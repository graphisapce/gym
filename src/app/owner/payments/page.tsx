import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaymentsClient from './payments-client'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const [
    { data: pendingMembersData },
    { data: allMembersData },
    { data: historyData }
  ] = await Promise.all([
    adminClient.from('members').select('id, name, phone, pending_amount').gt('pending_amount', 0).order('pending_amount', { ascending: false }),
    adminClient.from('members').select('id, name').order('name', { ascending: true }),
    adminClient.from('payments').select('*, members(name, phone)').order('payment_date', { ascending: false })
  ])

  // 6 months Chart Math
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1) // First day of that 6th month ago

  const { data: rawPayments } = await adminClient
    .from('payments')
    .select('amount, payment_date')
    .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0])

  // Template the rolling array
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      name: d.toLocaleString('en-IN', { month: 'short' }),
      total: 0,
      year: d.getFullYear(),
      monthIndex: d.getMonth()
    }
  })

  // Distribute totals
  rawPayments?.forEach(pay => {
    const pDate = new Date(pay.payment_date)
    const pMonth = pDate.getMonth()
    const pYear = pDate.getFullYear()
    
    // Find matching month bin
    const target = chartData.find(m => m.monthIndex === pMonth && m.year === pYear)
    if (target) {
      target.total += pay.amount
    }
  })

  // Format historical relation flattening
  const historyList = historyData?.map((pay: any) => ({
    id: pay.id,
    amount: pay.amount,
    date: pay.payment_date,
    plan: pay.plan,
    note: pay.note,
    memberId: pay.member_id,
    memberName: Array.isArray(pay.members) ? pay.members[0]?.name : pay.members?.name || 'Unknown',
    memberPhone: Array.isArray(pay.members) ? pay.members[0]?.phone : pay.members?.phone || ''
  })) || []

  return (
    <div className="min-h-screen pb-12 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payments & Financials</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage revenue, track dues, and view trends</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-4">
        <PaymentsClient 
          pendingMembers={pendingMembersData || []} 
          allMembers={allMembersData || []} 
          historyList={historyList}
          chartData={chartData}
        />
      </div>
    </div>
  )
}
