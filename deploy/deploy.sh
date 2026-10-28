#!/usr/bin/env bash
# Deploy the latest build of main to the VM (issue #22).
# Installed as /usr/local/bin/ruchintachi-deploy by setup-server.sh. Usage: sudo ruchintachi-deploy
#
# Downloads the `deploy-latest` release made by .github/workflows/build-release.yml,
# unpacks it into releases/<commit>, backs up the database, points `current` at
# the new release and restarts the app (which applies migrations on start).
# If the app doesn't answer, switches back to the previous release.
set -euo pipefail

REPO=mayxbui/ruchintachi
APP_USER=ruchintachi
APP_DIR=/opt/ruchintachi
KEEP_RELEASES=3

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }

set -a; . /etc/ruchintachi.env; . /etc/ruchintachi-deploy.env; set +a
[ -n "${GH_TOKEN:-}" ] || { echo "GH_TOKEN is empty in /etc/ruchintachi-deploy.env (see deploy/README.md)" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

gh release download deploy-latest --repo "$REPO" --pattern ruchintachi.tar.gz --dir "$tmp"
mkdir "$tmp/release"
tar -xzf "$tmp/ruchintachi.tar.gz" -C "$tmp/release"

rev="$(cat "$tmp/release/REVISION")"
short="${rev:0:7}"
target="$APP_DIR/releases/$short"
previous="$(readlink -f "$APP_DIR/current" 2>/dev/null || true)"

if [ "$previous" = "$target" ]; then
  echo "Already running $short; nothing to do."
  exit 0
fi

rm -rf "$target"
mv "$tmp/release" "$target"
touch "$target"
chown -R "$APP_USER:$APP_USER" "$target"

# Back up before the new release migrates the database
if [ -f "$DATABASE_PATH" ]; then
  sudo -u "$APP_USER" --preserve-env=DATABASE_PATH,BACKUP_DIR,BACKUP_KEEP /usr/local/bin/ruchintachi-backup
fi

ln -sfn "$target" "$APP_DIR/current"
systemctl restart ruchintachi

healthy() {
  for _ in $(seq 1 30); do
    # Quiet while the app is still starting; a real failure is reported below
    curl -fs -o /dev/null "http://127.0.0.1:${PORT}/" && return 0
    sleep 1
  done
  return 1
}

if ! healthy; then
  echo "Release $short did not answer on port $PORT. Recent logs:" >&2
  journalctl -u ruchintachi -n 30 --no-pager >&2 || true
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    echo "Rolling back to $(basename "$previous")." >&2
    echo "If $short already migrated the database, restore the backup taken above (deploy/README.md)." >&2
    ln -sfn "$previous" "$APP_DIR/current"
    systemctl restart ruchintachi
  fi
  exit 1
fi

echo "Deployed $short."

# Keep the newest $KEEP_RELEASES releases, never the one running
current="$(readlink -f "$APP_DIR/current")"
ls -1dt "$APP_DIR"/releases/*/ | sed 's#/$##' | grep -vxF "$current" \
  | tail -n +"$KEEP_RELEASES" | xargs -r rm -rf --
