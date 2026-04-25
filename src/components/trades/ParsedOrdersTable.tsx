import type { ParsedOrder } from '@/types'

interface Props {
  orders: ParsedOrder[]
  selected: Set<number>
  onToggle: (i: number) => void
  onToggleAll: () => void
}

export default function ParsedOrdersTable({ orders, selected, onToggle, onToggleAll }: Props) {
  const allSelected = orders.length > 0 && selected.size === orders.length

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
            <th className="pb-3 pr-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="accent-blue-500"
              />
            </th>
            <th className="pb-3 pr-4">Ticker</th>
            <th className="pb-3 pr-4">Action</th>
            <th className="pb-3 pr-4">Qty</th>
            <th className="pb-3 pr-4">Price</th>
            <th className="pb-3 pr-4">Date / Time</th>
            <th className="pb-3 pr-4">Asset</th>
            <th className="pb-3 pr-4">Opt Type</th>
            <th className="pb-3">Strike</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {orders.map((order, i) => (
            <tr
              key={i}
              onClick={() => onToggle(i)}
              className={`cursor-pointer transition-colors hover:bg-gray-800/40 ${
                selected.has(i) ? '' : 'opacity-35'
              }`}
            >
              <td className="py-3 pr-4">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => onToggle(i)}
                  onClick={(e) => e.stopPropagation()}
                  className="accent-blue-500"
                />
              </td>
              <td className="py-3 pr-4 font-semibold text-white">{order.ticker}</td>
              <td className={`py-3 pr-4 font-medium ${order.action === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {order.action.toUpperCase()}
              </td>
              <td className="py-3 pr-4 text-gray-300">{order.quantity}</td>
              <td className="py-3 pr-4 text-gray-300">${order.price.toFixed(2)}</td>
              <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{order.date} {order.time}</td>
              <td className="py-3 pr-4 text-gray-400 capitalize">{order.asset_type}</td>
              <td className="py-3 pr-4 text-gray-400 capitalize">{order.option_type ?? '—'}</td>
              <td className="py-3 text-gray-400">{order.strike ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
