import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  bucketName: text("bucket_name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apiKey = pgTable("api_key", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type Project = typeof project.$inferSelect;
export type ApiKey = typeof apiKey.$inferSelect;
