'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TagPicker from './TagPicker'

const inputClass =
  'w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm'
const labelClass = 'block text-xs font-medium text-gray-400 mb-1'

export default function TradeForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [assetType, setAssetType] = useState('stock')
  const [tags, setTags] = useState<string[]>([])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const body = {
      ticker: fd.get('ticker'),
      asset_type: fd.get('asset_type'),
      option_type: fd.get('option_type') || null,
      strike: fd.get('strike') ? Number(fd.get('strike')) : null,
      expiration: fd.get('expiration') || null,
      quantity: Number(fd.get('quantity')),
      entry_price: Number(fd.get('entry_price')),
      exit_price: fd.get('exit_price') ? Number(fd.get('exit_price')) : null,
      entry_time: fd.get('entry_time'),
      exit_time: fd.get('exit_time') || null,
      notes: fd.get('notes') || null,
      tags,
    }

    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to save trade')
      setLoading(false)
      return
    }

    router.push('/dashboard/history')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Ticker</label>
          <input name="ticker" required placeholder="SPX" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Asset Type</label>
          <select
            name="asset_type"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className={inputClass}
          >
            <option value="stock">Stock</option>
            <option value="option">Option</option>
            <option value="crypto">Crypto</option>
            <option value="futures">Futures</option>
          </select>
        </div>
      </div>

      {assetType === 'option' && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Option Type</label>
            <select name="option_type" className={inputClass}>
              <option value="call">Call</option>
              <option value="put">Put</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Strike</label>
            <input name="strike" type="number" step="0.01" placeholder="450.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Expiration</label>
            <input name="expiration" type="date" className={inputClass} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Quantity</label>
          <input name="quantity" type="number" step="0.01" required placeholder="1" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Entry Price</label>
          <input name="entry_price" type="number" step="0.01" required placeholder="0.00" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Exit Price</label>
          <input name="exit_price" type="number" step="0.01" placeholder="0.00" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Entry Time</label>
          <input name="entry_time" type="datetime-local" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Exit Time</label>
          <input name="exit_time" type="datetime-local" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" rows={3} className={inputClass} placeholder="What was your thesis?" />
      </div>

      <div>
        <label className={labelClass}>Tags</label>
        <TagPicker selected={tags} onChange={setTags} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? 'Saving…' : 'Save Trade'}
      </button>
    </form>
  )
}
