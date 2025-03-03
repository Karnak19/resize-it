import sharp from "sharp";
import { config } from "../config";
import { createHash } from "crypto";
import { MonitoringService } from "./monitoring.service";
import { CacheService } from "./cache.service";

export interface ResizeOptions {
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "png";
  quality?: number;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  grayscale?: boolean;
  blur?: number;
  sharpen?: boolean;
  watermark?: {
    text?: string;
    image?: string;
    position?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
    opacity?: number;
  };
  crop?: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  };
}

interface CachedImage {
  buffer: Buffer;
  contentType: string;
  cacheTime: number;
}

export class ImageService {
  private monitoringService?: MonitoringService;
  private cacheService?: CacheService;

  constructor(
    monitoringService?: MonitoringService,
    cacheService?: CacheService
  ) {
    this.monitoringService = monitoringService;
    this.cacheService = cacheService;
  }

  async resize(
    imageBuffer: Buffer,
    options: ResizeOptions,
    originalPath: string = "unknown"
  ): Promise<Buffer> {
    const startTime = performance.now();
    const inputSize = imageBuffer.length;

    // Try to get from cache first if cache service is available
    if (this.cacheService && config.cache.enabled) {
      const cacheKey = this.cacheService.generateImageCacheKey(
        originalPath,
        options
      );
      const cachedImage = await this.cacheService.get<CachedImage>(cacheKey);

      if (cachedImage) {
        // Record cache hit metric
        if (this.monitoringService) {
          this.monitoringService.recordMetric("image_cache", {
            originalPath,
            cacheHit: true,
            size: cachedImage.buffer.length,
            age: Date.now() - cachedImage.cacheTime,
          });
        }
        return cachedImage.buffer;
      }
    }

    const {
      width = config.image.maxWidth,
      height = config.image.maxHeight,
      format = "webp",
      quality = config.image.quality,
      rotate,
      flip,
      flop,
      grayscale,
      blur,
      sharpen,
      watermark,
      crop,
    } = options;

    let transformer = sharp(imageBuffer);

    if (crop && crop.width && crop.height) {
      transformer = transformer.extract({
        left: crop.left || 0,
        top: crop.top || 0,
        width: crop.width,
        height: crop.height,
      });
    }

    transformer = transformer.resize({
      width: width > config.image.maxWidth ? config.image.maxWidth : width,
      height: height > config.image.maxHeight ? config.image.maxHeight : height,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (rotate) {
      transformer = transformer.rotate(rotate);
    }

    if (flip) {
      transformer = transformer.flip();
    }
    if (flop) {
      transformer = transformer.flop();
    }

    if (grayscale) {
      transformer = transformer.grayscale();
    }

    if (blur && blur > 0) {
      transformer = transformer.blur(blur);
    }

    if (sharpen) {
      transformer = transformer.sharpen();
    }

    if (watermark && (watermark.text || watermark.image)) {
      if (watermark.text) {
        transformer = await this.applyTextWatermark(transformer, watermark);
      } else if (watermark.image) {
        transformer = await this.applyImageWatermark(transformer, watermark);
      }
    }

    switch (format) {
      case "webp":
        transformer = transformer.webp({ quality });
        break;
      case "jpeg":
        transformer = transformer.jpeg({ quality });
        break;
      case "png":
        transformer = transformer.png({ quality });
        break;
      default:
        transformer = transformer.webp({ quality });
    }

    const outputBuffer = await transformer.toBuffer();
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Record metrics if monitoring service is available
    if (this.monitoringService) {
      this.monitoringService.recordImageProcessing({
        originalPath,
        transformations: { ...options },
        outputFormat: format,
        inputSize,
        outputSize: outputBuffer.length,
        processingTime,
        timestamp: Date.now(),
      });

      // Record cache miss metric
      if (this.cacheService && config.cache.enabled) {
        this.monitoringService.recordMetric("image_cache", {
          originalPath,
          cacheHit: false,
          processingTime,
        });
      }
    }

    // Store in cache if cache service is available
    if (this.cacheService && config.cache.enabled) {
      const cacheKey = this.cacheService.generateImageCacheKey(
        originalPath,
        options
      );
      const contentType = this.getContentType(format);

      await this.cacheService.set(cacheKey, {
        buffer: outputBuffer,
        contentType,
        cacheTime: Date.now(),
      });
    }

    return outputBuffer;
  }

  private async applyTextWatermark(
    transformer: sharp.Sharp,
    watermark: ResizeOptions["watermark"]
  ): Promise<sharp.Sharp> {
    if (!watermark?.text) return transformer;

    const { text, position = "bottom-right", opacity = 0.5 } = watermark;

    const svgText = `
      <svg width="500" height="100">
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="rgba(255, 255, 255, ${opacity})" text-anchor="middle" dominant-baseline="middle">${text}</text>
      </svg>
    `;

    const textBuffer = Buffer.from(svgText);
    const metadata = await transformer.metadata();

    let gravity: sharp.Gravity;
    switch (position) {
      case "top-left":
        gravity = "northwest";
        break;
      case "top-right":
        gravity = "northeast";
        break;
      case "bottom-left":
        gravity = "southwest";
        break;
      case "bottom-right":
        gravity = "southeast";
        break;
      case "center":
        gravity = "center";
        break;
      default:
        gravity = "southeast";
    }

    return transformer.composite([
      {
        input: textBuffer,
        gravity,
      },
    ]);
  }

  private async applyImageWatermark(
    transformer: sharp.Sharp,
    watermark: ResizeOptions["watermark"]
  ): Promise<sharp.Sharp> {
    if (!watermark?.image) return transformer;

    try {
      const { image, position = "bottom-right", opacity = 0.5 } = watermark;

      const watermarkBuffer = await this.loadWatermarkImage(image);
      if (!watermarkBuffer) return transformer;

      const processedWatermark = await sharp(watermarkBuffer)
        .resize({ width: 150 })
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
            raw: {
              width: 1,
              height: 1,
              channels: 4,
            },
            tile: true,
            blend: "dest-in",
          },
        ])
        .toBuffer();

      let gravity: sharp.Gravity;
      switch (position) {
        case "top-left":
          gravity = "northwest";
          break;
        case "top-right":
          gravity = "northeast";
          break;
        case "bottom-left":
          gravity = "southwest";
          break;
        case "bottom-right":
          gravity = "southeast";
          break;
        case "center":
          gravity = "center";
          break;
        default:
          gravity = "southeast";
      }

      return transformer.composite([
        {
          input: processedWatermark,
          gravity,
        },
      ]);
    } catch (error) {
      console.error("Error applying image watermark:", error);
      return transformer;
    }
  }

  private async loadWatermarkImage(imagePath: string): Promise<Buffer | null> {
    try {
      return null;
    } catch (error) {
      console.error("Error loading watermark image:", error);
      return null;
    }
  }

  getContentType(format: string): string {
    switch (format) {
      case "webp":
        return "image/webp";
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      default:
        return "image/webp";
    }
  }

  generateCacheKey(originalPath: string, options: ResizeOptions): string {
    const optionsStr = JSON.stringify(options);
    const key = `${originalPath}_${optionsStr}`;
    return createHash("md5").update(key).digest("hex");
  }
}
