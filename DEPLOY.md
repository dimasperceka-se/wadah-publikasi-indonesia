# SciPub — Deploy Guide

Dokumen singkat untuk:

1. Push repo ke GitHub
2. Pull di server Tencent (Ubuntu)
3. Deploy sebagai `https://scipub.storify.asia`

Asumsi:
- Repo lokal: `c:\Users\dimas\Downloads\Scientific-Publication-Hub\Scientific-Publication-Hub`
- Repo remote: `https://github.com/dimasperceka-se/wadah-publikasi-indonesia.git`
- Server: Tencent Cloud, Ubuntu 22.04 / 24.04, akses via SSH
- Domain `scipub.storify.asia` sudah (atau akan) di-arahkan ke IP server lewat DNS A record

---

## 1. Push ke GitHub (dari mesin lokal)

Dari root project, **PowerShell**:

```powershell
# pertama kali — set remote (kalau belum)
git remote add origin https://github.com/dimasperceka-se/wadah-publikasi-indonesia.git

# kalau sebelumnya remote menunjuk repo lain, ganti URL-nya
git remote set-url origin https://github.com/dimasperceka-se/wadah-publikasi-indonesia.git

# pastikan branch utama bernama "main"
git branch -M main

# commit perubahan saat ini
git add .
git commit -m "Initial deploy: remove Replit, add storify-style theme"

# push pertama kali (set upstream)
git push -u origin main
```

Push berikutnya cukup `git push`.

> Catatan: file `.env` sudah di-`.gitignore`. Pastikan tidak ter-commit — kredensial DB lokal jangan masuk repo.

---

## 2. Pull di server Tencent (Ubuntu)

### 2.1 Prasyarat — install sekali per server

SSH ke server (`ssh ubuntu@<ip-server>`), lalu:

```bash
# update apt
sudo apt update && sudo apt upgrade -y

# Node.js 22 LTS (mendukung --env-file flag yang dipakai di api-server)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

# pnpm via corepack
sudo corepack enable
corepack prepare pnpm@10.33.0 --activate

# PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# nginx + certbot (untuk reverse proxy dan TLS)
sudo apt install -y nginx
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot

# verifikasi
node -v && pnpm -v && psql --version && nginx -v
```

### 2.2 Setup database

Buat role + database di Postgres server:

```bash
sudo -u postgres psql <<'SQL'
-- ganti password ini sebelum dipakai produksi
CREATE ROLE scipub_app LOGIN PASSWORD 'GANTI_PASSWORD_INI' ;
CREATE DATABASE scipub OWNER scipub_app;
GRANT ALL PRIVILEGES ON DATABASE scipub TO scipub_app;
SQL
```

> Untuk produksi pakai user terpisah (`scipub_app`) bukan `postgrest/postgrest`. Password disimpan di `.env`.

### 2.3 Clone repo

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/dimasperceka-se/wadah-publikasi-indonesia.git scipub
cd scipub
```

### 2.4 `.env` produksi

```bash
cat > .env <<'EOF'
DATABASE_URL=postgres://scipub_app:GANTI_PASSWORD_INI@localhost:5432/scipub
SESSION_SECRET=GANTI_DENGAN_RANDOM_64_CHAR
PORT=15000
NODE_ENV=production
LOG_LEVEL=info
ANTHROPIC_API_KEY=
EOF
chmod 600 .env
```

Generate secret yang kuat (sekali jalan, copy hasilnya ke `SESSION_SECRET`):

```bash
openssl rand -base64 48
```

### 2.5 Install deps + build + push schema

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/sci-pub run build
```

### 2.6 Update flow (setiap deploy berikutnya)

```bash
cd /var/www/scipub
git pull
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push          # hanya kalau schema berubah
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/sci-pub run build
sudo systemctl restart scipub-api
sudo systemctl reload nginx
```

---

## 3. Deploy sebagai `scipub.storify.asia`

Arsitektur runtime:
- **API server** (Node) jalan di `127.0.0.1:15000`, dikelola oleh systemd
- **Frontend** sudah di-build jadi static files di `artifacts/sci-pub/dist/public`
- **nginx** terima request `https://scipub.storify.asia`, serve static + proxy `/api/*` ke API server
- **TLS** dari Let's Encrypt via certbot

### 3.1 DNS

Di panel DNS `storify.asia`, tambah:

| Type | Name    | Value             | TTL |
|------|---------|-------------------|-----|
| A    | scipub  | <IP-server-Tencent> | 300 |

Tunggu propagasi (cek `dig scipub.storify.asia +short`).

### 3.2 Systemd unit untuk API server

```bash
sudo tee /etc/systemd/system/scipub-api.service > /dev/null <<'UNIT'
[Unit]
Description=SciPub API server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/scipub/artifacts/api-server
ExecStart=/usr/bin/node --enable-source-maps --env-file=/var/www/scipub/.env /var/www/scipub/artifacts/api-server/dist/index.mjs
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=scipub-api

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now scipub-api
sudo systemctl status scipub-api --no-pager
```

