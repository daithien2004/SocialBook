FROM node:20-alpine AS builder
WORKDIR /app

# Build context = ROOT repo (xem .github/workflows/deploy.yml: context: .)
# → COPY shared/ TRƯỚC + riêng biệt để tận dụng layer cache:
#   sửa file luật CASL (shared/) KHÔNG rebuild lại node_modules/frontend source.
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci

COPY shared ./shared
RUN npm run build:shared
COPY frontend ./frontend

WORKDIR /app/frontend
ARG NEXT_PUBLIC_NEST_API_URL
ENV NEXT_PUBLIC_NEST_API_URL=$NEXT_PUBLIC_NEST_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

USER node
EXPOSE 3000
CMD ["node", "frontend/server.js"]
