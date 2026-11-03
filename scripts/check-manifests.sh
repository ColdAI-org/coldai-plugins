#!/usr/bin/env bash
# Checks what `claude plugin validate` doesn't: the Codex marketplace's fields and paths, that each plugin's name
# agrees in both marketplaces and both of its manifests, each skill's frontmatter, that the exclip plugin states
# ColdAI's fee wherever it describes itself, and that no description, launch-dex's skill or the README describes a fee
# split. Needs jq. Run from anywhere: bash scripts/check-manifests.sh
set -euo pipefail

cd "$(dirname "$0")/.."

CLAUDE_MARKETPLACE=.claude-plugin/marketplace.json
CODEX_MARKETPLACE=.agents/plugins/marketplace.json
KEBAB='^[a-z0-9]+(-[a-z0-9]+)*$'
# jq prints one line per problem. Each check's output goes into a variable first, so that a jq error stops the script.
NEED='def need(ok; problem): if ok then empty else problem end;'
failed=0

fail() {
  echo "error: $1: $2" >&2
  failed=1
}

# Reports each line a jq program printed as a problem with the file.
report() {
  local file=$1 line
  while IFS= read -r line; do
    if [ -n "$line" ]; then fail "$file" "$line"; fi
  done <<< "$2"
}

# Everything below reads these files, so each must be valid JSON first.
for file in "$CLAUDE_MARKETPLACE" "$CODEX_MARKETPLACE" plugins/*/.claude-plugin/plugin.json plugins/*/plugin.json; do
  jq empty "$file" 2> /dev/null || fail "$file" "missing, or not valid JSON"
done
if [ "$failed" -ne 0 ]; then exit 1; fi

