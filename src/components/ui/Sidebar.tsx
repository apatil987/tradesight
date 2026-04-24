'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/add-trade', label: 'Add Trade' },
  { href: '/dashboard/history', label: 'Trade History' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-gray-900 min-h-screen flex flex-col py-8 px-4 gap-1">
      <span className="text-white font-bold text-lg mb-6 px-2">TradeSight</span>
      {links.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </aside>
  )
}
