'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recordPayment(formData: FormData) {
  const supabase = await createClient()

  // 1. Manually verify user role securely (since we are bypassing RLS next)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') {
    return { error: 'Unauthorized: Only owners can record payments.' }
  }

  const memberId = formData.get('member_id') as string
  const amountStr = formData.get('amount') as string
  const paymentDate = formData.get('payment_date') as string
  const note = (formData.get('note') as string) || null

  const amount = parseInt(amountStr, 10)

  if (!memberId || isNaN(amount) || amount <= 0 || !paymentDate) {
    return { error: 'Invalid or missing fields. Ensure amount > 0.' }
  }

  // Use Admin Client to bypass missing RLS Insert policies on the 'payments' table
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // 2. Get the member details to auto-resolve 'plan' and 'gym_id'
  const { data: member, error: memberErr } = await adminClient
    .from('members')
    .select('plan, pending_amount, gym_id')
    .eq('id', memberId)
    .single()

  if (memberErr || !member) {
    return { error: 'Could not fetch member details securely.' }
  }

  // 3. Insert into Payments using Admin Client
  const { error: insertErr } = await adminClient.from('payments').insert({
    member_id: memberId,
    gym_id: member.gym_id,
    amount: amount,
    payment_date: paymentDate,
    plan: member.plan, // Extracted dynamically 
    note: note
  })

  if (insertErr) {
    return { error: 'Failed to log the payment: ' + insertErr.message }
  }

  // 4. Mathematical Clamp subtraction from members `pending_amount`
  const currentPending = member.pending_amount || 0
  const adjustedPending = Math.max(0, currentPending - amount)

  const { error: updateErr } = await adminClient
    .from('members')
    .update({ pending_amount: adjustedPending })
    .eq('id', memberId)

  if (updateErr) {
    return { error: 'Payment logged, but failed to adjust pending balance locally. ' + updateErr.message }
  }

  revalidatePath('/owner/payments')
  revalidatePath('/owner/dashboard')
  revalidatePath('/owner/members')
  return { success: true }
}
