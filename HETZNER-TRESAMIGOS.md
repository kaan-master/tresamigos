# Tres Amigos op Hetzner VPS

Deze opzet houdt de publieke website, admin en API licht:

- Nginx ontvangt HTTPS verkeer.
- Node serveert de website, admin en `/api`.
- Beheerbare content staat in `data/site-content.json`.
- Admin-wachtwoord staat alleen in `.env`.
- Er staan geen databasegegevens of wachtwoorden in de frontend.

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

Voorbeeld `/etc/nginx/sites-available/tresamigos`:

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
