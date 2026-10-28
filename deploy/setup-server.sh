#!/usr/bin/env bash
# One-time server setup on the Ubuntu VM (issues #20, #21, #22, #23).
# Copy the whole deploy/ folder to the VM, then run:
#   sudo SITE_ADDRESS=ruchintachi.northcentralus.cloudapp.azure.com bash deploy/setup-server.sh
#
# Installs Node LTS, Caddy, the GitHub CLI and sqlite3, adds swap, locks the
# firewall to 22/80/443, creates the app user and directories, and installs the
# systemd units, the Caddyfile and the deploy/backup commands. Nothing is built
# here: deploy.sh downloads the finished build from GitHub. Safe to re-run.
set -euo pipefail

SITE_ADDRESS="${SITE_ADDRESS:?set SITE_ADDRESS to the domain or Azure DNS name}"
NODE_MAJOR="${NODE_MAJOR:-24}"  # must match node-version in .github/workflows/build-release.yml
APP_USER=ruchintachi
APP_DIR=/opt/ruchintachi
DATA_DIR=/var/lib/ruchintachi
BACKUP_DIR=/var/backups/ruchintachi
ENV_FILE=/etc/ruchintachi.env
DEPLOY_ENV_FILE=/etc/ruchintachi-deploy.env
HERE="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg ufw sqlite3 \
  debian-keyring debian-archive-keyring apt-transport-https unattended-upgrades
install -d -m 755 /etc/apt/keyrings

# Node LTS from NodeSource
if ! node --version 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

# Caddy from its official apt repo
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

# GitHub CLI, used by deploy.sh to download the build
if ! command -v gh >/dev/null; then
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    -o /etc/apt/keyrings/githubcli-archive-keyring.gpg
  chmod 644 /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list
  apt-get update
  apt-get install -y gh
fi

# 1 GB swap as a safety margin on a 1 GiB VM
if ! swapon --show | grep -q /swapfile; then
  [ -f /swapfile ] || { fallocate -l 1G /swapfile; chmod 600 /swapfile; mkswap /swapfile; }
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
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
id "$APP_USER" >/dev/null 2>&1 || useradd --system --shell /usr/sbin/nologin "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 750 "$APP_DIR" "$APP_DIR/releases" "$DATA_DIR" "$BACKUP_DIR"

# App environment (read by the service and the backup)
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

# Deploy token, root-only and kept out of the app's environment.
# Fill in GH_TOKEN yourself (see deploy/README.md); never commit it.
if [ ! -f "$DEPLOY_ENV_FILE" ]; then
  install -m 600 -o root -g root /dev/stdin "$DEPLOY_ENV_FILE" <<'EOF'
# Fine-grained GitHub token: repo mayxbui/ruchintachi, Contents: read-only.
GH_TOKEN=
EOF
fi

# Caddy reverse proxy with automatic HTTPS
echo "SITE_ADDRESS=$SITE_ADDRESS" > /etc/default/caddy
install -m 644 "$HERE/Caddyfile" /etc/caddy/Caddyfile
mkdir -p /etc/systemd/system/caddy.service.d
install -m 644 /dev/stdin /etc/systemd/system/caddy.service.d/env.conf <<'EOF'
[Service]
EnvironmentFile=/etc/default/caddy
EOF

# systemd units and commands
install -m 644 "$HERE/ruchintachi.service" /etc/systemd/system/
install -m 644 "$HERE/ruchintachi-backup.service" /etc/systemd/system/
install -m 644 "$HERE/ruchintachi-backup.timer" /etc/systemd/system/
install -m 755 "$HERE/backup-db.sh" /usr/local/bin/ruchintachi-backup
install -m 755 "$HERE/deploy.sh" /usr/local/bin/ruchintachi-deploy
systemctl daemon-reload
systemctl enable ruchintachi.service ruchintachi-backup.timer
systemctl restart caddy
systemctl start ruchintachi-backup.timer

echo "Setup done."
echo "Next: put your token in $DEPLOY_ENV_FILE (sudo nano $DEPLOY_ENV_FILE), then run: sudo ruchintachi-deploy"
