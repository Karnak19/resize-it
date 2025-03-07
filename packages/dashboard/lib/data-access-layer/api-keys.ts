import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKey, project } from "db-schema";
import { cache } from "react";

/**
 * Get all API keys for a user
 */
export const getApiKeys = cache(async (userId: string) => {
  const apiKeys = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.userId, userId))
    .innerJoin(project, eq(apiKey.projectId, project.id));
  return apiKeys;
});

/**
 * Get API keys for a specific project
 */
export const getApiKeysByProject = cache(async (projectId: string) => {
  const apiKeys = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.projectId, projectId));
  return apiKeys;
});

/**
 * Create a new API key
 */
export const createApiKey = async (data: {
  key: string;
  name: string;
  projectId: string;
  userId: string;
}) => {
  return await db.insert(apiKey).values(data);
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (keyId: string) => {
  return await db.delete(apiKey).where(eq(apiKey.id, keyId));
};

/**
 * Update an API key
 */
export const updateApiKey = async (
  keyId: string,
  data: Partial<typeof apiKey.$inferInsert>
) => {
  return await db.update(apiKey).set(data).where(eq(apiKey.id, keyId));
};
