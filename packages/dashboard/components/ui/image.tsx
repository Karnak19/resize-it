"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ResizeIt, ResizeOptions } from "@karnak19/resize-it-sdk";
import { cn } from "@/lib/utils";

export interface ResizeItImageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Path of the image in the storage
   */
  src: string;

  /**
   * Alternative text for the image
   */
  alt: string;

  /**
   * Width of the image in pixels
   */
  width?: number;

  /**
   * Height of the image in pixels
   */
  height?: number;

  /**
   * Additional resize options
   */
  resizeOptions?: Omit<ResizeOptions, "width" | "height">;

  /**
   * Fill the container (uses Next.js Image fill mode)
   */
  fill?: boolean;

  /**
   * Object fit style
   */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";

  /**
   * Priority loading (for LCP images)
   */
  priority?: boolean;

  /**
   * Loading strategy
   */
  loading?: "eager" | "lazy";

  /**
   * API key to use for the image
   */
  apiKey?: string;
}

/**
 * ResizeIt Image component for displaying images with on-the-fly resizing
 */
export function ResizeItImage({
  src,
  alt,
  width,
  height,
  resizeOptions,
  fill = false,
  objectFit = "cover",
  priority = false,
  loading,
  className,
  apiKey,
  ...props
}: ResizeItImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("");

  const [resizeItClient, setResizeItClient] = useState<ResizeIt>(
    new ResizeIt({
      baseUrl: process.env.NEXT_PUBLIC_RESIZE_IT_API_URL,
      apiKey: apiKey,
    })
  );

  useEffect(() => {
    // Generate the resize URL using the SDK
    const options: ResizeOptions = {
      ...(width && { width }),
      ...(height && { height }),
      ...resizeOptions,
    };

    const url = resizeItClient.getResizeUrl(src, options);
    setImageUrl(url);
  }, [src, width, height, resizeOptions]);

  if (!imageUrl) {
    // Return a placeholder or loading state
    return (
      <div
        className={cn("bg-gray-200 animate-pulse rounded-md", className)}
        style={{ width: width || "100%", height: height || "100%" }}
        {...props}
      />
    );
  }

  return (
    <div className={cn("overflow-hidden", className)} {...props}>
      <Image
        src={imageUrl}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        style={{ objectFit }}
        priority={priority}
        loading={loading}
        quality={100}
        className="w-full h-full"
      />
    </div>
  );
}

/**
 * ResizeIt Image Loader function for use with Next.js Image component
 */
export function resizeItImageLoader({
  src,
  width,
  quality,
  apiKey,
}: {
  src: string;
  width: number;
  quality?: number;
  apiKey?: string;
}) {
  const resizeItClient = new ResizeIt({
    baseUrl: process.env.NEXT_PUBLIC_RESIZE_IT_API_URL,
    apiKey: apiKey,
  });

  return resizeItClient.getResizeUrl(src, {
    width,
    quality,
  });
}
