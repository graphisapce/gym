import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

// Next.js 15 page props need to await searchParams
export default async function MemberScanReceiver({ searchParams }: { searchParams: Promise<{ gym_id?: string }> }) {
  const params = await searchParams
  const gymId = params.gym_id

  if (!gymId) {
    return (
      <ScanResultBox 
        success={false} 
        title="Invalid QR Code" 
        message="The QR code does not contain a valid Gym ID." 
      />
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Must be logged in
  if (!user || user.user_metadata?.role !== 'member') {
    redirect('/login?message=' + encodeURIComponent('Aapko attendance lagane ke liye pehle login karna hoga.'))
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // 1. Get Member ID
  const { data: member } = await adminClient
    .from('members')
    .select('id, name')
    .eq('auth_user_id', user.id)
    .single()

  if (!member) {
    return (
      <ScanResultBox 
        success={false} 
        title="Member Not Found" 
        message="Aapka account database mein nahi mila." 
      />
    )
  }

  // 2. Check duplicate attendance for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data: existingScan } = await adminClient
    .from('attendance')
    .select('id')
    .eq('member_id', member.id)
    .gte('check_in', todayISO)
    .limit(1)
    .maybeSingle()

  if (existingScan) {
    return (
      <ScanResultBox 
        success={true} 
        alreadyScanned={true}
        title="Already Checked In!" 
        message={`Hi ${member.name}, aapki aaj ki attendance pehle hi lag chuki hai.`} 
      />
    )
  }

  // 3. Mark Present!
  const { error } = await adminClient.from('attendance').insert({
    member_id: member.id,
    gym_id: gymId
  })

  if (error) {
    return (
      <ScanResultBox 
        success={false} 
        title="Network Error" 
        message={'Attendance mark nahi ho payi: ' + error.message} 
      />
    )
  }

  return (
    <ScanResultBox 
      success={true} 
      title="Attendance Marked!" 
      message={`Excellent! ${member.name}, aapki attendance lag gayi hai. Have a great workout! 💪`} 
    />
  )
}

function ScanResultBox({ success, alreadyScanned, title, message }: { success: boolean, alreadyScanned?: boolean, title: string, message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-xl border-t-4 text-center pb-4 animate-in zoom-in-95 fill-mode-both duration-300">
        <CardHeader className="pt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-4">
            {success ? (
              alreadyScanned ? (
                <CheckCircle2 className="h-20 w-20 text-orange-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="h-20 w-20 text-green-500" />
              )
            ) : (
              <AlertCircle className="h-20 w-20 text-red-500" />
            )}
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-lg leading-snug px-2">
            {message}
          </p>
          <div className="pt-4 border-t">
            <Link 
              href="/member/dashboard" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
