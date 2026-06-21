export const metricExplanations: Record<string, string> = {
  spread: 'Difference between best ask and best bid. Tight spreads indicate high liquidity; wide spreads indicate low liquidity or volatile moments.',
  midprice: 'Midpoint between bid and ask. Useful as a smoothed reference when markets are fast.',
  notional: 'Trade notional = entry price * size. Use for exposure and risk budgeting.'
}
