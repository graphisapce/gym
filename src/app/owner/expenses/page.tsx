import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExpensesClient from './expenses-client'

export default async function ExpensesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'owner') {
    redirect('/login')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Get default gym context securely 
  const { data: gymData } = await adminClient
    .from('gyms')
    .select('id')
    .limit(1)
    .maybeSingle()

  let initialExpenses: any[] = []
  
  if (gymData) {
    const { data } = await adminClient
      .from('expenses')
      .select('*')
      .eq('gym_id', gymData.id)
      .order('expense_date', { ascending: false })

    initialExpenses = data || []
  }

  return (
    <div className="min-h-screen pb-12 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expenses Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">Track rent, salaries, equipment repairs, and other operational costs</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-4">
        <ExpensesClient initialExpenses={initialExpenses} />
      </div>
    </div>
  )
}
