#!/usr/bin/env bash
# Submit a manifest to the CertifiedData certification endpoint.
#
# Usage:
#   CERTIFIEDDATA_API_KEY=<key> ./scripts/submit.sh examples/single-dataset.json
#
# Defaults to production; override with CERTIFIEDDATA_BASE_URL for staging.

set -euo pipefail

MANIFEST="${1:-}"
if [[ -z "${MANIFEST}" ]]; then
  echo "usage: submit.sh <manifest.json>" >&2
  exit 2
fi

if [[ ! -f "${MANIFEST}" ]]; then
  echo "manifest file not found: ${MANIFEST}" >&2
  exit 1
fi

: "${CERTIFIEDDATA_API_KEY:?set CERTIFIEDDATA_API_KEY to a free-tier or paid API key}"
BASE="${CERTIFIEDDATA_BASE_URL:-https://certifieddata.io}"

curl -sS -X POST "${BASE%/}/api/manifest/certify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${CERTIFIEDDATA_API_KEY}" \
  --data-binary "@${MANIFEST}" \
  --fail-with-body
