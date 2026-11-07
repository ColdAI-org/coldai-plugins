# Privacy policy

This policy covers the `exclip` and `clip-wallet` plugins for coding agents, published by ColdAI LLC from
https://github.com/ColdAI-org/coldai-plugins, wherever you install them from: this repository's marketplace,
Anthropic's plugin directory or OpenAI's.

## What the plugins are

Each plugin is a set of instructions, called a skill, that your coding agent reads and follows. The `exclip` plugin
also holds one settings file, `platform.json`, with ColdAI's fee settings. The plugins have no server, no code of
their own that runs, and no telemetry. When you use a skill, your coding agent runs the commands it describes on your
computer.

## What ColdAI collects through them

Nothing. The plugins send ColdAI no data: not your prompts, your files, your answers to the skills' questions, how you
use them, or anything about your computer.

## What the commands contact

The commands the skills describe contact these services. Each one's own privacy policy covers what it receives, such
as your IP address and what you download.

- **Where you install the plugins from**: GitHub, or the plugin directory you use.
- **GitHub**: `launch-dex` clones ExClip from it. For a Clip Wallet desktop app, installing the project's packages
  downloads Electron from Electron's releases on GitHub.
- **The npm registry**: both skills install packages from it, Corepack downloads pnpm from it, and `launch-wallet`
  reads `create-clip-wallet`'s details and the kit's provenance attestations from it.
- **Playwright's servers**: if `launch-dex` downloads Chromium for ExClip's screenshots.
- **The services ExClip uses**: while `launch-dex` checks the fee, and once your DEX is live, ExClip's server may
  contact the services in ExClip's
  [architecture notes](https://github.com/ColdAI-org/exclip/blob/main/docs/architecture.md#how-the-parts-talk). On a
  live DEX, ColdAI's fee is paid on-chain to ColdAI's address on Sonic, and like every on-chain payment, it's public.
  Nothing else goes to ColdAI.
- **The services your wallet uses**: set in its `clip.config.ts` and described in the
  [Clip Wallet kit's docs](https://github.com/ColdAI-org/clip-wallet).

## Your conversation

What you type to your AI app, and what your coding agent reads and writes while it follows a skill, is handled by the
app's maker under its own privacy policy. ColdAI doesn't receive it.

## Retention

ColdAI receives no data through the plugins, so it keeps none.

## Your choices

You can uninstall either plugin at any time, and decline or stop any command your coding agent runs. The `exclip`
plugin changes nothing unless you agree to ColdAI's fee.

## Contact

Ask ColdAI about this policy at https://coldai.org/contact. ColdAI's privacy policy for its website and services is
at https://coldai.org/privacy.

Last changed: 2026-11-07.
