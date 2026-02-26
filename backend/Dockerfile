FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files separately to leverage layer caching
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies and build artifacts
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

# Use non-root user for security
USER node

CMD ["node", "dist/main.js"]
