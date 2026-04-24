export type AssetType = 'stock' | 'option' | 'crypto' | 'futures'
export type OptionType = 'call' | 'put'

export interface Profile {
  id: string
  email: string
  created_at: string
}

export interface Trade {
  id: string
  user_id: string
  ticker: string
  asset_type: AssetType
  option_type: OptionType | null
  strike: number | null
  expiration: string | null
  quantity: number
  entry_price: number
  exit_price: number | null
  entry_time: string
  exit_time: string | null
  pnl: number | null
  score: number | null
  notes: string | null
  tags: string[]
  created_at: string
}

export type TradeInsert = Omit<Trade, 'id' | 'created_at'>
export type TradeUpdate = Partial<TradeInsert>