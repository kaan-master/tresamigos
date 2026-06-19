# Tres Amigos — deploy op Ubuntu

Productie-architectuur:

| Route | Doel |
|-------|------|
| `http://SERVER_IP/` | React website (`apps/web/dist`) |
| `http://SERVER_IP/admin/` | React admin (`apps/admin/dist`) |
| `http://SERVER_IP/api/*` | NestJS API → `127.0.0.1:3100` |

Alleen **Nginx** luistert op poort 80. Web en admin zijn statische Vite-builds. De API is het enige Node-proces (intern op 3100).

PostgreSQL draait op poort **5434**, Redis op **6380** (Docker Compose).

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
PORT=3100

DATABASE_URL=postgresql://tresamigos:tresamigos@localhost:5434/tresamigos?schema=public
REDIS_URL=redis://localhost:6380

ADMIN_PASSWORD=<sterk-wachtwoord>
ADMIN_PASSWORD_HASH=
CORS_ORIGINS=http://167.233.20.221

# Leeg laten — browser gebruikt relatieve /api/... paden
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

- **`VITE_API_URL=` leeg laten** in productie → `fetch("/api/content")`, niet `/api/api/...`.
- Vul **niet** `http://SERVER_IP/api` in — dat geeft dubbele paden.
- **`NODE_ENV`** hoort niet in `.env` voor Vite. Zet `NODE_ENV=production` in systemd (zie service hieronder).

## 5. systemd service (API)

Kopieer de meegeleverde unit:

```bash
cp deploy/tresamigos-api.service /etc/systemd/system/tresamigos-api.service
systemctl daemon-reload
systemctl enable tresamigos-api
systemctl start tresamigos-api
systemctl status tresamigos-api
```

Referentie (`deploy/tresamigos-api.service`):

```ini
[Unit]
Description=Tres Amigos API
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
WorkingDirectory=/var/www/tresamigos
Environment=NODE_ENV=production
EnvironmentFile=/var/www/tresamigos/.env
ExecStart=/usr/bin/pnpm --filter @tresamigos/api start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## 6. Nginx

Kopieer de meegeleverde config:

```bash
cp deploy/nginx-tresamigos.conf /etc/nginx/sites-available/tresamigos
ln -sf /etc/nginx/sites-available/tresamigos /etc/nginx/sites-enabled/tresamigos
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Verwachte routing (`deploy/nginx-tresamigos.conf`):

```nginx
server {
    listen 80 default_server;
    server_name _;

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

    location = /admin {
        return 301 /admin/;
    }

    location /admin/ {
        alias /var/www/tresamigos/apps/admin/dist/;
        index index.html;
        try_files $uri $uri/ index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    client_max_body_size 15M;
}
```

**Niet doen:** `location /assets/` alias naar `/var/www/tresamigos/assets` — Vite-build JS/CSS staat óók onder `/assets/` en breekt dan.

Optioneel (CMS-uploads): alleen `/assets/uploads/` proxien naar de API — zie `deploy/nginx-tresamigos.conf`.

## 7. Eerste deploy

```bash
cd /var/www/tresamigos
chmod +x start.sh
./start.sh production
```

Op `/var/www/tresamigos` detecteert `./start.sh` automatisch productiemodus.

## 10. Deploy update

Na een push naar git:

```bash
cd /var/www/tresamigos
./start.sh production
# of als Permission denied:
bash start.sh production
# of:
pnpm deploy
```

`start.sh` doet automatisch `git fetch` + `git reset --hard origin/<branch>`. Lokale build-ruis (zoals `*.tsbuildinfo`) blokkeert deploy niet meer. **`.env` blijft altijd staan** — die staat in `.gitignore`.

**Eenmalig** als pull al vastloopt vóór je deze fix hebt:

```bash
cd /var/www/tresamigos
git fetch origin
git reset --hard origin/main   # of: origin/master / jouw branch
./start.sh production
```

`start.sh` productie voert ook uit: `pnpm install`, Prisma generate + migraties + seed, `pnpm build`, API restart, nginx reload, health checks.

## 9. Health checks (handmatig)

Vervang `SERVER_IP`:

```bash
curl -I http://SERVER_IP/
curl -I http://SERVER_IP/admin/
curl http://SERVER_IP/api/content | head -c 300
curl http://SERVER_IP/api/instagram/feed | head -c 300
grep -R "/api/api" -n apps/web/dist apps/admin/dist
ss -tulpn | grep :3100
```

Verwacht:

- Web en admin: HTTP 200
- API: JSON
- `grep`: **geen** output (geen dubbele `/api/api`)
- Precies één API-proces op poort 3100

---

## Troubleshooting

### `/api/api/admin/login` of dubbele `/api/`-paden

`VITE_API_URL` staat verkeerd (bijv. `http://SERVER_IP/api`). Zet `VITE_API_URL=` leeg in `.env` en voer `./start.sh production` opnieuw uit.

### `EADDRINUSE 3100`

Dubbele API-processen. Controleer:

```bash
ss -tulpn | grep :3100
systemctl status tresamigos-api
```

Stop handmatige `pnpm dev` / `node dist/main.js` en gebruik alleen systemd.

### Lege pagina terwijl HTML wél laadt

JavaScript/CSS niet geladen. Controleer:

```bash
curl -I http://SERVER_IP/assets/<bestand>.js
```

Gebruik bestandsnamen uit `apps/web/dist/index.html`. Voeg **geen** brede `/assets/` Nginx-alias toe.

### `413 Request Entity Too Large`

Zorg dat `client_max_body_size 15M;` in Nginx staat en herlaad Nginx.
