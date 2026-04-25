interface StatCardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean
  negative?: boolean
}

export default function StatCard({ label, value, sub, positive, negative }: StatCardProps) {
  const valueColor = positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-white'
  const gradientTo = positive
    ? 'to-green-950/30'
    : negative
    ? 'to-red-950/30'
    : 'to-gray-800/50'

  return (
    <div className={`bg-gradient-to-br from-gray-900 ${gradientTo} rounded-xl p-5 flex flex-col gap-1 border border-gray-800/60`}>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${valueColor}`}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}
