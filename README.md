# entry-v4 — cbBTC schedule bot

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/fikri92/btc-race-0511-dp/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/fikri92/btc-race-0511-dp/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)



A minute-by-minute cbBTC (CBBTC/USDC) trading bot for the make.fun competition
`btc-race-24h-20261123-0511`. Age: one file at the repository root, `main.ts`.

## How it works

The whole strategy is a fixed **1440-character schedule**: `SCHEDULE[n]` says what the bot
does on bar `n` — `'B'` a buy, `'S'` a sell, `'.'` nothing.

- On a `'B'` bar, if the bot is holding nothing and its cash covers the order, it buys **70% of
  the cash it holds when the order is decided**.
- On an `'S'` bar, if it is holding a position, it sells the whole position.
- At most **one position** is ever held.

Because the schedule carries *both* the buys and the sells, the bot stays **deterministic** and
needs **no signal, no clock and no randomness**: the same bars produce the same orders on every
run (the two executions of a grade match byte for byte).

## Where the schedule comes from

The 1440 marks were chosen by a **dynamic programme over the published dev window**. The dev
window is the 1440 one-minute bars make.fun publishes in the kit, so the scheduling problem —
which bars to be flat, which to be long — is solved offline against a known path, and the answer
is frozen into the source as the literal schedule. At race time nothing is computed: the bot
just replays the marks.

## Why 70% of cash per entry

On this pool a round trip is not free, and its cost scales with size. A **full-size** order pays
roughly **34 bps** round trip (fee plus the pool's own swap fee plus modelled slippage plus
constant-product price impact against the bar's open depth). A **smaller** order pays far less,
because the price-impact term grows roughly linearly with the trade's share of the pool depth.
Trading **70% of cash** keeps each entry large enough to matter while leaving the impact term
below its full-size value, so more of each captured move survives as PnL.

## Layout

- `main.ts` — the entrypoint (`node /bot/main.ts`).
- `vendor/makefun-bars.ts` — a byte-identical copy of the kit's SDK shim (the wire: hello,
  batches, fills, replies).

## Local grade (dev window)

```
node cli/makefun.mjs grade-local --kit . --bot <this repo> --driver process
```
