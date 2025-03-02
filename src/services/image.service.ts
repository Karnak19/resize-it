import sharp from "sharp";
import { config } from "../config";
import { createHash } from "crypto";

export interface ResizeOptions {
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "png";
  quality?: number;
}

export class ImageService {
  async resize(imageBuffer: Buffer, options: ResizeOptions): Promise<Buffer> {
    const {
      width = config.image.maxWidth,
      height = config.image.maxHeight,
      format = "webp",
      quality = config.image.quality,
    } = options;

    let transformer = sharp(imageBuffer).resize({
      width: width > config.image.maxWidth ? config.image.maxWidth : width,
      height: height > config.image.maxHeight ? config.image.maxHeight : height,
      fit: "inside",
      withoutEnlargement: true,
    });

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

    return transformer.toBuffer();
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
    const { width, height, format, quality } = options;
    const key = `${originalPath}_w${width}_h${height}_f${format}_q${quality}`;
    return createHash("md5").update(key).digest("hex");
  }
}
