import { createClient } from '@/lib/db/supabase-server'
import { getTradeStats } from '@/lib/db/trades'
import StatCard from '@/components/ui/StatCard'
import { redirect } from 'next/navigation'

function fmtPnl(val: number | null): { text: string; pos: boolean; neg: boolean } {
  if (val === null) return { text: '—', pos: false, neg: false }
  const text = val >= 0 ? `+$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`
  return { text, pos: val > 0, neg: val < 0 }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const stats = await getTradeStats(user.id)

  const totalPnlText = stats.totalPnl >= 0
    ? `+$${stats.totalPnl.toFixed(2)}`
    : `-$${Math.abs(stats.totalPnl).toFixed(2)}`

  const best = fmtPnl(stats.bestPnl)
  const worst = fmtPnl(stats.worstPnl)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Total Trades"
          value={String(stats.total)}
        />
        <StatCard
          label="Total P&L"
          value={stats.total === 0 ? '$0.00' : totalPnlText}
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
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Best Trade"
          value={best.text}
          positive={best.pos}
          negative={best.neg}
        />
        <StatCard
          label="Worst Trade"
          value={worst.text}
          positive={worst.pos}
          negative={worst.neg}
        />
      </div>
    </div>
  )
}
