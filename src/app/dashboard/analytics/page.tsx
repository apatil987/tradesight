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

      {/* Time of day breakdown */}
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

      {/* Insights */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Insights</h2>
        {insights.length === 0 ? (
          <p className="text-gray-500 text-sm">Add at least 3 completed trades to see insights.</p>
        ) : (
          <ul className="space-y-3">
            {insights.map((text, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-300 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
