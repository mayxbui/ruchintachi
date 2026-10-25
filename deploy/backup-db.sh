#!/usr/bin/env bash
# Back up the SQLite database and keep the newest N copies (issue #23).
# Installed as /usr/local/bin/ruchintachi-backup; run nightly by ruchintachi-backup.timer.
# Uses SQLite's online backup, which is safe while the app is running (WAL mode).
set -euo pipefail

DATABASE_PATH="${DATABASE_PATH:-/var/lib/ruchintachi/ruchintachi.db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ruchintachi}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"

[ -f "$DATABASE_PATH" ] || { echo "no database at $DATABASE_PATH" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"

target="$BACKUP_DIR/ruchintachi-$(date -u +%Y%m%dT%H%M%SZ).db"
sqlite3 "$DATABASE_PATH" ".backup '$target'"
[ "$(sqlite3 "$target" 'PRAGMA integrity_check;')" = "ok" ] || { echo "integrity check failed: $target" >&2; exit 1; }
gzip "$target"
echo "backup written: $target.gz"

# Prune: keep the newest $BACKUP_KEEP
ls -1t "$BACKUP_DIR"/ruchintachi-*.db.gz | tail -n +"$((BACKUP_KEEP + 1))" | xargs -r rm --
