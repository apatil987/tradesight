import type { MarketData } from '@/lib/market-data'

interface Props {
  entryPrice: number
  quantity: number
  pnl: number | null
  marketData: MarketData | null
}

function calcPnl(price: number | null | undefined, entryPrice: number, quantity: number): number | null {
  if (price == null) return null
  return (price - entryPrice) * quantity
}

function fmtPnl(val: number | null): { text: string; cls: string } {
  if (val === null) return { text: '—', cls: 'text-gray-500' }
  const text = val >= 0 ? `+$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`
  return { text, cls: val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-gray-400' }
}

function fmtDiff(val: number | null, baseline: number | null): string | null {
  if (val === null || baseline === null) return null
  const diff = val - baseline
  if (Math.abs(diff) < 0.005) return '= same as exit'
  return diff > 0
    ? `▲ $${diff.toFixed(2)} better than exit`
    : `▼ $${Math.abs(diff).toFixed(2)} worse than exit`
}

function Stat({
  label, value, cls, sub, subCls,
}: {
  label: string
  value: string
  cls?: string
  sub?: string | null
  subCls?: string
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${cls ?? 'text-white'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${subCls ?? 'text-gray-500'}`}>{sub}</p>}
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

  const isLoss = pnl !== null && pnl < 0

  const whatIf5  = calcPnl(marketData.price_5min_after_exit,  entryPrice, quantity)
  const whatIf10 = calcPnl(marketData.price_10min_after_exit, entryPrice, quantity)
  const maxPossible = calcPnl(marketData.max_high_during_hold ?? null, entryPrice, quantity)
  const worstPnl    = calcPnl(marketData.min_low_during_hold  ?? null, entryPrice, quantity)

  // Capture %: clamp 0–100; losing trades always show 0
  const capturePct =
    !isLoss && pnl !== null && maxPossible !== null && maxPossible > 0
      ? Math.max(0, Math.min(100, Math.round((pnl / maxPossible) * 100)))
      : null

  const capturePctDisplay = isLoss
    ? { value: '0% — trade moved against you', cls: 'text-red-400 text-sm' }
    : capturePct !== null
    ? {
        value: `${capturePct}%`,
        cls: capturePct >= 70 ? 'text-green-400' : capturePct >= 40 ? 'text-yellow-400' : 'text-red-400',
      }
    : { value: '—', cls: 'text-gray-500' }

  // Pain point: how far underwater at worst
  const painPointDisplay =
    worstPnl !== null && worstPnl < 0
      ? { value: `-$${Math.abs(worstPnl).toFixed(2)} at worst`, cls: 'text-red-400' }
      : worstPnl !== null
      ? { value: 'Never went negative', cls: 'text-green-400' }
      : { value: '—', cls: 'text-gray-500' }

  const actual = fmtPnl(pnl)
  const max    = fmtPnl(maxPossible)
  const w5     = fmtPnl(whatIf5)
  const w10    = fmtPnl(whatIf10)
  const worst  = fmtPnl(worstPnl)

  const w5diff  = fmtDiff(whatIf5,  pnl)
  const w10diff = fmtDiff(whatIf10, pnl)
  const w5diffCls  = whatIf5 != null && pnl != null ? (whatIf5 > pnl ? 'text-green-400' : whatIf5 < pnl ? 'text-red-400' : 'text-gray-500') : 'text-gray-500'
  const w10diffCls = whatIf10 != null && pnl != null ? (whatIf10 > pnl ? 'text-green-400' : whatIf10 < pnl ? 'text-red-400' : 'text-gray-500') : 'text-gray-500'

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white mb-5">What-If Analysis</h2>

      {/* Upside row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-5">
        <Stat label="Actual P&L"   value={actual.text} cls={actual.cls} />
        <Stat label="Max Possible" value={max.text}    cls={max.cls} />
        <Stat label="Capture %"    value={capturePctDisplay.value} cls={capturePctDisplay.cls} />
        <Stat label="Max High (hold)" value={
          marketData.max_high_during_hold != null
            ? `$${marketData.max_high_during_hold.toFixed(2)}` : '—'
        } />
      </div>

      {/* Downside / worst-case row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-5">
        <Stat label="Worst P&L (drawdown)" value={worst.text} cls={worst.cls} />
        <Stat label="Pain Point"           value={painPointDisplay.value} cls={painPointDisplay.cls} />
        <Stat label="Min Low (hold)" value={
          marketData.min_low_during_hold != null
            ? `$${marketData.min_low_during_hold.toFixed(2)}` : '—'
        } />
      </div>

      {/* What-if +5/+10 with comparison */}
      <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-5">
        <Stat label="If held +5 min"  value={w5.text}  cls={w5.cls}  sub={w5diff}  subCls={w5diffCls} />
        <Stat label="If held +10 min" value={w10.text} cls={w10.cls} sub={w10diff} subCls={w10diffCls} />
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
