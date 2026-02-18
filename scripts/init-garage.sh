#!/bin/sh

set -eu

S3_ACCESS_KEY="${S3_ACCESS_KEY:-GK000000000000000000000000}"
S3_SECRET_KEY="${S3_SECRET_KEY:-0000000000000000000000000000000000000000000000000000000000000000}"
S3_BUCKET="${S3_BUCKET:-images}"
GARAGE_ZONE="${GARAGE_ZONE:-local}"
GARAGE_CAPACITY="${GARAGE_CAPACITY:-1G}"
GARAGE_KEY_NAME="${GARAGE_KEY_NAME:-resize-it}"

echo "Waiting for Garage to become ready..."
until garage -c /etc/garage.toml status >/dev/null 2>&1; do
  sleep 1
done

NODE_ID="$(garage -c /etc/garage.toml node id -q | cut -d'@' -f1)"

echo "Assigning node layout..."
garage -c /etc/garage.toml layout assign -z "${GARAGE_ZONE}" -c "${GARAGE_CAPACITY}" "${NODE_ID}" >/dev/null 2>&1 || true
garage -c /etc/garage.toml layout apply --version 1 >/dev/null 2>&1 || true

echo "Waiting for layout to become ready..."
for _ in $(seq 1 30); do
  if garage -c /etc/garage.toml bucket list >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Ensuring bucket exists..."
garage -c /etc/garage.toml bucket info "${S3_BUCKET}" >/dev/null 2>&1 || garage -c /etc/garage.toml bucket create "${S3_BUCKET}"

echo "Ensuring access key exists..."
garage -c /etc/garage.toml key info "${S3_ACCESS_KEY}" >/dev/null 2>&1 || garage -c /etc/garage.toml key import "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" -n "${GARAGE_KEY_NAME}" --yes

echo "Ensuring bucket permissions..."
garage -c /etc/garage.toml bucket allow --read --write --owner "${S3_BUCKET}" --key "${S3_ACCESS_KEY}"

echo "Garage initialization complete."
