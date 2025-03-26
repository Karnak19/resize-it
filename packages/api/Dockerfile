FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Set environment variables to ensure the app listens on all interfaces
ENV HOST=0.0.0.0
ENV PORT=3000

# Start the application
ENTRYPOINT ["bun", "run", "src/index.ts"]