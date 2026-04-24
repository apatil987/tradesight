'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/db/supabase-server'
import { deleteTrade } from '@/lib/db/trades'

export async function deleteTradeAction(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await deleteTrade(id)
  revalidatePath('/dashboard/history')
  revalidatePath('/dashboard')
}
