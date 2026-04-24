import type { Trade } from '@/types'

type SubScores = { entry: number; exit: number; capture: number }

type TradeInput = Pick<Trade, 'pnl' | 'tags' | 'entry_time' | 'exit_time' | 'score'>

export function generateTradeCoaching(trade: TradeInput, subScores: SubScores): string[] {
  if (trade.pnl === null || trade.score === null) return []

  const tags = trade.tags ?? []
  const items: string[] = []

  // Score assessment — fires at both performance extremes
  if (trade.score >= 80) {
    items.push(`Strong trade — score of ${trade.score}. Study this setup and look to repeat it.`)
  } else if (trade.score < 40) {
    items.push(`Score of ${trade.score} — take time to review what went wrong before your next trade.`)
  }

  // Positive reinforcement for elite execution (skip if already praised above)
  if (subScores.exit >= 90 && subScores.capture >= 90 && trade.score < 80) {
    items.push('Excellent exit — you captured the bulk of this move.')
  }

  // Bad entry timing
  if (subScores.entry < 25) {
    items.push('Your entry timing was off — price moved against you after entry. Wait for stronger confirmation before pulling the trigger.')
  }

  // Behavioral tag: revenge trade
  if (tags.includes('revenge_trade')) {
    items.push('This was tagged as a revenge trade. Revenge trading after a loss leads to poor decisions — consider stepping away for at least 15 minutes after a loser.')
  }

  // Behavioral tag: chasing
  if (tags.includes('chasing')) {
    items.push('You tagged this as chasing. Chasing entries means buying after the move has already started — wait for a pullback or a cleaner setup next time.')
  }

  // Holding a losing trade too long
  if (trade.pnl < 0 && trade.exit_time) {
    const holdMins = (new Date(trade.exit_time).getTime() - new Date(trade.entry_time).getTime()) / 60000
    if (holdMins > 60) {
      items.push(`You held a losing trade for over ${Math.round(holdMins)} minutes. Cutting losses earlier protects your capital — define your max loss before entry.`)
    }
  }

  // Cap warnings at 3, then always append the actionable tip
  const capped = items.slice(0, 3)

  const weakest = (Object.entries(subScores) as [keyof SubScores, number][]).reduce((a, b) =>
    a[1] <= b[1] ? a : b
  )[0]

  const tips: Record<keyof SubScores, string> = {
    entry: 'Next trade: wait for at least two confluence signals before entering — a stronger entry changes the risk profile entirely.',
    exit: 'Next trade: set a profit target before you enter and honor it when price gets there.',
    capture: 'Next trade: try holding your position a bit longer — you tend to exit before the full move plays out.',
  }

  capped.push(tips[weakest])
  return capped
}
