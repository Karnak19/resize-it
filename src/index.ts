import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { ImageService } from "./services/image.service";
import { MinioService } from "./services/minio.service";
import { MonitoringService } from "./services/monitoring.service";
import { ImageController } from "./controllers/image.controller";
import { AdminController } from "./controllers/admin.controller";
import { AuthMiddleware } from "./middleware/auth.middleware";

// Initialize services
const minioService = new MinioService();
const monitoringService = new MonitoringService();
const imageService = new ImageService(monitoringService);

// Initialize controllers
const imageController = new ImageController(imageService, minioService);
const adminController = new AdminController(monitoringService, minioService);

// Initialize MinIO bucket with retries
const initializeMinIO = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `Attempting to connect to MinIO (attempt ${attempt}/${retries})...`
      );
      await minioService.initialize();
      console.log("Successfully connected to MinIO and initialized bucket");
      return;
    } catch (error) {
      console.error(
        `Failed to initialize MinIO (attempt ${attempt}/${retries}):`,
        error
      );

      if (attempt === retries) {
        console.error("Maximum retry attempts reached. Exiting...");
        process.exit(1);
      }

      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Create and configure the app
const app = new Elysia()
  // Apply CORS middleware with configuration
  .use(
    cors({
      origin: config.security.cors.allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
      credentials: true,
    })
  )
  // Apply rate limiter middleware
  .use(AuthMiddleware.rateLimiter)
  // Apply request metrics middleware
  // .use(monitoringService.createRequestMetricsMiddleware())
  // Apply Swagger documentation
  .use(
    swagger({
      documentation: {
        info: {
          title: "Image Resizer API",
          version: "1.0.0",
          description: "API for resizing and optimizing images stored in MinIO",
        },
        tags: [
          { name: "Image", description: "Image operations" },
          { name: "Admin", description: "Admin operations" },
          { name: "Health", description: "Health check" },
        ],
        components: {
          securitySchemes: {
            apiKey: {
              type: "apiKey",
              in: "header",
              name: "X-API-Key",
            },
          },
        },
      },
    })
  );

// Register routes
// Create a new Elysia instance for each controller to avoid type issues
const imageApp = new Elysia();
imageController.registerRoutes(imageApp);

const adminApp = new Elysia();
adminController.registerRoutes(adminApp);

// Mount the controller apps to the main app
app.use(imageApp);
app.use(adminApp);

// Start the server and initialize MinIO
const server = app.listen(config.server.port, () => {
  console.log(
    `🦊 Image Resizer is running at ${config.server.host}:${config.server.port}`
  );
  console.log(
    `📚 Swagger documentation available at http://${config.server.host}:${config.server.port}/swagger`
  );

  // Initialize MinIO after server has started
  initializeMinIO().catch((error) => {
    console.error("Failed to initialize MinIO after retries:", error);
    process.exit(1);
  });
});
