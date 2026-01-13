import { Elysia, t } from "elysia";
import { config } from "../config";
import { imageService, ResizeOptions } from "../services/image.service";
import { storageService } from "../services/bun-s3.service";
import { ApiKeyService } from "../middleware/auth.middleware";

const resizeParamsSchema = t.Object({
  "*": t.String(),
});

const resizeQuerySchema = t.Object({
  width: t.Optional(t.String()),
  height: t.Optional(t.String()),
  format: t.Optional(t.String()),
  quality: t.Optional(t.String()),
  rotate: t.Optional(t.String()),
  flip: t.Optional(t.String()),
  flop: t.Optional(t.String()),
  grayscale: t.Optional(t.String()),
  blur: t.Optional(t.String()),
  sharpen: t.Optional(t.String()),
  watermarkText: t.Optional(t.String()),
  watermarkImage: t.Optional(t.String()),
  watermarkPosition: t.Optional(t.String()),
  watermarkOpacity: t.Optional(t.String()),
  cropLeft: t.Optional(t.String()),
  cropTop: t.Optional(t.String()),
  cropWidth: t.Optional(t.String()),
  cropHeight: t.Optional(t.String()),
});

const uploadBodySchema = t.Object({
  image: t.String(),
  path: t.String(),
  contentType: t.String(),
});

export const imageController = new Elysia({ prefix: "/images" })
  // .use(AuthMiddleware.apiKeyAuth)
  .get("/health", () => ({ status: "ok" }))
  .get(
    "/resize/*",
    async ({ params, query, set }) => {
      try {
        // Extract the path from the wildcard parameter
        const path = params["*"];

        const options: ResizeOptions = {
          // Basic options
          width: query.width ? parseInt(query.width as string) : undefined,
          height: query.height ? parseInt(query.height as string) : undefined,
          format: (query.format as "webp" | "jpeg" | "png") || "webp",
          quality: query.quality
            ? parseInt(query.quality as string)
            : config.image.quality,

          // Transformation options
          rotate: query.rotate ? parseInt(query.rotate as string) : undefined,
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
        const cacheKey = imageService.generateCacheKey(path, options);
        const cachePath = `cache/${cacheKey}`;

        // Check if the resized image already exists in the cache
        const cacheExists =
          config.cache.enabled &&
          (await storageService.objectExists(cachePath));

        if (cacheExists) {
          // Return the cached image
          const cachedImage = await storageService.getObject(cachePath);
          set.headers["Content-Type"] = imageService.getContentType(
            options.format as string
          );
          set.headers[
            "Cache-Control"
          ] = `public, max-age=${config.cache.maxAge}`;
          return cachedImage;
        }

        // Get the original image from MinIO
        const originalExists = await storageService.objectExists(path);
        if (!originalExists) {
          set.status = 404;
          return { message: "Image not found" };
        }

        const originalImage = await storageService.getObject(path);

        // Resize the image
        const resizedImage = await imageService.resize(
          originalImage,
          options,
          path
        );

        // Store the resized image in the cache if caching is enabled
        if (config.cache.enabled) {
          await storageService.putObject(
            cachePath,
            resizedImage,
            imageService.getContentType(options.format as string)
          );
        }

        // Return the resized image
        set.headers["Content-Type"] = imageService.getContentType(
          options.format as string
        );
        set.headers["Cache-Control"] = `public, max-age=${config.cache.maxAge}`;
        return resizedImage;
      } catch (err) {
        console.error("Error processing image:", err);
        set.status = 500;
        return { message: "Failed to process image" };
      }
    },
    { params: resizeParamsSchema, query: resizeQuerySchema }
  )
  .use(ApiKeyService)
  .post(
    "/upload",
    async ({ body, request, set }) => {
      try {
        const { image, path, contentType } = body;

        if (!image || !path || !contentType) {
          set.status = 400;
          return { message: "Missing required fields" };
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(image, "base64");

        // Store the original image in MinIO
        await storageService.putObject(path, buffer, contentType);

        // Get the base URL from the request
        const baseUrl = new URL(request.url).origin;
        const isProduction = process.env.NODE_ENV === "production";
        const finalBaseUrl = isProduction
          ? baseUrl.replace(/^http:/, "https:")
          : baseUrl;

        return {
          success: true,
          path,
          url: storageService.getObjectUrl(path, finalBaseUrl),
        };
      } catch (err) {
        console.error("Error uploading image:", err);
        set.status = 500;
        return { message: "Failed to upload image" };
      }
    },
    { body: uploadBodySchema }
  );
