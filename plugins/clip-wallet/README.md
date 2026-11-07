![Clip Wallet mark](assets/icon.svg)

# Clip Wallet

> **Pre-release: Clip Wallet runs on test networks only and has had no external audit.**

Launch your own non-custodial wallet with the [Clip Wallet](https://github.com/ColdAI-org/clip-wallet) kit: a browser
extension, a desktop app for macOS, Windows and Linux, and a phone app for iOS and Android, under your own name, ids,
logo and accent colour, for the network families and languages you pick. The plugin has one skill, `launch-wallet`,
which makes the project with the kit's starter, `create-clip-wallet`, and checks it with the project's own checks.

The wallet it makes runs on test networks, and the command has no switch for mainnet: that is your decision, as the
wallet's owner, after the project's `MAINNET.md`. The skill is instructions to a coding agent, and agents make
mistakes: review what yours made before you build.

## What it needs

- A coding agent that runs commands in a terminal, such as Claude Code, Codex or Cowork. In a chat without a terminal,
  such as claude.ai, the skill can explain the steps but not run them.
- Node 22 or newer, with npm, and pnpm or Corepack.
- Git, if you want `create-clip-wallet` to make the project's first commit. It works without it.
- Your wallet's name, a reverse-DNS id for a domain you own (such as com.acme.wallet), a logo as a `.png` (1024×1024
  is best) or an `.svg`, an accent colour and your homepage. An `.svg` logo needs one of `@resvg/resvg-js`,
  `rsvg-convert`, `sips` (built into macOS) or ImageMagick's `magick`.
- Each platform's own build tools, to build for it. The agent tells you which are missing.

## Install

In Claude Code, one line adds the marketplace and installs the plugin:

```sh
/plugin install clip-wallet --marketplace ColdAI-org/coldai-plugins
```

From a terminal: `claude plugin install clip-wallet --marketplace ColdAI-org/coldai-plugins`. The
[repository's README](https://github.com/ColdAI-org/coldai-plugins#install-with-claude-code) covers Codex.

## What it runs, fetches and sends

The skill tells your coding agent what to do, and the agent runs the commands on your computer. In order:

1. It says that Clip Wallet is pre-release, and asks for your wallet's details. It runs nothing before you answer.
2. `node --version`, to check for Node 22 or newer.
3. `npm view create-clip-wallet@0.2.1 name version repository.url dist.attestations.provenance.predicateType`, which
   reads the starter's details from the npm registry. If they don't show the kit's own package, built and published
   from Clip Wallet's repository with npm provenance, the skill stops there.
4. `npx create-clip-wallet@0.2.1 <folder> … --yes`, with your values. It downloads the starter from the npm registry
   and makes the project in a new folder: `clip.config.ts`, `wallet.identity.json`, every platform's icons, listing
   drafts, and the browser extension's private key in `.keys/extension.pem`, which the agent never opens. With Git
   installed, the starter also runs `git init` and makes the first commit, on your computer.
5. `corepack enable`, if pnpm isn't installed, then `pnpm install`, which downloads the project's packages from the
   npm registry, and for the desktop app, Electron from Electron's releases on GitHub.
6. `pnpm harness`, `pnpm check-types` and `pnpm build`: the project's checks and builds, on your computer.
7. `pnpm verify:provenance`, which reads each kit package's provenance attestation from the npm registry, and checks
   that Clip Wallet's CI built the package from its public repository and that npm serves that build.
8. It tells you what was made and what each check said, and how to try each platform.

It reads the new project's `AGENTS.md` and `llms.txt`, and follows them. It makes no other commits unless you ask,
never switches mainnet on, never publishes anything, and never asks for a recovery phrase or a private key.

## What the plugin sends to ColdAI

Nothing. The plugin is instructions for your coding agent. It has no server and no telemetry, and ColdAI collects no
data through it. What your wallet contacts when it runs is set in its `clip.config.ts` and described in the kit's
docs.

## Example prompts

- Launch my own wallet with Clip Wallet.
- Make a browser extension wallet called Acme Wallet for EVM networks and Solana, with a green accent.
- Start a wallet with the Clip Wallet kit for desktop and phone, in English and German, with the id com.acme.wallet.

## Support

Contact ColdAI at [coldai.org/contact](https://coldai.org/contact), or open an issue at
[github.com/ColdAI-org/coldai-plugins/issues](https://github.com/ColdAI-org/coldai-plugins/issues). Report a
vulnerability privately, as
[SECURITY.md](https://github.com/ColdAI-org/coldai-plugins/blob/main/SECURITY.md) says.

## Privacy

The plugin's privacy policy is
[PRIVACY.md](https://github.com/ColdAI-org/coldai-plugins/blob/main/PRIVACY.md).

## Licence

This plugin is licensed under the [Apache License 2.0](LICENSE), © 2026 ColdAI LLC. "Clip Wallet" and the Clip Wallet
mark are ColdAI trademarks and aren't licensed under it: section 6 of the licence grants no trademark rights.
