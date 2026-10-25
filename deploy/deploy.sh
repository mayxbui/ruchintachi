#!/usr/bin/env bash
# Deploy the latest main to the VM (issue #22).
# Usage on the VM: sudo bash /opt/ruchintachi/deploy/deploy.sh [branch]
set -euo pipefail

BRANCH="${1:-main}"
APP_USER=ruchintachi
APP_DIR=/opt/ruchintachi

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }

set -a; . /etc/ruchintachi.env; set +a
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

KEEP_ENV=DATABASE_PATH,NODE_ENV,BACKUP_DIR,BACKUP_KEEP,COREPACK_ENABLE_DOWNLOAD_PROMPT
as_app() { sudo -u "$APP_USER" --preserve-env="$KEEP_ENV" bash -c "cd $APP_DIR && $*"; }

# Back up before migrating, so a bad migration can be rolled back
if [ -f "$DATABASE_PATH" ]; then as_app /usr/local/bin/ruchintachi-backup; fi

as_app "git fetch --prune origin && git checkout $BRANCH && git reset --hard origin/$BRANCH"
as_app "NODE_ENV=development pnpm install --frozen-lockfile"
as_app "pnpm db:migrate"
as_app "pnpm build"

systemctl restart ruchintachi
sleep 3
systemctl --no-pager --lines=5 status ruchintachi
curl -fsS -o /dev/null -w "health: HTTP %{http_code}\n" "http://127.0.0.1:${PORT}/"
