# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- The `coldai` plugin marketplace, for Claude Code (`.claude-plugin/marketplace.json`) and for Codex
  (`.agents/plugins/marketplace.json`). Both serve the same skill files.
- The `exclip` plugin, with the skill `launch-dex`: launch your own DEX on ExClip, with ColdAI's fee of 0.875 % of the
  amount sold on every swap except swaps with a tokenised stock on either side, which carry no fee. The fee is
  ExClip's plain fee rate, 875 per 100,000 of the amount sold, paid straight to ColdAI's address, and the DEX charges
  no fee of its own. Traders see the fee on every swap's review. The skill states the fee and waits for a clear yes
  before it changes anything. `plugins/exclip/platform.json` holds the address, the name the review gives it, the
  rate, the fee on stock swaps (0) and the ExClip commit the skill checks out, `46ff2be`
  (`46ff2beb0ca0c4500cff133c023e79411c0a52cc`).
- The `clip-wallet` plugin, with the skill `launch-wallet`: make your own wallet with the Clip Wallet kit's
  `create-clip-wallet`. Pre-release: test networks only, and no external audit. The skill runs `create-clip-wallet`
  0.2.1 and no other version: it first checks on the npm registry that the package is the kit's own, built and
  published from Clip Wallet's repository with npm provenance, and stops if it isn't. After the build, the project's
  `pnpm verify:provenance` checks every kit package's provenance attestation.
- Listings for Anthropic's and OpenAI's plugin directories. Each plugin folder has a README (what the plugin does and
  needs, what it runs, fetches and sends, example prompts, support, privacy and licence), a copy of the licence, and
  its icon. Each `.claude-plugin/plugin.json` adds `displayName`, `homepage`, `repository` and `author.url`. Each
  `plugin.json` follows the portable Agent Plugins schema, with OpenAI's listing under
  `extensions."com.openai".interface`. `PRIVACY.md` is the plugins' privacy policy: they send nothing to ColdAI and
  collect no data.
- CI: `claude plugin validate` for the marketplace and each plugin, the Codex marketplace's fields and paths, the
  plugins' names, and ColdAI's fee settings.
