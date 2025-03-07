import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

console.log("🚀 ~ process.env.DATABASE_URL:", process.env.DATABASE_URL);

const client = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle({ client });
