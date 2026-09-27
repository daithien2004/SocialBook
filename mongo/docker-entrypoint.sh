#!/bin/bash
set -e

# MongoDB yeu cau keyFile khi chay replica set + authorization.
# Keyfile phai nam trong named volume (khong phai bind mount) de giu nguyen
# giua cac lan restart, va phai co quyen 400 nen moi khop.
KEYFILE="${MONGO_KEYFILE:-/data/keyfile/keyfile}"

mkdir -p "$(dirname "$KEYFILE")"

if [ ! -s "$KEYFILE" ]; then
  openssl rand -base64 756 > "$KEYFILE"
fi

chown mongodb:mongodb "$KEYFILE" 2>/dev/null || true
chmod 400 "$KEYFILE"

exec docker-entrypoint.sh "$@"
