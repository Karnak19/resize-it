import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { project, apiKey } from "db-schema";
import { cache } from "react";

/**
 * Get a project with its API keys
 */
export const getProjectWithApiKeys = cache(async (projectId: string) => {
  return await db
    .select()
    .from(project)
    .where(eq(project.id, projectId))
    .leftJoin(apiKey, eq(project.id, apiKey.projectId));
});

/**
 * Get all API keys with their associated projects
 */
export const getApiKeysWithProjects = cache(async (userId: string) => {
  return await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.userId, userId))
    .innerJoin(project, eq(apiKey.projectId, project.id));
});

/**
 * Get all projects with their API keys
 */
export const getProjectsWithApiKeys = cache(async (userId: string) => {
  return await db
    .select()
    .from(project)
    .where(eq(project.userId, userId))
    .leftJoin(apiKey, eq(project.id, apiKey.projectId));
});
