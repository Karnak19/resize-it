import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { logger } from "./utils/logger";
import { imageController } from "./controllers/image.controller";
import { adminController } from "./controllers/admin.controller";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Resize-it API",
          version: "2.0.0",
          description:
            "API for resizing and optimizing images stored in S3-compatible storage",
        },
      },
    })
  )
  .use(cors())
  .get("/", () => "Hello World")
  .use(adminController)
  .use(imageController);

app.listen(config.server.port, ({ hostname, port, development }) => {
  logger.info(`🚀 Server running at http://${hostname}:${port}`);
  logger.info(
    `📚 Swagger docs available at http://${hostname}:${port}/swagger`
  );
  logger.info(`🔧 Environment: ${development ? "development" : "production"}`);
});

export type App = typeof app;
