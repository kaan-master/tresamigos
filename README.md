# Tres Amigos

Monorepo voor het Tres Amigos platform.

| App | Stack |
|-----|-------|
| `apps/web` | React · TypeScript · Vite |
| `apps/admin` | React · TypeScript · Vite |
| `apps/api` | NestJS · TypeScript · Prisma · PostgreSQL · Redis |

Productie draait met **Nginx** (poort 80), **systemd** (API) en **Docker Compose** (PostgreSQL + Redis).

## Lokaal ontwikkelen

```bash
pnpm install
cp .env.example .env   # vul ADMIN_PASSWORD in; zet NODE_ENV=development en VITE_API_URL=http://localhost:3100
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Website: http://localhost:5180
- Admin: http://localhost:5181/admin/
- API: http://localhost:3100/api/content

## Productie (Ubuntu)

Volledige serverhandleiding: **[DEPLOY-UBUNTU.md](./DEPLOY-UBUNTU.md)**

Kort:

- Web op `/` · Admin op `/admin/` · API op `/api/`
- API intern op `127.0.0.1:3100`
- PostgreSQL op poort `5434` · Redis op poort `6380`
- `VITE_API_URL` leeg laten in productie (relatieve API-calls)

## Packages

- `packages/types` — gedeelde TypeScript contracts
- `packages/utils` — sanitization & auth helpers
