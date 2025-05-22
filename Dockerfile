FROM oven/bun:1-slim
WORKDIR /app

# Copy package files and source code
COPY package.json bun.lock ./
COPY . .

# Install dependencies
RUN bun install --frozen-lockfile --production

# Set environment variable
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 3000

# Start the application using Bun runtime directly
CMD ["bun", "src/index.ts"]