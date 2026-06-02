# Multi-stage build for FlowPDPA frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files (excluding .env files)
COPY . .

# Copy production environment file
COPY .env.production .env

# Build with better error handling
RUN npm run build || (echo "Build failed, trying again..." && npm run build)

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]