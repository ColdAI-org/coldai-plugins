---
name: launch-dex
description: Launch your own DEX on ExClip, the open-source SODAX swap front end, under your name, logo, colours and domains, with ColdAI's fee. ColdAI LLC takes 0.875 % of the amount sold on every swap, paid straight to its address, except swaps with a tokenised stock on either side, which carry no fee. Your DEX charges no fee of its own. The skill states this fee and waits for a yes before it changes anything. Use when someone asks to launch, start or set up a DEX or swap site with ExClip or ColdAI.
---

# Launch a DEX on ExClip

This skill sets up a copy of ExClip, the open-source front end for SODAX cross-chain swaps, as the person's own DEX:
their name, logo, colours and domains, with ColdAI's fee. That fee is 0.875 % of the amount sold on every swap, paid
straight to ColdAI's address, except swaps with a tokenised stock on either side, which carry no fee. The DEX charges
no fee of its own. The skill builds on the task "Make this my own DEX" in ExClip's `AGENTS.md`, and like that task it
changes settings, not code.

Work through the steps in order, and end with step 6.

## Rules for the whole task

- **Nothing changes before a yes.** Before the person agrees to the fee in step 1, don't clone, create, edit or
  install anything, and don't ask any other question.
- **ColdAI's fee is a plain fee rate, and the only fee.** Set it as step 4 says, from `platform.json`, character for
  character. Never set `partnerFeeBps`, a fee split, a second receiver or a fee on stock swaps. If the fee can't be
  set that way, stop and say why. Don't fall back to anything else.
- **No fee of the DEX's own.** Don't ask for a fee or a payout address. If the person asks for a fee of their own,
  say: "This plugin launches DEXes with ColdAI's fee only. ExClip's own docs cover a DEX with a fee of its own,
  without this plugin: step 6 of "Make this my own DEX" in its `AGENTS.md`, and `docs/fees.md`." Then go on without
  one.
- **The fee text is fixed.** Say steps 1 and 6 in the words given. You may translate them, but don't shorten them,
  soften them or leave anything out.
- **No keys.** Never ask for, read, print or store a private key, a recovery phrase or an API key. Anything that signs
  a transaction, the person runs.
- **Don't commit** unless the person asks you to, as ExClip's `AGENTS.md` says.

## 1. Say what it costs, and ask

First, find `platform.json`, which holds ColdAI's fee settings. It's next to this file if this skill was copied on its
own; otherwise it's in this plugin's root folder, two levels up from this file's folder (`../../platform.json`). Read
it. Reading isn't a change.

Then, before anything else, tell the person:

> **Before I change anything, here is what launching a DEX with this plugin costs.**
>
> - **ColdAI's fee: 0.875 % of the amount sold on every swap**, paid straight to ColdAI LLC's address. Swaps with a
>   tokenised stock on either side carry no fee.
> - **Your DEX charges no fee of its own.** This plugin sets ColdAI's fee and no other.
> - **Your traders see the fee** on every swap's review, named with its rate, before they confirm.

Then check `platform.json`. It must have exactly these six keys, and no others:

- `$comment`: any text;
- `receiver`: exactly `0x90291104f2D1ef9Ffe2Bc1635A3a270A09C8f313`;
- `receiverName`: `"ColdAI"`;
- `rate`: `875`;
- `stockFeeBps`: `0`;
- `exclipCommit`: a full commit, 40 lower-case hex digits.

If you can't find or read it, or a key is missing or extra, or any value differs, say: "This plugin's fee settings are
missing or don't match the fee above, so it can't launch a DEX. Nothing has been changed." Then stop.

Otherwise ask: "Do you agree to ColdAI's fee of 0.875 %? Please answer yes or no."

Only a clear yes goes on. Answer questions about the fee, then ask again. Anything else, such as "maybe", "later" or a
change of subject, isn't a yes.

