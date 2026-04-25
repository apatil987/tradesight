'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-browser'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/add-trade', label: 'Add Trade' },
  { href: '/dashboard/import', label: 'Import Screenshot' },
  { href: '/dashboard/history', label: 'Trade History' },
  { href: '/dashboard/analytics', label: 'Analytics' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-gray-900 min-h-screen flex flex-col py-8 px-4">
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">TS</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight">TradeSight</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
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
      </nav>

      <div className="border-t border-gray-800 pt-4">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
