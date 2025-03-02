# Resize-It: Image Resizer and Optimizer

A high-performance image resizing and optimization service built with Bun and Elysia that acts as a pass-through between websites and MinIO storage.

## Features

- On-the-fly image resizing and optimization
- Support for multiple output formats (WebP, JPEG, PNG)
- Configurable quality settings
- Caching of resized images for improved performance
- Simple API for uploading and retrieving images
- Swagger documentation

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

Parameters:

- `path`: Path to the image in MinIO
- `width` (optional): Desired width in pixels
- `height` (optional): Desired height in pixels
- `format` (optional): Output format (webp, jpeg, png)
- `quality` (optional): Output quality (1-100)

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

### Health Check

```
GET /health
```

## Documentation

Swagger documentation is available at `/swagger` when the server is running.

## License

MIT
