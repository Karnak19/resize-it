"use server";

import * as Minio from "minio";
import { revalidatePath } from "next/cache";

// Create a MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT || "localhost",
  port: parseInt(process.env.S3_PORT || "9000"),
  useSSL: process.env.S3_USE_SSL === "true",
  accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
  secretKey: process.env.S3_SECRET_KEY || "minioadmin",
});

// Helper function to ensure bucket exists
async function ensureBucketExists(bucketName: string) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
      console.log(`Bucket '${bucketName}' created successfully`);
    }
    return true;
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
    // Don't throw error here, just return false
    return false;
  }
}

// Upload an object to the bucket
export async function uploadObject(
  formData: FormData,
  bucketName: string
): Promise<string> {
  try {
    const bucketExists = await ensureBucketExists(bucketName);

    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;

    if (!file || !fileName) {
      throw new Error("File and fileName are required");
    }

    // If bucket doesn't exist or can't connect in development, just pretend it worked
    if (!bucketExists && process.env.NODE_ENV === "development") {
      console.warn("MinIO connection failed, mocking upload for development");
      revalidatePath("/dashboard");
      return fileName;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;

    await minioClient.putObject(bucketName, fileName, buffer, undefined, {
      "Content-Type": contentType,
    });

    revalidatePath("/dashboard");
    return fileName;
  } catch (error) {
    console.error("Error uploading object:", error);

    // In development, just pretend it worked
    if (process.env.NODE_ENV === "development") {
      console.warn("MinIO connection failed, mocking upload for development");
      revalidatePath("/dashboard");
      return formData.get("fileName") as string;
    }

    throw new Error("Failed to upload object");
  }
}

// Delete an object from the bucket
export async function deleteObjectAction(
  fileName: string,
  bucketName: string
): Promise<void> {
  try {
    const bucketExists = await ensureBucketExists(bucketName);

    // If bucket doesn't exist or can't connect in development, just pretend it worked
    if (!bucketExists && process.env.NODE_ENV === "development") {
      console.warn("MinIO connection failed, mocking delete for development");
      revalidatePath("/dashboard");
      return;
    }

    await minioClient.removeObject(bucketName, fileName);
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting object:", error);

    // In development, just pretend it worked
    if (process.env.NODE_ENV === "development") {
      console.warn("MinIO connection failed, mocking delete for development");
      revalidatePath("/dashboard");
      return;
    }

    throw new Error("Failed to delete object");
  }
}

// Get a presigned URL for an object
export async function getPresignedUrl(
  objectName: string,
  bucketName: string
): Promise<string> {
  try {
    const bucketExists = await ensureBucketExists(bucketName);

    // If bucket doesn't exist or can't connect, return mock URL in development
    if (!bucketExists && process.env.NODE_ENV === "development") {
      console.warn(
        "MinIO connection failed, returning mock URL for development"
      );
      return `/mock-files/${objectName}`;
    }

    return await minioClient.presignedGetObject(bucketName, objectName, 3600);
  } catch (error) {
    console.error("Error generating presigned URL:", error);

    // In development, return mock URL instead of throwing
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "MinIO connection failed, returning mock URL for development"
      );
      return `/mock-files/${objectName}`;
    }

    throw new Error("Failed to generate presigned URL");
  }
}
