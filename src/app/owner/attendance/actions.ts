'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getGymId(supabase: any) {
  const { data } = await supabase.from('gyms').select('id').limit(1).single()
  return data?.id || null
}

export async function searchMembers(query: string) {
  if (!query || query.length < 2) return []
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return []
  
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('members')
    .select('id, name, phone, expiry_date, status')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(5)

  return data || []
}

export async function markPresent(memberId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') {
    return { error: 'Unauthorized: Only owners can mark attendance.' }
  }

  const gymId = await getGymId(supabase)

  if (!gymId) {
    return { error: 'No gym context available.' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('attendance').insert({
    member_id: memberId,
    gym_id: gymId
  })

  // Important: Since we want UI immediate feedback, revalidate is crucial.
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/owner/attendance')
  return { success: true }
}
