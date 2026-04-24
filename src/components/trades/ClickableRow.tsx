'use client'

import { useRouter } from 'next/navigation'

interface Props {
  href: string
  children: React.ReactNode
}

export default function ClickableRow({ href, children }: Props) {
  const router = useRouter()
  return (
    <tr
      onClick={() => router.push(href)}
      className="hover:bg-gray-900/50 cursor-pointer transition-colors"
    >
      {children}
    </tr>
  )
}
