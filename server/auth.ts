import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, organizations, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const scryptAsync = promisify(scrypt);

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    if (!storedPassword || !storedPassword.includes('.')) {
      return false;
    }
    const [hashedPassword, salt] = storedPassword.split(".");
    if (!hashedPassword || !salt) {
      return false;
    }
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

// Extend express user object with our schema
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      password: string;
      firstName: string | null;
      lastName: string | null;
      role: string | null;
      organizationId: number | null;
      organizationRole: string | null;
      userType: string;
      createdAt: Date | null;
    }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || process.env.REPL_ID || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
            columns: {
              id: true,
              email: true,
              password: true,
              firstName: true,
              lastName: true,
              role: true,
              organizationId: true,
              organizationRole: true,
              userType: true,
              createdAt: true
            }
          });

          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }

          const isValid = await crypto.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Incorrect password." });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          organizationId: users.organizationId,
          organizationRole: users.organizationRole,
          userType: users.userType,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return done(new Error('User not found'), null);
      }

      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, organizationName } = req.body;

      // Create organization
      const [organization] = await db
        .insert(organizations)
        .values({
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, "-"),
          billingEmail: email, // Required field
          plan: "starter", // Required field
          maxUsers: 5 // Required field
        })
        .returning();

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email,
          password: await bcrypt.hash(password, 10),
          firstName,
          lastName,
          organizationId: organization.id,
          organizationRole: "owner",
          role: "admin",
          userType: "full",
        })
        .returning();

      res.json({ user, organization });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            organizationRole: user.organizationRole
          }
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }

      res.json({ message: "Logout successful" });
    });
  });

  // Create superadmin user for guaranteed access to Sensor Control
  app.get("/api/setup-superadmin", async (req, res) => {
    try {
      // Check if superadmin already exists
      const existingSuperAdmin = await db.query.users.findFirst({
        where: eq(users.email, "superadmin@example.com"),
      });
      
      if (existingSuperAdmin) {
        return res.json({
          success: true,
          message: "Superadmin user already exists",
          credentials: {
            email: "superadmin@example.com",
            password: "admin123"
          }
        });
      }
      
      // Create superadmin user
      const hashedPassword = await crypto.hash("admin123");
      const [newUser] = await db
        .insert(users)
        .values({
          email: "superadmin@example.com",
          password: hashedPassword,
          firstName: "Super",
          lastName: "Admin",
          role: "user",
          organizationRole: "owner",
          organizationId: 2,
          createdAt: new Date()
        })
        .returning();
        
      return res.json({
        success: true,
        message: "Superadmin user created successfully",
        credentials: {
          email: "superadmin@example.com",
          password: "admin123"
        }
      });
    } catch (error) {
      console.error("Error creating superadmin:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create superadmin user"
      });
    }
  });
  
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...safeUser } = req.user;
      return res.json(safeUser);
    }

    res.status(401).json({ error: "Not authenticated" });
  });
}