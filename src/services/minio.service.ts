import { Client, ItemBucketMetadata } from "minio";
import { config } from "../config";

export class MinioService {
  private client: Client;

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
    const bucketExists = await this.client.bucketExists(config.minio.bucket);
    if (!bucketExists) {
      await this.client.makeBucket(config.minio.bucket, "us-east-1");
      console.log(`Bucket '${config.minio.bucket}' created successfully`);
    }
  }

  async getObject(objectName: string): Promise<Buffer> {
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
      await this.client.statObject(config.minio.bucket, objectName);
      return true;
    } catch (err) {
      return false;
    }
  }

  getObjectUrl(objectName: string): string {
    const protocol = config.minio.useSSL ? "https" : "http";
    return `${protocol}://${config.minio.endPoint}:${config.minio.port}/${config.minio.bucket}/${objectName}`;
  }
}
