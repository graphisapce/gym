'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getGymId(supabase: any) {
  const { data } = await supabase.from('gyms').select('id').limit(1).single()
  return data?.id || null
}

export async function addEquipment(formData: FormData) {
  const supabase = await createClient()
  const gymId = await getGymId(supabase)

  if (!gymId) return { error: 'Gym nahi mila database mein.' }

  const name = formData.get('name') as string
  const purchaseDate = formData.get('purchase_date') as string
  const lastServiceDate = formData.get('last_service_date') as string
  const nextServiceDate = formData.get('next_service_date') as string
  const warrantyExpiry = formData.get('warranty_expiry') as string
  const status = formData.get('status') as string

  if (!name) return { error: 'Equipment ka naam zaroori hai.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('equipment').insert({
    gym_id: gymId,
    name,
    purchase_date: purchaseDate || null,
    last_service_date: lastServiceDate || null,
    next_service_date: nextServiceDate || null,
    warranty_expiry: warrantyExpiry || null,
    status: status || 'working',
  })

  if (error) return { error: 'Equipment add nahi ho paya: ' + error.message }

  revalidatePath('/owner/equipment')
  return { success: true }
}

export async function updateEquipment(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const purchaseDate = formData.get('purchase_date') as string
  const lastServiceDate = formData.get('last_service_date') as string
  const nextServiceDate = formData.get('next_service_date') as string
  const warrantyExpiry = formData.get('warranty_expiry') as string
  const status = formData.get('status') as string

  if (!name) return { error: 'Equipment ka naam zaroori hai.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('equipment')
    .update({
      name,
      purchase_date: purchaseDate || null,
      last_service_date: lastServiceDate || null,
      next_service_date: nextServiceDate || null,
      warranty_expiry: warrantyExpiry || null,
      status: status || 'working',
    })
    .eq('id', id)

  if (error) return { error: 'Equipment update nahi ho paya: ' + error.message }

  revalidatePath('/owner/equipment')
  return { success: true }
}

export async function deleteEquipment(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('equipment').delete().eq('id', id)

  if (error) return { error: 'Equipment delete nahi ho paya: ' + error.message }

  revalidatePath('/owner/equipment')
  return { success: true }
}
