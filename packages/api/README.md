# Resize-it API

A high-performance image resizing and optimization service built with Bun and Elysia.

## Features

- Resize, crop, and transform images on-the-fly
- Support for multiple image formats (WebP, JPEG, PNG)
- Caching for improved performance
- S3-compatible storage using Bun's built-in S3 client

## Bun's S3 Client

The application uses Bun's lightweight, high-performance built-in S3 client for storage operations.

### Limitations

- The `listObjects` operation is not currently supported in Bun's S3 client
- For operations that require listing objects, the application will log a warning

## Configuration

Configuration is done via environment variables:

```env
# Server configuration
PORT=3000
HOST=0.0.0.0

# S3 Storage configuration
S3_ENDPOINT=localhost
S3_PORT=9000
S3_USE_SSL=false
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=images

# Image processing configuration
MAX_WIDTH=1920
MAX_HEIGHT=1080
IMAGE_QUALITY=80

# Cache configuration
CACHE_ENABLED=true
CACHE_MAX_AGE=86400
```

## API Endpoints

### Image Operations

- `GET /resize/:path` - Resize and transform an image
  - Query parameters:
    - `width` - Target width
    - `height` - Target height
    - `format` - Output format (webp, jpeg, png)
    - `quality` - Output quality (1-100)
    - Various transformation options (rotate, flip, grayscale, etc.)

### Admin Operations

- `GET /admin/health` - Check system health
- `GET /admin/cache/list` - List cached images
- `DELETE /admin/cache/clear` - Clear the cache

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Build for production
bun build

# Run in production mode
bun start
```

## Documentation

API documentation is available at `/swagger` when the server is running.
