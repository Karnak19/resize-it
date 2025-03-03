import { Elysia, t } from "elysia";
import { MonitoringService } from "../services/monitoring.service";
import { StorageService } from "../services/storage.interface";
import { CacheService } from "../services/cache.service";
import { config } from "../config";
import { AuthMiddleware } from "../middleware/auth.middleware";

export class AdminController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly storageService: StorageService,
    private readonly cacheService?: CacheService
  ) {}

  registerRoutes(app: Elysia): Elysia {
    // Apply API key authentication to all admin routes
    const adminRoutes = app.group("/admin", (app) =>
      app
        .use(AuthMiddleware.apiKeyAuth)

        // Get system stats
        .get("/stats", () => {
          return this.monitoringService.getStats();
        })

        // Clear MinIO cache
        .post(
          "/cache/minio/clear",
          async ({ query, set }) => {
            try {
              const { pattern } = query;
              const prefix = "cache/";

              // List all cache objects
              const allObjects = await this.storageService.listObjects(prefix);

              // Filter objects by pattern if provided
              const objectsToDelete = pattern
                ? allObjects.filter((obj) => obj.includes(pattern))
                : allObjects;

              if (objectsToDelete.length === 0) {
                return {
                  success: true,
                  message: "No MinIO cache entries found to clear",
                  count: 0,
                };
              }

              // Delete objects in batches of 1000 (MinIO limit)
              const batchSize = 1000;
              for (let i = 0; i < objectsToDelete.length; i += batchSize) {
                const batch = objectsToDelete.slice(i, i + batchSize);
                await this.storageService.removeObjects(batch);
              }

              return {
                success: true,
                message: "MinIO cache cleared successfully",
                count: objectsToDelete.length,
              };
            } catch (error) {
              console.error("Error clearing MinIO cache:", error);
              set.status = 500;
              return { error: "Failed to clear MinIO cache" };
            }
          },
          {
            query: t.Object({
              pattern: t.Optional(t.String()), // Optional pattern to clear specific cache entries
            }),
          }
        )

        // Clear Dragonfly cache
        .post(
          "/cache/dragonfly/clear",
          async ({ query, set }) => {
            try {
              if (!this.cacheService || !config.dragonfly.enabled) {
                set.status = 400;
                return {
                  success: false,
                  error: "Dragonfly cache is not enabled",
                };
              }

              const { pattern } = query;

              // For now, we don't have a way to clear by pattern in Dragonfly
              // We would need to implement a pattern-based deletion in the future
              // For now, we'll just return a message that it's not supported
              if (pattern) {
                set.status = 400;
                return {
                  success: false,
                  error:
                    "Pattern-based cache clearing is not supported for Dragonfly yet",
                };
              }

              // Since we can't clear by pattern, we'll just return a message
              // In a real implementation, you would use Redis FLUSHDB or similar
              return {
                success: true,
                message: "Dragonfly cache clearing is not implemented yet",
                count: 0,
              };
            } catch (error) {
              console.error("Error clearing Dragonfly cache:", error);
              set.status = 500;
              return { error: "Failed to clear Dragonfly cache" };
            }
          },
          {
            query: t.Object({
              pattern: t.Optional(t.String()), // Optional pattern to clear specific cache entries
            }),
          }
        )

        // List cached images in MinIO
        .get(
          "/cache/minio/list",
          async ({ query, set }) => {
            try {
              const { prefix = "cache/", limit = "100", marker = "" } = query;
              const limitNum = parseInt(limit);

              // List objects with the given prefix
              const allObjects = await this.storageService.listObjects(prefix);

              // Apply pagination
              let startIndex = 0;
              if (marker) {
                const markerIndex = allObjects.findIndex(
                  (obj) => obj === marker
                );
                if (markerIndex !== -1) {
                  startIndex = markerIndex + 1;
                }
              }

              const paginatedObjects = allObjects.slice(
                startIndex,
                startIndex + limitNum
              );

              // Get next marker
              const nextMarker =
                allObjects.length > startIndex + limitNum
                  ? allObjects[startIndex + limitNum]
                  : null;

              return {
                success: true,
                items: paginatedObjects,
                count: paginatedObjects.length,
                total: allObjects.length,
                nextMarker,
              };
            } catch (error) {
              console.error("Error listing MinIO cache:", error);
              set.status = 500;
              return { error: "Failed to list MinIO cache" };
            }
          },
          {
            query: t.Object({
              prefix: t.Optional(t.String()),
              limit: t.Optional(t.String()),
              marker: t.Optional(t.String()),
            }),
          }
        )

        // Get system health
        .get("/health", async () => {
          // Check MinIO connection
          let minioStatus = "ok";
          try {
            await this.storageService.initialize();
          } catch (error) {
            minioStatus = "error";
          }

          // Check Dragonfly connection if enabled
          let dragonflyStatus = "disabled";
          if (this.cacheService && config.dragonfly.enabled) {
            try {
              // Try to set and get a test value
              const testKey = "health-check-" + Date.now();
              await this.cacheService.set(testKey, { test: true }, 10);
              const testValue = await this.cacheService.get(testKey);
              dragonflyStatus = testValue ? "ok" : "error";
            } catch (error) {
              dragonflyStatus = "error";
            }
          }

          // Get memory usage
          const memoryUsage = process.memoryUsage();

          return {
            status: "ok",
            version: "1.0.0",
            uptime: process.uptime(),
            memory: {
              rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
              heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
              heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
            },
            services: {
              minio: minioStatus,
              dragonfly: dragonflyStatus,
            },
            cache: {
              dragonfly: {
                enabled: config.dragonfly.enabled,
                host: config.dragonfly.host,
                port: config.dragonfly.port,
              },
            },
          };
        })
    );

    return adminRoutes;
  }
}
