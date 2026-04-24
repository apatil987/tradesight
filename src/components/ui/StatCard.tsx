interface StatCardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean
  negative?: boolean
}

export default function StatCard({ label, value, sub, positive, negative }: StatCardProps) {
  const valueColor = positive
    ? 'text-green-400'
    : negative
    ? 'text-red-400'
    : 'text-white'

  return (
    <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${valueColor}`}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}
