import { Elysia, t } from "elysia";
import { MonitoringService } from "../services/monitoring.service";
import { MinioService } from "../services/minio.service";
import { config } from "../config";
import { AuthMiddleware } from "../middleware/auth.middleware";

export class AdminController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly minioService: MinioService
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

        // Clear cache
        .post(
          "/cache/clear",
          async ({ query, set }) => {
            try {
              const { pattern } = query;
              const prefix = "cache/";

              // List all cache objects
              const allObjects = await this.minioService.listObjects(prefix);

              // Filter objects by pattern if provided
              const objectsToDelete = pattern
                ? allObjects.filter((obj) => obj.includes(pattern))
                : allObjects;

              if (objectsToDelete.length === 0) {
                return {
                  success: true,
                  message: "No cache entries found to clear",
                  count: 0,
                };
              }

              // Delete objects in batches of 1000 (MinIO limit)
              const batchSize = 1000;
              for (let i = 0; i < objectsToDelete.length; i += batchSize) {
                const batch = objectsToDelete.slice(i, i + batchSize);
                await this.minioService.removeObjects(batch);
              }

              return {
                success: true,
                message: "Cache cleared successfully",
                count: objectsToDelete.length,
              };
            } catch (error) {
              console.error("Error clearing cache:", error);
              set.status = 500;
              return { error: "Failed to clear cache" };
            }
          },
          {
            query: t.Object({
              pattern: t.Optional(t.String()), // Optional pattern to clear specific cache entries
            }),
          }
        )

        // List cached images
        .get(
          "/cache/list",
          async ({ query, set }) => {
            try {
              const { prefix = "cache/", limit = "100", marker = "" } = query;
              const limitNum = parseInt(limit);

              // List objects with the given prefix
              const allObjects = await this.minioService.listObjects(prefix);

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
              console.error("Error listing cache:", error);
              set.status = 500;
              return { error: "Failed to list cache" };
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
            await this.minioService.initialize();
          } catch (error) {
            minioStatus = "error";
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
            },
          };
        })
    );

    return adminRoutes;
  }
}
