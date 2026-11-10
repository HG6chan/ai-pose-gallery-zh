#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
export NODE_USE_ENV_PROXY=1
exec node scripts/launcher.mjs "$@"
