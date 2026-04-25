export interface MarketData {
  ticker: string
  date: string
  entry_price: number | null
  exit_price: number | null
  price_5min_after_exit: number | null
  price_10min_after_exit: number | null
  max_high_during_hold: number | null
  max_high_after_exit: number | null
  min_low_during_hold: number | null
  min_low_after_exit: number | null
  moved_in_favor: boolean | null
}

function utcToEastern(iso: string): { date: string; time: string } {
  const dt = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hour = get('hour') === '24' ? '00' : get('hour')

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}`,
  }
}

const SERVICE_URL = process.env.MARKET_DATA_SERVICE_URL ?? 'http://localhost:8000'

export async function fetchMarketData(
  ticker: string,
  entryIso: string,
  exitIso: string,
): Promise<MarketData | null> {
  try {
    const { date, time: entry_time } = utcToEastern(entryIso)
    const { time: exit_time } = utcToEastern(exitIso)

    const params = new URLSearchParams({ ticker, date, entry_time, exit_time, tz: 'America/New_York'})
    const res = await fetch(`${SERVICE_URL}/candles?${params}`)

    if (!res.ok) return null
    return (await res.json()) as MarketData
  } catch {
    return null
  }
}
