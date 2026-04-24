// v1 scoring — entry/exit proxied from price direction, no market data.
// Full formula (5-min price movement, intraday high/low) requires Phase 2 market data.

export function calculatePnl(trade: {
  exit_price: number | null
  entry_price: number
  quantity: number
  option_type: string | null
}): number | null {
  if (trade.exit_price === null) return null
  return trade.option_type === 'put'
    ? (trade.entry_price - trade.exit_price) * trade.quantity
    : (trade.exit_price - trade.entry_price) * trade.quantity
}

function entryScore(pnl: number | null): number {
  if (pnl === null) return 50
  return pnl > 0 ? 80 : pnl === 0 ? 50 : 20
}

function exitScore(pnl: number | null, entryPrice: number, quantity: number): number {
  if (pnl === null) return 50
  const entryValue = Math.abs(entryPrice * quantity)
  if (entryValue === 0) return 50
  const pct = (pnl / entryValue) * 100
  if (pct >= 5) return 100
  if (pct >= 2) return 80
  if (pct >= 0) return 60
  if (pct >= -3) return 40
  return 20
}

function captureScore(pnl: number | null): number {
  // Without intraday max_possible: winner = fully captured, loser = 0
  if (pnl === null || pnl <= 0) return 0
  return 100
}

export function calculateScore(trade: {
  pnl: number | null
  entry_price: number
  quantity: number
  exit_price: number | null
}): number | null {
  if (trade.exit_price === null) return null
  const e = entryScore(trade.pnl)
  const x = exitScore(trade.pnl, trade.entry_price, trade.quantity)
  const c = captureScore(trade.pnl)
  return Math.round(e * 0.4 + x * 0.4 + c * 0.2)
}

export function getSubScores(trade: {
  pnl: number | null
  entry_price: number
  quantity: number
}): { entry: number; exit: number; capture: number } {
  return {
    entry: entryScore(trade.pnl),
    exit: exitScore(trade.pnl, trade.entry_price, trade.quantity),
    capture: captureScore(trade.pnl),
  }
}
