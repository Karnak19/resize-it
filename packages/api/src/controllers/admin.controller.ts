import { Elysia, error, t } from "elysia";
import { monitoringService } from "../services/monitoring.service";
import { storageService } from "../services/bun-s3.service";
import { cacheService } from "../services/cache.service";
import { config } from "../config";
import { ApiKeyService } from "../middleware/auth.middleware";

export const adminController = new Elysia({ prefix: "/admin" })
  .use(ApiKeyService)

  // Get system stats
  .get("/stats", () => {
    return monitoringService.getStats();
  })

  // Clear MinIO cache
  .post(
    "/cache/minio/clear",
    async ({ query }) => {
      try {
        const { pattern } = query;
        const prefix = "cache/";

        // List all cache objects
        const allObjects = await storageService.listObjects(prefix);

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
          await storageService.removeObjects(batch);
        }

        return {
          success: true,
          message: "MinIO cache cleared successfully",
          count: objectsToDelete.length,
        };
      } catch (err) {
        console.error("Error clearing MinIO cache:", err);
        return error(500, { message: "Failed to clear MinIO cache" });
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
        if (!cacheService || !config.dragonfly.enabled) {
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
          return error(400, {
            message:
              "Pattern-based cache clearing is not supported for Dragonfly yet",
          });
        }

        // Since we can't clear by pattern, we'll just return a message
        // In a real implementation, you would use Redis FLUSHDB or similar
        return {
          success: true,
          message: "Dragonfly cache clearing is not implemented yet",
          count: 0,
        };
      } catch (err) {
        console.error("Error clearing Dragonfly cache:", err);
        return error(500, { message: "Failed to clear Dragonfly cache" });
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
        const allObjects = await storageService.listObjects(prefix);

        // Apply pagination
        let startIndex = 0;
        if (marker) {
          const markerIndex = allObjects.findIndex((obj) => obj === marker);
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
      } catch (err) {
        console.error("Error listing MinIO cache:", err);
        return error(500, { message: "Failed to list MinIO cache" });
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
      await storageService.initialize();
    } catch (error) {
      minioStatus = "error";
    }

    // Check Dragonfly connection if enabled
    let dragonflyStatus = "disabled";
    if (cacheService && config.dragonfly.enabled) {
      try {
        // Try to set and get a test value
        const testKey = "health-check-" + Date.now();
        await cacheService.set(testKey, { test: true }, 10);
        const testValue = await cacheService.get(testKey);
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
  });
