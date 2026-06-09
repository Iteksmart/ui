# iTechSmart Suite — one container, twenty subdomains.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Live endpoints baked at build time (NEXT_PUBLIC_* are client-side)
ARG NEXT_PUBLIC_ITS_API_BASE=https://api.itechsmart.dev
ARG NEXT_PUBLIC_ITS_VERIFY_BASE=https://verify.itechsmart.dev
ENV NEXT_PUBLIC_ITS_API_BASE=$NEXT_PUBLIC_ITS_API_BASE
ENV NEXT_PUBLIC_ITS_VERIFY_BASE=$NEXT_PUBLIC_ITS_VERIFY_BASE
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
USER app
EXPOSE 3300
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3300/ > /dev/null || exit 1
CMD ["npm", "run", "start"]
