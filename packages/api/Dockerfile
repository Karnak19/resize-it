FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json ./
RUN bun install --frozen-lockfile

# Copy source code
COPY ./src ./src

ENV NODE_ENV=production

# Build to binary following Elysia.js recommendations
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./src/index.ts

# Use distroless base image for smaller footprint
FROM oven/bun:latest

WORKDIR /app

# Copy only the binary
COPY --from=build /app/server server

ENV NODE_ENV=production

# Start the application
CMD ["./server"]

EXPOSE 3000