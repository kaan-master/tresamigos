# Tres Amigos — deploy op Ubuntu

Volledige serverhandleiding voor productie met Nginx (poort 80), systemd en Docker Compose.

| Route | Doel |
|-------|------|
| `/` | React website (`apps/web/dist`) |
| `/admin/` | React admin (`apps/admin/dist`) |
| `/api/` | NestJS API (proxy naar `127.0.0.1:3100`) |

PostgreSQL draait op poort **5434**, Redis op **6380** (via Docker Compose).

---

## 1. Ubuntu voorbereiden

```bash
apt update && apt upgrade -y
apt install -y curl git nginx docker.io docker-compose-plugin build-essential
systemctl enable --now nginx
systemctl enable --now docker
```

## 2. Node.js 20 installeren

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
corepack enable
corepack prepare pnpm@latest --activate
node -v
pnpm -v
```

## 3. Project plaatsen

```bash
mkdir -p /var/www
cd /var/www
git clone <repo-url> tresamigos
cd /var/www/tresamigos
pnpm install
```

## 4. `.env` aanmaken

```bash
cp .env.example .env
nano .env
```

Productie `.env` voorbeeld:

```env
NODE_ENV=production
PORT=3100

DATABASE_URL=postgresql://tresamigos:tresamigos@localhost:5434/tresamigos?schema=public
REDIS_URL=redis://localhost:6380

ADMIN_PASSWORD=<sterk-wachtwoord>
ADMIN_PASSWORD_HASH=
CORS_ORIGINS=http://167.233.20.221

VITE_API_URL=
VITE_WEB_PORT=5180
VITE_ADMIN_PORT=5181

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

GOOGLE_PLACES_API_KEY=

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
```

**Belangrijk:**

- `VITE_API_URL=` **leeg laten** in productie.
- Frontend gebruikt relatieve API-calls (`/api/...`).
- Vul **niet** `http://167.233.20.221/api` in — dat geeft dubbele paden (`/api/api/...`).

## 5. Database en Redis

```bash
pnpm infra:up
pnpm --filter @tresamigos/api prisma generate
pnpm db:deploy
pnpm db:seed
```

## 6. Build

```bash
pnpm build
```

## 7. systemd service (API)

```bash
nano /etc/systemd/system/tresamigos-api.service
```

```ini
[Unit]
Description=Tres Amigos API
After=network.target docker.service

[Service]
Type=simple
WorkingDirectory=/var/www/tresamigos
EnvironmentFile=/var/www/tresamigos/.env
ExecStart=/usr/bin/pnpm --filter @tresamigos/api start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Activeren:

```bash
systemctl daemon-reload
systemctl enable tresamigos-api
systemctl restart tresamigos-api
systemctl status tresamigos-api
```

## 8. Nginx

```bash
nano /etc/nginx/sites-available/tresamigos
```

```nginx
server {
    listen 80 default_server;
    server_name 167.233.20.221 _;

    root /var/www/tresamigos/apps/web/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3100/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        alias /var/www/tresamigos/apps/admin/dist/;
        try_files $uri $uri/ /admin/index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    client_max_body_size 15M;
}
```

Activeren:

```bash
ln -sf /etc/nginx/sites-available/tresamigos /etc/nginx/sites-enabled/tresamigos
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 9. Checks

```bash
curl -I http://167.233.20.221/
curl -I http://167.233.20.221/admin/
curl http://167.233.20.221/api/content | head -c 300
curl http://127.0.0.1:3100/health
```

## 10. Deploy update

Na een `git pull`:

```bash
cd /var/www/tresamigos
git pull
pnpm install
pnpm --filter @tresamigos/api prisma generate
pnpm db:deploy
pnpm build
systemctl restart tresamigos-api
systemctl reload nginx
```

---

## Troubleshooting

### `/api/api/admin/login` of dubbele `/api/`-paden

`VITE_API_URL` staat verkeerd. Zet `VITE_API_URL=` leeg in `.env` en voer opnieuw `pnpm build` uit.

### `EADDRINUSE 3100`

De API draait al (systemd of een achtergebleven proces). Controleer met `systemctl status tresamigos-api` of stop het dubbele proces.

### Lege pagina terwijl HTML wél laadt

JavaScript of CSS wordt niet geladen. Controleer asset-URLs:

```bash
curl -I http://167.233.20.221/assets/<bestand>.js
curl -I http://167.233.20.221/assets/<bestand>.css
```

Vervang `<bestand>` door een bestandsnaam uit `apps/web/dist/index.html`.

### `413 Request Entity Too Large` (sollicitaties met CV)

Zorg dat `client_max_body_size 15M;` in de Nginx-config staat en herlaad Nginx.
