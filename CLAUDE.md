# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ResizeIt is a high-performance image resizing and optimization service. It's a monorepo with two packages:
- **@resize-it/api**: Elysia.js-based REST API for image processing
- **@karnak19/resize-it-sdk**: TypeScript SDK for client integration (published to npm)

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia.js
- **Image Processing**: Sharp
- **Storage**: S3-compatible (MinIO) via Bun's built-in S3 client
- **Caching**: Redis-compatible (Dragonfly)

## Common Commands

```bash
# Install dependencies
bun install

# API Development
bun dev              # Run API with hot reload
bun build            # Build API
bun start            # Run production build

# SDK Development
bun sdk:dev          # Watch mode for SDK
bun sdk:build        # Build SDK
bun sdk:test         # Run SDK tests

# Run single test file
bun test packages/sdk/src/index.test.ts

# Docker (local development with MinIO + Dragonfly)
docker compose up -d
```

## Architecture

### API Package (`packages/api/`)

```
src/
├── index.ts                    # Elysia app entry point, mounts controllers
├── config.ts                   # Environment config (S3, cache, security, image limits)
├── controllers/
│   ├── image.controller.ts     # /images/* routes (resize, upload)
│   └── admin.controller.ts     # /admin/* routes (health, cache management)
├── services/
│   ├── image.service.ts        # Sharp-based image processing + watermarking
│   ├── bun-s3.service.ts       # Storage operations using Bun's S3Client
│   ├── cache.service.ts        # Dragonfly/Redis caching
│   └── storage.interface.ts    # Storage abstraction interface
├── middleware/
│   └── auth.middleware.ts      # API key authentication
└── utils/
    └── logger.ts               # Logging utility
```

**Key endpoints:**
- `GET /images/resize/:path?width=&height=&format=&quality=` - Resize and transform images
- `POST /images/upload` - Upload images (requires API key when enabled)
- `GET /swagger` - API documentation

### SDK Package (`packages/sdk/`)

```
src/
├── index.ts         # ResizeIt class: uploadImage(), getResizeUrl(), getResizedImage()
├── nextjs.ts        # toNextJsHandler() for Next.js API route integration
└── types.ts         # ResizeItConfig, ResizeOptions, UploadOptions, etc.
```

The SDK has a separate export for Next.js: `@karnak19/resize-it-sdk/nextjs`

## Environment Variables

Key variables (see `packages/api/src/config.ts` for full list):
- `S3_ENDPOINT`, `S3_PORT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- `DRAGONFLY_ENABLED`, `DRAGONFLY_HOST`, `DRAGONFLY_PORT`
- `ENABLE_API_KEY_AUTH`, `API_KEYS` (comma-separated)
- `MAX_WIDTH`, `MAX_HEIGHT`, `IMAGE_QUALITY`

## SDK Publishing

```bash
bun sdk:version:patch   # Bump patch, build, commit, and tag
bun sdk:version:minor   # Bump minor version
bun sdk:version:major   # Bump major version
```

GitHub Actions auto-publishes on version tags (`v*`) or to `next` tag on main branch changes.
