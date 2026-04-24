import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/db/supabase-server'
import { getTradeById } from '@/lib/db/trades'
import TradeForm from '@/components/trades/TradeForm'

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const trade = await getTradeById(id, user.id)
  if (!trade) notFound()

  return (
    <div className="max-w-2xl">
      <Link
        href={`/dashboard/trades/${id}`}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        ← Back to Trade
      </Link>
      <h1 className="text-2xl font-bold text-white mt-4 mb-8">
        Edit Trade — {trade.ticker}
      </h1>
      <TradeForm initialData={trade} tradeId={id} />
    </div>
  )
}