# The Claude Code marketplace's names and paths. `claude plugin validate` checks the rest of its schema.
problems=$(jq -r --arg kebab "$KEBAB" "$NEED"'
  need(.name == "coldai"; "name must be \"coldai\""),
  need(.owner.name == "ColdAI"; "owner.name must be \"ColdAI\""),
  need((.plugins | type) == "array" and (.plugins | length) > 0; "plugins must be a non-empty array"),
  (.plugins[]? | (.name // "?" | tostring) as $name |
    need((.name | type) == "string" and (.name | test($kebab)); "plugin \($name): name must be kebab-case"),
    need(.source == "./plugins/\($name)"; "plugin \($name): source must be \"./plugins/\($name)\""),
    need((.description | type) == "string" and (.description | length) > 0; "plugin \($name): description is required"))
' "$CLAUDE_MARKETPLACE")
report "$CLAUDE_MARKETPLACE" "$problems"

# The Codex marketplace: its name, and each entry's source, policy and category.
problems=$(jq -r --arg kebab "$KEBAB" "$NEED"'
  need(.name == "coldai"; "name must be \"coldai\""),
  need((.interface.displayName | type) == "string"; "interface.displayName is required"),
  need((.plugins | type) == "array" and (.plugins | length) > 0; "plugins must be a non-empty array"),
  (.plugins[]? | (.name // "?" | tostring) as $name |
    need((.name | type) == "string" and (.name | test($kebab)); "plugin \($name): name must be kebab-case"),
    need(.source.source == "local"; "plugin \($name): source.source must be \"local\""),
    need(.source.path == "./plugins/\($name)"; "plugin \($name): source.path must be \"./plugins/\($name)\""),
    need((.policy.installation | type) == "string"; "plugin \($name): policy.installation is required"),
    need((.policy.authentication | type) == "string"; "plugin \($name): policy.authentication is required"),
    need((.category | type) == "string"; "plugin \($name): category is required"))
' "$CODEX_MARKETPLACE")
report "$CODEX_MARKETPLACE" "$problems"

# Both marketplaces list exactly the folders in plugins/.
folders=$(find plugins -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort)
for marketplace in "$CLAUDE_MARKETPLACE" "$CODEX_MARKETPLACE"; do
  listed=$(jq -r '.plugins[]?.name' "$marketplace" | sort)
  if [ "$listed" != "$folders" ]; then
    fail "$marketplace" "must list exactly the folders in plugins/: $(echo $folders)"
  fi
done

# Each plugin's two manifests: the folder's name, the same version, and a description.
for name in $folders; do
  claude_manifest=plugins/$name/.claude-plugin/plugin.json
  codex_manifest=plugins/$name/plugin.json
  if [ ! -f "$claude_manifest" ] || [ ! -f "$codex_manifest" ]; then
    fail "plugins/$name" "needs both $claude_manifest and $codex_manifest"
    continue
  fi
  for manifest in "$claude_manifest" "$codex_manifest"; do
    problems=$(jq -r --arg name "$name" "$NEED"'
      need(.name == $name; "name must be \"\($name)\", the name of its folder"),
      need((.version | type) == "string" and (.version | test("^[0-9]+\\.[0-9]+\\.[0-9]+$")); "version must be MAJOR.MINOR.PATCH"),
      need((.description | type) == "string" and (.description | length) > 0; "description is required")
    ' "$manifest")
    report "$manifest" "$problems"
  done
  if [ "$(jq -r '.version' "$claude_manifest")" != "$(jq -r '.version' "$codex_manifest")" ]; then
    fail "$codex_manifest" "version must be the same as in $claude_manifest"
  fi
  if ! compgen -G "plugins/$name/skills/*/SKILL.md" > /dev/null; then
    fail "plugins/$name" "has no skills/<skill>/SKILL.md"
  fi
done

# Each skill's frontmatter: the folder's name, and a description of at most 1,024 characters.
for skill in plugins/*/skills/*/SKILL.md; do
  folder=$(basename "$(dirname "$skill")")
  closing=$(awk 'NR > 1 && $0 == "---" { print NR; exit }' "$skill")
  if [ "$(head -n 1 "$skill")" != "---" ] || [ -z "$closing" ]; then
    fail "$skill" "must start with frontmatter between two --- lines"
    continue
  fi
  frontmatter=$(sed -n "2,$((closing - 1))p" "$skill")
  name=$(sed -n 's/^name: *//p' <<< "$frontmatter")
  description=$(sed -n 's/^description: *//p' <<< "$frontmatter")
  if [ "$name" != "$folder" ]; then fail "$skill" "name must be \"$folder\", the name of its folder"; fi
  if [ -z "$description" ]; then fail "$skill" "description is required"; fi
  if [ "${#description}" -gt 1024 ]; then fail "$skill" "description is longer than 1,024 characters"; fi
done

# ColdAI's fee, wherever the exclip plugin describes itself, and the skill's fixed words for it.
descriptions=(
  "$CLAUDE_MARKETPLACE" "$(jq -r '.plugins[]? | select(.name == "exclip") | .description' "$CLAUDE_MARKETPLACE")"
  plugins/exclip/.claude-plugin/plugin.json "$(jq -r '.description' plugins/exclip/.claude-plugin/plugin.json)"
  plugins/exclip/plugin.json "$(jq -r '.description' plugins/exclip/plugin.json)"
)
for ((i = 0; i < ${#descriptions[@]}; i += 2)); do
  if [[ "${descriptions[i + 1]}" != *"0.875 %"* ]]; then
    fail "${descriptions[i]}" "the exclip plugin's description must state ColdAI's fee, 0.875 %"
  fi
done
for words in \
  "**ColdAI's fee: 0.875 % of the amount sold on every swap**" \
  "**Your DEX charges no fee of its own.**" \
  "**Your traders see the fee**" \
  "Do you agree to ColdAI's fee of 0.875 %? Please answer yes or no."; do
  if ! grep -qF -- "$words" plugins/exclip/skills/launch-dex/SKILL.md; then
    fail plugins/exclip/skills/launch-dex/SKILL.md "the fee's fixed words are missing: $words"
  fi
done

# launch-dex charges ColdAI's fee as a plain rate, so a fee split's terms appear nowhere that describes it: not in its
# skill, not in the README, and not in any plugin's or marketplace's description.
split_terms=("1.875" "operatorRate" "FeeSplitterFactory")
for file in plugins/exclip/skills/launch-dex/SKILL.md README.md; do
  for words in "${split_terms[@]}"; do
    if grep -qF -- "$words" "$file"; then
      fail "$file" "mentions $words, a fee split's term: launch-dex charges ColdAI's fee as a plain rate"
    fi
  done
done
for file in "$CLAUDE_MARKETPLACE" "$CODEX_MARKETPLACE" plugins/*/.claude-plugin/plugin.json plugins/*/plugin.json; do
  text=$(jq -r '[.. | objects | .description? | strings] | join("\n")' "$file")
  for words in "${split_terms[@]}"; do
    if [[ "$text" == *"$words"* ]]; then
      fail "$file" "a description mentions $words, a fee split's term: launch-dex charges ColdAI's fee as a plain rate"
    fi
  done
done

if [ "$failed" -ne 0 ]; then exit 1; fi
echo "Manifests: $(echo $folders) agree in both marketplaces and both manifests; skill frontmatter and fee wording in place; no fee split's terms."
