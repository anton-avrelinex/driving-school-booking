FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS build

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN cd apps/main-service && pnpm exec prisma generate

RUN pnpm run -r build

RUN pnpm deploy --filter=@driving-school-booking/main-service --prod /prod/main-service
RUN pnpm deploy --filter=@driving-school-booking/observability-service --prod /prod/observability-service

FROM base AS main-service

COPY --from=build /prod/main-service /app
COPY --from=build /usr/src/app/apps/main-service/src/generated /app/src/generated

WORKDIR /app
EXPOSE 3001

CMD ["pnpm", "start:prod"]

FROM base AS observability-service

COPY --from=build /prod/observability-service /app

WORKDIR /app
EXPOSE 4001

CMD ["pnpm", "start:prod"]

FROM nginx:alpine AS web-client

COPY --from=build /usr/src/app/apps/web-client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
