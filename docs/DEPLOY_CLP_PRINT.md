# Deploy `clp-print.aromawax.eu`

## What this deployment serves

- Next.js CLP print interface
- Shopify product catalog search
- CLP data merged from `data/clp_master_table.tsv`

## Required server stack

- Ubuntu 22.04 or newer
- Node.js 22
- npm
- nginx
- systemd

## Required env vars

Create `/var/www/clp-print/current/.env.local`:

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_ACCESS_TOKEN=
APP_PASSWORD=
USE_MOCK_DATA=0
```

Use one auth mode:

- preferred: `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`
- fallback: `SHOPIFY_ACCESS_TOKEN`

If hosted token generation misbehaves, keep `SHOPIFY_ACCESS_TOKEN` set and redeploy. The runtime prefers the static token over client-credentials auth.

## First deploy

```bash
sudo mkdir -p /var/www/clp-print
sudo chown -R $USER:$USER /var/www/clp-print
cd /var/www/clp-print
git clone https://github.com/ovdspb-code/aroma-wax.git current
cd current
npm install
npm run build
```

## Run with systemd

Create `/etc/systemd/system/clp-print.service`:

```ini
[Unit]
Description=AROMA + WAX CLP Print
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/clp-print/current
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo chown -R www-data:www-data /var/www/clp-print/current
sudo systemctl daemon-reload
sudo systemctl enable clp-print
sudo systemctl start clp-print
sudo systemctl status clp-print
```

## nginx config

Create `/etc/nginx/sites-available/clp-print.aromawax.eu`:

```nginx
server {
    server_name clp-print.aromawax.eu;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/clp-print.aromawax.eu /etc/nginx/sites-enabled/clp-print.aromawax.eu
sudo nginx -t
sudo systemctl reload nginx
```

## SSL

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d clp-print.aromawax.eu
```

## GoDaddy DNS

If the app is on a dedicated VPS:

- create `A` record
- host: `clp-print`
- value: public IPv4 of the server

If the app is behind another hostname:

- create `CNAME`
- host: `clp-print`
- value: host name of the reverse proxy / platform

## Update flow

```bash
cd /var/www/clp-print/current
git pull
npm install
npm run build
sudo systemctl restart clp-print
```

## CLP data sync on server

Refresh catalog, autofill from site, and import back to Shopify:

```bash
cd /var/www/clp-print/current
npm run clp:sync
```

## Quick checks

```bash
curl -I http://127.0.0.1:3000
curl -I https://clp-print.aromawax.eu
sudo systemctl status clp-print
sudo journalctl -u clp-print -n 100 --no-pager
```
