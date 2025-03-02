import { Client, ItemBucketMetadata } from "minio";
import { config } from "../config";

export class MinioService {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection by listing buckets
      await this.client.listBuckets();

      // Check if bucket exists
      const bucketExists = await this.client.bucketExists(config.minio.bucket);
      if (!bucketExists) {
        await this.client.makeBucket(config.minio.bucket, "us-east-1");
        console.log(`Bucket '${config.minio.bucket}' created successfully`);
      } else {
        console.log(`Bucket '${config.minio.bucket}' already exists`);
      }

      this.isConnected = true;
    } catch (error: any) {
      this.isConnected = false;
      console.error("MinIO connection error:", error);
      throw new Error(
        `Failed to connect to MinIO: ${error.message || String(error)}`
      );
    }
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.initialize();
    }
  }

  async getObject(objectName: string): Promise<Buffer> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks: Buffer[] = [];

      this.client
        .getObject(config.minio.bucket, objectName)
        .then((stream) => {
          stream.on("data", (chunk: Buffer) => {
            size += chunk.length;
            chunks.push(chunk);
          });
          stream.on("end", () => resolve(Buffer.concat(chunks, size)));
          stream.on("error", (error: Error) => reject(error));
        })
        .catch((error) => reject(error));
    });
  }

  async putObject(
    objectName: string,
    data: Buffer,
    contentType: string
  ): Promise<string> {
    await this.ensureConnected();

    await this.client.putObject(
      config.minio.bucket,
      objectName,
      data,
      data.length,
      { "Content-Type": contentType }
    );
    return objectName;
  }

  async objectExists(objectName: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      await this.client.statObject(config.minio.bucket, objectName);
      return true;
    } catch (err: any) {
      if (err.code === "NotFound") {
        return false;
      }
      // For other errors, re-throw
      if (err.code !== "NotFound") {
        throw err;
      }
      return false;
    }
  }

  getObjectUrl(objectName: string): string {
    const protocol = config.minio.useSSL ? "https" : "http";
    return `${protocol}://${config.minio.endPoint}:${config.minio.port}/${config.minio.bucket}/${objectName}`;
  }

  async listObjects(
    prefix: string = "",
    recursive: boolean = true
  ): Promise<string[]> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      const objects: string[] = [];
      const stream = this.client.listObjects(
        config.minio.bucket,
        prefix,
        recursive
      );

      stream.on("data", (obj) => {
        if (obj.name) {
          objects.push(obj.name);
        }
      });

      stream.on("error", (err) => {
        reject(err);
      });

      stream.on("end", () => {
        resolve(objects);
      });
    });
  }

  async removeObject(objectName: string): Promise<void> {
    await this.ensureConnected();
    await this.client.removeObject(config.minio.bucket, objectName);
  }

  async removeObjects(objectNames: string[]): Promise<void> {
    if (objectNames.length === 0) return;

    await this.ensureConnected();
    await this.client.removeObjects(config.minio.bucket, objectNames);
  }
}
