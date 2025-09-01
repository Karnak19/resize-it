import sharp from "sharp";
import { config } from "../config";
import { createHash } from "crypto";
import heicConvert from "heic-convert";
import { monitoringService, MonitoringService } from "./monitoring.service";
import { cacheService, CacheService } from "./cache.service";

export interface ResizeOptions {
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "jpg" | "png";
  quality?: number;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  grayscale?: boolean;
  blur?: number;
  sharpen?: boolean;
  crop?: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  };
}

/**
 * Watermark configuration for image processing
 */
export interface WatermarkOptions {
  text?: string;
  image?: string;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center"
    | "repeat-45deg";
  opacity?: number;
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

  private isHeic(buffer: Buffer): boolean {
    if (buffer.length < 12) {
      return false;
    }
    const signature = buffer.slice(4, 12);
    return signature.toString() === "ftypheic";
  }

  async resize(
    imageBuffer: Buffer,
    options: ResizeOptions,
    originalPath: string = "unknown"
  ): Promise<Buffer> {
    const startTime = performance.now();
    let inputSize = imageBuffer.length;
    let processedImageBuffer = imageBuffer;

    if (this.isHeic(imageBuffer)) {
      processedImageBuffer = Buffer.from(
        await heicConvert({
          buffer: imageBuffer,
          format: "JPEG",
        })
      );
      inputSize = processedImageBuffer.length;
    }

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
      crop,
    } = options;

    let transformer = sharp(processedImageBuffer);

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

    switch (format) {
      case "webp":
        transformer = transformer.webp({ quality });
        break;
      case "jpeg":
      case "jpg":
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

  /**
   * Apply watermark to an image during upload
   * @param imageBuffer Original image buffer
   * @param watermark Watermark options
   * @returns Buffer of image with watermark applied
   */
  async applyWatermark(
    imageBuffer: Buffer,
    watermark: WatermarkOptions
  ): Promise<Buffer> {
    let transformer = sharp(imageBuffer);

    if (watermark.text) {
      transformer = await this.applyTextWatermark(transformer, watermark);
    } else if (watermark.image) {
      transformer = await this.applyImageWatermark(transformer, watermark);
    }

    return transformer.toBuffer();
  }

  private async applyTextWatermark(
    transformer: sharp.Sharp,
    watermark: WatermarkOptions
  ): Promise<sharp.Sharp> {
    if (!watermark?.text) return transformer;

    const { text, position = "repeat-45deg", opacity = 0.5 } = watermark;

    // Get image dimensions to create appropriate watermark pattern
    const metadata = await transformer.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Check if we should use standard positioning or the repeating pattern
    if (
      position === "bottom-right" ||
      position === "bottom-left" ||
      position === "top-right" ||
      position === "top-left" ||
      position === "center"
    ) {
      // Use standard positioning for explicit positions
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

      const svgText = `
        <svg width="500" height="100">
          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="rgba(255, 255, 255, ${opacity})" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>
      `;

      const textBuffer = Buffer.from(svgText);

      return transformer.composite([
        {
          input: textBuffer,
          gravity,
        },
      ]);
    } else {
      // Create a repeating 45° watermark pattern across the entire image
      // Calculate the size of the watermark tile - make it large enough to contain the text
      const tileSize = Math.max(text.length * 12, 200); // Rough estimate for tile size based on text length

      // Create a larger SVG for the repeating pattern with 45° rotation
      const svgPattern = `
        <svg width="${tileSize}" height="${tileSize}" viewBox="0 0 ${tileSize} ${tileSize}">
          <defs>
            <pattern id="watermark" patternUnits="userSpaceOnUse" width="${
              tileSize * 2
            }" height="${tileSize * 2}" patternTransform="rotate(45)">
              <text x="${tileSize / 2}" y="${
        tileSize / 2
      }" font-family="Arial" font-size="24" fill="rgba(255, 255, 255, ${opacity})" text-anchor="middle" dominant-baseline="middle">${text}</text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#watermark)" />
        </svg>
      `;

      const watermarkBuffer = Buffer.from(svgPattern);

      // Create a composite of the entire image covered with the watermark pattern
      return transformer.composite([
        {
          input: watermarkBuffer,
          tile: true, // Repeat the watermark pattern
          blend: "over",
        },
      ]);
    }
  }

  private async applyImageWatermark(
    transformer: sharp.Sharp,
    watermark: WatermarkOptions
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

export const imageService = new ImageService(monitoringService, cacheService);
