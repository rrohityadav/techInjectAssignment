# --- Stage 1: Builder ---
FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm prisma generate
RUN pnpm build

# --- Stage 2: Production ---
FROM node:20

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env .env

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
