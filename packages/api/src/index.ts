import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { ImageService } from "./services/image.service";
import { BunS3Service } from "./services/bun-s3.service";
import { MonitoringService } from "./services/monitoring.service";
import { CacheService } from "./services/cache.service";
import { ImageController } from "./controllers/image.controller";
import { AdminController } from "./controllers/admin.controller";
import { logger } from "./utils/logger";

// Create services
const monitoringService = new MonitoringService();
const storageService = new BunS3Service();
logger.info("Using Bun's built-in S3 client");

// Initialize cache service if enabled
let cacheService: CacheService | undefined;
if (config.cache.enabled) {
  cacheService = new CacheService(monitoringService);
}

// Create image service
const imageService = new ImageService(monitoringService, cacheService);

// Create controllers
const imageController = new ImageController(imageService, storageService);
const adminController = new AdminController(
  monitoringService,
  storageService,
  cacheService
);

// Create and configure the app
const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Resize-it API",
          version: "1.0.0",
          description:
            "API for resizing and optimizing images stored in S3-compatible storage",
        },
        tags: [
          { name: "images", description: "Image operations" },
          { name: "admin", description: "Administrative operations" },
        ],
      },
    })
  )
  .use(cors())
  .get("/", () => "Hello World")
  .use((app) => imageController.registerRoutes(app))
  .use((app) => adminController.registerRoutes(app));

// Initialize services
const init = async () => {
  try {
    // Try to connect to S3 storage with retries
    let retries = 0;
    const maxRetries = 5;
    let connected = false;

    while (!connected && retries < maxRetries) {
      try {
        await storageService.initialize();
        connected = true;
        logger.info("Successfully connected to S3 storage");
      } catch (error: any) {
        retries++;
        logger.error(
          `Failed to connect to S3 storage (attempt ${retries}/${maxRetries}): ${error.message}`
        );
        if (retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1000; // Exponential backoff
          logger.info(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!connected) {
      logger.error(
        "Failed to connect to S3 storage after maximum retries. Application may not function correctly."
      );
    }

    // Initialize cache if enabled
    if (cacheService) {
      try {
        await cacheService.close(); // Close any existing connections
        logger.info("Cache service initialized");
      } catch (error: any) {
        logger.error(`Error initializing cache service: ${error.message}`);
      }
    }

    logger.info(
      `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`
    );
  } catch (error: any) {
    logger.error(`Error during initialization: ${error.message}`);
  }
};

app.listen(config.server.port, () => {
  init();
});

export type App = typeof app;
