'use client'

import { useTransition } from 'react'
import { deleteTradeAction } from '@/lib/actions/trades'

export default function DeleteButton({ tradeId }: { tradeId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this trade?')) return
    startTransition(() => deleteTradeAction(tradeId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
