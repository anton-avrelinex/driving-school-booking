# Driving School Booking

A multi-tenant driving school management platform — student booking, instructor scheduling, vehicle assignment, lessons lifecycle, dashboards, and request-log observability. NestJS monorepo (Turborepo + pnpm) with a Vue 3 SPA.

## Prerequisites

- **Node.js** ≥ 24
- **pnpm** 11 (via `corepack enable`)
- **Docker** + **Docker Compose v2**

## Setup — Docker (one-command)

Runs the whole stack (postgres, mongo, redis, both NestJS services, nginx, web client) plus a one-shot bootstrap container that applies migrations and seeds demo data.

```sh
git clone <repo>
cd driving-school-booking
pnpm install
pnpm setup           # copies every .env.example → .env
docker compose up    # first build: 5–10 min; subsequent boots: seconds
```

When all containers report healthy, open **http://localhost** and log in.

| Role       | Email             | Password                              |
| ---------- | ----------------- | ------------------------------------- |
| Admin      | `admin@demo.com`  | `INITIAL_ADMIN_PASSWORD` (`admin123`) |
| Instructor | `erik@demo.com`   | `DEMO_USERS_PASSWORD` (`password123`) |
| Instructor | `maria@demo.com`  | same                                  |
| Instructor | `lars@demo.com`   | same                                  |
| Student    | `sophie@demo.com` | same                                  |
| Student    | `tom@demo.com`    | same                                  |
| Student    | `anna@demo.com`   | same                                  |
| Student    | `lukas@demo.com`  | same                                  |
| Student    | `emma@demo.com`   | same                                  |

To bootstrap admin-only (no demo instructors/students/lessons), delete the `DEMO_USERS_PASSWORD` line in the root `.env` before `docker compose up`.

## Setup — Local (services on host, databases in Docker)

Run the data services in Docker but the three apps as host processes — what you want for iterating on app code.

```sh
git clone <repo>
cd driving-school-booking
pnpm install
pnpm setup

# 1. Start only the data services
docker compose up -d postgres mongo redis

# 2. Apply schema + seed (run from apps/main-service)
cd apps/main-service
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
cd ../..

# 3. Start all three apps in watch mode
pnpm dev
```

| App                   | URL                   |
| --------------------- | --------------------- |
| Web client (Vite)     | http://localhost:5173 |
| Main service          | http://localhost:3001 |
| Observability service | http://localhost:4001 |

The Vite dev server proxies `/api` → main-service and `/api/monitoring` → observability-service, so the web app uses `http://localhost:5173` for everything. Override the proxy targets in `apps/web-client/.env` if you need to point elsewhere.

## Environment files

`pnpm setup` materializes a `.env` from every `.env.example` (root + each app). Existing `.env` files are left untouched.

| File                              | Used by                                          |
| --------------------------------- | ------------------------------------------------ |
| `.env`                            | docker-compose substitutions                     |
| `apps/main-service/.env`          | `pnpm dev`, `pnpm exec prisma`                   |
| `apps/observability-service/.env` | `pnpm dev`                                       |
| `apps/web-client/.env`            | Vite dev server (`VITE_API_URL`, `VITE_OBS_URL`) |

For production: replace the dev secrets in `.env` (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `INITIAL_ADMIN_PASSWORD`) with strong random values — e.g. `openssl rand -base64 32`.

## Reset

```sh
docker compose down -v         # drop containers + volumes
docker compose up              # next boot re-runs the bootstrap (migrations + seed)
```
