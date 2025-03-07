import { minioClient, bucketName } from "./s3-client";
import { Readable } from "stream";
import * as Minio from "minio";

export interface ObjectInfo {
  name: string;
  lastModified: Date;
  size: number;
  etag: string;
  contentType?: string;
}

export interface UploadParams {
  file: Buffer | Readable;
  fileName: string;
  contentType: string;
}

export class MinioService {
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.S3_ENDPOINT || "localhost",
      port: parseInt(process.env.S3_PORT || "9000"),
      useSSL: process.env.S3_USE_SSL === "true",
      accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
      secretKey: process.env.S3_SECRET_KEY || "minioadmin",
    });
  }

  /**
   * Create a new bucket
   */
  async createBucket(bucketName: string): Promise<boolean> {
    try {
      // Validate bucket name according to S3/MinIO rules
      if (!this.isValidBucketName(bucketName)) {
        throw new Error(
          `Invalid bucket name: ${bucketName}. Bucket names must be 3-63 characters, contain only lowercase letters, numbers, periods, and hyphens, and begin and end with a letter or number.`
        );
      }

      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName);
        console.log(`Bucket '${bucketName}' created successfully`);
      }
      return true;
    } catch (error) {
      console.error(`Error creating bucket '${bucketName}':`, error);
      throw error;
    }
  }

  /**
   * Validates a bucket name according to S3/MinIO naming rules
   */
  private isValidBucketName(name: string): boolean {
    // Check length (3-63 characters)
    if (name.length < 3 || name.length > 63) {
      return false;
    }

    // Check characters (lowercase letters, numbers, periods, hyphens)
    if (!/^[a-z0-9.-]+$/.test(name)) {
      return false;
    }

    // Check start and end with letter or number
    if (!/^[a-z0-9].*[a-z0-9]$/.test(name)) {
      return false;
    }

    // Check not formatted as IP address
    if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
      return false;
    }

    // Check no adjacent periods
    if (name.includes("..")) {
      return false;
    }

    return true;
  }

  /**
   * Upload a file to a bucket
   */
  async uploadFile(
    bucketName: string,
    fileName: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      await this.client.putObject(bucketName, fileName, file, undefined, {
        "Content-Type": contentType,
      });
      return fileName;
    } catch (error) {
      console.error(
        `Error uploading file '${fileName}' to bucket '${bucketName}':`,
        error
      );

      // In development, just pretend it worked
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "MinIO connection failed, mocking file upload for development"
        );
        return fileName;
      }

      throw error;
    }
  }

  /**
   * Delete a file from a bucket
   */
  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    try {
      await this.client.removeObject(bucketName, fileName);
    } catch (error) {
      console.error(
        `Error deleting file '${fileName}' from bucket '${bucketName}':`,
        error
      );

      // In development, just pretend it worked
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "MinIO connection failed, mocking file deletion for development"
        );
        return;
      }

      throw error;
    }
  }

  /**
   * Get a presigned URL for a file
   */
  async getPresignedUrl(
    bucketName: string,
    fileName: string,
    expiryInSeconds = 3600
  ): Promise<string> {
    try {
      return await this.client.presignedGetObject(
        bucketName,
        fileName,
        expiryInSeconds
      );
    } catch (error) {
      console.error(
        `Error generating presigned URL for file '${fileName}' in bucket '${bucketName}':`,
        error
      );

      // In development, return a mock URL
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "MinIO connection failed, returning mock URL for development"
        );
        return `/mock-files/${bucketName}/${fileName}`;
      }

      throw error;
    }
  }

  /**
   * List all files in a bucket
   */
  async listFiles(
    bucketName: string,
    prefix = ""
  ): Promise<Minio.BucketItem[]> {
    try {
      const stream = this.client.listObjects(bucketName, prefix, true);
      const files: Minio.BucketItem[] = [];

      return new Promise((resolve, reject) => {
        stream.on("data", (obj) => {
          files.push(obj);
        });

        stream.on("error", (err) => {
          reject(err);
        });

        stream.on("end", () => {
          resolve(files);
        });
      });
    } catch (error) {
      console.error(`Error listing files in bucket '${bucketName}':`, error);

      // In development, return an empty array
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "MinIO connection failed, returning empty array for development"
        );
        return [];
      }

      throw error;
    }
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(name: string): Promise<void> {
    try {
      await this.client.removeBucket(name);
      console.log(`Bucket '${name}' deleted successfully`);
    } catch (error) {
      console.error(`Error deleting bucket '${name}':`, error);
      throw error;
    }
  }

  /**
   * List all objects in the bucket with an optional prefix
   */
  static async listObjects(prefix = ""): Promise<ObjectInfo[]> {
    try {
      const objectsStream = minioClient.listObjects(bucketName, prefix, true);
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
      throw error;
    }
  }

  /**
   * Get object metadata
   */
  static async getObjectStat(
    objectName: string
  ): Promise<Minio.BucketItemStat> {
    try {
      return await minioClient.statObject(bucketName, objectName);
    } catch (error) {
      console.error("Error getting object stats:", error);
      throw error;
    }
  }

  /**
   * Ensure the bucket exists
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName);
        console.log(`Bucket '${bucketName}' created successfully`);
      } else {
        console.log(`Bucket '${bucketName}' already exists`);
      }
    } catch (error) {
      console.error("Error ensuring bucket exists:", error);
      throw error;
    }
  }
}
