#!/usr/bin/env bash
set -euo pipefail

# Linux/macOS E2E entry.
# Examples:
#   ./sbin/start.sh tree-full direct
#   ./sbin/start.sh table-full direct
#   ./sbin/start.sh all-models-full direct
#   ./sbin/start.sh all-models-full direct headed
#   ./sbin/start.sh all-models-full direct report
#   ./sbin/start.sh all-models-full-dev dev
#   ./sbin/start.sh all-models-full-dev dev headed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

node tests/e2e/scripts/run-e2e-entry.mjs "$@"
