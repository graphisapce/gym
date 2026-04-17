'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getGymId(supabase: any) {
  const { data } = await supabase.from('gyms').select('id').limit(1).single()
  return data?.id || null
}

export async function addLead(formData: FormData) {
  const supabase = await createClient()
  const gymId = await getGymId(supabase)

  if (!gymId) {
    return { error: 'No gym context available to assign lead.' }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const interest = formData.get('interest') as string
  const followUpDate = formData.get('follow_up_date') as string

  if (!name || !phone) {
    return { error: 'Name and Phone are mandatory fields.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') {
    return { error: 'Unauthorized' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('leads').insert({
    gym_id: gymId,
    name,
    phone,
    interest,
    follow_up_date: followUpDate || null,
    status: 'new' // Explicitly set starting state
  })

  if (error) {
    return { error: 'Failed to add lead: ' + error.message }
  }

  revalidatePath('/owner/leads')
  return { success: true }
}

export async function updateLeadStatus(leadId: string, newStatus: string) {
  const supabase = await createClient()

  if (!leadId || !newStatus) return { error: 'Missing parameters' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') {
    return { error: 'Unauthorized' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId)

  if (error) {
    return { error: 'Failed to update status: ' + error.message }
  }

  revalidatePath('/owner/leads')
  return { success: true }
}
