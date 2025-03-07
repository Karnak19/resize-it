# ResizeIt Image Component

This component provides an easy way to display and resize images using the ResizeIt service in your dashboard application.

## Installation

The component is already installed as part of the dashboard package. Make sure you have the following environment variables set in your `.env` file:

```
NEXT_PUBLIC_RESIZE_IT_API_URL=http://localhost:3001
NEXT_PUBLIC_RESIZE_IT_API_KEY=your-api-key-if-needed
```

## Basic Usage

```tsx
import { ResizeItImage } from "@/components/ui/image";

// Basic usage with fixed dimensions
<ResizeItImage
  src="path/to/your/image.jpg"
  alt="Description of the image"
  width={400}
  height={300}
/>

// Using fill mode (container must have position relative and dimensions)
<div className="relative h-48 w-full">
  <ResizeItImage
    src="path/to/your/image.jpg"
    alt="Description of the image"
    fill
  />
</div>
```

## Props

The `ResizeItImage` component accepts the following props:

| Prop            | Type    | Description                                                        |
| --------------- | ------- | ------------------------------------------------------------------ |
| `src`           | string  | Path of the image in the storage                                   |
| `alt`           | string  | Alternative text for the image                                     |
| `width`         | number  | Width of the image in pixels                                       |
| `height`        | number  | Height of the image in pixels                                      |
| `resizeOptions` | object  | Additional resize options (see below)                              |
| `fill`          | boolean | Fill the container (uses Next.js Image fill mode)                  |
| `objectFit`     | string  | Object fit style: "contain", "cover", "fill", "none", "scale-down" |
| `priority`      | boolean | Priority loading (for LCP images)                                  |
| `loading`       | string  | Loading strategy: "eager" or "lazy"                                |
| `className`     | string  | Additional CSS classes                                             |

## Resize Options

The `resizeOptions` prop accepts an object with the following properties:

```tsx
{
  // Format options
  format?: "webp" | "jpeg" | "jpg" | "png";
  quality?: number; // 1-100

  // Transformation options
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  grayscale?: boolean;
  blur?: number;
  sharpen?: boolean;

  // Watermark options
  watermark?: {
    text?: string;
    image?: string;
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    opacity?: number;
  };

  // Crop options
  crop?: {
    left?: number;
    top?: number;
    width: number;
    height: number;
  };
}
```

## Using the Image Loader

If you prefer to use the Next.js Image component directly, you can use the provided loader:

```tsx
import Image from "next/image";
import { resizeItImageLoader } from "@/components/ui/image";

<Image
  src="path/to/your/image.jpg"
  alt="Description of the image"
  width={400}
  height={300}
  loader={resizeItImageLoader}
/>;
```

## Examples

See the `image-example.tsx` component for more usage examples.
