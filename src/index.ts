import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { ImageService } from "./services/image.service";
import { MinioService } from "./services/minio.service";
import { ImageController } from "./controllers/image.controller";

// Initialize services
const minioService = new MinioService();
const imageService = new ImageService();
const imageController = new ImageController(imageService, minioService);

// Initialize MinIO bucket
minioService.initialize().catch((error) => {
  console.error("Failed to initialize MinIO:", error);
  process.exit(1);
});

// Create and configure the app
const app = new Elysia().use(cors()).use(
  swagger({
    documentation: {
      info: {
        title: "Image Resizer API",
        version: "1.0.0",
        description: "API for resizing and optimizing images stored in MinIO",
      },
      tags: [
        { name: "Image", description: "Image operations" },
        { name: "Health", description: "Health check" },
      ],
    },
  })
);

// Register routes
imageController.registerRoutes(app);

// Start the server
const server = app.listen(config.server.port, () => {
  console.log(
    `🦊 Image Resizer is running at ${config.server.host}:${config.server.port}`
  );
  console.log(
    `📚 Swagger documentation available at http://${config.server.host}:${config.server.port}/swagger`
  );
});
