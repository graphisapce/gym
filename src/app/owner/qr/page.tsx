import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GymQRCodeClient from './qr-client'

export default async function GymQRCodePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: gymData } = await adminClient
    .from('gyms')
    .select('id, gym_name')
    .limit(1)
    .single()

  if (!gymData) {
    return <div className="p-10 text-center text-red-500 font-bold">Gym setup not found in database.</div>
  }

  return <GymQRCodeClient gymId={gymData.id} gymName={gymData.gym_name} />
}
