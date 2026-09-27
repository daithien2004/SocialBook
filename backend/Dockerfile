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
RUN npm run build:shared
COPY backend/src ./backend/src
COPY backend/tsconfig*.json ./backend/
COPY backend/nest-cli.json ./backend/

WORKDIR /app/backend
# Assert luôn entry point của worker: thiếu file này thì container `worker`
# crashloop và toàn bộ job nặng (TTS trả phí, import chương, chroma, moderation)
# ngừng được tiêu thụ — mà deploy vẫn báo thành công. Fail ở build time.
RUN npm run build && test -f dist/worker.js

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
RUN npm ci --omit=dev --ignore-scripts --workspace=backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared ./shared
USER node
CMD ["node", "backend/dist/main.js"]
