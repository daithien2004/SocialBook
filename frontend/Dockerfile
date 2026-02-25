FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# --- THÊM 2 DÒNG NÀY VÀO ĐÂY ---
ARG NEXT_PUBLIC_NEST_API_URL
ENV NEXT_PUBLIC_NEST_API_URL=$NEXT_PUBLIC_NEST_API_URL
# -------------------------------

RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Phải copy thêm file .env nếu bạn có dùng biến runtime, 
# nhưng với NEXT_PUBLIC thì build xong là nó nằm trong .next rồi.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./ 
# Lưu ý: nên copy package.json từ builder sang để đồng bộ

RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]