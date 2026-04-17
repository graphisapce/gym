import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MembersClient from './members-client'

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  const { query } = await searchParams

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  let membersQuery = adminClient
    .from('members')
    .select('*, gyms(gym_name)')
    .order('created_at', { ascending: false })

  if (query) {
    // Basic ilike search on name or phone
    membersQuery = membersQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
  }

  const { data: members } = await membersQuery

  return (
    <div className="min-h-screen pb-12 bg-zinc-50/50 dark:bg-zinc-950">
      <MembersClient initialMembers={members || []} initialQuery={query || ''} />
    </div>
  )
}
