import * as Minio from "minio";

// Create a MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT || "localhost",
  port: parseInt(process.env.S3_PORT || "9000"),
  useSSL: process.env.S3_USE_SSL === "true",
  accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
  secretKey: process.env.S3_SECRET_KEY || "minioadmin",
});

const DEFAULT_BUCKET = process.env.S3_BUCKET || "images";

// Types
export interface ObjectInfo {
  name: string;
  lastModified: Date;
  size: number;
  etag: string;
  contentType?: string;
}

// Helper function to ensure bucket exists
export async function ensureBucketExists(bucketName: string) {
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

// List objects in the bucket
export async function listObjects(bucketName: string): Promise<ObjectInfo[]> {
  try {
    const bucketExists = await ensureBucketExists(bucketName);

    // If bucket doesn't exist or can't connect, return empty array in development
    if (!bucketExists && process.env.NODE_ENV === "development") {
      console.warn(
        "MinIO connection failed, returning mock data for development"
      );
      return getMockObjects();
    }

    const objectsStream = minioClient.listObjects(bucketName, "", true);
    const objects: ObjectInfo[] = [];

    for await (const obj of objectsStream) {
      if (obj.name && obj.lastModified) {
        objects.push({
          name: obj.name,
          lastModified: obj.lastModified,
          size: obj.size,
          etag: obj.etag,
        });
      }
    }

    return objects;
  } catch (error) {
    console.error("Error listing objects:", error);

    // In development, return mock data instead of throwing
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "MinIO connection failed, returning mock data for development"
      );
      return getMockObjects();
    }

    throw new Error("Failed to list objects");
  }
}

// Get a presigned URL for an object
export async function getPresignedUrl(
  objectName: string,
  expirySeconds = 3600
): Promise<string> {
  try {
    const bucketExists = await ensureBucketExists(DEFAULT_BUCKET);

    // If bucket doesn't exist or can't connect, return mock URL in development
    if (!bucketExists && process.env.NODE_ENV === "development") {
      console.warn(
        "MinIO connection failed, returning mock URL for development"
      );
      return `/mock-files/${objectName}`;
    }

    return await minioClient.presignedGetObject(
      DEFAULT_BUCKET,
      objectName,
      expirySeconds
    );
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

// Helper function to generate mock objects for development
function getMockObjects(): ObjectInfo[] {
  return [
    {
      name: "sample-image-1.jpg",
      lastModified: new Date(),
      size: 1024 * 1024 * 2, // 2MB
      etag: "mock-etag-1",
      contentType: "image/jpeg",
    },
    {
      name: "sample-image-2.png",
      lastModified: new Date(Date.now() - 86400000), // 1 day ago
      size: 1024 * 1024 * 1.5, // 1.5MB
      etag: "mock-etag-2",
      contentType: "image/png",
    },
    {
      name: "sample-document.pdf",
      lastModified: new Date(Date.now() - 86400000 * 2), // 2 days ago
      size: 1024 * 1024 * 3, // 3MB
      etag: "mock-etag-3",
      contentType: "application/pdf",
    },
  ];
}
