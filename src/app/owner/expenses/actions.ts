'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getGymId(supabase: any) {
  const { data } = await supabase.from('gyms').select('id').limit(1).single()
  return data?.id || null
}

export async function addExpense(formData: FormData) {
  const supabase = await createClient()
  const gymId = await getGymId(supabase)

  if (!gymId) return { error: 'Gym association error.' }

  const category = formData.get('category') as string
  const amountStr = formData.get('amount') as string
  const expenseDate = formData.get('expense_date') as string
  const description = formData.get('description') as string

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) return { error: 'Invalid amount.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('expenses').insert({
    gym_id: gymId,
    category,
    amount,
    expense_date: expenseDate,
    description: description || null
  })

  if (error) return { error: error.message }

  revalidatePath('/owner/expenses')
  revalidatePath('/owner/dashboard')
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('expenses').delete().eq('id', expenseId)

  if (error) return { error: error.message }

  revalidatePath('/owner/expenses')
  revalidatePath('/owner/dashboard')
  return { success: true }
}
