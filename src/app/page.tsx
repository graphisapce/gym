import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const role = user.user_metadata?.role
    if (role === 'owner') redirect('/owner/dashboard')
    if (role === 'member') redirect('/member/dashboard')
  }

  redirect('/login')
}

