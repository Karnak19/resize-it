// Bun automatically loads environment variables from .env files
// No need to manually load them

export const config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
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
  dragonfly: {
    enabled: process.env.DRAGONFLY_ENABLED === "true",
    host: process.env.DRAGONFLY_HOST || "localhost",
    port: process.env.DRAGONFLY_PORT
      ? parseInt(process.env.DRAGONFLY_PORT)
      : 6379,
    ttl: process.env.DRAGONFLY_CACHE_TTL
      ? parseInt(process.env.DRAGONFLY_CACHE_TTL)
      : 86400, // 1 day in seconds
  },
  security: {
    apiKeys: process.env.API_KEYS
      ? process.env.API_KEYS.split(",")
      : ["dev-api-key"],
    enableApiKeyAuth: process.env.ENABLE_API_KEY_AUTH === "true",
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== "false",
      windowMs: process.env.RATE_LIMIT_WINDOW_MS
        ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
        : 60000, // 1 minute
      max: process.env.RATE_LIMIT_MAX
        ? parseInt(process.env.RATE_LIMIT_MAX)
        : 100, // 100 requests per minute
    },
    cors: {
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(",")
        : ["*"],
    },
  },
};
