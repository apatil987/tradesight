'use client'

import { useState, useRef, useCallback } from 'react'
import type { ParsedOrder } from '@/types'
import { matchOrders } from '@/lib/trade-matching'
import ParsedOrdersTable from './ParsedOrdersTable'

type Status = 'idle' | 'parsing' | 'review' | 'saving' | 'done' | 'error'

export default function ScreenshotImporter() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<ParsedOrder[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [savedCount, setSavedCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function applyFile(f: File) {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setStatus('idle')
    setOrders([])
    setSelected(new Set())
    setError(null)
    setSavedCount(0)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) applyFile(f)
  }

  async function handleParse() {
    if (!file) return
    setStatus('parsing')
    setError(null)
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res = await fetch('/api/parse-screenshot', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Parse failed')
      const parsed = data as ParsedOrder[]
      setOrders(parsed)
      setSelected(new Set(parsed.map((_, i) => i)))
      if (parsed.length === 0) {
        setError('No filled trades found in the screenshot.')
        setStatus('error')
      } else {
        setStatus('review')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse screenshot')
      setStatus('error')
    }
  }

  async function handleSave() {
    const selectedOrders = orders.filter((_, i) => selected.has(i))
    const trades = matchOrders(selectedOrders, '')
    if (trades.length === 0) {
      setError('No matched buy/sell pairs found. Trades need both an open and close order to import.')
      return
    }
    setStatus('saving')
    let count = 0
    const errs: string[] = []
    await Promise.all(
      trades.map(async (trade) => {
        const res = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trade),
        })
        if (res.ok) {
          count++
        } else {
          const d = await res.json().catch(() => ({}))
          errs.push(d.error ?? 'Save failed')
        }
      })
    )
    setSavedCount(count)
    if (errs.length > 0) setError(`Saved ${count} trade(s). Errors: ${errs.join('; ')}`)
    setStatus('done')
  }

  const toggleOne = useCallback((i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === orders.length ? new Set() : new Set(orders.map((_, i) => i))
    )
  }, [orders])

  const canParse = file && status !== 'parsing'
  const canSave = status === 'review' && selected.size > 0

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-700 hover:border-blue-600 rounded-xl p-10 text-center cursor-pointer transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
        />
        {file ? (
          <p className="text-sm text-gray-300">
            <span className="font-medium text-white">{file.name}</span>
            <span className="text-gray-500 ml-2">({(file.size / 1024).toFixed(0)} KB)</span>
            <span className="text-gray-500 ml-2">— click or drop to replace</span>
          </p>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-1">Drag and drop a screenshot here</p>
            <p className="text-gray-600 text-xs">or click to select — JPEG, PNG, WebP up to 10MB</p>
          </>
        )}
      </div>

      {/* Preview */}
      {previewUrl && (
        <img src={previewUrl} alt="Screenshot preview" className="max-h-64 rounded-xl border border-gray-800 object-contain" />
      )}

      {/* Parse button */}
      {file && status !== 'done' && (
        <button
          onClick={handleParse}
          disabled={!canParse}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {status === 'parsing' ? 'Claude is reading your screenshot…' : 'Parse Screenshot'}
        </button>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Results */}
      {(status === 'review' || status === 'saving') && orders.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {orders.length} order{orders.length !== 1 ? 's' : ''} found — select which to include
            </h2>
            <span className="text-xs text-gray-500">{selected.size} selected</span>
          </div>
          <ParsedOrdersTable orders={orders} selected={selected} onToggle={toggleOne} onToggleAll={toggleAll} />
          <div className="pt-2 border-t border-gray-800 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={!canSave || status === 'saving'}
              className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {status === 'saving' ? 'Saving…' : `Save Selected Trades`}
            </button>
            <p className="text-xs text-gray-500">
              Matched buy/sell pairs will be saved as completed trades.
            </p>
          </div>
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div className="bg-green-950/40 border border-green-800/50 rounded-xl p-5">
          <p className="text-green-400 font-semibold text-sm">
            {savedCount} trade{savedCount !== 1 ? 's' : ''} imported successfully.
          </p>
          <button
            onClick={() => { setFile(null); setPreviewUrl(null); setStatus('idle'); setOrders([]); setError(null) }}
            className="mt-3 text-xs text-gray-400 hover:text-white transition-colors underline"
          >
            Import another screenshot
          </button>
        </div>
      )}
    </div>
  )
}
