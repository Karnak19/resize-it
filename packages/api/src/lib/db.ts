import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";

// Create a new SQLite database connection
// If DATABASE_URL is not provided, it will use an in-memory database
const client = new SQL(Bun.env.DATABASE_URL!);

// Create a Drizzle ORM instance with the SQLite connection
export const db = drizzle({ client });
