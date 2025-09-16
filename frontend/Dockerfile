FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]

# Đừng quên trong frontend/package.json đặt "start": "next start -p 3000". (chưa hiểu)
