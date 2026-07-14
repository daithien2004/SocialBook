FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG NEXT_PUBLIC_NEST_API_URL
RUN echo ">>> API URL = $NEXT_PUBLIC_NEST_API_URL"
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_NEST_API_URL=$NEXT_PUBLIC_NEST_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./ 
COPY --from=builder /app/next.config.ts ./

RUN npm ci --production --ignore-scripts
EXPOSE 3000
CMD ["npm", "start"]