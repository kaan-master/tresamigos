# Tres Amigos Platform

Production-oriented platform voor de Tres Amigos website, beheeromgeving, sollicitaties en content-API.

## Apps

| App | Poort | Beschrijving |
|-----|-------|--------------|
| `apps/web` | 5180 | React publieke website |
| `apps/admin` | 5181 | React admin dashboard |
| `apps/api` | 3100 | NestJS API · Prisma · PostgreSQL · Redis |
| PostgreSQL (Docker) | 5434 | Niet 5432 — lokale Postgres op Windows |
| Redis (Docker) | 6380 | Niet 6379 — andere projecten |

## Packages

| Package | Beschrijving |
|---------|--------------|
| `packages/types` | Gedeelde TypeScript contracts |
| `packages/utils` | Sanitization & auth helpers |

## Stack

- React + TypeScript + Vite
- NestJS
- Prisma + PostgreSQL
- Redis (sessies + login rate limiting)
- pnpm workspaces

## Quick start

### 1. Vereisten

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (voor PostgreSQL + Redis)

### 2. Installatie

```bash
pnpm install
cp .env.example .env
```

Zet minimaal in `.env`:

```env
ADMIN_PASSWORD=<sterk-wachtwoord>
DATABASE_URL=postgresql://tresamigos:tresamigos@localhost:5434/tresamigos?schema=public
REDIS_URL=redis://localhost:6380
```

### 3. Infrastructuur

PostgreSQL draait op **poort 5434** (niet 5432), zodat het niet botst met een lokale PostgreSQL-installatie op Windows.

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:seed
```

### 4. Development

```bash
pnpm dev
```

- Website: http://localhost:5180
- Admin: http://localhost:5181/admin/
- API: http://localhost:3100/api/content
- Health: http://localhost:3100/health

## API routes

| Methode | Route | Auth |
|---------|-------|------|
| GET | `/api/content` | Publiek |
| POST | `/api/applications` | Publiek |
| POST | `/api/admin/login` | Publiek |
| GET/PUT | `/api/admin/content` | Bearer token |
| GET | `/api/admin/applications` | Bearer token |

## Deployment (Hetzner)

1. Docker Compose voor PostgreSQL + Redis op de server
2. `pnpm build` in CI of op server
3. `pnpm db:deploy && pnpm db:seed` voor database
4. Nginx:
   - `/` → web build (`apps/web/dist`)
   - `/admin/` → admin build (`apps/admin/dist`)
   - `/api/` → NestJS op poort 3100
   - `/assets/` → statische assets map

## Legacy

De oude statische site (`server.cjs`, HTML-pagina's, `cms.js`) staat in `legacy/` als referentie. De actieve codebase is de monorepo hierboven.

## MVP status

- Beheeromgeving (vestigingen, menu, video, SEO, footer)
- Sollicitatie-intake → PostgreSQL
- Publieke React-site met dynamische content
- Redis sessies voor admin login

Geplande uitbreidingen: contactformulier backend, Mollie betalingen, media upload UI.
