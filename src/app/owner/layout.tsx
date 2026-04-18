import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OwnerSidebar from './sidebar'

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  // Fetch gym info for sidebar
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: gym } = await adminClient
    .from('gyms')
    .select('gym_name, owner_name')
    .limit(1)
    .single()

  const gymName = gym?.gym_name ?? 'My Gym'
  const ownerName = gym?.owner_name ?? user.email ?? 'Owner'

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      <OwnerSidebar gymName={gymName} ownerName={ownerName} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
