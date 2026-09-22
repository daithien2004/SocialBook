FROM node:20-alpine AS builder
WORKDIR /app

# --- Mở cửa để CASL shared/ lọt vào image backend ---
# Build context bây giờ là ROOT repo (xem docker-compose build: context: .)
# COPY shared TRƯỚC + riêng biệt để tận dụng layer cache:
# sửa file luật CASL (shared/) KHÔNG rebuild lại toàn bộ node_modules/backend source.

COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci

COPY shared ./shared
COPY backend/src ./backend/src
COPY backend/tsconfig*.json ./backend/
COPY backend/nest-cli.json ./backend/

WORKDIR /app/backend
RUN npm run build

FROM node:20-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=builder /app/backend/package.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/shared ./../shared
USER node
CMD ["node", "dist/main.js"]
