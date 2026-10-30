FROM node:22.23.3-alpine AS build

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src
RUN npx tsc -p apps/api/tsconfig.json

FROM node:22.23.3-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/health/ready').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
