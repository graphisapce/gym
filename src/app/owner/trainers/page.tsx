import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrainersClient from './trainers-client'

export default async function TrainersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Saare trainers lao with member count
  const { data: trainersRaw } = await adminClient
    .from('trainers')
    .select('*')
    .order('joining_date', { ascending: false })

  // Har trainer ke assigned members count karo
  const trainersWithCounts = await Promise.all(
    (trainersRaw || []).map(async (trainer) => {
      const { data: assignedMembers, count } = await adminClient
        .from('members')
        .select('id, name, phone', { count: 'exact' })
        .eq('trainer_id', trainer.id)

      return {
        ...trainer,
        memberCount: count || 0,
        assignedMembers: assignedMembers || []
      }
    })
  )

  // Saare members lao (assign dropdown ke liye)
  const { data: allMembers } = await adminClient
    .from('members')
    .select('id, name, trainer_id')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen pb-12 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trainers Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Apne trainers ko manage karo aur members assign karo</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-4">
        <TrainersClient 
          initialTrainers={trainersWithCounts} 
          allMembers={allMembers || []} 
        />
      </div>
    </div>
  )
}
