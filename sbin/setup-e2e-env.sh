#!/usr/bin/env bash
set -euo pipefail

# Linux/macOS one-click E2E environment setup.
# Examples:
#   ./sbin/setup-e2e-env.sh
#   ./sbin/setup-e2e-env.sh --download-only
#   ./sbin/setup-e2e-env.sh --no-start

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

node tests/e2e/scripts/setup-e2e-env.mjs "$@"
