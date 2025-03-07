import { defineConfig } from "drizzle-kit";

console.log("🚀 ~ process.env.DATABASE_URL:", process.env.DATABASE_URL);

export default defineConfig({
  schema: "../db-schema/src",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
