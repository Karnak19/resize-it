// Bun automatically loads environment variables from .env files
// No need to manually load them

export const config = {
  server: {
    host: process.env.HOST || "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT || "localhost",
    port: process.env.S3_PORT ? parseInt(process.env.S3_PORT) : 3900,
    useSSL: process.env.S3_USE_SSL === "true",
    accessKey:
      process.env.S3_ACCESS_KEY || "GK0123456789abcdef01234567",
    secretKey:
      process.env.S3_SECRET_KEY ||
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    bucket: process.env.S3_BUCKET || "images",
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
