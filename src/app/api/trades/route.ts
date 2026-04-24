import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db/supabase-server'
import { insertTrade } from '@/lib/db/trades'
import { calculateScore } from '@/lib/scoring'
import type { TradeInsert } from '@/types'

function calculatePnl(body: {
  exit_price: number | null
  entry_price: number
  quantity: number
  option_type: string | null
}): number | null {
  if (body.exit_price === null) return null
  const { exit_price, entry_price, quantity, option_type } = body
  return option_type === 'put'
    ? (entry_price - exit_price) * quantity
    : (exit_price - entry_price) * quantity
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const required = ['ticker', 'asset_type', 'quantity', 'entry_price', 'entry_time']
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const pnl = calculatePnl({
    exit_price: body.exit_price as number | null,
    entry_price: body.entry_price as number,
    quantity: body.quantity as number,
    option_type: body.option_type as string | null,
  })

  const score = calculateScore({
    pnl,
    entry_price: body.entry_price as number,
    quantity: body.quantity as number,
    exit_price: (body.exit_price as number) ?? null,
  })

  const trade: TradeInsert = {
    user_id: user.id,
    ticker: (body.ticker as string).toUpperCase(),
    asset_type: body.asset_type as TradeInsert['asset_type'],
    option_type: (body.option_type as TradeInsert['option_type']) ?? null,
    strike: (body.strike as number) ?? null,
    expiration: (body.expiration as string) ?? null,
    quantity: body.quantity as number,
    entry_price: body.entry_price as number,
    exit_price: (body.exit_price as number) ?? null,
    entry_time: body.entry_time as string,
    exit_time: (body.exit_time as string) ?? null,
    pnl,
    score,
    notes: (body.notes as string) ?? null,
    tags: (body.tags as string[]) ?? [],
  }

  try {
    const saved = await insertTrade(trade)
    return NextResponse.json(saved, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
