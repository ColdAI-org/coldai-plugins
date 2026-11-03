---
name: launch-wallet
description: Launch your own non-custodial wallet with the Clip Wallet kit, as a browser extension, a desktop app and a phone app under your own name, ids, logo and accent colour, for the network families and languages you pick. Runs the kit's documented create-clip-wallet command, then the project's checks. Pre-release, test networks only, no external audit. Use when someone asks to launch, start or make their own wallet with Clip Wallet or ColdAI.
---

# Launch a wallet with the Clip Wallet kit

This skill makes a new wallet project with `create-clip-wallet`, the Clip Wallet kit's starter: a browser extension, a
desktop app for macOS, Windows and Linux, and a phone app for iOS and Android, from one `clip.config.ts`, under the
person's own name, ids, logo and accent colour. It runs the kit's documented command, checks the project with the
project's own checks, and hands back.

Work through the steps in order, and end with step 5.

## Rules for the whole task

- **Use the kit's documented commands.** Change nothing in the project that the commands don't write, unless the person
  asks.
- **Keys.** `create-clip-wallet` writes the extension's private key to `.keys/extension.pem`. Never open, print, copy,
  move or commit it. Never ask for, or handle, a recovery phrase or a private key.
- **The kit's rules for coding agents.** Never tick a box in `MAINNET.md` or switch mainnet on: that is the wallet
  owner's decision. Never weaken a harness rule to get a passing run. Never publish packages.
- **Don't commit** unless the person asks you to.

## 1. Say what this is

Before anything else, tell the person:

> **Pre-release: Clip Wallet runs on test networks only and has had no external audit.** The wallet this makes runs on
> test networks. There is no switch for mainnet in the command: mainnet is a later decision for you, as the wallet's
> owner, after the project's `MAINNET.md`.

## 2. Ask for the details

Ask for these together, with the notes, so the person can answer in one go:

1. **The wallet's name**, as it shows on every platform. It must be their own: the kit refuses "Clip Wallet".
2. **A reverse-DNS id** for a domain they own, such as `com.acme.wallet` for `acme.com`. It's the wallet's EIP-6963
   id, and its desktop and phone app id: the macOS bundle id `<id>.desktop`, the iOS bundle id and the Android
   package. The kit refuses `org.coldai.*`. Without one, the kit uses a `com.example.*` placeholder, which the
   project's checks warn about and which blocks mainnet later.
3. **The logo**: the path of a `.png` file (1024×1024 is best) or an `.svg`. Every icon is rendered from it. It must
   be their own, not Clip Wallet's. Without one, the kit draws a starter mark in the accent colour.
4. **An accent colour**, as `#RRGGBB`. White text on it needs a contrast of at least 3:1. It's also the background
   of the phone app's icon and splash screen.
5. **The platforms**: the browser extension, the desktop app, the phone app, or any of them. Without an answer, all
   three.
6. **The network families**, from those the kit offers: `evm:*` for EVM networks, or `evm:<chain id>` for one EVM
   network, and `hedera`, `solana`, `bitcoin`, `sui`, `aptos`, `cardano`, `substrate`, `starknet`, `ton`, `near`,
   `stellar`, `tezos`, `algorand`. Without an answer, all of them.
7. **The languages** the wallet offers in Settings → Language, from `en`, `de`, `fr`, `es`, `pt-BR`, `it`, `tr`,
   `ja`, `ko`, `zh-Hans`, `ar` and `hi`. The first is the fallback. Without an answer, all of them.
8. **The homepage**: their website, as `https://…`, for the stores, wallet pickers and WalletConnect. Without one,
   mainnet is blocked later.

Also ask for the folder to create, such as `acme-wallet`, unless the name makes it obvious. It must not exist yet.

Check the answers before you run anything, and ask again about any that fail: a name; an id of lower-case labels
joined by dots; a `.png` or `.svg` file that exists; a colour in `#RRGGBB`; and only the platforms, network families
and languages above. An `.svg` logo needs one of these installed to be rendered: `@resvg/resvg-js`, `rsvg-convert`
(librsvg), `sips` (built into macOS) or ImageMagick (`magick`). Without any of them, ask for a `.png`.

## 3. Make the project

Check that Node is 22 or newer (`node --version`). Then check that the package is the kit's own, published from
Clip Wallet's repository:

```sh
npm view create-clip-wallet name version repository.url
```

`repository.url` must be `git+https://github.com/ColdAI-org/clip-wallet.git`. If it isn't, or the package isn't
found, stop and say so: don't run it. Otherwise tell the person which version will run.

Then run the kit's documented command, with their values, from the directory the folder goes in:

```sh
npx create-clip-wallet <folder> --platforms <platforms> --name "<name>" --rdns <id> \
  --id <id> --logo <logo> --accent "<accent>" --networks "<network families>" \
  --languages <languages> --homepage <homepage> --yes
```

`--platforms` takes `extension`, `desktop` and `mobile`, joined by commas, and `--networks` and `--languages` take
comma-separated lists too. Leave out an option the person gave no answer for, so the kit's default applies. Add other
options only if the person asks for them (see the kit's documentation for `create-clip-wallet`).

If the command refuses a value, it has written nothing. Tell the person which value and why, in the command's words,
ask again, and run it again.

## 4. Check the project

Read the new project's `AGENTS.md` and `llms.txt`, and follow them from here on. Then run the kit's loop for a
kit-built wallet, from the project's folder (`corepack enable` first, if `pnpm` isn't installed):

```sh
pnpm install
pnpm harness
pnpm check-types
pnpm build
```

`pnpm harness` must pass before every commit. If a check fails, fix the cause if it's in what the person gave you,
such as the logo or the colour, and run it again. Otherwise report it with its message. If a build needs a toolchain
this computer doesn't have, say which.

## 5. Hand back

Tell the person what was made and what each check said, then give them this, with the platforms they chose:

> **Your wallet: what you have and what's next**
>
> **Pre-release: Clip Wallet runs on test networks only and has had no external audit.**
>
> **Try it**, from the project's folder:
>
> - the browser extension: `pnpm dev:extension`, which opens Chrome with the extension loaded and live reload;
> - the desktop app: `pnpm dev:desktop`;
> - the phone app: `pnpm --filter mobile start`, Metro for a development build.
>
> **What the kit wrote**: `clip.config.ts`, the one config for every platform; `wallet.identity.json`, the name, ids,
> homepage and icon; every platform's icons, from your logo; listing drafts in `docs/listings/`; and
> `docs/signing.md`, the code signing and store accounts each platform needs when you ship. No account or
> certificate is needed to build.
>
> **Your extension key.** `.keys/extension.pem` is the browser extension's private key. Its public half fixes the
> extension's id in Chrome. It's kept out of Git and never printed. Back it up offline, and never commit or share it.
>
> **Mainnet** is your decision, later, after `MAINNET.md`. `pnpm harness` and the builds refuse mainnet while a box in
> it is open, and the builds also while something is missing or still a placeholder, such as the `com.example.*` id,
> the homepage or a WalletConnect project id. `pnpm wallet:mainnet-check` lists what's left.
>
> **Later changes**: `pnpm wallet:identity` sets the name, ids, accent, logo, homepage or WalletConnect project id
> again, and keeps the extension key. `pnpm wallet:brand` renders the icons again from the logo, and
> `pnpm wallet:listings` regenerates the listing drafts. `pnpm verify:provenance` checks every kit package's
> provenance attestation.
