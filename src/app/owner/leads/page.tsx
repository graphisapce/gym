import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeadsClient from './leads-client'

export default async function LeadsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: rawLeads } = await adminClient
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pb-12 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leads Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage prospects and track conversions visually</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-4">
        <LeadsClient initialLeads={rawLeads || []} />
      </div>
    </div>
  )
}
