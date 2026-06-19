# Tres Amigos

Monorepo voor het Tres Amigos platform.

| App | Stack |
|-----|-------|
| `apps/web` | React · TypeScript · Vite |
| `apps/admin` | React · TypeScript · Vite |
| `apps/api` | NestJS · TypeScript · Prisma · PostgreSQL · Redis |

Productie: **Nginx** (poort 80) · **systemd** (API op 3100) · **Docker Compose** (PostgreSQL + Redis).

## Lokaal ontwikkelen

```bash
pnpm install
cp .env.example .env   # vul ADMIN_PASSWORD in
chmod +x start-containers.sh start.sh
./start-containers.sh   # git pull + docker + migraties + pnpm dev
```

Of:

```bash
./start.sh development
pnpm dev
```

- Website: http://localhost:5180
- Admin: http://localhost:5181/admin/
- API: http://localhost:3100/api/content

Lokaal optioneel in `.env`: `VITE_API_URL=http://localhost:3100` (zonder `/api` suffix).

## Productie (Ubuntu)

Volledige handleiding: **[DEPLOY-UBUNTU.md](./DEPLOY-UBUNTU.md)**

```bash
cd /var/www/tresamigos
git fetch origin
git reset --hard origin/main
chmod +x start.sh start-containers.sh
bash start.sh production
```

| Route | Doel |
|-------|------|
| `/` | Web (`apps/web/dist`) |
| `/admin/` | Admin (`apps/admin/dist`) |
| `/api/*` | API → `127.0.0.1:3100` |

- **`VITE_API_URL=` leeg** in productie → relatieve API-paden (`/api/content`)
- Geen Vite dev servers, geen `pnpm dev` op productie
- Config templates: `deploy/nginx-tresamigos.conf`, `deploy/tresamigos-api.service`

## Packages

- `packages/types` — gedeelde TypeScript contracts
- `packages/utils` — sanitization, auth helpers, API URL helpers
