# Resize-it Monorepo

A monorepo for the Resize-it image processing service and related packages.

## Packages

- [@resize-it/api](./packages/api/README.md) - A high-performance image resizing and optimization service built with Bun and Elysia.

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
│   └── api/           # Image resizing and optimization service
├── package.json       # Root package.json for monorepo configuration
└── tsconfig.json      # Base TypeScript configuration
```

## License

MIT
