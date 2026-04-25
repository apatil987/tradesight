import { redirect } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-server'
import { getTrades } from '@/lib/db/trades'
import { computeHourlyStats, generateInsights } from '@/lib/analytics'

function fmtHour(h: number): string {
  return new Date(0, 0, 0, h).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

function fmtPnl(n: number): string {
  return n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`
}

function InsightIcon({ text }: { text: string }) {
  const base = 'w-5 h-5 shrink-0 mt-0.5'
  // Win rate: starts with a digit
  if (/^\d/.test(text)) {
    return (
      <svg className={`${base} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
  // Best hour
  if (text.startsWith('Your best trades')) {
    return (
      <svg className={`${base} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  // Hold time (winners vs losers)
  if (text.startsWith('You hold') || text.startsWith('You exit')) {
    return (
      <svg className={`${base} text-yellow-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  }
  // Revenge trades
  if (text.startsWith('Your revenge')) {
    return (
      <svg className={`${base} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
  // Best ticker (default)
  return (
    <svg className={`${base} text-purple-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  )
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const trades = await getTrades(user.id)
  const hourStats = computeHourlyStats(trades)
  const insights = generateInsights(trades)

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Time of Day Breakdown</h2>
        {hourStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No completed trades yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm max-w-2xl">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="pb-3 pr-8">Hour</th>
                  <th className="pb-3 pr-8">Trades</th>
                  <th className="pb-3 pr-8">Win Rate</th>
                  <th className="pb-3">Avg P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {hourStats.map((row) => {
                  const winRate = (row.wins / row.trades) * 100
                  const avgPnl = row.totalPnl / row.trades
                  return (
                    <tr key={row.hour} className="hover:bg-gray-900/50 transition-colors">
                      <td className="py-3 pr-8 text-white font-medium">{fmtHour(row.hour)}</td>
                      <td className="py-3 pr-8 text-gray-400">{row.trades}</td>
                      <td className="py-3 pr-8 text-gray-400">{winRate.toFixed(0)}%</td>
                      <td className={`py-3 font-medium ${avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fmtPnl(avgPnl)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Insights</h2>
        {insights.length === 0 ? (
          <p className="text-gray-500 text-sm">Add at least 3 completed trades to see insights.</p>
        ) : (
          <div className="space-y-3">
            {insights.map((text, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex gap-3 items-start">
                <InsightIcon text={text} />
                <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
