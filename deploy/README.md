# Deploying Ruchintachi

One small Azure VM runs everything: Caddy terminates HTTPS and proxies to the
Next.js app on `127.0.0.1:3000`, systemd keeps the app running, and a systemd
timer backs up the SQLite file every night. Everything here is free-tier or
free software.

The VM never builds. GitHub Actions builds a self-contained
[standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
copy of the app on every push to `main` and publishes it as the `deploy-latest`
release. On the VM, `sudo ruchintachi-deploy` downloads it and switches to it.
Migrations run when the app starts (`src/instrumentation.ts`).

| File | Purpose | Issue |
| --- | --- | --- |
| `../.github/workflows/build-release.yml` | Test, build, pack, upload to `deploy-latest` | #22 |
| `provision-vm.sh` | Optional: create the VM from the CLI instead of the portal | #20 |
| `setup-server.sh` | One-time server setup: Node LTS, Caddy, GitHub CLI, swap, ufw, users, units | #20–#23 |
| `Caddyfile` | Reverse proxy with automatic Let's Encrypt certificates | #21 |
| `ruchintachi.service` | Runs `node server.js`; starts on boot, restarts on crash | #22 |
| `deploy.sh` | Download the build, back up, switch, health check, roll back | #22 |
| `backup-db.sh`, `ruchintachi-backup.{service,timer}` | Nightly SQLite backup, keeps the last N | #23 |

## Layout on the server

| Path | What |
| --- | --- |
| `/opt/ruchintachi/releases/<commit>/` | Unpacked builds (the last 3 are kept) |
| `/opt/ruchintachi/current` | Link to the release that is running |
| `/var/lib/ruchintachi/ruchintachi.db` | The database (`DATABASE_PATH`) |
| `/var/backups/ruchintachi/` | Gzipped backups |
| `/etc/ruchintachi.env` | App environment (port, paths, backup count) |
| `/etc/ruchintachi-deploy.env` | `GH_TOKEN` for downloading builds, root-only |
| `/etc/default/caddy` | `SITE_ADDRESS` for the Caddyfile |

## Our VM

| | |
| --- | --- |
| Name / resource group | `vm-ruchintachi` / `VM-RUCHINTACHI_GROUP` (created in the portal) |
| Size / region | `Standard_B2ats_v2` (1 GiB) / North Central US |
| Address | `ruchintachi.northcentralus.cloudapp.azure.com` (`64.236.205.109`) |
| Login | `ssh -i .ssh/ruchintachi_key.pem azureuser@ruchintachi.northcentralus.cloudapp.azure.com` |
| Firewall | 80/443 open; 22 only from your IP (rule `SSH` in `vm-ruchintachi-nsg`) |

If your IP changes and SSH times out:

```bash
az network nsg rule update -g VM-RUCHINTACHI_GROUP --nsg-name vm-ruchintachi-nsg -n SSH --source-address-prefixes "$(curl -fsS https://api.ipify.org)/32"
```

Stop / start the VM to save credit:

```bash
az vm deallocate -g VM-RUCHINTACHI_GROUP -n vm-ruchintachi
az vm start -g VM-RUCHINTACHI_GROUP -n vm-ruchintachi
```

## 1. Set up the server (once)

From the project folder, copy `deploy/` to the VM and log in:

```bash
scp -i .ssh/ruchintachi_key.pem -r deploy azureuser@ruchintachi.northcentralus.cloudapp.azure.com:
ssh -i .ssh/ruchintachi_key.pem azureuser@ruchintachi.northcentralus.cloudapp.azure.com
```

On the VM:

```bash
sudo SITE_ADDRESS=ruchintachi.northcentralus.cloudapp.azure.com bash deploy/setup-server.sh
```

The script is safe to re-run; run it again after changing a unit file or the
Caddyfile. It also turns off SSH password login and enables `ufw` with only
SSH, 80 and 443 open.

## 2. Give the VM a read-only GitHub token (once)

The repo is private, so the VM needs a token to download builds.

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
2. Repository access: only `mayxbui/ruchintachi`. Permissions: **Contents: Read-only**. Pick an expiry you'll remember.
3. On the VM: `sudo nano /etc/ruchintachi-deploy.env` and paste it after `GH_TOKEN=`.

When the token expires, make a new one and replace it the same way.

## 3. Deploy (#22)

Merge to `main` and wait for the **Build release** workflow (Actions tab) to
finish. Then on the VM:

```bash
sudo ruchintachi-deploy
```

It downloads `deploy-latest`, unpacks it to `releases/<commit>`, backs up the
database, points `current` at the new release, restarts the app and waits for
it to answer. If it doesn't, it prints the logs and switches back to the
previous release. A migration that already ran is not undone: restore the
backup it just took (below) if the old release can't work with the new schema.

To build without pushing, run the workflow by hand: Actions → Build release →
Run workflow.

## HTTPS (#21)

Caddy gets and renews the certificate on its own once DNS points at the VM and
80/443 are open. The Azure DNS name works out of the box. For your own domain,
add an `A` record for the VM's public IP, set `SITE_ADDRESS` in
`/etc/default/caddy`, and `sudo systemctl restart caddy`.

## Backups (#23)

`ruchintachi-backup.timer` runs at 03:30 UTC, and every deploy takes one too.
It uses SQLite's online `.backup` (safe while the app runs), checks the copy's
integrity, gzips it, and keeps the newest `BACKUP_KEEP` (default 14) files.
Change the count in `/etc/ruchintachi.env`.

```bash
systemctl list-timers ruchintachi-backup.timer   # next run
sudo systemctl start ruchintachi-backup.service  # back up now
ls -lh /var/backups/ruchintachi
```

Restore:

```bash
sudo systemctl stop ruchintachi
sudo rm -f /var/lib/ruchintachi/ruchintachi.db-wal /var/lib/ruchintachi/ruchintachi.db-shm
gunzip -c /var/backups/ruchintachi/ruchintachi-<stamp>.db.gz | sudo -u ruchintachi tee /var/lib/ruchintachi/ruchintachi.db >/dev/null
sudo systemctl start ruchintachi
```

Backups live on the same disk as the database. To survive losing the VM, copy
them off now and then. The backup folder is only readable by the app user, so
copy them to your home folder on the VM first:

```bash
sudo install -o azureuser -m 600 /var/backups/ruchintachi/*.gz ~/   # on the VM
scp -i .ssh/ruchintachi_key.pem "azureuser@ruchintachi.northcentralus.cloudapp.azure.com:~/*.gz" .   # on your PC
```

## Troubleshooting

```bash
journalctl -u ruchintachi -f      # app logs
journalctl -u caddy -f            # proxy / certificate logs
systemctl status ruchintachi
ls -l /opt/ruchintachi/current    # which release is running
```
