# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
# Drizzle migrations need to be available for runtime migrations or schema mapping
COPY --from=builder /app/drizzle ./drizzle
# Ensure the OpenAPI JSON definition is copied to the final distribution
COPY src/utils/swagger.json ./dist/utils/swagger.json

EXPOSE 5000
ENV PORT=5000
ENV DATABASE_URL=sqlite.db
ENV FASTAPI_URL=http://localhost:8000
ENV NODE_ENV=production

# Start command
CMD ["node", "dist/server.js"]
