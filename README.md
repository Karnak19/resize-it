# Resize-it Monorepo

A monorepo for the Resize-it image processing service and related packages.

## Packages

- [@resize-it/api](./packages/api/README.md) - A high-performance image resizing and optimization service built with Bun and Elysia.
- [@resize-it/sdk](./packages/sdk/README.md) - TypeScript SDK for easy integration with the Resize-it service, including Next.js support.

## Development

```bash
# Install dependencies for all packages
bun install

# Run the API in development mode
bun dev

# Build all packages
bun build

# Start the API in production mode
bun start
```

## Monorepo Structure

```
resize-it/
├── packages/
│   ├── api/           # Image resizing and optimization service
│   └── sdk/           # TypeScript SDK with Next.js integration
├── docker-compose.yml # Docker configuration for local development
├── package.json       # Root package.json for monorepo configuration
└── tsconfig.json      # Base TypeScript configuration
```

## Features

- High-performance image resizing and optimization
- Multiple storage backends (S3-compatible storage)
- Redis/Dragonfly caching for improved performance
- TypeScript SDK with Next.js integration
- Support for multiple image formats (WebP, JPEG, PNG)
- Advanced image transformation options

## License

MIT
