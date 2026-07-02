#!/usr/bin/env bash
set -euo pipefail

# Linux/macOS E2E entry.
# Default with no args:
#   ./sbin/start.sh  => all-models-full direct report
# Examples:
#   ./sbin/start.sh tree-login direct
#   ./sbin/start.sh table-login direct
#   ./sbin/start.sh tree-dashboard direct headed
#   ./sbin/start.sh table-dashboard direct headed
#   ./sbin/start.sh tree-full direct
#   ./sbin/start.sh table-full direct
#   ./sbin/start.sh all-models-full direct
#   ./sbin/start.sh all-models-full direct headed
#   ./sbin/start.sh all-models-full direct report
#   ./sbin/start.sh all-models-full dev
#   ./sbin/start.sh all-models-full dev headed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

if [ "$#" -eq 0 ]; then
  node tests/e2e/scripts/run-e2e-entry.mjs all-models-full direct report
else
  node tests/e2e/scripts/run-e2e-entry.mjs "$@"
fi
