#!/usr/bin/env bash
# Build every participant and assemble the full GitHub Pages site.
# Result goes into $FINAL (a complete, servable site root):
#   - homepage + repo assets copied from the repo root (noise excluded)
#   - participantes/<name>/ replaced with the built output (or static + path rewrite)
set -euo pipefail

FINAL=".gh-pages-site"
rm -rf "$FINAL"
mkdir -p "$FINAL"

# 1. Copy the repo root: homepage, assets, achievements, certificados, prensa,
#    README, .gitignore, etc. Exclude VCS, CI infra, and junk.
rsync -a --exclude='.git' --exclude='.github' --exclude='node_modules' \
  --exclude='.gh-pages-site' --exclude='participantes' \
  --exclude='scripts' \
  --exclude='_p.txt' --exclude='_pos.txt' --exclude='_params.txt' \
  --exclude='motoko_*' \
  ./ "$FINAL/"

# 2. Build / stage each participant into $FINAL/participantes/<name>/.
mkdir -p "$FINAL/participantes"
for dir in participantes/*/; do
  [ -d "$dir" ] || continue
  name="$(basename "$dir")"
  out="$FINAL/participantes/$name"
  mkdir -p "$out"

  if [ -f "$dir/package.json" ] && jq -e '.scripts.build' "$dir/package.json" >/dev/null 2>&1; then
    echo "==> Build: $name"
    pushd "$dir" >/dev/null
    npm ci --no-audit --no-fund --silent
    # --base=./ keeps asset URLs relative so the bundle works from
    # /participantes/<name>/ on GitHub Pages.
    npm run build -- --base=./ --outDir=dist 2>/dev/null || npm run build
    popd >/dev/null
    if [ -d "$dir/dist" ]; then
      cp -r "$dir/dist/." "$out/"
    else
      echo "    WARN: no dist/ produced for $name"
    fi
  elif [ -f "$dir/index.html" ]; then
    echo "==> Static: $name"
    rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' "$dir/" "$out/"
    sed -i -E 's#(href|src)="/#\1="./#g' "$out/index.html"
  else
    echo "==> Skip: $name (no index.html)"
  fi
done

echo "Site staged: $FINAL"
ls "$FINAL"