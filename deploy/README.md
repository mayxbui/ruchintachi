# Deploying Ruchintachi

One small Azure VM runs everything: Caddy terminates HTTPS and proxies to the
Next.js app on `127.0.0.1:3000`, systemd keeps the app running, and a systemd
timer backs up the SQLite file every night. Everything here is free-tier or
free software.

| File | Purpose | Issue |
| --- | --- | --- |
| `provision-vm.sh` | Create the VM, public IP + DNS name, network rules (run locally) | #20 |
| `setup-server.sh` | One-time server setup: Node LTS, pnpm, Caddy, ufw, users, units | #20–#23 |
| `Caddyfile` | Reverse proxy with automatic Let's Encrypt certificates | #21 |
| `ruchintachi.service` | Runs the app; starts on boot, restarts on crash | #22 |
| `deploy.sh` | Pull, install, migrate, build, restart | #22 |
| `backup-db.sh`, `ruchintachi-backup.{service,timer}` | Nightly SQLite backup, keeps the last N | #23 |

## Layout on the server

| Path | What |
| --- | --- |
| `/opt/ruchintachi` | Git checkout, owned by the `ruchintachi` system user |
| `/var/lib/ruchintachi/ruchintachi.db` | The database (`DATABASE_PATH`) |
| `/var/backups/ruchintachi/` | Gzipped backups |
| `/etc/ruchintachi.env` | Environment (port, paths, backup count). Not in git. |
| `/etc/default/caddy` | `SITE_ADDRESS` for the Caddyfile |

## 1. Create the VM (#20)

Needs the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) and an SSH key.

```bash
az login
DNS_LABEL=ruchintachi bash deploy/provision-vm.sh
```

Optional overrides: `RESOURCE_GROUP`, `LOCATION` (default `eastus`), `VM_NAME`,
`VM_SIZE` (default `Standard_B1s`, covered by the free account for 12 months),
`ADMIN_USER`, `SSH_KEY`, `MY_IP`.

The network security group allows 80/443 from anywhere and SSH (22) only from
the IP you ran the script from. If your IP changes, update the `allow-ssh-me`
rule in the portal or with `az network nsg rule update`.

## 2. Set up the server

```bash
scp deploy/setup-server.sh azureuser@<fqdn>:
ssh azureuser@<fqdn>
```

The repo is private, so give the app user a read-only deploy key first:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin ruchintachi
sudo -u ruchintachi mkdir -p -m 700 /home/ruchintachi/.ssh
sudo -u ruchintachi ssh-keygen -t ed25519 -N "" -f /home/ruchintachi/.ssh/id_ed25519
sudo cat /home/ruchintachi/.ssh/id_ed25519.pub
sudo -u ruchintachi ssh -o StrictHostKeyChecking=accept-new -T git@github.com
```

Add the printed key under GitHub → repo → Settings → Deploy keys (read-only).
The `ssh -T` line records GitHub's host key; "successfully authenticated" means it worked.
Then:

```bash
sudo SITE_ADDRESS=<fqdn-or-domain> bash setup-server.sh
```

The script is safe to re-run. It also turns off SSH password login and enables
`ufw` with only SSH, 80 and 443 open.

## 3. Deploy (#22)

```bash
sudo bash /opt/ruchintachi/deploy/deploy.sh          # main
sudo bash /opt/ruchintachi/deploy/deploy.sh my-branch
```

It backs up the database, resets the checkout to `origin/<branch>`, runs
`pnpm install --frozen-lockfile`, `pnpm db:migrate`, `pnpm build`, restarts the
service and prints a health check.

If you change a unit file or the Caddyfile, re-run `setup-server.sh` (it
reinstalls them) or copy them to `/etc/systemd/system` / `/etc/caddy` and run
`sudo systemctl daemon-reload && sudo systemctl restart ruchintachi caddy`.

## HTTPS (#21)

Caddy gets and renews the certificate on its own once DNS points at the VM and
80/443 are open. The Azure DNS name (`<label>.<region>.cloudapp.azure.com`)
works out of the box. For your own domain, add an `A` record for the VM's public
IP, set `SITE_ADDRESS` in `/etc/default/caddy`, and `sudo systemctl restart caddy`.

## Backups (#23)

`ruchintachi-backup.timer` runs at 03:30 UTC. It uses SQLite's online
`.backup` (safe while the app runs), checks the copy's integrity, gzips it, and
keeps the newest `BACKUP_KEEP` (default 14) files. Change the count in
`/etc/ruchintachi.env`.

```bash
systemctl list-timers ruchintachi-backup.timer   # next run
sudo systemctl start ruchintachi-backup.service  # back up now
ls -lh /var/backups/ruchintachi
```

Restore:

```bash
sudo systemctl stop ruchintachi
gunzip -c /var/backups/ruchintachi/ruchintachi-<stamp>.db.gz | sudo -u ruchintachi tee /var/lib/ruchintachi/ruchintachi.db >/dev/null
sudo rm -f /var/lib/ruchintachi/ruchintachi.db-wal /var/lib/ruchintachi/ruchintachi.db-shm
sudo systemctl start ruchintachi
```

Backups live on the same disk as the database. To survive losing the VM, copy
them off now and then, e.g. `scp azureuser@<fqdn>:/var/backups/ruchintachi/*.gz .`.

## Troubleshooting

```bash
journalctl -u ruchintachi -f      # app logs
journalctl -u caddy -f            # proxy / certificate logs
systemctl status ruchintachi
```
