# Tres Amigos — Linux start & deployment

Gids voor **Ubuntu/Debian** (getest op Ubuntu 26.04 LTS). Windows: `start-all.bat`.

## Vereisten

- Node.js **20+**
- pnpm (`npm install -g pnpm` of `corepack enable`)
- Docker Engine + Docker Compose (PostgreSQL + Redis)
- Nginx (productie)

## Lokaal starten (development)

Eén bestand — alles gebeurt hierin met duidelijke voortgang:

```bash
cd /var/www/tresamigos   # of je clone-pad
cp .env.example .env     # vul ADMIN_PASSWORD en DATABASE_URL in
pnpm install
chmod +x start.sh
./start.sh
```

Het script doorloopt **6 stappen**:

1. Docker controleren
2. Poorten 3100, 5180, 5181 vrijmaken
3. PostgreSQL + Redis containers starten
4. Wachten tot database healthy is
5. Migraties + seed
6. Packages bouwen → API, Web en Admin starten

| Service | URL |
|---------|-----|
| Website | http://localhost:5180 |
| Admin | http://localhost:5181/admin/ |
| API | http://localhost:3100/api/content |

Stoppen: `Ctrl+C` in de terminal, daarna optioneel `docker compose down`.

### Handmatig (zonder script)

```bash
pnpm infra:up
sleep 6
pnpm db:migrate && pnpm db:seed
pnpm dev
```

---

## Productie op Hetzner / VPS

De **nieuwe monorepo** vervangt de oude statische site (`server.cjs`, losse `.html`-bestanden).  
Op de server staan nu waarschijnlijk nog oude bestanden — deploy de volledige repo.

### 1. Server basis

```bash
sudo apt update
sudo apt install -y nginx ufw git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Applicatie plaatsen

```bash
cd /var/www
sudo git clone <repo-url> tresamigos
sudo chown -R $USER:$USER /var/www/tresamigos
cd /var/www/tresamigos
cp .env.example .env
nano .env
pnpm install
pnpm build
pnpm db:deploy
pnpm db:seed
```

Minimaal in `.env` voor productie:

```env
NODE_ENV=production
PORT=3100
DATABASE_URL=postgresql://tresamigos:tresamigos@localhost:5434/tresamigos?schema=public
REDIS_URL=redis://localhost:6380
ADMIN_PASSWORD=<sterk-wachtwoord>
CORS_ORIGINS=https://tresamigos.aydev.nl
```

> **Poort:** lokaal dev = 3100. Op je server gebruik je `PORT=3100` (of 3000 als je nginx daar al op wijst — pas nginx en `.env` gelijk aan).

Docker op de server:

```bash
docker compose up -d
```

### 3. systemd service (API)

Maak `/etc/systemd/system/tresamigos-api.service`:

```ini
[Unit]
Description=Tres Amigos API (NestJS)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/var/www/tresamigos/apps/api
EnvironmentFile=/var/www/tresamigos/.env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /var/www/tresamigos
sudo systemctl daemon-reload
sudo systemctl enable tresamigos-api
sudo systemctl start tresamigos-api
sudo systemctl status tresamigos-api
```

### 4. Nginx (website + admin + API)

**Belangrijk voor sollicitaties met CV:** zet `client_max_body_size` op minimaal **15M** (anders krijg je `413 Request Entity Too Large`).

Voorbeeld `/etc/nginx/sites-available/tresamigos` voor `tresamigos.aydev.nl`:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name tresamigos.aydev.nl;

    client_max_body_size 15M;

    root /var/www/tresamigos/apps/web/dist;
    index index.html;

    # Statische brand/site assets
    location /assets/ {
        alias /var/www/tresamigos/assets/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # NestJS API — sollicitaties, contact, content
    location /api/ {
        client_max_body_size 15M;
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React admin (Vite base /admin/)
    location /admin/ {
        alias /var/www/tresamigos/apps/admin/dist/;
        try_files $uri $uri/ /admin/index.html;
    }

    # React website (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    access_log /var/log/nginx/tresamigos.access.log;
    error_log /var/log/nginx/tresamigos.error.log;
}
```

Activeer:

```bash
sudo ln -sf /etc/nginx/sites-available/tresamigos /etc/nginx/sites-enabled/tresamigos
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS met Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tresamigos.aydev.nl
```

### 5. Migratie van oude statische site

Als je server nog `index.html`, `server.cjs`, `cms.js` heeft:

1. Backup: `sudo tar czf ~/tresamigos-old-backup.tar.gz /var/www/tresamigos`
2. Clone de nieuwe monorepo naar `/var/www/tresamigos`
3. Kopieer `.env` en `assets/uploads/` uit de backup
4. `pnpm install && pnpm build && pnpm db:deploy && pnpm db:seed`
5. Vervang nginx-config (zie hierboven) — **niet** meer `proxy_pass` naar `server.cjs` op poort 3000
6. Start `tresamigos-api` systemd service

### 6. Update na git pull

```bash
cd /var/www/tresamigos
git pull
pnpm install
pnpm build
pnpm db:deploy
sudo systemctl restart tresamigos-api
```

---

## Sollicitatie-uploads

| Laag | Limiet |
|------|--------|
| Frontend | PDF, DOC, DOCX — max **10 MB** |
| NestJS API | JSON body **15 MB** |
| Nginx | `client_max_body_size 15M` |

Bij `413 Request Entity Too Large`: verhoog nginx **en** herstart nginx + API.

---

## Checklist

- [ ] `.env` nooit committen
- [ ] Sterk admin-wachtwoord
- [ ] Docker Postgres + Redis draaien
- [ ] `client_max_body_size 15M` in nginx
- [ ] HTTPS via Certbot
- [ ] Poort 3100 alleen lokaal (achter nginx)
- [ ] Back-ups van database + `assets/uploads/`

Zie ook [HETZNER-TRESAMIGOS.md](./HETZNER-TRESAMIGOS.md) voor algemene server-notities.
