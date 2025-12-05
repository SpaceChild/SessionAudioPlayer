# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build
# Copy SQL schema files to dist
RUN mkdir -p dist/db && cp src/db/*.sql dist/db/

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Install production dependencies
COPY --chown=node:node backend/package*.json ./
RUN npm install --omit=dev

# Copy built files with correct ownership
COPY --chown=node:node --from=backend-build /app/backend/dist ./dist
COPY --chown=node:node --from=frontend-build /app/frontend/dist ./public

# Create data directory
RUN mkdir -p /app/data && chown node:node /app/data

# Expose port
EXPOSE 3000

# Run as node user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
