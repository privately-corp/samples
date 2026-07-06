#!/usr/bin/env bash
set -euo pipefail

DEMO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$DEMO_ROOT/assets/sdk"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path-to-headless-sdk-dist>"
  echo ""
  echo "Example:"
  echo "  $0 ~/Downloads/faceassure-headless-sdk/dist"
  echo ""
  echo "The directory must contain headless-sdk.js and the required *.wasm files"
  echo "from your licensed FaceAssure Headless SDK package."
  exit 1
fi

SDK_SRC="$(cd "$1" && pwd)"

if [[ ! -f "$SDK_SRC/headless-sdk.js" ]]; then
  echo "Error: headless-sdk.js not found in $SDK_SRC"
  exit 1
fi

mkdir -p "$DEST"

cp "$SDK_SRC/headless-sdk.js" "$DEST/headless-sdk.bundle"
cp "$SDK_SRC/"*.wasm "$DEST/" 2>/dev/null || true

node "$DEMO_ROOT/scripts/generate-sdk-assets.mjs"

echo "SDK assets copied to $DEST"
ls -lh "$DEST"
