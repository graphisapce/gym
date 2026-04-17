import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceClient from './attendance-client'

export default async function AttendancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // 7 days ago (Rolling "This Week")
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6) 
  const sevenDaysAgoISO = sevenDaysAgo.toISOString()

  // 14 days ago (Rolling "Last Week")
  const fourteenDaysAgo = new Date(sevenDaysAgo)
  fourteenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fourteenDaysAgoISO = fourteenDaysAgo.toISOString()

  const [
    { data: todaysRaw },
    { count: thisWeekCount },
    { count: lastWeekCount }
  ] = await Promise.all([
    adminClient
      .from('attendance')
      .select('id, check_in, members(name)')
      .gte('check_in', todayISO)
      .order('check_in', { ascending: false }),
    
    adminClient
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('check_in', sevenDaysAgoISO),

    adminClient
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('check_in', fourteenDaysAgoISO)
      .lt('check_in', sevenDaysAgoISO)
  ])

  // Extract relational name securely
  const todaysList = todaysRaw?.map((item: any) => ({
    id: item.id,
    check_in: item.check_in,
    name: Array.isArray(item.members) ? item.members[0]?.name : item.members?.name || 'Unknown'
  })) || []

  return (
    <div className="min-h-screen pb-12 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="border-b bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rapid Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">Scan or search members to log daily entry</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-4">
        <AttendanceClient 
          todaysList={todaysList} 
          thisWeek={thisWeekCount || 0} 
          lastWeek={lastWeekCount || 0} 
        />
      </div>
    </div>
  )
}
