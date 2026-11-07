#!/usr/bin/env bash
# Packs each plugin for OpenAI's plugin directory: one ZIP per plugin, of the committed plugins/<name> folder, with
# plugin.json at the ZIP's root. Then it lists each ZIP and checks that it holds what the listing needs. It packs HEAD,
# so commit first. Needs git, jq and unzip. Run from anywhere: bash scripts/pack-openai.sh
set -euo pipefail

cd "$(dirname "$0")/.."

# What every ZIP must hold. A name that ends in / is a folder, which must hold at least one file.
REQUIRED=(plugin.json skills/ assets/icon.svg README.md LICENSE)
failed=0

fail() {
  echo "error: $1: $2" >&2
  failed=1
}

if ! git diff --quiet HEAD -- plugins || [ -n "$(git ls-files --others --exclude-standard plugins)" ]; then
  echo "warning: plugins/ has changes that aren't committed: the ZIPs hold HEAD, without them" >&2
fi

mkdir -p dist
zips=()
for name in $(git ls-tree -d --name-only HEAD:plugins); do
  if ! manifest=$(git show "HEAD:plugins/$name/plugin.json" 2> /dev/null); then
    fail "plugins/$name" "has no plugin.json in HEAD"
    continue
  fi
  version=$(jq -r '.version // empty' <<< "$manifest")
  if [ -z "$version" ]; then
    fail "plugins/$name/plugin.json" "has no version"
    continue
  fi
  zip=dist/$name-$version.zip
  git archive --format=zip -o "$zip" "HEAD:plugins/$name"
  contents=$(unzip -Z1 "$zip")
  echo "$zip:"
  sed 's/^/  /' <<< "$contents"
  for entry in "${REQUIRED[@]}"; do
    if [[ "$entry" == */ ]]; then
      if ! grep -q "^${entry}.*[^/]$" <<< "$contents"; then fail "$zip" "has no file in $entry"; fi
    elif ! grep -qxF -- "$entry" <<< "$contents"; then
      fail "$zip" "has no $entry"
    fi
  done
  zips+=("$zip")
done

if [ "$failed" -ne 0 ]; then exit 1; fi
echo "Packed for OpenAI's plugin directory: ${zips[*]}, each with plugin.json, skills/, assets/icon.svg, README.md and LICENSE."
