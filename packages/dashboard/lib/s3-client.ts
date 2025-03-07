import * as Minio from "minio";

// Create a MinIO client
export const minioClient = new Minio.Client({
  endPoint: process.env.S3_ENDPOINT || "localhost",
  port: parseInt(process.env.S3_PORT || "9000"),
  useSSL: process.env.S3_USE_SSL === "true",
  accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
  secretKey: process.env.S3_SECRET_KEY || "minioadmin",
});

export const bucketName = process.env.S3_BUCKET || "images";
