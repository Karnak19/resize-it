# ResizeIt SDK

A simple TypeScript SDK for uploading and retrieving images from the ResizeIt service.

## Installation

```bash
# Using npm
npm install @karnak19/resize-it-sdk

# Using yarn
yarn add @karnak19/resize-it-sdk

# Using bun
bun add @karnak19/resize-it-sdk
```

## Usage

### Initializing the SDK

```typescript
import { ResizeIt } from "@karnak19/resize-it-sdk";

const resizeIt = new ResizeIt({
  baseUrl: "https://your-resize-it-api.com",
  apiKey: "your-api-key", // Optional
  timeout: 30000, // Optional, default is 30000ms (30 seconds)
});
```

### Next.js Integration

The SDK provides a dedicated Next.js integration that makes it easy to handle image uploads in your Next.js application:

```typescript
import { ResizeIt } from "@karnak19/resize-it-sdk";
import { toNextJsHandler } from "@karnak19/resize-it-sdk/nextjs";

const resizeIt = new ResizeIt({
  baseUrl: process.env.RESIZE_IT_API_URL,
  apiKey: process.env.RESIZE_IT_API_KEY,
});

// Create a Next.js API route handler
export const { POST } = toNextJsHandler(resizeIt);
```

This creates an API route that:

- Accepts file uploads via FormData
- Automatically handles file processing
- Organizes uploads by date (YYYY/MM/DD)
- Returns the uploaded image details in the response

Example usage in your frontend:

```typescript
async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result;
}
```

### Uploading an Image

```typescript
// Upload from a file input
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const response = await resizeIt.uploadImage(file, {
    path: "images/my-image.jpg",
    contentType: file.type,
  });

  console.log("Upload successful:", response);
  console.log("Image URL:", response.url);
}

// Upload from a Buffer (Node.js)
import { readFile } from "fs/promises";

const imageBuffer = await readFile("path/to/image.jpg");
const response = await resizeIt.uploadImage(imageBuffer, {
  path: "images/my-image.jpg",
  contentType: "image/jpeg",
});

// Upload from a base64 string
const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...";
const response = await resizeIt.uploadImage(base64Image, {
  path: "images/my-image.jpg",
  contentType: "image/jpeg",
});
```

### Getting a Resized Image URL

```typescript
// Get a URL for a resized image
const imageUrl = resizeIt.getResizeUrl("images/my-image.jpg", {
  width: 300,
  height: 200,
  format: "webp",
  quality: 80,
});

// Use the URL in an img tag
const imgElement = document.createElement("img");
imgElement.src = imageUrl;
document.body.appendChild(imgElement);
```

### Fetching a Resized Image

```typescript
// Fetch a resized image as a Blob
const imageBlob = await resizeIt.getResizedImage("images/my-image.jpg", {
  width: 300,
  height: 200,
  format: "webp",
  quality: 80,
});

// Create an object URL from the Blob
const objectUrl = URL.createObjectURL(imageBlob);

// Use the object URL in an img tag
const imgElement = document.createElement("img");
imgElement.src = objectUrl;
document.body.appendChild(imgElement);

// Clean up the object URL when done
imgElement.onload = () => {
  URL.revokeObjectURL(objectUrl);
};
```

## Resize Options

The SDK supports all the resize options provided by the ResizeIt service:

```typescript
interface ResizeOptions {
  // Basic options
  width?: number;
  height?: number;
  format?: "webp" | "jpeg" | "png";
  quality?: number;

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
    position?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
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

## Error Handling

The SDK methods throw errors when operations fail. You should wrap your calls in try/catch blocks:

```typescript
try {
  const response = await resizeIt.uploadImage(imageData, {
    path: "images/my-image.jpg",
    contentType: "image/jpeg",
  });
  console.log("Upload successful:", response);
} catch (error) {
  console.error("Upload failed:", error);
}
```

## Development

### Building the SDK

```bash
# Install dependencies
bun install

# Build the SDK
bun run build

# Run tests
bun test
```

### Versioning and Publishing the SDK

The SDK includes helper scripts for versioning and publishing:

```bash
# Increment patch version (1.0.0 -> 1.0.1)
bun run version:patch

# Increment minor version (1.0.0 -> 1.1.0)
bun run version:minor

# Increment major version (1.0.0 -> 2.0.0)
bun run version:major
```

These scripts will:

1. Update the version in package.json
2. Build the package
3. Create a git commit with the version change
4. Create a git tag for the new version

After running one of these scripts, you can push the changes and tag:

```bash
git push origin main
git push origin v1.0.1  # Replace with your actual version
```

The GitHub Actions workflow will automatically publish the package to npm when:

- A new tag starting with 'v' is pushed (published with the tag version)
- Changes to the SDK are pushed to main/master (published with the 'next' tag)

You can also publish manually:

```bash
bun publish --access public
```

## License

MIT
