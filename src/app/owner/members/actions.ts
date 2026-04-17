'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Utility to fetch first Gym ID implicitly
async function getGymId(supabase: any) {
  const { data } = await supabase.from('gyms').select('id').limit(1).single()
  return data?.id || null
}

function calculateExpiryDate(joiningDateStr: string, plan: string) {
  const date = new Date(joiningDateStr)
  if (plan === '1 month') date.setMonth(date.getMonth() + 1)
  else if (plan === '3 month') date.setMonth(date.getMonth() + 3)
  else if (plan === '6 month') date.setMonth(date.getMonth() + 6)
  else if (plan === '1 year') date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().split('T')[0]
}

export async function addMember(formData: FormData) {
  const supabase = await createClient()
  const gymId = await getGymId(supabase)

  if (!gymId) {
    return { error: "No gym found to attach to." }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = (formData.get('email') as string)?.trim() || ''
  const plan = formData.get('plan') as string
  const amountPaid = parseInt((formData.get('amount_paid') as string) || '0', 10)
  const pendingAmount = parseInt((formData.get('pending_amount') as string) || '0', 10)
  const joiningDate = formData.get('joining_date') as string
  
  const expiryDate = calculateExpiryDate(joiningDate, plan)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('members').insert({
    gym_id: gymId,
    name,
    phone,
    email: email || null,
    plan,
    amount_paid: amountPaid,
    pending_amount: pendingAmount,
    joining_date: joiningDate,
    expiry_date: expiryDate,
    status: 'active'
  })

  if (error) {
    return { error: error.message }
  }

  // If email provided, send Supabase Auth invite so member can set their password
  if (email) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { role: 'member', name },
        redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
      })

      if (inviteError) {
        // Don't block member creation — just log. Common cause: email already invited.
        console.warn('Member auth invite warning:', inviteError.message)
      }
    } catch (adminErr) {
      console.error('Admin client error (check SUPABASE_SERVICE_ROLE_KEY):', adminErr)
    }
  }

  revalidatePath('/owner/members')
  revalidatePath('/owner/dashboard')
  return { success: true, invited: !!email }
}

export async function markAttendance(memberId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') {
    return { error: 'Unauthorized: Only owners can mark attendance.' }
  }

  const gymId = await getGymId(supabase)

  if (!gymId) {
    return { error: 'No gym context' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('attendance').insert({
    member_id: memberId,
    gym_id: gymId
  })

  if (error) {
    return { error: error.message }
  }

  // Not revalidating entirely since attendance is mostly background, but can reval table if needed
  return { success: true }
}

export async function editMember(memberId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = (formData.get('email') as string)?.trim() || null
  const plan = formData.get('plan') as string
  const amountPaid = parseInt((formData.get('amount_paid') as string) || '0', 10)
  const pendingAmount = parseInt((formData.get('pending_amount') as string) || '0', 10)
  const joiningDate = formData.get('joining_date') as string

  const expiryDate = calculateExpiryDate(joiningDate, plan)

  const { error } = await adminClient
    .from('members')
    .update({
      name,
      phone,
      email,
      plan,
      amount_paid: amountPaid,
      pending_amount: pendingAmount,
      joining_date: joiningDate,
      expiry_date: expiryDate
    })
    .eq('id', memberId)

  if (error) return { error: error.message }

  revalidatePath('/owner/members')
  revalidatePath('/owner/payments')
  revalidatePath('/owner/dashboard')
  return { success: true }
}

export async function deleteMember(memberId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Must cascade delete attendance manually because schema doesn't specify 'on delete cascade'
  await adminClient.from('attendance').delete().eq('member_id', memberId)
  await adminClient.from('payments').delete().eq('member_id', memberId)

  // Now delete the member
  const { error } = await adminClient.from('members').delete().eq('id', memberId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/owner/members')
  revalidatePath('/owner/dashboard')
  return { success: true }
}

export async function saveMemberPlan(memberId: string, planType: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return { error: 'Unauthorized' }
  const gymId = await getGymId(supabase)
  if (!gymId) return { error: 'No gym context' }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Manual reset to avoid unique constraint complexities
  await adminClient.from('member_plans').delete().eq('member_id', memberId).eq('plan_type', planType)

  if (content.trim()) {
    const { error } = await adminClient.from('member_plans').insert({
      gym_id: gymId,
      member_id: memberId,
      plan_type: planType,
      content
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/owner/members')
  return { success: true }
}

