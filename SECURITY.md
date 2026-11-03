# Security policy

The skills in this repository tell a coding agent what to run and what to write. `launch-dex` sets up a DEX that takes
ColdAI's fee on its swaps and pays it straight to a fixed address, so a bug here can send money to the wrong place, or
change someone's files before they have agreed to the fee. We would rather hear about a problem twice than not at
all.

## Reporting a vulnerability

Report security problems privately. The preferred channel is GitHub's private vulnerability reporting: open the
repository's **Security** tab and choose **Report a vulnerability**, which opens a private security advisory.
Alternatively, email shayan@coldai.org. Do not use a public issue, pull request or discussion.

A useful report says:

- which part is affected: a skill (`plugins/exclip/skills/launch-dex` or `plugins/clip-wallet/skills/launch-wallet`),
  ColdAI's fee settings (`plugins/exclip/platform.json`), the marketplace and plugin manifests, or the checks in
  `scripts/` and `.github/workflows/`;
- which commit you tested, and with which coding agent;
- how to reproduce it, and what an attacker gains;
- whether funds, fees or keys are at risk.

A proof of concept is welcome. Test with your own copies and your own wallets. ExClip runs on live networks only, so
use small amounts.

## What happens next

- We aim to acknowledge a report within three working days. We will tell you whether we can reproduce it, and keep
  you posted until it is fixed.
- We fix the problem, publish the fix and then the advisory. Please give us reasonable time to do that before you
  disclose anything.
- We credit you in the advisory unless you ask us not to.

We will not pursue legal action over good-faith research that follows this policy. That means you do not touch other
people's funds or data, you do not degrade a service someone else runs, and you stop and tell us if you come across
someone else's data.

## Scope

In scope: the files in this repository. That covers what each skill tells a coding agent to do, in particular the fee
it states and the yes it asks for before anything changes; ColdAI's fee settings and how `launch-dex` uses them; any
way a skill could change files before that yes, set a fee other than ColdAI's, pay a fee anywhere but to ColdAI's
address, or handle a key; and the checks CI runs.

Report these elsewhere:

- **ExClip** and its fee allow-list. Report to the ExClip project, as its `SECURITY.md` says, and tell us too if
  `launch-dex` is affected.
- **Clip Wallet and `create-clip-wallet`.** Report to the Clip Wallet project, and tell us too if `launch-wallet` is
  affected.
- **A DEX or wallet that someone launched with these plugins.** Each is run by its own operator. Contact them, and
  tell us as well if the flaw is in a skill.
- **SODAX contracts or the SODAX API.** Report to SODAX.
- **The coding agent itself, or a dependency.** Report to its maker or maintainers.

## Supported versions

Security fixes go to the latest commit on `main`. Once there are tagged releases, they also go to the latest release.