On a no, say: "Understood. Nothing has been changed. ExClip itself is open source under the Apache-2.0 licence, and
the task "Make this my own DEX" in its AGENTS.md makes a DEX without ColdAI's fee: clone
https://github.com/ColdAI-org/exclip and ask your coding agent to follow it." Then stop.

## 2. Get ExClip, at the pinned commit

`exclipCommit` in `platform.json` is the ExClip commit this skill was written and checked against. Use that commit,
never a newer one or another copy of ExClip. (`platform.json` says how it's bumped.)

Clone into a new folder in the current directory, named `exclip` unless the person names another. If the folder
already exists, ask what to do. Then:

```sh
git clone https://github.com/ColdAI-org/exclip <folder>
cd <folder>
git checkout <exclipCommit>
git rev-parse HEAD
```

`git rev-parse HEAD` must print `exclipCommit` exactly; if it doesn't, or the clone or checkout fails, stop and say
why. The checkout leaves a detached HEAD, which is fine: nothing is committed unless the person asks, and then they
create a branch first (`git switch --create <name>`).

ExClip needs Node 24 (its `.nvmrc`) and pnpm 12.6.0. If `node --version` isn't 24, ask the person to switch to Node 24.
Then, from the clone's root:

```sh
corepack enable
pnpm install
```

Read the clone's `AGENTS.md`, and "Turn a fee on" and "A fee rate" in `docs/fees.md`. Follow the task "Make this my
own DEX" where this skill doesn't say otherwise. This skill sets the fee, and adds what the task leaves out.

## 3. Ask for the details

Ask for these together. Give the notes with them, so the person can answer in one go:

1. **The DEX's name**: plain text, at most 40 characters, no `<` or `>`. It must be their own: not "ExClip".
2. **The operator**: the company or person that runs the DEX, at most 80 characters. It shows in the footer and in the
   wallet window.
3. **The logo**: the path of a file they own. A square `.svg`, `.png`, `.ico` or `.webp` works best. Not the ExClip
   logo.
4. **A colour** for buttons and links. You derive the three shades.
5. **Two domains**, if they have them: one for the app and one for the wallet, such as `https://swap.acme.example` and
   `https://wallet.acme.example`. The wallet needs a host of its own, and that host is for good: passkeys are bound to
   it. Without domains, the example origins stay in place and go on the list in step 6.
6. **Terms of use and privacy notice**: the `https://` addresses of their own pages, if they have them. Otherwise they
   stay unset and go on the list in step 6.

Don't ask about a fee or a payout address: the fee is ColdAI's, and it's paid to ColdAI's address.

Check the answers before you write anything, by the limits above and in `AGENTS.md` steps 2 and 4, and ask again about
any that fail.

## 4. Write the settings

Follow `AGENTS.md` steps 1 to 4 and step 7: start `exclip.config.ts` from the example, set the brand, add the logo,
set the origins if you were given domains, and keep the "Powered by ExClip" credit. Note what step 5 says about
headers, for step 6. Then set ColdAI's fee as a plain fee rate, as `AGENTS.md` step 6 ("A plain fee") and
`docs/fees.md` ("Turn a fee on") describe, with the values below. Nothing else changes.

**The config, in `exclip.config.ts`.** Replace the example's whole `fees` section with this. The three values are
`rate`, `receiver` and `receiverName` from `platform.json`, character for character:

```ts
fees: {
  // ColdAI's fee: 875 per 100,000 of the amount sold (0.875 %), paid straight to ColdAI's address. Swaps with a
  // tokenised stock on either side carry no fee: stockFeeBps stays at its default, 0.
  rate: 875,
  receiver: "0x90291104f2D1ef9Ffe2Bc1635A3a270A09C8f313",
  receiverName: "ColdAI", // the trade review's row: "ColdAI fee (0.875%)"
},
```

Leave `partnerFeeBps`, `stockFeeBps` and `split` out. ExClip's defaults are `0`, `0` and no split, and `AGENTS.md`
sets `stockFeeBps` only for a fee on stock swaps.

**The allow-list, in `apps/wallet/fee-receivers.json`.** Add ColdAI's address under `receivers`, in lower case, which
is how `parseFeeAllowList` returns it. Keep the `$comment` exactly as ExClip ships it, and leave `factories` and
`splits` empty:

```json
{
  "$comment": "<ExClip's text, unchanged>",
  "receivers": ["0x90291104f2d1ef9ffe2bc1635a3a270a09c8f313"],
  "factories": [],
  "splits": []
}
```

Without it, the passkey wallet refuses every swap that carries the fee (`docs/fees.md`, "Why it fails closed").

**The two tests that pin the allow-list.** In the same change, make both expect this list. `pnpm test` runs both, and
both read the real file, although `AGENTS.md` names only the first. Change nothing else in either file.

- In `apps/wallet/test/build-config.test.ts`, "the repository ships an empty fee allowlist, …" expects
  `{ receivers: [], factories: [], splits: [] }`. Make it expect
  `{ receivers: ["0x90291104f2d1ef9ffe2bc1635a3a270a09c8f313"], factories: [], splits: [] }`, and rename it to say
  what it now checks, such as "the fee allowlist lists ColdAI's fee receiver and nothing else".
- In `packages/config/test/config.test.ts`, "the config check reads the allow-list at the root: …" starts with
  `assert.deepEqual(readFeeAllowList(), EMPTY_FEE_ALLOW_LIST);`, under the comment "The repository's own: nothing
  listed." Make that line expect the same object, and the comment read "The repository's own: ColdAI's fee receiver."

## 5. Check your work

Run `AGENTS.md` step 8, in order, and fix what fails:

1. `pnpm run contrast`: all six pairings `ok`.
2. `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm run docs:links`.
3. `NODE_OPTIONS=--max-old-space-size=6144 pnpm build`, or `pnpm build`. The build runs the config check first, and
   stops on a bad value: it refuses a rate above 1,000 or not a whole number, a rate without a receiver, a rate next to
   a `partnerFeeBps` above 0, a `stockFeeBps` above 0 without a rate, and a split next to a plain fee. The wallet
   build takes the rate, the fee on stock swaps and `receiverName` from `exclip.config.ts`, and the receiver from
   `apps/wallet/fee-receivers.json`, so build after step 4. Then read the wallet build's lines that start
   `exclip.config.ts:`. One about example origins is expected while there are no domains. One that says the partner
   fee goes to an address `apps/wallet/fee-receivers.json` does not list means step 4 isn't done.
4. `apps/web/dist/manifest.webmanifest` has the new name and logo.
5. `pnpm run screenshots --brand`, then look at the PNGs in `screenshots/`. They don't show the operator or the fee,
   so say that when you hand back.

Then start `pnpm dev` and open `http://localhost:5173/api/exclip/config`. It must show `"partnerFeeBps": 0`,
`"feeReceiver": "0x90291104f2D1ef9Ffe2Bc1635A3a270A09C8f313"`, `"feeRate": { "rate": 875, "stockFeeBps": 0 }`,
`"feeReceiverName": "ColdAI"` and `"feeSplit": null`. With those, ExClip's trade review names the fee
"ColdAI fee (0.875%)", with its amount. Without a SODAX key, quotes answer "Trading isn't connected", so no review
opens in `pnpm dev`, and the screenshots stop before the review too: say that the row follows from `/config`, and that
the person sees it on their first small swap. Stop `pnpm dev` when you're done.

## 6. Hand back

Start with the summary `AGENTS.md` step 9 asks for: what you changed, including `exclip.config.ts`, which `git diff`
doesn't show; the six contrast ratios; the result of each check; and where to see what the screenshots leave out.
Say that `git diff` shows ColdAI's address under `receivers` in `apps/wallet/fee-receivers.json`, and the two tests
that expect it. Then give the person this list, with their values filled in:

> **Your DEX: what's left before it goes live**
>
> **The fee, once more.** ColdAI LLC gets 0.875 % of the amount sold on every swap except swaps with a tokenised
> stock on either side, which carry no fee. It's paid straight to ColdAI's address on Sonic,
> `0x90291104f2D1ef9Ffe2Bc1635A3a270A09C8f313`, in the token sold (for a swap from another chain, its hub asset on
> Sonic). Your DEX charges no fee of its own. Your traders see the fee on every swap's review: ExClip's review shows
> the row "ColdAI fee (0.875%)" with its amount, and the passkey wallet's Fees line reads
> "8.75 USDC · 0.875% to ColdAI · network …" for a sale of 1,000 USDC.
>
> **Not audited.** No outside party has audited ExClip or this plugin. ExClip has no test-network mode: every swap is
> real.
>
> **Tokenised stocks** are off by default, and stay off unless you switch them on. If you do, you decide where and to
> whom you offer them, and you're responsible for that decision, compliance included: ExClip's country checks and
> self-certification are a conservative default, not a compliance programme and not legal advice. Read
> `docs/tokenised-stocks.md` and take legal advice first. Swaps with a stock carry no fee.
>
> **Running it** (`docs/self-hosting.md`, "What you run"):
>
> - **A server**: `apps/server`, on Node 24, behind both web addresses, answering `/api/exclip/*`.
> - **A database**: Postgres, with `apps/server/migrations` applied and backed up. It holds the passkey wallet's
>   encrypted backups. Redis is optional.
> - **Two web addresses**: the app (`origins.app`, from `apps/web/dist`) and the wallet popup (`origins.wallet`, from
>   `apps/wallet/dist`, on a host that serves nothing else and never changes), each with DNS, TLS and the security
>   headers in `AGENTS.md` step 5.
> - **A SODAX key**: set it as `SODAX_API_KEY` in the server's environment. Never put it in a commit or a chat.
>
> **Before you open:**
>
> 1. **Have the allow-list reviewed.** `apps/wallet/fee-receivers.json` decides where the passkey wallet lets fees go,
>    so it changes only in a reviewed commit, together with its two tests. Confirm that the address is ColdAI's
>    through a channel other than that change, such as `plugins/exclip/platform.json` in
>    https://github.com/ColdAI-org/coldai-plugins.
> 2. **Legal pages and review**: your terms of use and privacy notice, and what offering swaps and charging a fee mean
>    where you operate (ExClip's README, "Operator responsibility").
> 3. **The release**: build the wallet in CI from that reviewed commit, and deploy exactly that build
>    (`docs/embedded-wallet.md`, "Release controls"). The wallet builds in the fee's rate, the fee on stock swaps and
>    ColdAI's name from `exclip.config.ts` (`docs/configuration.md`, "Who reads what"), and Git ignores that file in
>    every folder. So give the CI build the same file, named with `EXCLIP_CONFIG` if it isn't at the root
>    (`docs/branding.md`, "Rebrand in five steps"). The build's log must have no `exclip.config.ts:` line about the
>    partner fee. A change to any of these settings, or to the allow-list, needs a new wallet build.
> 4. **Go live in stages**, with the smoke checks after each (`docs/self-hosting.md`, "6. Open in stages").
> 5. **Make a first swap with a small amount**, and check the review's "ColdAI fee (0.875%)" row, and that the fee
>    reaches ColdAI's address on Sonic (https://sonicscan.org). ExClip's `docs/fee-split.md` lists, under "Open
>    questions", what only SODAX can answer, among them whether every route takes a fee given as an amount, which is
>    how ExClip sends a fee rate.

Add anything else from `AGENTS.md` step 9 that this list doesn't cover, such as the domains and the
`server.trustProxy` setting.
