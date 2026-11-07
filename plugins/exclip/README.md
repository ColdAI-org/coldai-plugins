![ExClip mark](assets/icon.svg)

# ExClip

Launch your own DEX on [ExClip](https://github.com/ColdAI-org/exclip), the open-source front end for SODAX cross-chain
swaps, under your name, logo, colours and domains, with ColdAI's fee. The plugin has one skill, `launch-dex`. It builds
on the task "Make this my own DEX" in ExClip's `AGENTS.md`, and like that task it changes settings, not code.

## The fee

- **ColdAI's fee: 0.875 % of the amount sold on every swap**, paid straight to ColdAI LLC's address. Swaps with a
  tokenised stock on either side carry no fee.
- **Your DEX charges no fee of its own.** This plugin sets ColdAI's fee and no other.
- **Your traders see the fee** on every swap's review, named with its rate, before they confirm.

Before it changes anything, the skill states the fee and asks:

> Do you agree to ColdAI's fee of 0.875 %? Please answer yes or no.

Only a clear yes goes on. On a no, nothing is changed, and the skill points to the task "Make this my own DEX" in
ExClip's `AGENTS.md`, which makes a DEX without ColdAI's fee.

The fee is ExClip's plain fee rate, 875 per 100,000 of the amount sold. It's paid in the token sold (for a swap from
another chain, its hub asset on Sonic) to ColdAI's address on Sonic, `0x90291104f2D1ef9Ffe2Bc1635A3a270A09C8f313`.
[`platform.json`](platform.json) holds these settings and the ExClip commit the skill checks out.

## What it needs

- A coding agent that runs commands in a terminal, such as Claude Code, Codex or Cowork. In a chat without a terminal,
  such as claude.ai, the skill can explain the steps but not run them.
- Git, Node 24 (ExClip's `.nvmrc`), and pnpm 12.6.0 through Corepack.
- Your DEX's name, its operator's name, a logo file you own and a colour. If you have them, two domains (one for the
  app, one for the wallet) and the addresses of your terms of use and privacy notice.

## Install

In Claude Code, one line adds the marketplace and installs the plugin:

```sh
/plugin install exclip --marketplace ColdAI-org/coldai-plugins
```

From a terminal: `claude plugin install exclip --marketplace ColdAI-org/coldai-plugins`. The
[repository's README](https://github.com/ColdAI-org/coldai-plugins#install-with-claude-code) covers Codex.

## What it runs, fetches and sends

The skill tells your coding agent what to do, and the agent runs the commands on your computer. In order:

1. It reads [`platform.json`](platform.json) in this plugin, states the fee and asks for a yes. Nothing else happens
   before that yes.
2. It clones ExClip from GitHub and checks out the commit in `platform.json`:
   `git clone https://github.com/ColdAI-org/exclip`, then `git checkout` and `git rev-parse HEAD`.
3. It runs `corepack enable` and `pnpm install`, which download pnpm and ExClip's packages from the npm registry.
4. It writes your settings in the clone: `exclip.config.ts`, your logo, ColdAI's address in
   `apps/wallet/fee-receivers.json` (the passkey wallet's fee allow-list), and the two tests that expect that address.
5. It runs ExClip's checks: `pnpm run contrast`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm run docs:links`
   (which checks links without fetching them), `NODE_OPTIONS=--max-old-space-size=6144 pnpm build` and
   `pnpm run screenshots --brand`. The screenshots need Google Chrome or Chromium. If neither is installed,
   `pnpm exec playwright install chromium` downloads Chromium from Playwright's servers.
6. It starts `pnpm dev` on your computer, reads `http://localhost:5173/api/exclip/config` to check the fee setting,
   and stops it. While it runs, ExClip's server may contact the services in ExClip's
   [architecture notes](https://github.com/ColdAI-org/exclip/blob/main/docs/architecture.md#how-the-parts-talk), such
   as CoinGecko.
7. It tells you what it changed and what each check said, and lists what's left before your DEX goes live: running
   it, legal pages and review, tokenised stocks, the wallet's release, and a first small swap.

It never asks for, reads or stores a private key, a recovery phrase or an API key, and it makes no commits unless you
ask. Once your DEX is live, it uses those same services, and each fee is paid on-chain, in public, to ColdAI's
address on Sonic.

## What the plugin sends to ColdAI

Nothing. The plugin is instructions for your coding agent, plus one settings file. It has no server and no telemetry,
and ColdAI collects no data through it. The fee on your DEX's swaps is the only thing that goes to ColdAI.

## Example prompts

- Launch my own DEX on ExClip.
- Set up a swap site with ExClip called Acme Swap, run by Acme Ltd, with a teal accent.
- Start a DEX with ColdAI on my domains: https://swap.acme.example for the app, https://wallet.acme.example for the
  wallet.

## Not audited

No outside party has audited ExClip or this plugin. ExClip has no test-network mode: every swap is real. The skill is
instructions to a coding agent, and agents make mistakes: review what yours changed before you build, and again
before anything goes live.

## Support

Contact ColdAI at [coldai.org/contact](https://coldai.org/contact), or open an issue at
[github.com/ColdAI-org/coldai-plugins/issues](https://github.com/ColdAI-org/coldai-plugins/issues). Report a
vulnerability privately, as
[SECURITY.md](https://github.com/ColdAI-org/coldai-plugins/blob/main/SECURITY.md) says.

## Privacy

The plugin's privacy policy is
[PRIVACY.md](https://github.com/ColdAI-org/coldai-plugins/blob/main/PRIVACY.md).

## Licence

This plugin is licensed under the [Apache License 2.0](LICENSE), © 2026 ColdAI LLC. "ExClip" and the ExClip mark are
ColdAI trademarks and aren't licensed under it: section 6 of the licence grants no trademark rights.
