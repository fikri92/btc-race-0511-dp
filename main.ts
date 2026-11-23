// entry-v4/main.ts — schedule bot for cbBTC (CBBTC/USDC), make.fun competition
// btc-race-24h-20261123-0511. Long only, at most one position at a time, integer bigint
// maths only, no clock and no randomness: the same bars give the same orders every run.
//
// The whole strategy is a fixed schedule: SCHEDULE[n] is what the bot does on bar n —
//   'B' a buy, 'S' a sell, '.' nothing.
// The schedule holds both the buys and the sells, so the bot stays deterministic and needs
// no signal, no clock and no randomness. A "B" bar buys 70% of the cash held when the order
// is decided; an "S" bar sells the whole position. At most one position is ever held.

import { runBars, type BarsState, type Fill, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
/** The slippage cap every order carries. */
const MAX_SLIPPAGE_BPS = 500;
/** The smallest buy the market takes (hello.fees.min_notional_quote_units). */
const MIN_NOTIONAL = 1_000_000n;
/** The share of cash spent on a "B" bar, in percent. */
const BUY_PCT = 70n;

// 1440 characters, one per bar: 'B' buy, 'S' sell, '.' nothing. Chosen by a dynamic
// programme over the published dev window (see README.md), 18 lines of 80 joined.
const SCHEDULE: string = [
  ".......B..............S...........B........................S............B.......",
  ".........S....................B................................S....B...........",
  "..............................................S.........B.............S........B",
  "...........S...B...............................S...B......S.....................",
  "...B.....................S...B.............S...B....................S.......B...",
  "...........................S......B.......S.B.S.B.....................S...B.....",
  ".....S...........B........S..........B.......S.................................B",
  "..............S......B...........S............B..........S...............B......",
  "....................................................S...........................",
  ".........B....................S..........................B.........S.........B..",
  "..........................S.....................................................",
  "....................................B......................................S....",
  "B...............S..................................B...............S......B.....",
  "...............................S.....B..............................S...........",
  ".......B........................S....B....S.....B....S....B..........S......B...",
  ".......S.B...............S......................................................",
  "............B.........S.B..................S..B.......S....B....S.........B.....",
  ".......S.B.......................S............B.........................S....B..",
].join("");

/** The quantity of CBBTC held, updated from the batch's fills. */
let qty = 0n;

/** Fold the batch's fills into the position book. */
function foldFills(fills: Fill[]): void {
  for (const f of fills) {
    if (f.status !== 'filled') continue;
    const q = BigInt(f.qty);
    if (f.side === 'buy') qty += q;
    else qty -= q;
    if (qty < 0n) qty = 0n;
  }
}

await runBars({
  onHello() {
    qty = 0n;
  },

  onBatch(state: BarsState, batch) {
    foldFills(batch.fills);

    // The bars carry every price; the clock is never read. While warming up no order is taken.
    if (state.warmingUp) return [];

    const n = state.seq;
    if (n < 0 || n >= SCHEDULE.length) return [];
    const act = SCHEDULE[n];
    if (act === undefined) return [];

    const orders: OrderInput[] = [];

    if (act === 'B') {
      if (qty === 0n) {
        const notional = (state.cash * BUY_PCT) / 100n;
        if (notional >= MIN_NOTIONAL) {
          orders.push({ side: 'buy', symbol: SYMBOL, notional_quote_units: notional, max_slippage_bps: MAX_SLIPPAGE_BPS });
        }
      }
    } else if (act === 'S') {
      if (qty > 0n) {
        orders.push({ side: 'sell', symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS });
      }
    }

    return orders;
  },
});
