# Resize-It: Modern Image Resizing Service

A high-performance API for resizing, optimizing, and transforming images with advanced caching powered by Dragonfly DB.

![Resize-It Banner](https://via.placeholder.com/1200x300/4a6bff/ffffff?text=Resize-It)

## 🚀 Features

- **High Performance**: Built with Bun and Elysia for lightning-fast image processing
- **Advanced Caching**: Utilizes Dragonfly DB for ultra-fast in-memory caching
- **Flexible Transformations**: Resize, crop, rotate, apply filters, and add watermarks
- **Comprehensive Metrics**: Track image processing performance and cache hit rates
- **Secure API**: API key authentication, rate limiting, and CORS protection
- **Object Storage**: Seamless integration with MinIO for scalable storage

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - JavaScript runtime with built-in bundler
- **Framework**: [Elysia.js](https://elysiajs.com/) - TypeScript framework for building fast web applications
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- **Storage**: [MinIO](https://min.io/) - S3-compatible object storage
- **Caching**: [Dragonfly DB](https://www.dragonflydb.io/) - Ultra-fast Redis-compatible in-memory store
- **Redis Client**: [ioredis](https://github.com/redis/ioredis) - Redis client for Node.js with promises
- **Containerization**: [Docker](https://www.docker.com/) - For easy deployment

## 📋 Prerequisites

- Docker and Docker Compose
- Git

## 🚀 Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/resize-it.git
   cd resize-it
   ```

2. Start the services with Docker Compose:

   ```bash
   docker-compose up -d
   ```

3. The service will be available at http://localhost:3005

## 🔧 Configuration

Configuration is managed through environment variables in the `.env` file:

```
# Server settings
PORT=3000
HOST=0.0.0.0

# MinIO settings
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=images

# Image settings
MAX_WIDTH=1920
MAX_HEIGHT=1080
IMAGE_QUALITY=80

# Cache settings
CACHE_ENABLED=true
CACHE_MAX_AGE=86400

# Dragonfly settings
DRAGONFLY_HOST=localhost
DRAGONFLY_PORT=6379
DRAGONFLY_ENABLED=true
DRAGONFLY_CACHE_TTL=86400

# Security settings
ENABLE_API_KEY_AUTH=true
API_KEYS=dev-api-key,test-api-key
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
CORS_ALLOWED_ORIGINS=*
```

## 📝 API Usage

### Resize an Image

```bash
curl -X GET "http://localhost:3005/image/resize?path=example.jpg&width=800&height=600&format=webp" \
  -H "X-API-Key: dev-api-key" \
  -o resized-image.webp
```

### Apply Transformations

```bash
curl -X GET "http://localhost:3005/image/resize?path=example.jpg&width=500&grayscale=true&blur=5&watermark[text]=Copyright" \
  -H "X-API-Key: dev-api-key" \
  -o transformed-image.webp
```

### Check Service Health

```bash
curl -X GET "http://localhost:3005/admin/health" \
  -H "X-API-Key: dev-api-key"
```

### Get Service Statistics

```bash
curl -X GET "http://localhost:3005/admin/stats" \
  -H "X-API-Key: dev-api-key"
```

## 🔍 Available Transformations

| Parameter             | Type    | Description                                                                          |
| --------------------- | ------- | ------------------------------------------------------------------------------------ |
| `width`               | number  | Target width in pixels                                                               |
| `height`              | number  | Target height in pixels                                                              |
| `format`              | string  | Output format: `webp`, `jpeg`, or `png`                                              |
| `quality`             | number  | Compression quality (1-100)                                                          |
| `rotate`              | number  | Rotation angle in degrees                                                            |
| `flip`                | boolean | Flip the image vertically                                                            |
| `flop`                | boolean | Flip the image horizontally                                                          |
| `grayscale`           | boolean | Convert to grayscale                                                                 |
| `blur`                | number  | Gaussian blur (sigma)                                                                |
| `sharpen`             | boolean | Sharpen the image                                                                    |
| `watermark[text]`     | string  | Text watermark                                                                       |
| `watermark[image]`    | string  | Image watermark path                                                                 |
| `watermark[position]` | string  | Watermark position: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center` |
| `watermark[opacity]`  | number  | Watermark opacity (0-1)                                                              |
| `crop[left]`          | number  | Left offset for cropping                                                             |
| `crop[top]`           | number  | Top offset for cropping                                                              |
| `crop[width]`         | number  | Width of crop area                                                                   |
| `crop[height]`        | number  | Height of crop area                                                                  |

## 📊 Monitoring

The service includes comprehensive monitoring capabilities:

- **Request Metrics**: Track API usage, response times, and status codes
- **Image Processing Metrics**: Monitor transformation times and compression ratios
- **Cache Metrics**: Track cache hit rates and performance
- **System Health**: Monitor service uptime and resource usage

Access these metrics through the `/admin/stats` endpoint.

## 🔒 Security

- **API Key Authentication**: Protect your API with key-based authentication
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **CORS Protection**: Control which domains can access your API

## 🐉 Dragonfly DB Integration

Resize-It uses Dragonfly DB for high-performance caching:

- **Ultra-fast In-memory Store**: Much faster than traditional Redis
- **Persistent Caching**: Survive service restarts with persistent storage
- **Automatic TTL**: Configure time-to-live for cached images
- **Metrics Tracking**: Monitor cache performance

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ using Bun, Elysia, and Dragonfly DB
