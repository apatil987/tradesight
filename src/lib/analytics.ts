import type { Trade } from '@/types'

export interface HourStat {
  hour: number
  trades: number
  wins: number
  totalPnl: number
}

export function computeHourlyStats(trades: Trade[]): HourStat[] {
  const map = new Map<number, HourStat>()

  for (const trade of trades) {
    if (trade.pnl === null) continue
    const hour = new Date(trade.entry_time).getHours()
    const existing = map.get(hour) ?? { hour, trades: 0, wins: 0, totalPnl: 0 }
    map.set(hour, {
      hour,
      trades: existing.trades + 1,
      wins: existing.wins + (trade.pnl > 0 ? 1 : 0),
      totalPnl: existing.totalPnl + trade.pnl,
    })
  }

  return Array.from(map.values()).sort((a, b) => a.hour - b.hour)
}

function holdMinutes(trade: Trade): number | null {
  if (!trade.exit_time) return null
  return (new Date(trade.exit_time).getTime() - new Date(trade.entry_time).getTime()) / 60000
}

function avgHold(trades: Trade[]): number | null {
  const times = trades.map(holdMinutes).filter((m): m is number => m !== null)
  if (times.length === 0) return null
  return times.reduce((s, t) => s + t, 0) / times.length
}

function fmt(mins: number): string {
  return mins < 60 ? `${Math.round(mins)}m` : `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`
}

export function generateInsights(trades: Trade[]): string[] {
  const closed = trades.filter((t) => t.pnl !== null)
  if (closed.length < 3) return []

  const insights: string[] = []
  const winners = closed.filter((t) => (t.pnl ?? 0) > 0)
  const losers = closed.filter((t) => (t.pnl ?? 0) <= 0)

  // 1. Win rate
  const winRate = (winners.length / closed.length) * 100
  insights.push(`${winRate.toFixed(0)}% of your trades are profitable (${winners.length} of ${closed.length}).`)

  // 2. Best performing hour
  const hourStats = computeHourlyStats(closed)
  const qualifyingHours = hourStats.filter((h) => h.trades >= 2)
  if (qualifyingHours.length > 0) {
    const best = qualifyingHours.reduce((a, b) => (a.totalPnl / a.trades > b.totalPnl / b.trades ? a : b))
    const label = new Date(0, 0, 0, best.hour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
    const avgPnl = best.totalPnl / best.trades
    const sign = avgPnl >= 0 ? '+' : '-'
    insights.push(`Your best trades happen at ${label} (avg ${sign}$${Math.abs(avgPnl).toFixed(2)} over ${best.trades} trades).`)
  }

  // 3. Hold time: winners vs losers
  const avgWinHold = avgHold(winners)
  const avgLossHold = avgHold(losers)
  if (avgWinHold !== null && avgLossHold !== null) {
    const delta = avgLossHold - avgWinHold
    if (Math.abs(delta) >= 2) {
      if (delta > 0) {
        insights.push(`You hold losing trades ${fmt(delta)} longer than winning trades on average.`)
      } else {
        insights.push(`You exit winning trades ${fmt(Math.abs(delta))} earlier than losing trades — consider letting winners run.`)
      }
    }
  }

  // 4. Best ticker (min 3 trades)
  const tickerMap = new Map<string, { total: number; count: number }>()
  for (const t of closed) {
    const existing = tickerMap.get(t.ticker) ?? { total: 0, count: 0 }
    tickerMap.set(t.ticker, { total: existing.total + (t.pnl ?? 0), count: existing.count + 1 })
  }
  const qualifyingTickers = Array.from(tickerMap.entries()).filter(([, v]) => v.count >= 3)
  if (qualifyingTickers.length > 0) {
    const [bestTicker, bestStats] = qualifyingTickers.reduce((a, b) =>
      a[1].total / a[1].count > b[1].total / b[1].count ? a : b
    )
    const avg = bestStats.total / bestStats.count
    const sign = avg >= 0 ? '+' : '-'
    insights.push(`Your ${bestTicker} trades average ${sign}$${Math.abs(avg).toFixed(2)} P&L (${bestStats.count} trades).`)
  }

  // 5. Revenge trade impact
  const revengeTrades = closed.filter((t) => t.tags?.includes('revenge_trade'))
  const normalTrades = closed.filter((t) => !t.tags?.includes('revenge_trade'))
  if (revengeTrades.length >= 2 && normalTrades.length >= 2) {
    const revengeAvg = revengeTrades.reduce((s, t) => s + (t.pnl ?? 0), 0) / revengeTrades.length
    const normalAvg = normalTrades.reduce((s, t) => s + (t.pnl ?? 0), 0) / normalTrades.length
    const diff = normalAvg - revengeAvg
    if (diff > 0) {
      insights.push(`Your revenge trades average $${diff.toFixed(2)} less than your other trades.`)
    }
  }

  return insights
}
