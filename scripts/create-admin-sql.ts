import pkg from 'pg';
const { Pool } = pkg;
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Direct database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Create organization first with unique slug
    const timestamp = Date.now();
    const orgResult = await pool.query(
      `INSERT INTO organizations (name, slug, plan, max_users, billing_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ["Admin Organization", `admin-org-${timestamp}`, "enterprise", 100, "admin@example.com"]
    );
    const orgId = orgResult.rows[0].id;

    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    const userResult = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, organization_id, organization_role, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, role`,
      [
        "admin@example.com",
        hashedPassword,
        "Admin",
        "User",
        "admin",
        orgId,
        "owner",
        "full"
      ]
    );

    console.log("Admin user created successfully:", userResult.rows[0]);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await pool.end();
  }
}

createAdminUser(); 