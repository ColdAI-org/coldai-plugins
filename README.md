# ColdAI plugins

ColdAI's plugins for coding agents. One marketplace, `coldai`, works in Claude Code and in Codex, and both read the
same skill files.

| Plugin | Skill | What it does |
| --- | --- | --- |
| `exclip` | `launch-dex` | Launches your own DEX on [ExClip](https://github.com/ColdAI-org/exclip), with ColdAI's fee |
| `clip-wallet` | `launch-wallet` | Launches your own wallet with the [Clip Wallet](https://github.com/ColdAI-org/clip-wallet) kit |

## The fee

**A DEX launched with `launch-dex` pays ColdAI LLC 0.875 % of the amount sold on every swap**, except swaps with a
tokenised stock on either side, which carry no fee. It's ExClip's plain fee rate, paid straight to ColdAI's address.
The DEX charges no fee of its own.

- **Stated first.** Before it asks anything else or changes any file, the skill states the fee and asks for a clear
  yes. On a no, it changes nothing, and points to the task "Make this my own DEX" in ExClip's `AGENTS.md`, which makes
  a DEX without ColdAI's fee. ExClip is open source under the Apache-2.0 licence.
- **Shown to traders.** Every swap's review names the fee with its rate: in ExClip's app, the row
  "ColdAI fee (0.875%)", and in its passkey wallet, a line such as `8.75 USDC · 0.875% to ColdAI · network …`
  ([ExClip's fee rate](https://github.com/ColdAI-org/exclip/blob/main/docs/fees.md#a-fee-rate)).
- **Fixed in the plugin.** ColdAI's settings are in [`plugins/exclip/platform.json`](plugins/exclip/platform.json):
  its address on Sonic, `0x90291104f2D1ef9Ffe2Bc1635A3a270A09C8f313`; the name the review gives it, `ColdAI`; its
  rate, 875 per 100,000 of the amount sold; and no fee on swaps with a tokenised stock. CI checks them. The skill sets
  that fee and no other: no fee of the DEX's own, no fee split and no second receiver.

## Not audited

Nothing here has had an external audit: not these plugins, not ExClip, and not Clip Wallet. A DEX launched from
ExClip trades on live networks only, so every swap is real. Clip Wallet is pre-release and runs on test networks
only. The skills are instructions to a coding agent, and agents make mistakes: review what yours changed before you
build, and again before anything goes live.

## Install with Claude Code

Add the marketplace, then install the plugins you want
([plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)):

```sh
claude plugin marketplace add ColdAI-org/coldai-plugins
claude plugin install exclip@coldai
claude plugin install clip-wallet@coldai
```

In a session, `/plugin marketplace add ColdAI-org/coldai-plugins` and `/plugin install exclip@coldai` do the same.
Then ask for what you want, such as "launch a DEX", or run a skill by name: `/exclip:launch-dex` or
`/clip-wallet:launch-wallet`.

## Install with Codex

Add the marketplace ([plugins](https://developers.openai.com/plugins/build/plugins)):

```sh
codex plugin marketplace add ColdAI-org/coldai-plugins
```

Then install `exclip` or `clip-wallet` from the plugin directory in the Codex app.

Without plugins, copy the skills into `~/.agents/skills/` ([skills](https://learn.chatgpt.com/docs/build-skills.md)).
`launch-dex` needs `platform.json` next to its `SKILL.md`:

```sh
git clone https://github.com/ColdAI-org/coldai-plugins
mkdir -p ~/.agents/skills
cp -R coldai-plugins/plugins/exclip/skills/launch-dex coldai-plugins/plugins/clip-wallet/skills/launch-wallet ~/.agents/skills/
cp coldai-plugins/plugins/exclip/platform.json ~/.agents/skills/launch-dex/
```

## What the skills do

### launch-dex

It builds on the task "Make this my own DEX" in ExClip's
[`AGENTS.md`](https://github.com/ColdAI-org/exclip/blob/main/AGENTS.md):

1. It states the fee and asks for a yes. Nothing changes before that.
2. It clones ExClip and checks out the commit in `platform.json`.
3. It asks for the DEX's name, operator, logo, colour, the domains for the app and the wallet, and the terms and
   privacy pages. It doesn't ask for a fee or a payout address.
4. It writes the settings: `exclip.config.ts`, with ColdAI's fee as ExClip's plain fee rate; ColdAI's address in
   `apps/wallet/fee-receivers.json`, the passkey wallet's fee allow-list; and the two tests that pin that file.
5. It runs ExClip's checks, including the build's config check, and checks the fee in `/api/exclip/config`.
6. It hands back a checklist for going live: what running the DEX takes (a server, a database, two web addresses and
   a SODAX key); that nothing is audited; tokenised stocks, which are off by default and the operator's
   responsibility if they switch them on; a wallet release built from the same config; and the fee once more, as
   traders will see it.

### launch-wallet

It wraps
[`create-clip-wallet`](https://github.com/ColdAI-org/clip-wallet/tree/main/packages/create-clip-wallet), the Clip
Wallet kit's starter:

1. It says that Clip Wallet is pre-release, runs on test networks only and has had no external audit.
2. It asks for the wallet's name, reverse-DNS id, logo, accent colour and platforms (browser extension, desktop app,
   phone app), the network families you pick, the languages and the homepage.
3. It checks on the npm registry that `create-clip-wallet` 0.2.1 is the kit's own package, built and published from
   Clip Wallet's repository with npm provenance, then runs the kit's documented
   `npx create-clip-wallet@0.2.1 … --yes`. It runs no other version.
4. It runs the new project's checks, then `pnpm verify:provenance`, which checks every kit package's provenance
   attestation.
5. It points to each platform's dev command, and to what's left before shipping.

## Directory listings

Each plugin folder holds what Anthropic's and OpenAI's plugin directories ask for, next to its skills:

- a README for the plugin's page: what it does and needs, what it runs, fetches and sends, example prompts, support,
  privacy and licence ([exclip](plugins/exclip/README.md), [clip-wallet](plugins/clip-wallet/README.md));
- `LICENSE`, a copy of this repository's licence, and the plugin's icon, in `assets/`;
- `.claude-plugin/plugin.json`, the manifest for Claude Code and Anthropic's directory, and `plugin.json`, the portable
  Agent Plugins manifest for Codex and OpenAI's directory, with OpenAI's listing under
  `extensions."com.openai".interface`.

Both plugins send nothing to ColdAI and collect no data; [PRIVACY.md](PRIVACY.md) is their privacy policy.

For Anthropic's directory (claude.ai/directory/manage), submit a plugin bundle from this repository with the paths
`plugins/exclip` and `plugins/clip-wallet`.

For OpenAI's directory, which ChatGPT and Codex share, commit first, then run
[`bash scripts/pack-openai.sh`](scripts/pack-openai.sh). It packs each committed plugin folder as
`dist/<name>-<version>.zip`, with `plugin.json` at the ZIP's root, lists each ZIP, and checks that it holds
`plugin.json`, `skills/`, the icon, the README and the licence. Submit one ZIP per plugin.

## Maintaining

```text
.claude-plugin/marketplace.json     the marketplace, for Claude Code
.agents/plugins/marketplace.json    the marketplace, for Codex
plugins/<name>/.claude-plugin/plugin.json   each plugin's manifest, for Claude Code and Anthropic's plugin directory
plugins/<name>/plugin.json          each plugin's manifest, for Codex and OpenAI's plugin directory
plugins/<name>/skills/<skill>/SKILL.md      the skills, for both
plugins/<name>/README.md            each plugin's page in the directories
plugins/<name>/LICENSE              a copy of LICENSE, for each plugin on its own
plugins/<name>/assets/              each plugin's icon
plugins/exclip/platform.json        ColdAI's fee settings and the ExClip commit
PRIVACY.md                          the plugins' privacy policy
scripts/                            the checks CI runs, and the OpenAI packer
```

A plugin's name is the same in all four places: both marketplaces and both of its manifests. Both manifests have the
same version, description, author, homepage, repository, licence and keywords, and the same display name:
`displayName` in `.claude-plugin/plugin.json`, and in OpenAI's listing in `plugin.json`. A plugin's `LICENSE` is a
copy of the root `LICENSE`, byte for byte.

### Bump the ExClip commit

`exclipCommit` in `platform.json` is the ExClip commit `launch-dex` checks out. To move it:

1. Read the new commit's `AGENTS.md` ("Make this my own DEX"), `docs/fees.md` ("A fee rate") and
   `docs/configuration.md`, and change `launch-dex` wherever they changed.
2. Run `launch-dex` end to end on the new commit, on a test copy.
3. Set `exclipCommit` to the new commit's full hash, raise the `exclip` plugin's version in both of its manifests, and
   add the change to `CHANGELOG.md`.

### Checks

[`.github/workflows/validate.yml`](.github/workflows/validate.yml) runs on every push to `main` and every pull
request:

- `claude plugin validate` on the marketplace, and `claude plugin validate --strict` on each plugin, with the Claude
  Code CLI pinned to one version;
- [`scripts/check-manifests.sh`](scripts/check-manifests.sh): the Codex marketplace's fields and paths, that each
  plugin's name agrees in both marketplaces and both manifests, each skill's frontmatter, that the `exclip` plugin
  states ColdAI's fee wherever it describes itself and in the fee's fixed words in its skill, its README and its
  OpenAI listing, and that no description, listing text, `launch-dex`'s skill, README or `PRIVACY.md` describes a fee
  split;
- [`scripts/check-platform.mjs`](scripts/check-platform.mjs): that `platform.json` has exactly its six keys, with
  ColdAI's address in EIP-55 form, its name, the rate 875, no fee on stock swaps, and a full ExClip commit;
- [`scripts/check-listing.mjs`](scripts/check-listing.mjs): each plugin's directory listing. Its `plugin.json` has the
  portable schema's keys, OpenAI's listing within its limits, three different example prompts, `https://` links and
  a brand colour with at least 2:1 contrast against white, and the same shared fields and display name as its
  `.claude-plugin/plugin.json`. Its icon is a square SVG of at least 48 px. Its README has at least 40 words, the
  listing's prompts first under "Example prompts", the support and privacy links, and the icon only as a Markdown
  image. Its `LICENSE` is the root's. No file under `plugins/` is a link or a system file, images are SVG or PNG,
  other files are under 256 KiB, and every package launcher names one exact version.

Locally: `claude plugin validate .`, `claude plugin validate --strict ./plugins/<name>`,
`bash scripts/check-manifests.sh` (needs `jq`), `node scripts/check-platform.mjs` and
`node scripts/check-listing.mjs`.

## Security

Report a vulnerability privately, as [SECURITY.md](SECURITY.md) says.

## Licence

These plugins are licensed under the [Apache License 2.0](LICENSE), © 2026 ColdAI LLC. "ExClip", "Clip Wallet" and
their marks are ColdAI trademarks and aren't licensed under it: section 6 of the licence grants no trademark rights.
