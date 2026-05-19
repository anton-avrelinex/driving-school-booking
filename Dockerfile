FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS build

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN cd apps/main-service && pnpm exec prisma generate

RUN pnpm run -r build

# --legacy opts out of pnpm 10+'s default that requires injected workspaces.
RUN pnpm deploy --filter=@driving-school-booking/main-service --prod --legacy /prod/main-service
RUN pnpm deploy --filter=@driving-school-booking/observability-service --prod --legacy /prod/observability-service

FROM build AS bootstrap

WORKDIR /usr/src/app/apps/main-service

# Prisma's `db seed` shells out to `tsx prisma/seed.ts`; need tsx on PATH.
ENV PATH="/usr/src/app/apps/main-service/node_modules/.bin:$PATH"

# `pnpm exec` would trigger pnpm v11's runDepsStatusCheck, which tries to
# reinstall and trips the root husky hook in no-TTY containers.
CMD ["sh", "-c", "prisma migrate deploy && prisma db seed"]

FROM base AS main-service

COPY --from=build /prod/main-service /app
COPY --from=build /usr/src/app/apps/main-service/src/generated /app/src/generated

WORKDIR /app
EXPOSE 3001

# dist/src/main (not dist/main) because prisma/ next to src/ makes tsc
# preserve the src/ subpath. Direct `node` bypasses pnpm v11's deps check.
CMD ["node", "dist/src/main"]

FROM base AS observability-service

COPY --from=build /prod/observability-service /app

WORKDIR /app
EXPOSE 4001

CMD ["node", "dist/main"]

FROM nginx:alpine AS web-client

COPY --from=build /usr/src/app/apps/web-client/dist /usr/share/nginx/html
COPY apps/web-client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
