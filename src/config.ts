// Bun automatically loads environment variables from .env files
// No need to manually load them

export const config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: process.env.HOST || "0.0.0.0",
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    bucket: process.env.MINIO_BUCKET || "images",
  },
  image: {
    maxWidth: process.env.MAX_WIDTH ? parseInt(process.env.MAX_WIDTH) : 1920,
    maxHeight: process.env.MAX_HEIGHT ? parseInt(process.env.MAX_HEIGHT) : 1080,
    quality: process.env.IMAGE_QUALITY
      ? parseInt(process.env.IMAGE_QUALITY)
      : 80,
    formats: ["webp", "jpeg", "png"],
  },
  cache: {
    enabled: process.env.CACHE_ENABLED !== "false",
    maxAge: process.env.CACHE_MAX_AGE
      ? parseInt(process.env.CACHE_MAX_AGE)
      : 86400, // 1 day in seconds
  },
};
