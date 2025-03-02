FROM oven/bun:latest as base

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"] 