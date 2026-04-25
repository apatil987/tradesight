import type { ParsedOrder, TradeInsert } from '@/types'

function instrumentKey(o: ParsedOrder): string {
  return o.asset_type === 'option'
    ? `${o.ticker}|${o.option_type}|${o.strike}|${o.expiration}`
    : o.ticker
}

// Broker screenshots show Eastern time. Convert to UTC ISO.
function toUtcIso(date: string, time: string): string {
  const month = parseInt(date.split('-')[1])
  const offsetHours = month >= 3 && month <= 11 ? 4 : 5 // EDT or EST
  const dt = new Date(`${date}T${time}:00`)
  dt.setHours(dt.getHours() + offsetHours)
  return dt.toISOString()
}

export function matchOrders(orders: ParsedOrder[], userId: string): TradeInsert[] {
  const groups = new Map<string, ParsedOrder[]>()
  for (const order of orders) {
    const key = instrumentKey(order)
    const group = groups.get(key) ?? []
    group.push(order)
    groups.set(key, group)
  }

  const trades: TradeInsert[] = []

  for (const [, group] of groups) {
    const sorted = [...group].sort(
      (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    )

    const pending: ParsedOrder[] = []

    for (const order of sorted) {
      const matchIdx = pending.findIndex(
        (p) => p.action !== order.action && p.quantity === order.quantity
      )

      if (matchIdx !== -1) {
        const match = pending.splice(matchIdx, 1)[0]
        const isMatchFirst =
          new Date(`${match.date}T${match.time}`) <= new Date(`${order.date}T${order.time}`)
        const entry = isMatchFirst ? match : order
        const exit = isMatchFirst ? order : match

        trades.push({
          user_id: userId,
          ticker: entry.ticker,
          asset_type: entry.asset_type,
          option_type: entry.option_type,
          strike: entry.strike,
          expiration: entry.expiration,
          quantity: entry.quantity,
          entry_price: entry.price,
          exit_price: exit.price,
          entry_time: toUtcIso(entry.date, entry.time),
          exit_time: toUtcIso(exit.date, exit.time),
          pnl: null,
          score: null,
          notes: 'Imported from screenshot',
          tags: [],
        })
      } else {
        pending.push(order)
      }
    }
  }

  return trades
}
