/**
 * Configuration options for the ResizeIt SDK
 */
export interface ResizeItConfig {
  /**
   * Base URL of the ResizeIt API
   */
  baseUrl: string;

  /**
   * API key for authentication (if required)
   */
  apiKey?: string;

  /**
   * Default timeout for requests in milliseconds
   */
  timeout?: number;

  /**
   * Watermark options to be applied when uploading images
   */
  watermark?: {
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
  };
}

/**
 * Options for image resizing
 */
export interface ResizeOptions {
  // Basic options
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "jpg" | "png";
  quality?: number;

  // Transformation options
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  grayscale?: boolean;
  blur?: number;
  sharpen?: boolean;

  // Crop options
  crop?: {
    left?: number;
    top?: number;
    width: number;
    height: number;
  };
}

/**
 * Response from the upload operation
 */
export interface UploadResponse {
  success: boolean;
  path: string;
  url: string;
  error?: string;
}

/**
 * Options for uploading an image
 */
export interface UploadOptions {
  /**
   * Path where the image should be stored
   */
  path: string;

  /**
   * Content type of the image
   */
  contentType: string;
}
