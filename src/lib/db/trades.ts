import { createClient } from './supabase-server'
import type { Trade, TradeInsert } from '@/types'

export async function getTrades(userId: string): Promise<Trade[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('entry_time', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Trade[]
}

export async function getTradeById(id: string, userId: string): Promise<Trade | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data as Trade
}

export async function deleteTrade(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trades').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function insertTrade(trade: TradeInsert): Promise<Trade> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .insert(trade)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Trade
}

export async function getTradeStats(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trades')
    .select('pnl, score')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  const trades = data ?? []
  const total = trades.length
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
  const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length
  const winRate = total > 0 ? (wins / total) * 100 : 0
  const scoredTrades = trades.filter((t) => t.score !== null)
  const avgScore =
    scoredTrades.length > 0
      ? scoredTrades.reduce((sum, t) => sum + (t.score ?? 0), 0) / scoredTrades.length
      : null

  return { total, totalPnl, winRate, avgScore }
}
