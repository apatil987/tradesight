import { createClient } from '@/lib/db/supabase-server'
import { getTradeStats } from '@/lib/db/trades'
import StatCard from '@/components/ui/StatCard'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const stats = await getTradeStats(user.id)

  const pnlFormatted = stats.totalPnl >= 0
    ? `+$${stats.totalPnl.toFixed(2)}`
    : `-$${Math.abs(stats.totalPnl).toFixed(2)}`

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Trades"
          value={String(stats.total)}
        />
        <StatCard
          label="Total P&L"
          value={stats.total === 0 ? '$0.00' : pnlFormatted}
          positive={stats.totalPnl > 0}
          negative={stats.totalPnl < 0}
        />
        <StatCard
          label="Win Rate"
          value={stats.total === 0 ? '—' : `${stats.winRate.toFixed(1)}%`}
          sub={stats.total > 0 ? `${stats.total} trades` : undefined}
        />
        <StatCard
          label="Avg Score"
          value={stats.avgScore !== null ? stats.avgScore.toFixed(1) : '—'}
          sub={stats.avgScore === null ? 'No scored trades yet' : undefined}
        />
      </div>
    </div>
  )
}
