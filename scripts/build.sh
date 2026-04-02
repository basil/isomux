#!/usr/bin/env bash
set -euo pipefail

# Build main app
bun build ui/index.tsx --outdir ui/dist --production
cp ui/index.html ui/dist/index.html
cp node_modules/@xterm/xterm/css/xterm.css ui/dist/xterm.css
