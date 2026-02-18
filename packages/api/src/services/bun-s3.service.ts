import { S3Client } from "bun";
import { config } from "../config";
import { StorageService } from "./storage.interface";
import { logger } from "../utils/logger";

export class BunS3Service implements StorageService {
  private client: S3Client;

  constructor() {
    const endpoint = `http${config.storage.useSSL ? "s" : ""}://${
      config.storage.endpoint
    }:${config.storage.port}`;

    this.client = new S3Client({
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
      bucket: config.storage.bucket,
      endpoint,
    });
  }

  async initialize(): Promise<void> {
    try {
      // We can't directly check if a bucket exists with Bun's S3 client.
      // A metadata check on a non-existent object validates endpoint/auth for most providers.
      const testFile = this.client.file("test-connection.txt");
      await testFile.exists();
      logger.info(`Connected to bucket '${config.storage.bucket}'`);
    } catch (error: any) {
      if (error?.name === "S3Error" && error?.code === "UnknownError") {
        logger.warn(
          "S3 connection check returned UnknownError; continuing with configured storage provider"
        );
        return;
      }

      logger.error("S3 connection error:", error);
      throw new Error(
        `Failed to connect to S3: ${error.message || String(error)}`
      );
    }
  }

  async getObject(objectName: string): Promise<Buffer> {
    const s3File = this.client.file(objectName);
    return Buffer.from(await s3File.arrayBuffer());
  }

  async putObject(
    objectName: string,
    data: Buffer,
    contentType: string
  ): Promise<string> {
    const s3File = this.client.file(objectName);
    await s3File.write(data, {
      type: contentType,
    });

    return objectName;
  }

  async objectExists(objectName: string): Promise<boolean> {
    try {
      const s3File = this.client.file(objectName);
      return await s3File.exists();
    } catch (err: any) {
      if (
        err.name === "S3Error" &&
        (err.message.includes("NoSuchKey") || err.message.includes("not found"))
      ) {
        return false;
      }
      // For other errors, re-throw
      throw err;
    }
  }

  getObjectUrl(objectName: string, baseUrl?: string): string {
    // If a baseUrl is provided, use it to generate a URL to the resize-it service
    if (baseUrl) {
      return `${baseUrl}/images/resize/${objectName}`;
    }

    // Fallback to direct S3 URL if no public URL is configured
    const protocol = config.storage.useSSL ? "https" : "http";
    return `${protocol}://${config.storage.endpoint}:${config.storage.port}/${config.storage.bucket}/${objectName}`;
  }

  async listObjects(
    prefix: string = "",
    recursive: boolean = true
  ): Promise<string[]> {
    // Bun's S3 API doesn't currently expose list objects.
    logger.warn("listObjects is not implemented in Bun's S3 API yet");
    return [];
  }

  async removeObject(objectName: string): Promise<void> {
    const s3File = this.client.file(objectName);
    await s3File.delete();
  }

  async removeObjects(objectNames: string[]): Promise<void> {
    if (objectNames.length === 0) return;

    // Delete objects one by one
    await Promise.all(
      objectNames.map((name) => this.client.file(name).delete())
    );
  }
}

export const storageService = new BunS3Service();
