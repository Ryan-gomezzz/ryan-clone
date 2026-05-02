#!/usr/bin/env bash
#
# Nightly Postgres backup. Cron with:
#   0 3 * * * /opt/ryan-clone/infra/backup.sh >> /var/log/ryan-backup.log 2>&1
#
# Pushes the dump to a Hetzner Storage Box via SCP. Configure SBOX_* vars below.

set -euo pipefail

DATE=$(date -u +%Y-%m-%dT%H-%M-%SZ)
TMP=/tmp/ryan-clone-${DATE}.sql.gz

SBOX_USER="${SBOX_USER:-}"
SBOX_HOST="${SBOX_HOST:-}"
SBOX_PATH="${SBOX_PATH:-/backups/ryan-clone}"

cd /opt/ryan-clone/infra

docker compose exec -T postgres \
    pg_dump -U ryan -d ryanclone --no-owner --clean --if-exists \
    | gzip -9 > "$TMP"

if [ -n "$SBOX_USER" ] && [ -n "$SBOX_HOST" ]; then
    scp -o StrictHostKeyChecking=accept-new "$TMP" \
        "${SBOX_USER}@${SBOX_HOST}:${SBOX_PATH}/"
    rm -f "$TMP"
    echo "[backup] uploaded ryan-clone-${DATE}.sql.gz"
else
    echo "[backup] storage box unset — kept dump at $TMP"
fi

# Local 7-day retention
find /tmp -maxdepth 1 -name 'ryan-clone-*.sql.gz' -mtime +7 -delete || true
