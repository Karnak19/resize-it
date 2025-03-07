import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { project, apiKey } from "db-schema";
import { cache } from "react";

/**
 * Get all projects for a user
 */
export const getProjects = cache(async (userId: string) => {
  const projects = await db
    .select()
    .from(project)
    .where(eq(project.userId, userId));
  return projects;
});

/**
 * Get a project by ID
 */
export const getProjectById = cache(async (projectId: string) => {
  const [projectData] = await db
    .select()
    .from(project)
    .where(eq(project.id, projectId));
  return projectData;
});

/**
 * Create a new project
 */
export const createProject = async (data: {
  id: string;
  name: string;
  description?: string;
  bucketName: string;
  userId: string;
}) => {
  return await db.insert(project).values(data);
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string) => {
  return await db.delete(project).where(eq(project.id, projectId));
};

/**
 * Update a project
 */
export const updateProject = async (
  projectId: string,
  data: Partial<typeof project.$inferInsert>
) => {
  return await db.update(project).set(data).where(eq(project.id, projectId));
};
