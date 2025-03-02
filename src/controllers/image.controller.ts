import { Elysia, t } from "elysia";
import { ImageService, ResizeOptions } from "../services/image.service";
import { MinioService } from "../services/minio.service";
import { config } from "../config";

export class ImageController {
  constructor(
    private readonly imageService: ImageService,
    private readonly minioService: MinioService
  ) {}

  registerRoutes(app: Elysia): Elysia {
    return app
      .get("/health", () => ({ status: "ok" }))
      .get(
        "/resize/:path",
        async ({ params, query, set }) => {
          try {
            const { path } = params;
            const options: ResizeOptions = {
              // Basic options
              width: query.width ? parseInt(query.width as string) : undefined,
              height: query.height
                ? parseInt(query.height as string)
                : undefined,
              format: (query.format as "webp" | "jpeg" | "png") || "webp",
              quality: query.quality
                ? parseInt(query.quality as string)
                : config.image.quality,

              // Transformation options
              rotate: query.rotate
                ? parseInt(query.rotate as string)
                : undefined,
              flip: query.flip === "true",
              flop: query.flop === "true",
              grayscale: query.grayscale === "true",
              blur: query.blur ? parseFloat(query.blur as string) : undefined,
              sharpen: query.sharpen === "true",
            };

            // Handle watermark
            if (query.watermarkText) {
              options.watermark = {
                text: query.watermarkText as string,
                position: (query.watermarkPosition as any) || "bottom-right",
                opacity: query.watermarkOpacity
                  ? parseFloat(query.watermarkOpacity as string)
                  : 0.5,
              };
            } else if (query.watermarkImage) {
              options.watermark = {
                image: query.watermarkImage as string,
                position: (query.watermarkPosition as any) || "bottom-right",
                opacity: query.watermarkOpacity
                  ? parseFloat(query.watermarkOpacity as string)
                  : 0.5,
              };
            }

            // Handle crop
            if (query.cropWidth && query.cropHeight) {
              options.crop = {
                left: query.cropLeft ? parseInt(query.cropLeft as string) : 0,
                top: query.cropTop ? parseInt(query.cropTop as string) : 0,
                width: parseInt(query.cropWidth as string),
                height: parseInt(query.cropHeight as string),
              };
            }

            // Generate a cache key for this specific resize operation
            const cacheKey = this.imageService.generateCacheKey(path, options);

            // Check if the resized image already exists in the cache
            const cacheExists =
              config.cache.enabled &&
              (await this.minioService.objectExists(`cache/${cacheKey}`));

            if (cacheExists) {
              // Return the cached image
              const cachedImage = await this.minioService.getObject(
                `cache/${cacheKey}`
              );
              set.headers["Content-Type"] = this.imageService.getContentType(
                options.format as string
              );
              set.headers[
                "Cache-Control"
              ] = `public, max-age=${config.cache.maxAge}`;
              return cachedImage;
            }

            // Get the original image from MinIO
            const originalExists = await this.minioService.objectExists(path);
            if (!originalExists) {
              set.status = 404;
              return { error: "Image not found" };
            }

            const originalImage = await this.minioService.getObject(path);

            // Resize the image
            const resizedImage = await this.imageService.resize(
              originalImage,
              options,
              path
            );

            // Store the resized image in the cache if caching is enabled
            if (config.cache.enabled) {
              await this.minioService.putObject(
                `cache/${cacheKey}`,
                resizedImage,
                this.imageService.getContentType(options.format as string)
              );
            }

            // Return the resized image
            set.headers["Content-Type"] = this.imageService.getContentType(
              options.format as string
            );
            set.headers[
              "Cache-Control"
            ] = `public, max-age=${config.cache.maxAge}`;
            return resizedImage;
          } catch (error) {
            console.error("Error processing image:", error);
            set.status = 500;
            return { error: "Failed to process image" };
          }
        },
        {
          params: t.Object({
            path: t.String(),
          }),
          query: t.Object({
            // Basic options
            width: t.Optional(t.String()),
            height: t.Optional(t.String()),
            format: t.Optional(t.String()),
            quality: t.Optional(t.String()),

            // Transformation options
            rotate: t.Optional(t.String()),
            flip: t.Optional(t.String()),
            flop: t.Optional(t.String()),
            grayscale: t.Optional(t.String()),
            blur: t.Optional(t.String()),
            sharpen: t.Optional(t.String()),

            // Watermark options
            watermarkText: t.Optional(t.String()),
            watermarkImage: t.Optional(t.String()),
            watermarkPosition: t.Optional(t.String()),
            watermarkOpacity: t.Optional(t.String()),

            // Crop options
            cropLeft: t.Optional(t.String()),
            cropTop: t.Optional(t.String()),
            cropWidth: t.Optional(t.String()),
            cropHeight: t.Optional(t.String()),
          }),
        }
      )
      .post(
        "/upload",
        async ({ body, set }) => {
          try {
            const { image, path, contentType } = body;

            if (!image || !path || !contentType) {
              set.status = 400;
              return { error: "Missing required fields" };
            }

            // Convert base64 to buffer
            const buffer = Buffer.from(image, "base64");

            // Store the original image in MinIO
            await this.minioService.putObject(path, buffer, contentType);

            return {
              success: true,
              path,
              url: this.minioService.getObjectUrl(path),
            };
          } catch (error) {
            console.error("Error uploading image:", error);
            set.status = 500;
            return { error: "Failed to upload image" };
          }
        },
        {
          body: t.Object({
            image: t.String(),
            path: t.String(),
            contentType: t.String(),
          }),
        }
      );
  }
}
