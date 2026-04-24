import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase-server'
import { getTradeById } from '@/lib/db/trades'
import { getSubScores } from '@/lib/scoring'
import { generateTradeCoaching } from '@/lib/coaching'

function scoreLabel(score: number): string {
  if (score >= 90) return 'Elite'
  if (score >= 70) return 'Great'
  if (score >= 50) return 'Solid'
  if (score >= 25) return 'Weak'
  return 'Poor'
}

function scoreLabelColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatHoldTime(entry: string, exit: string | null): string {
  if (!exit) return 'Open'
  const mins = Math.round((new Date(exit).getTime() - new Date(entry).getTime()) / 60000)
  if (mins < 0) return '—'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-16 text-right text-sm text-white shrink-0">
        {score} <span className={`text-xs ${scoreLabelColor(score)}`}>{scoreLabel(score)}</span>
      </span>
    </div>
  )
}

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const trade = await getTradeById(id, user.id)
  if (!trade) notFound()

  const subScores = getSubScores(trade)
  const overallScore = trade.score
  const hasPnl = trade.pnl !== null
  const coachInsights = generateTradeCoaching(trade, subScores)

  const pnlText = !hasPnl
    ? '—'
    : trade.pnl! >= 0
    ? `+$${trade.pnl!.toFixed(2)}`
    : `-$${Math.abs(trade.pnl!).toFixed(2)}`
  const pnlColor = !hasPnl ? 'text-gray-500' : trade.pnl! > 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/history" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
        ← Back to Trade History
      </Link>

      {/* Trade Summary */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {trade.ticker}
              {trade.option_type && (
                <span className="ml-2 text-base font-normal text-gray-400">
                  {trade.option_type.toUpperCase()}
                  {trade.strike ? ` $${trade.strike}` : ''}
                  {trade.expiration ? ` exp ${trade.expiration}` : ''}
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">{trade.asset_type}</p>
          </div>
          <span className="text-xs text-gray-600 text-right">{formatDate(trade.entry_time)}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Entry Price</p>
            <p className="text-white font-medium">${trade.entry_price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Exit Price</p>
            <p className="text-white font-medium">{trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Quantity</p>
            <p className="text-white font-medium">{trade.quantity}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Hold Time</p>
            <p className="text-white font-medium">{formatHoldTime(trade.entry_time, trade.exit_time)}</p>
          </div>
        </div>
      </div>

      {/* P&L + Score side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* P&L */}
        <div className="bg-gray-900 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Profit / Loss</p>
          <p className={`text-5xl font-bold ${pnlColor}`}>{pnlText}</p>
        </div>

        {/* Score Breakdown */}
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trade Score</p>
          {overallScore !== null ? (
            <>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-4xl font-bold text-white">{overallScore}</span>
                <span className="text-sm text-gray-400">/ 100</span>
                <span className={`text-sm font-semibold ${scoreLabelColor(overallScore)}`}>
                  {scoreLabel(overallScore)}
                </span>
              </div>
              <div className="space-y-3">
                <ScoreBar label="Entry" score={subScores.entry} />
                <ScoreBar label="Exit" score={subScores.exit} />
                <ScoreBar label="Profit Capture" score={subScores.capture} />
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm mt-2">Score available once trade is closed.</p>
          )}
        </div>
      </div>

      {/* What-If Analysis */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-2">What-If Analysis</h2>
        <p className="text-sm text-gray-500">
          Coming soon — will show what you would have made holding 5 or 10 minutes longer once market data is connected.
        </p>
      </div>

      {/* Coach Insight */}
      {coachInsights.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-blue-900/40">
          <h2 className="text-sm font-semibold text-white mb-4">Coach Insight</h2>
          <ul className="space-y-3">
            {coachInsights.map((insight, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="text-base leading-5 shrink-0">💡</span>
                <span className="text-sm text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes & Tags */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-3">Notes & Tags</h2>
        {trade.notes ? (
          <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">{trade.notes}</p>
        ) : (
          <p className="text-gray-600 text-sm mb-4 italic">No notes recorded.</p>
        )}
        {(trade.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {trade.tags!.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-400 border border-gray-700">
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
