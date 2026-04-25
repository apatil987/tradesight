import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/db/supabase-server'

const anthropic = new Anthropic()

const PROMPT = `This is a brokerage order history screenshot. Extract all FILLED trades only (ignore CANCELED, WORKING, SAVED). Return ONLY a valid JSON array with no markdown formatting.

Each trade object must have:
- ticker: string (e.g. 'SPX', 'NVDA', 'VOO')
- action: 'buy' or 'sell' (BOT = buy, SOLD = sell)
- quantity: positive number (ignore +/- sign)
- price: number (the price after @)
- date: string in YYYY-MM-DD format
- time: string in HH:MM format (24hr)
- asset_type: 'stock' or 'option'
- option_type: 'call' or 'put' or null (C = call, P = put)
- strike: number or null (the strike price for options)
- expiration: string YYYY-MM-DD or null (expiration date for options)

If no trades found return []. Example output:
[{"ticker":"SPX","action":"sell","quantity":4,"price":10.40,"date":"2026-04-02","time":"13:33","asset_type":"option","option_type":"put","strike":6565,"expiration":"2026-04-02"}]`

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type AllowedType = typeof ALLOWED_TYPES[number]

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limiting — gracefully skip if migration hasn't been run
  const today = new Date().toISOString().split('T')[0]
  let currentCount = 0
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('screenshot_count, screenshot_reset_date')
      .eq('id', user.id)
      .single()

    if (!error && profile) {
      const resetDate = profile.screenshot_reset_date ?? today
      currentCount = resetDate < today ? 0 : (profile.screenshot_count ?? 0)
    }
  } catch { /* columns not yet migrated — rate limiting disabled */ }

  if (currentCount >= 50) {
    return NextResponse.json({ error: 'Daily limit reached (50 screenshots per day)' }, { status: 429 })
  }

  // Parse multipart form
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: 'File must be JPEG, PNG, GIF, or WebP' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 })
  }

  // Convert to base64
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  // Call Claude Vision
  let parsed: unknown[]
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: file.type as AllowedType, data: base64 },
          },
          { type: 'text', text: PROMPT },
        ],
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) parsed = []
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to parse screenshot: ${msg}` }, { status: 500 })
  }

  // Update rate limit count
  try {
    await supabase.from('profiles').update({
      screenshot_count: currentCount + 1,
      screenshot_reset_date: today,
    }).eq('id', user.id)
  } catch { /* migration not run — skip */ }

  return NextResponse.json(parsed)
}
