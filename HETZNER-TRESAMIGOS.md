# Tres Amigos op Hetzner VPS

> **Linux start-script:** zie [START-LINUX.md](./START-LINUX.md) voor `./start.sh`, nginx met upload-limiet en migratie van de oude statische site.

Deze opzet gebruikt de **monorepo** (React + NestJS + PostgreSQL + Redis):

- Nginx serveert de web- en admin-build en proxy't `/api/` naar NestJS.
- Content en sollicitaties gaan via PostgreSQL (niet meer alleen `data/site-content.json`).
- Admin-wachtwoord staat in `.env`.

## 1. Server basis

```bash
sudo apt update
sudo apt install -y nginx ufw git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 2. Applicatie plaatsen

```bash
cd /var/www
sudo git clone <repo-url> tresamigos
sudo chown -R $USER:$USER /var/www/tresamigos
cd /var/www/tresamigos
cp .env.example .env
nano .env
npm run build
```

Zet in `.env` minimaal:

```conf
PORT=3000
ADMIN_PASSWORD=<sterk-admin-wachtwoord>
```

## 3. Schrijfrechten voor content

De service moet `data/site-content.json` kunnen aanpassen:

```bash
sudo chown -R www-data:www-data /var/www/tresamigos/data
sudo chmod -R 750 /var/www/tresamigos/data
```

## 4. systemd service

Maak `/etc/systemd/system/tresamigos.service`:

```ini
[Unit]
Description=Tres Amigos website and CMS
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/tresamigos
EnvironmentFile=/var/www/tresamigos/.env
ExecStart=/usr/bin/node /var/www/tresamigos/server.cjs
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable tresamigos
sudo systemctl start tresamigos
sudo systemctl status tresamigos
```

## 5. Nginx

Volledige config (inclusief `client_max_body_size` voor CV-uploads): **[START-LINUX.md § Nginx](./START-LINUX.md#4-nginx-website--admin--api)**.

Kort voorbeeld:

```nginx
server {
  listen 80;
  server_name tresamigos.nl www.tresamigos.nl;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Activeer:

```bash
sudo ln -s /etc/nginx/sites-available/tresamigos /etc/nginx/sites-enabled/tresamigos
sudo nginx -t
sudo systemctl reload nginx
```

Gebruik daarna Certbot voor HTTPS.

## 6. Checklist

- Commit nooit `.env`.
- Gebruik een sterk admin-wachtwoord.
- Maak back-ups van `data/site-content.json`.
- Zet HTTPS aan voordat de admin live gebruikt wordt.
- Houd poort `3000` achter Nginx; open hem niet publiek.
