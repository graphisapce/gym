import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  IndianRupee,
  LogOut,
  User,
  NotebookText,
  Utensils
} from 'lucide-react'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function MemberDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/member-login')

  // Find member record by auth user id, then fallback to email
  let member: any = null

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: memberById } = await adminClient
    .from('members')
    .select('*, gyms(gym_name)')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (memberById) {
    member = memberById
  } else if (user.email) {
    const { data: memberByEmail } = await adminClient
      .from('members')
      .select('*, gyms(gym_name)')
      .eq('email', user.email)
      .maybeSingle()
    
    if (memberByEmail) {
      member = memberByEmail
      // Backfill auth_user_id so future lookups don't need email match
      await adminClient
        .from('members')
        .update({ auth_user_id: user.id })
        .eq('id', memberByEmail.id)
    }
  }

  // If still no member record found, redirect to login
  if (!member) redirect('/member-login?message=Aapka account nahi mila. Owner se contact karo.')

  // ─── Dates ───────────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  // ─── Expiry Math ─────────────────────────────────────────
  const expiryDate = member?.expiry_date ? new Date(member.expiry_date) : null
  const joiningDate = member?.joining_date ? new Date(member.joining_date) : null

  let daysRemaining = 0
  let totalDays = 0
  let progressPct = 0
  let isExpiring = false
  let isExpired = false

  if (expiryDate) {
    daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    isExpired = daysRemaining < 0
    isExpiring = daysRemaining >= 0 && daysRemaining <= 7

    if (joiningDate && expiryDate > joiningDate) {
      totalDays = Math.ceil((expiryDate.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24))
      const elapsed = Math.ceil((today.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24))
      progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)))
    }
  }

  // ─── Payment Summary ─────────────────────────────────────
  const totalPaid = member
    ? (
        await adminClient
          .from('payments')
          .select('amount')
          .eq('member_id', member.id)
      ).data?.reduce((s: number, p: any) => s + (p.amount || 0), 0) ?? 0
    : 0

  const pendingAmount = member?.pending_amount ?? 0

  // ─── Trainer Info ────────────────────────────────────────
  let trainerData = null
  if (member?.trainer_id) {
    const { data } = await adminClient
      .from('trainers')
      .select('name, phone')
      .eq('id', member.trainer_id)
      .maybeSingle()
    if (data) trainerData = data
  }

  // ─── Attendance & Plans ──────────────────────────────────
  const [
    { count: monthAttendance }, 
    { data: recentAttendance },
    { data: myPlans }
  ] = await Promise.all([
    member
      ? adminClient
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .gte('check_in', firstOfMonth)
      : Promise.resolve({ count: 0 }),
    member
      ? adminClient
          .from('attendance')
          .select('id, check_in')
          .eq('member_id', member.id)
          .order('check_in', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    member
      ? adminClient
          .from('member_plans')
          .select('plan_type, content')
          .eq('member_id', member.id)
      : Promise.resolve({ data: null })
  ])

  const workoutPlan = myPlans?.find(p => p.plan_type === 'workout')
  const dietPlan = myPlans?.find(p => p.plan_type === 'diet')

  const gymName =
    (Array.isArray(member?.gyms) ? member?.gyms[0]?.gym_name : member?.gyms?.gym_name) ?? 'Your Gym'

  const memberName = member?.name ?? user.email ?? 'Member'

  return (
    <div className="min-h-screen pb-16 bg-zinc-50/50 dark:bg-zinc-950">
      {/* ── Expiry Alert Banner ── */}
      {(isExpiring || isExpired) && (
        <div className="bg-red-600 text-white px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {isExpired
            ? 'Aapki membership expire ho chuki hai. Please renew karein!'
            : `Aapki membership ${daysRemaining} din mein expire ho rahi hai. Abhi renew karein!`}
        </div>
      )}

      {/* ── Header ── */}
      <div className="border-b bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{gymName}</h1>
              <p className="text-muted-foreground text-xs">Member Portal</p>
            </div>
          </div>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 mt-2">

        {/* ── Welcome Card ── */}
        <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Welcome back 👋</p>
                <h2 className="text-2xl font-bold tracking-tight">{memberName}</h2>
                <p className="text-muted-foreground text-sm mt-0.5">{gymName}</p>
              </div>
              {member?.status && (
                <div className="ml-auto">
                  <Badge
                    className={
                      member.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                    }
                    variant="outline"
                  >
                    {member.status === 'active' ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                    ) : 'Expired'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Personal Profile ── */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Naam (Name)</p>
                <p className="font-semibold text-sm mt-0.5">{memberName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="font-semibold text-sm mt-0.5">{member?.phone || '—'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Email ID</p>
                <p className="font-semibold text-sm mt-0.5 truncate">{member?.email || user.email}</p>
              </div>
              
              <div className="col-span-2 sm:col-span-3 pt-3 mt-1 border-t border-border/50">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Your Gym Trainer</p>
                {trainerData ? (
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{trainerData.name}</span>
                    <Badge variant="outline" className="text-[10px] h-5 py-0 bg-background text-muted-foreground ml-auto sm:ml-2 border-border/50">
                      📞 {trainerData.phone}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground opacity-80">
                    <div className="bg-muted p-1.5 rounded-full">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm italic">Koi personal trainer assign nahi hai</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── My Personal Plans ── */}
        {(workoutPlan || dietPlan) && (
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <NotebookText className="w-5 h-5 text-primary" />
                My Assigned Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={workoutPlan ? "workout" : "diet"} className="w-full">
                <div className="px-4 pt-4 border-b">
                  <TabsList className="w-full grid grid-cols-2 bg-muted/50 pb-0 rounded-b-none h-auto gap-4">
                    <TabsTrigger value="workout" disabled={!workoutPlan} className="py-2.5 data-selected:bg-background data-selected:text-primary border-b-2 border-transparent data-selected:border-primary rounded-b-none shadow-none">
                      <Dumbbell className="w-4 h-4 mr-2" /> Workout Routine
                    </TabsTrigger>
                    <TabsTrigger value="diet" disabled={!dietPlan} className="py-2.5 data-selected:bg-background data-selected:text-primary border-b-2 border-transparent data-selected:border-primary rounded-b-none shadow-none">
                      <Utensils className="w-4 h-4 mr-2" /> Diet Plan
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {workoutPlan && (
                  <TabsContent value="workout" className="p-4 m-0">
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
                      {workoutPlan.content}
                    </div>
                  </TabsContent>
                )}
                
                {dietPlan && (
                  <TabsContent value="diet" className="p-4 m-0">
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
                      {dietPlan.content}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* ── Membership Card ── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Membership Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-semibold mt-0.5">{member?.plan ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joining Date</p>
                <p className="font-semibold mt-0.5">{formatDate(member?.joining_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p className={`font-semibold mt-0.5 ${isExpired ? 'text-red-600' : isExpiring ? 'text-orange-600' : ''}`}>
                  {formatDate(member?.expiry_date)}
                </p>
              </div>
            </div>

            {/* Days remaining + Progress bar */}
            {expiryDate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {isExpired
                      ? 'Membership expired'
                      : `${daysRemaining} din baaki hain`}
                  </span>
                  <span className="text-muted-foreground text-xs">{progressPct}% used</span>
                </div>
                <Progress
                  value={progressPct}
                  className={`h-2.5 ${
                    isExpired || progressPct >= 90
                      ? '[&>div]:bg-red-500'
                      : progressPct >= 70
                      ? '[&>div]:bg-orange-500'
                      : '[&>div]:bg-green-500'
                  }`}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Payment Summary ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${pendingAmount > 0 ? 'border-orange-200 dark:border-orange-800' : ''}`}>
            <CardContent className="pt-6 pb-5">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  pendingAmount > 0
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : 'bg-muted'
                }`}>
                  <IndianRupee className={`h-5 w-5 ${pendingAmount > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Amount</p>
                  <p className={`text-xl font-bold ${pendingAmount > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {pendingAmount > 0 ? formatCurrency(pendingAmount) : '₹0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Attendance ── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Attendance</CardTitle>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {monthAttendance ?? 0} visits this month
              </Badge>
            </div>
            <CardDescription className="text-xs">Last 10 gym visits</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentAttendance || recentAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                Abhi tak koi attendance record nahi hai
              </div>
            ) : (
              <div className="space-y-1">
                {recentAttendance.map((record: any, idx: number) => {
                  const checkInDate = new Date(record.check_in)
                  const isToday =
                    checkInDate.toDateString() === new Date().toDateString()
                  return (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
                        idx === 0
                          ? 'bg-primary/5 border border-primary/10'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            idx === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                        />
                        <span className="font-medium">
                          {isToday ? 'Aaj' : formatDate(record.check_in)}
                        </span>
                      </div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(record.check_in)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
