// Client-side API for MinIO operations
// This file doesn't import MinIO directly to avoid Node.js modules in the browser
import { getPresignedUrl as getPresignedUrlAction } from "../app/actions";

export interface ObjectInfo {
  name: string;
  lastModified: Date;
  size: number;
  etag: string;
  contentType?: string;
}

// Get a presigned URL for an object using server action
export async function getPresignedUrl(
  objectName: string,
  bucketName: string
): Promise<string> {
  try {
    return await getPresignedUrlAction(objectName, bucketName);
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    throw new Error("Failed to generate presigned URL");
  }
}
