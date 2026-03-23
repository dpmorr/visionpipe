import { db } from "../db/index.js";
import { users, organizations } from "../db/schema.js";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("Seeding user...");

  // Check if org exists
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "wastetraq"),
  });

  if (!org) {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: "WasteTraq",
        slug: "wastetraq",
        plan: "starter",
        maxUsers: 5,
        billingEmail: "dmorrissy5@gmail.com",
      })
      .returning();
    org = newOrg;
    console.log("Created organization:", org.name);
  } else {
    console.log("Organization already exists:", org.name);
  }

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, "dmorrissy5@gmail.com"),
  });

  if (existingUser) {
    console.log("User already exists:", existingUser.email);
  } else {
    const hashedPassword = await hashPassword("snowboardX5!");
    const [user] = await db
      .insert(users)
      .values({
        email: "dmorrissy5@gmail.com",
        password: hashedPassword,
        firstName: "Daniel",
        lastName: "Morrissy",
        role: "admin",
        organizationId: org.id,
        organizationRole: "owner",
        userType: "full",
      })
      .returning();
    console.log("Created user:", user.email);
  }

  console.log("\n--- Credentials ---");
  console.log("Email: dmorrissy5@gmail.com");
  console.log("Password: snowboardX5!");
  console.log("-------------------\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
