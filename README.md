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

## Maintaining

```text
.claude-plugin/marketplace.json     the marketplace, for Claude Code
.agents/plugins/marketplace.json    the marketplace, for Codex
plugins/<name>/.claude-plugin/plugin.json   each plugin's manifest, for Claude Code
plugins/<name>/plugin.json          each plugin's manifest, for Codex
plugins/<name>/skills/<skill>/SKILL.md      the skills, for both
plugins/exclip/platform.json        ColdAI's fee settings and the ExClip commit
scripts/                            the checks CI runs
```

A plugin's name is the same in all four places: both marketplaces and both of its manifests. Its version is in both
manifests.

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

- `claude plugin validate` on the marketplace and on each plugin, with the Claude Code CLI pinned to one version;
- [`scripts/check-manifests.sh`](scripts/check-manifests.sh): the Codex marketplace's fields and paths, that each
  plugin's name agrees in both marketplaces and both manifests, each skill's frontmatter, that the `exclip` plugin
  states ColdAI's fee wherever it describes itself and in the skill's fixed words, and that no description,
  `launch-dex`'s skill or this README describes a fee split;
- [`scripts/check-platform.mjs`](scripts/check-platform.mjs): that `platform.json` has exactly its six keys, with
  ColdAI's address in EIP-55 form, its name, the rate 875, no fee on stock swaps, and a full ExClip commit.

Locally: `claude plugin validate .`, `bash scripts/check-manifests.sh` (needs `jq`) and
`node scripts/check-platform.mjs`.

## Security

Report a vulnerability privately, as [SECURITY.md](SECURITY.md) says.

## Licence

These plugins are licensed under the [Apache License 2.0](LICENSE), © 2026 ColdAI LLC.
