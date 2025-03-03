import {
  ResizeItConfig,
  ResizeOptions,
  UploadOptions,
  UploadResponse,
} from "./types";

/**
 * ResizeIt SDK for uploading and retrieving images
 */
export class ResizeIt {
  private config: ResizeItConfig;

  /**
   * Create a new ResizeIt SDK instance
   * @param config Configuration options
   */
  constructor(config: ResizeItConfig) {
    this.config = {
      timeout: 30000, // Default timeout: 30 seconds
      ...config,
    };

    // Ensure baseUrl doesn't end with a slash
    if (this.config.baseUrl.endsWith("/")) {
      this.config.baseUrl = this.config.baseUrl.slice(0, -1);
    }
  }

  /**
   * Upload an image to the ResizeIt service
   * @param imageData Image data as a Buffer, Blob, or base64 string
   * @param options Upload options
   * @returns Promise resolving to the upload response
   */
  async uploadImage(
    imageData: Buffer | Blob | string,
    options: UploadOptions
  ): Promise<UploadResponse> {
    try {
      // Convert image data to base64 if it's not already
      let base64Image: string;

      if (typeof imageData === "string") {
        // Check if it's already base64
        if (
          imageData.startsWith("data:") ||
          /^[A-Za-z0-9+/=]+$/.test(imageData)
        ) {
          // If it's a data URL, extract the base64 part
          base64Image = imageData.startsWith("data:")
            ? imageData.split(",")[1]
            : imageData;
        } else {
          // It's a string but not base64, convert it to base64
          base64Image = Buffer.from(imageData).toString("base64");
        }
      } else if (imageData instanceof Buffer) {
        base64Image = imageData.toString("base64");
      } else if (imageData instanceof Blob) {
        // Convert Blob to base64
        const arrayBuffer = await imageData.arrayBuffer();
        base64Image = Buffer.from(arrayBuffer).toString("base64");
      } else {
        throw new Error("Unsupported image data format");
      }

      // Prepare the request
      const response = await fetch(`${this.config.baseUrl}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey
            ? { Authorization: `Bearer ${this.config.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          image: base64Image,
          path: options.path,
          contentType: options.contentType,
        }),
        signal: this.config.timeout
          ? AbortSignal.timeout(this.config.timeout)
          : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Upload failed with status: ${response.status}`
        );
      }

      return (await response.json()) as UploadResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      throw new Error("Failed to upload image: Unknown error");
    }
  }

  /**
   * Get a URL for a resized image
   * @param imagePath Path of the original image
   * @param options Resize options
   * @returns URL for the resized image
   */
  getResizeUrl(imagePath: string, options: ResizeOptions = {}): string {
    // Start with the base URL and path
    const url = new URL(`${this.config.baseUrl}/resize/${imagePath}`);

    // Add resize parameters
    if (options.width !== undefined)
      url.searchParams.append("width", options.width.toString());
    if (options.height !== undefined)
      url.searchParams.append("height", options.height.toString());
    if (options.format) url.searchParams.append("format", options.format);
    if (options.quality !== undefined)
      url.searchParams.append("quality", options.quality.toString());

    // Add transformation parameters
    if (options.rotate !== undefined)
      url.searchParams.append("rotate", options.rotate.toString());
    if (options.flip !== undefined)
      url.searchParams.append("flip", options.flip.toString());
    if (options.flop !== undefined)
      url.searchParams.append("flop", options.flop.toString());
    if (options.grayscale !== undefined)
      url.searchParams.append("grayscale", options.grayscale.toString());
    if (options.blur !== undefined)
      url.searchParams.append("blur", options.blur.toString());
    if (options.sharpen !== undefined)
      url.searchParams.append("sharpen", options.sharpen.toString());

    // Add watermark parameters
    if (options.watermark) {
      if (options.watermark.text)
        url.searchParams.append("watermarkText", options.watermark.text);
      if (options.watermark.image)
        url.searchParams.append("watermarkImage", options.watermark.image);
      if (options.watermark.position)
        url.searchParams.append(
          "watermarkPosition",
          options.watermark.position
        );
      if (options.watermark.opacity !== undefined)
        url.searchParams.append(
          "watermarkOpacity",
          options.watermark.opacity.toString()
        );
    }

    // Add crop parameters
    if (options.crop) {
      if (options.crop.left !== undefined)
        url.searchParams.append("cropLeft", options.crop.left.toString());
      if (options.crop.top !== undefined)
        url.searchParams.append("cropTop", options.crop.top.toString());
      url.searchParams.append("cropWidth", options.crop.width.toString());
      url.searchParams.append("cropHeight", options.crop.height.toString());
    }

    return url.toString();
  }

  /**
   * Fetch a resized image
   * @param imagePath Path of the original image
   * @param options Resize options
   * @returns Promise resolving to the resized image as a Blob
   */
  async getResizedImage(
    imagePath: string,
    options: ResizeOptions = {}
  ): Promise<Blob> {
    try {
      const url = this.getResizeUrl(imagePath, options);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...(this.config.apiKey
            ? { Authorization: `Bearer ${this.config.apiKey}` }
            : {}),
        },
        signal: this.config.timeout
          ? AbortSignal.timeout(this.config.timeout)
          : undefined,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get resized image: ${response.status} ${response.statusText}`
        );
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get resized image: ${error.message}`);
      }
      throw new Error("Failed to get resized image: Unknown error");
    }
  }
}

// Export types
export * from "./types";
