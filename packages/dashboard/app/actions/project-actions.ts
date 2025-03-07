"use server";

import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { MinioService } from "@/lib/minio-service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  createProject as dbCreateProject,
  createApiKey as dbCreateApiKey,
  deleteApiKey as dbDeleteApiKey,
  getProjectById,
  getProjectsWithApiKeys,
  db,
} from "@/lib/data-access-layer";
import { apiKey, project } from "db-schema";

// Create a new project
export async function createProject(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      return { error: "Project name is required" };
    }

    // In a real implementation, this would create a record in the database
    // For now, we'll just simulate it
    const projectId = uuidv4();
    const userId = session.user.id;

    // Create a valid bucket name: lowercase, no special chars except hyphens, 3-63 chars
    // Use a shorter format with just the project ID to ensure valid length
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .substring(0, 20);
    const bucketName = `user-${userId.substring(
      0,
      8
    )}-${sanitizedName}`.toLowerCase();

    // Create the bucket for this project if SAAS_MODE is enabled
    if (process.env.SAAS_MODE === "true") {
      const minioService = new MinioService();
      await minioService.createBucket(bucketName);
    }

    // Use the data access layer function instead of direct db access
    const newProject = await dbCreateProject({
      id: projectId,
      name,
      description,
      bucketName,
      userId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating project:", error);
    return { error: "Failed to create project" };
  }
}

// Create a new API key for a project
export async function createApiKey(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const projectId = formData.get("projectId") as string;

    if (!name) {
      return { error: "Key name is required" };
    }

    const newApiKey = uuidv4();

    // Use the data access layer function instead of direct db access
    await dbCreateApiKey({
      key: newApiKey,
      name,
      projectId,
      userId: session.user.id,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/api-keys");
    return { apiKey: newApiKey };
  } catch (error) {
    console.error("Error creating API key:", error);
    return { error: "Failed to create API key" };
  }
}

// Revoke an API key
export async function revokeApiKey(keyId: string) {
  console.log("🚀 ~ revokeApiKey ~ keyId:", keyId);
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Get the project ID using the data access layer
    // We can use the joined query to get all projects with their API keys
    const projectsWithApiKeys = await getProjectsWithApiKeys(session.user.id);
    const projectId = projectsWithApiKeys[0]?.project?.id;

    if (!projectId) {
      return { error: "Project ID is required" };
    }

    // Use the data access layer function instead of direct db access
    await dbDeleteApiKey(keyId);

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard/api-keys");
    return { success: true };
  } catch (error) {
    console.error("Error revoking API key:", error);
    return { error: "Failed to revoke API key" };
  }
}
