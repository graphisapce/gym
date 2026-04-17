'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getGymId(supabase: any) {
  const { data } = await supabase.from('gyms').select('id').limit(1).single()
  return data?.id || null
}

export async function addTrainer(formData: FormData) {
  const supabase = await createClient()
  const gymId = await getGymId(supabase)

  if (!gymId) return { error: 'Gym nahi mila database mein.' }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const salary = parseInt((formData.get('salary') as string) || '0', 10)
  const joiningDate = formData.get('joining_date') as string

  if (!name || !phone) return { error: 'Name aur Phone dono zaroori hain.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('trainers').insert({
    gym_id: gymId,
    name,
    phone,
    salary,
    joining_date: joiningDate || null
  })

  if (error) return { error: 'Trainer add nahi ho paya: ' + error.message }

  revalidatePath('/owner/trainers')
  return { success: true }
}

export async function deleteTrainer(trainerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  // Pehle assigned members se trainer hata do
  await adminClient.from('members').update({ trainer_id: null }).eq('trainer_id', trainerId)

  const { error } = await adminClient.from('trainers').delete().eq('id', trainerId)

  if (error) return { error: 'Trainer delete nahi ho paya: ' + error.message }

  revalidatePath('/owner/trainers')
  return { success: true }
}

export async function assignMembersToTrainer(trainerId: string, memberIds: string[]) {
  const supabase = await createClient()

  if (!trainerId) {
    return { error: 'Trainer ID missing.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()

  // Pehle purane assignments hata do is trainer ke
  await adminClient.from('members').update({ trainer_id: null }).eq('trainer_id', trainerId)

  // Agar koi member select nahi kiya toh sirf clear karo (valid use case)
  if (memberIds.length > 0) {
    const { error } = await adminClient
      .from('members')
      .update({ trainer_id: trainerId })
      .in('id', memberIds)

    if (error) return { error: 'Members assign nahi ho paye: ' + error.message }
  }

  revalidatePath('/owner/trainers')
  revalidatePath('/owner/members')
  return { success: true }
}