Cek log: `sudo journalctl -u scipub-api -f`.

Smoke test: `curl http://127.0.0.1:15000/api/healthz` → `{"status":"ok"}`.

### 3.3 nginx — virtual host

```bash
sudo tee /etc/nginx/sites-available/scipub.storify.asia > /dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name scipub.storify.asia;

    # HTTP-01 challenge — biarkan certbot yang isi
    root /var/www/scipub/artifacts/sci-pub/dist/public;
    index index.html;

    # API → backend Node
    location /api/ {
        proxy_pass http://127.0.0.1:15000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Static assets dengan cache panjang
    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # gzip dasar
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript application/xml image/svg+xml;
    gzip_min_length 1024;
}
NGINX

sudo ln -sf /etc/nginx/sites-available/scipub.storify.asia /etc/nginx/sites-enabled/scipub.storify.asia
sudo nginx -t && sudo systemctl reload nginx
```

### 3.4 Pastikan firewall buka 80/443

```bash
# Tencent biasanya pakai security group di console + ufw lokal
sudo ufw allow 'Nginx Full'
sudo ufw status
```

Buka port 80 dan 443 juga di **Security Group** Tencent Cloud Console.

### 3.5 TLS via Let's Encrypt

```bash
sudo certbot --nginx -d scipub.storify.asia \
    --redirect --agree-tos -m you@storify.asia --no-eff-email
```

Certbot akan:
- Verifikasi via HTTP-01
- Pasang sertifikat
- Tambah `listen 443 ssl` ke nginx config dan redirect 80 → 443
- Jadwalkan auto-renewal (cek: `systemctl status certbot.timer`)

Tes: `https://scipub.storify.asia` di browser → harus muncul SciPub dengan ribbon background.

---

## 4. Operasional sehari-hari

### Cek status

```bash
sudo systemctl status scipub-api
sudo journalctl -u scipub-api -f
sudo nginx -t && sudo systemctl status nginx
```

### Restart API only

```bash
sudo systemctl restart scipub-api
```

### Rotate SESSION_SECRET

Edit `/var/www/scipub/.env`, ganti `SESSION_SECRET`, lalu:

```bash
sudo systemctl restart scipub-api
```

> Semua user akan ter-logout (token JWT lama tidak valid lagi).

### Backup database

```bash
sudo -u postgres pg_dump scipub | gzip > ~/scipub-$(date +%Y%m%d).sql.gz
```

Pulihkan:

```bash
gunzip -c scipub-YYYYMMDD.sql.gz | sudo -u postgres psql scipub
```

### Promote user jadi admin / verifier

```bash
sudo -u postgres psql scipub <<'SQL'
UPDATE users SET role = 'ADMIN' WHERE email = 'kamu@email.com';
-- verifier layer 2:
UPDATE users SET role = 'VERIFIER', verifier_layer = 2 WHERE email = 'l2@email.com';
SQL
```

---

## 5. Troubleshooting cepat

| Gejala | Cek |
|---|---|
| `502 Bad Gateway` di browser | `sudo systemctl status scipub-api` — apakah API jalan? `curl 127.0.0.1:15000/api/healthz` |
| `connection refused` di journalctl | DB belum jalan / `DATABASE_URL` salah; `sudo systemctl status postgresql` |
| `password authentication failed` | Cek `.env` vs role di Postgres (`\du` di `psql`) |
| Frontend 404 di refresh halaman dalam | nginx fallback ke `index.html` — pastikan blok `try_files $uri $uri/ /index.html;` ada |
| Build frontend gagal di server | Pastikan Node ≥ 22 dan RAM cukup; tambah swap kalau <2GB RAM |
| `--env-file` not recognized | Node terlalu lama. Butuh Node 20.6+ (kita pakai 22 LTS) |
| Certbot gagal | Pastikan port 80 terbuka di Tencent Security Group; DNS sudah propagasi |

### Tambah swap (kalau RAM 1GB)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 6. Ringkasan checklist deploy pertama kali

- [ ] DNS A record `scipub.storify.asia` → IP server
- [ ] Port 80, 443 terbuka di Tencent Security Group + ufw
- [ ] Node 22 + pnpm + Postgres + nginx + certbot terinstall
- [ ] Role `scipub_app` + DB `scipub` dibuat dengan password kuat
- [ ] Repo di-clone ke `/var/www/scipub`
- [ ] `.env` produksi terisi (`SESSION_SECRET` random 48+ byte)
- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm --filter @workspace/db run push`
- [ ] Build api-server + frontend
- [ ] systemd unit `scipub-api` aktif dan running
- [ ] nginx vhost aktif, `nginx -t` lulus
- [ ] `certbot --nginx` selesai, redirect HTTPS jalan
- [ ] `https://scipub.storify.asia/api/healthz` → `{"status":"ok"}`
