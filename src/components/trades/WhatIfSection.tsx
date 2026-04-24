import type { MarketData } from '@/lib/market-data'

interface Props {
  entryPrice: number
  quantity: number
  pnl: number | null
  marketData: MarketData | null
}

function calcPnl(exitPrice: number | null, entryPrice: number, quantity: number): number | null {
  if (exitPrice === null) return null
  return (exitPrice - entryPrice) * quantity
}

function fmtPnl(val: number | null): { text: string; cls: string } {
  if (val === null) return { text: '—', cls: 'text-gray-500' }
  const text = val >= 0 ? `+$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`
  return { text, cls: val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-gray-400' }
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${cls ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

export default function WhatIfSection({ entryPrice, quantity, pnl, marketData }: Props) {
  if (!marketData) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-2">What-If Analysis</h2>
        <p className="text-sm text-gray-500">
          Coming soon — will show what you would have made holding 5 or 10 minutes longer once market data is connected.
        </p>
      </div>
    )
  }

  const whatIf5 = calcPnl(marketData.price_5min_after_exit, entryPrice, quantity)
  const whatIf10 = calcPnl(marketData.price_10min_after_exit, entryPrice, quantity)
  const maxPossible = marketData.max_high_during_hold !== null
    ? (marketData.max_high_during_hold - entryPrice) * quantity
    : null

  const capturePct =
    pnl !== null && maxPossible !== null && maxPossible > 0
      ? Math.min(100, Math.round((pnl / maxPossible) * 100))
      : null

  const actual = fmtPnl(pnl)
  const max = fmtPnl(maxPossible)
  const w5 = fmtPnl(whatIf5)
  const w10 = fmtPnl(whatIf10)

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white mb-5">What-If Analysis</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-5">
        <Stat label="Actual P&L" value={actual.text} cls={actual.cls} />
        <Stat label="Max Possible" value={max.text} cls={max.cls} />
        <Stat
          label="Capture %"
          value={capturePct !== null ? `${capturePct}%` : '—'}
          cls={
            capturePct === null ? 'text-gray-500'
            : capturePct >= 70 ? 'text-green-400'
            : capturePct >= 40 ? 'text-yellow-400'
            : 'text-red-400'
          }
        />
        <Stat label="Max High (hold)" value={
          marketData.max_high_during_hold !== null
            ? `$${marketData.max_high_during_hold.toFixed(2)}`
            : '—'
        } />
      </div>

      <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-5">
        <Stat label="If held +5 min" value={w5.text} cls={w5.cls} />
        <Stat label="If held +10 min" value={w10.text} cls={w10.cls} />
      </div>

      {capturePct !== null && maxPossible !== null && maxPossible > 0 && (
        <p className="mt-4 text-xs text-gray-500">
          You captured {capturePct}% of the available move.
          {capturePct < 50 && ' Consider holding longer on similar setups.'}
          {capturePct >= 90 && ' Near-perfect exit.'}
        </p>
      )}
    </div>
  )
}
