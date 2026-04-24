import { redirect } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-server'
import { getTrades } from '@/lib/db/trades'
import DeleteButton from '@/components/trades/DeleteButton'
import ClickableRow from '@/components/trades/ClickableRow'
import type { Trade } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatHoldTime(entry: string, exit: string | null): string {
  if (!exit) return '—'
  const mins = Math.round((new Date(exit).getTime() - new Date(entry).getTime()) / 60000)
  if (mins < 0) return '—'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function formatPnl(pnl: number | null): { text: string; className: string } {
  if (pnl === null) return { text: '—', className: 'text-gray-500' }
  const text = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`
  return { text, className: pnl > 0 ? 'text-green-400' : 'text-red-400' }
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const trades: Trade[] = await getTrades(user.id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Trade History</h1>

      {trades.length === 0 ? (
        <p className="text-gray-500 text-sm">No trades yet. <a href="/dashboard/add-trade" className="text-blue-400 hover:underline">Add your first trade.</a></p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="pb-3 pr-6">Ticker</th>
                <th className="pb-3 pr-6">Date</th>
                <th className="pb-3 pr-6">P&L</th>
                <th className="pb-3 pr-6">Score</th>
                <th className="pb-3 pr-6">Hold Time</th>
                <th className="pb-3 pr-6">Tags</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {trades.map((trade) => {
                const pnl = formatPnl(trade.pnl)
                return (
                  <ClickableRow key={trade.id} href={`/dashboard/trades/${trade.id}`}>
                    <td className="py-3 pr-6 font-semibold text-white">
                      {trade.ticker}
                      {trade.option_type && (
                        <span className="ml-1.5 text-xs text-gray-500 font-normal">
                          {trade.option_type.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-6 text-gray-400">{formatDate(trade.entry_time)}</td>
                    <td className={`py-3 pr-6 font-medium ${pnl.className}`}>{pnl.text}</td>
                    <td className="py-3 pr-6 text-gray-400">
                      {trade.score !== null ? trade.score.toFixed(0) : '—'}
                    </td>
                    <td className="py-3 pr-6 text-gray-400">
                      {formatHoldTime(trade.entry_time, trade.exit_time)}
                    </td>
                    <td className="py-3 pr-6">
                      <div className="flex flex-wrap gap-1">
                        {(trade.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400"
                          >
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <DeleteButton tradeId={trade.id} />
                    </td>
                  </ClickableRow>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
