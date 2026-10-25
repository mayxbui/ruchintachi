#!/usr/bin/env bash
# One-time server setup on the Ubuntu VM (issues #20, #21, #22, #23).
# Usage: sudo SITE_ADDRESS=ruchintachi.eastus.cloudapp.azure.com bash setup-server.sh
#
# Installs Node LTS + pnpm, Caddy and sqlite3, locks the firewall to 22/80/443,
# creates the app user and directories, clones the repo, and installs the
# systemd units for the app and the nightly backup. Safe to re-run.
set -euo pipefail

SITE_ADDRESS="${SITE_ADDRESS:?set SITE_ADDRESS to the domain or Azure DNS name}"
REPO_URL="${REPO_URL:-git@github.com:mayxbui/ruchintachi.git}"
NODE_MAJOR="${NODE_MAJOR:-24}"
APP_USER=ruchintachi
APP_DIR=/opt/ruchintachi
DATA_DIR=/var/lib/ruchintachi
BACKUP_DIR=/var/backups/ruchintachi
ENV_FILE=/etc/ruchintachi.env

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg git ufw sqlite3 build-essential python3 \
  debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades

# Node LTS from NodeSource
if ! node --version 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
corepack enable

# Caddy from its official apt repo
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

# Firewall: SSH + web only (the Azure NSG also restricts these)
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# SSH: keys only
install -m 644 /dev/stdin /etc/ssh/sshd_config.d/90-ruchintachi.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
systemctl reload ssh

# App user and directories
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 750 "$APP_DIR" "$DATA_DIR" "$BACKUP_DIR"

# Environment file (secrets live here, never in git)
if [ ! -f "$ENV_FILE" ]; then
  install -m 640 -o root -g "$APP_USER" /dev/stdin "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
DATABASE_PATH=$DATA_DIR/ruchintachi.db
BACKUP_DIR=$BACKUP_DIR
BACKUP_KEEP=14
EOF
fi

# Code. The repo is private: add a read-only deploy key for $APP_USER on GitHub
# (sudo -u $APP_USER ssh-keygen -t ed25519) before this step, or clone over HTTPS.
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi

# Caddy reverse proxy with automatic HTTPS
echo "SITE_ADDRESS=$SITE_ADDRESS" > /etc/default/caddy
install -m 644 "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
mkdir -p /etc/systemd/system/caddy.service.d
install -m 644 /dev/stdin /etc/systemd/system/caddy.service.d/env.conf <<'EOF'
[Service]
EnvironmentFile=/etc/default/caddy
EOF

# systemd units
install -m 644 "$APP_DIR/deploy/ruchintachi.service" /etc/systemd/system/
install -m 644 "$APP_DIR/deploy/ruchintachi-backup.service" /etc/systemd/system/
install -m 644 "$APP_DIR/deploy/ruchintachi-backup.timer" /etc/systemd/system/
install -m 755 "$APP_DIR/deploy/backup-db.sh" /usr/local/bin/ruchintachi-backup
systemctl daemon-reload
systemctl enable ruchintachi.service ruchintachi-backup.timer
systemctl restart caddy
systemctl start ruchintachi-backup.timer

echo "Setup done. Deploy the app with: sudo bash $APP_DIR/deploy/deploy.sh"
