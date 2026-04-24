export interface MarketData {
  ticker: string
  date: string
  entry_price: number | null
  exit_price: number | null
  price_5min_after_exit: number | null
  price_10min_after_exit: number | null
  max_high_during_hold: number | null
  max_high_after_exit: number | null
  moved_in_favor: boolean | null
}

function toDateAndTime(iso: string): { date: string; time: string } {
  const normalized = iso.slice(0, 16) // "2026-04-09T09:55"
  const [date, time] = normalized.split('T')
  return { date, time }
}

const SERVICE_URL = process.env.MARKET_DATA_SERVICE_URL ?? 'http://localhost:8000'

export async function fetchMarketData(
  ticker: string,
  entryIso: string,
  exitIso: string,
): Promise<MarketData | null> {
  try {
    const { date, time: entry_time } = toDateAndTime(entryIso)
    const { time: exit_time } = toDateAndTime(exitIso)

    const params = new URLSearchParams({ ticker, date, entry_time, exit_time })
    const res = await fetch(`${SERVICE_URL}/candles?${params}`, {
      next: { revalidate: 3600 }, // historical candles don't change
    })

    if (!res.ok) return null
    return (await res.json()) as MarketData
  } catch {
    return null
  }
}
