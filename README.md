# Resize-It: Image Resizer and Optimizer

A high-performance image resizing and optimization service built with Bun and Elysia that acts as a pass-through between websites and MinIO storage.

## Features

- On-the-fly image resizing and optimization
- Support for multiple output formats (WebP, JPEG, PNG)
- Configurable quality settings
- Caching of resized images for improved performance
- Simple API for uploading and retrieving images
- Swagger documentation

### Advanced Image Transformations

- Rotation, flipping, and cropping
- Grayscale conversion
- Blur and sharpen effects
- Text and image watermarking

### Security Features

- API key authentication
- Rate limiting
- Configurable CORS settings

### Monitoring and Analytics

- Request metrics tracking
- Image processing statistics
- System health monitoring
- Memory usage tracking

## Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [MinIO](https://min.io/) server (for storage)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/resize-it.git
cd resize-it
```

2. Install dependencies:

```bash
bun install
```

3. Configure environment variables (create a `.env` file):

```
PORT=3000
HOST=0.0.0.0
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=images
MAX_WIDTH=1920
MAX_HEIGHT=1080
IMAGE_QUALITY=80
CACHE_ENABLED=true
CACHE_MAX_AGE=86400

# Security settings
ENABLE_API_KEY_AUTH=true
API_KEYS=dev-api-key,test-api-key
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
CORS_ALLOWED_ORIGINS=*
```

## Development

To start the development server with hot reloading:

```bash
bun run dev
```

## API Endpoints

### Resize an Image

```
GET /resize/:path?width=<width>&height=<height>&format=<format>&quality=<quality>
```

#### Basic Parameters:

- `path`: Path to the image in MinIO
- `width` (optional): Desired width in pixels
- `height` (optional): Desired height in pixels
- `format` (optional): Output format (webp, jpeg, png)
- `quality` (optional): Output quality (1-100)

#### Transformation Parameters:

- `rotate` (optional): Rotation angle in degrees
- `flip` (optional): Flip the image vertically (true/false)
- `flop` (optional): Flip the image horizontally (true/false)
- `grayscale` (optional): Convert to grayscale (true/false)
- `blur` (optional): Apply blur effect (0-100)
- `sharpen` (optional): Apply sharpen effect (true/false)

#### Watermark Parameters:

- `watermarkText` (optional): Text to add as watermark
- `watermarkImage` (optional): Path to image to use as watermark
- `watermarkPosition` (optional): Position of watermark (top-left, top-right, bottom-left, bottom-right, center)
- `watermarkOpacity` (optional): Opacity of watermark (0-1)

#### Crop Parameters:

- `cropLeft` (optional): Left position for cropping
- `cropTop` (optional): Top position for cropping
- `cropWidth` (optional): Width of crop area
- `cropHeight` (optional): Height of crop area

### Upload an Image

```
POST /upload
```

Request body (JSON):

```json
{
  "image": "base64-encoded-image-data",
  "path": "desired/path/in/minio",
  "contentType": "image/jpeg"
}
```

### Admin Endpoints

All admin endpoints require API key authentication via the `X-API-Key` header.

#### Get System Stats

```
GET /admin/stats
```

Returns statistics about the system, including request metrics and image processing metrics.

#### Clear Cache

```
POST /admin/cache/clear
```

Parameters:

- `pattern` (optional): Pattern to match cache entries to clear

#### List Cached Images

```
GET /admin/cache/list
```

Parameters:

- `prefix` (optional): Prefix to filter cache entries
- `limit` (optional): Maximum number of entries to return
- `marker` (optional): Marker for pagination

#### Get System Health

```
GET /admin/health
```

Returns detailed health information about the system.

### Health Check

```
GET /health
```

## Security

### API Key Authentication

To use protected endpoints, include the `X-API-Key` header with a valid API key:

```
X-API-Key: your-api-key
```

### Rate Limiting

The API includes rate limiting to prevent abuse. By default, it allows 100 requests per minute per IP address.

## Documentation

Swagger documentation is available at `/swagger` when the server is running.

## License

MIT
