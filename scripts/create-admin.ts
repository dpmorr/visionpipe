import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import { users, organizations } from "../db/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Direct database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool, { schema: { users, organizations } });

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // First create the organization
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Admin Organization",
        slug: `admin-org-${Date.now()}`,
        plan: "starter",
        maxUsers: 5,
        billingEmail: "admin@example.com",
        createdAt: new Date()
      })
      .returning();

    console.log("Created organization:", org);

    // Then create the admin user
    const hashedPassword = await hashPassword("admin123");
    const [user] = await db
      .insert(users)
      .values({
        email: "admin@example.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "user",
        organizationRole: "owner",
        organizationId: org.id,
        userType: "full",
        createdAt: new Date()
      })
      .returning();

    console.log("Created admin user:", {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId
    });

    console.log("\nLogin credentials:");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await pool.end();
  }
}

createAdminUser(); 