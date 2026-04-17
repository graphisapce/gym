import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Activity, AlertCircle, IndianRupee, MessageCircle, Users } from 'lucide-react'

interface Gym {
  gym_name: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  plan: string;
  expiry_date: string;
  status: string;
  pending_amount: number;
  gyms: Gym | Gym[];
}

export default async function OwnerDashboard() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Promise.all to fetch metrics in parallel
  const [
    { count: totalActive },
    { count: expiringThisWeek },
    { data: pendingData },
    { data: revenueData },
    { data: expiringMembersData },
    { data: expensesData }
  ] = await Promise.all([
    // Active Members
    adminClient.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    // Expiring this week count
    adminClient.from('members').select('*', { count: 'exact', head: true }).gte('expiry_date', todayStr).lte('expiry_date', nextWeekStr),
    // Pending payments
    adminClient.from('members').select('pending_amount').gt('pending_amount', 0),
    // Revenue this month
    adminClient.from('payments').select('amount').gte('payment_date', firstDayOfMonth),
    // Expiring table data + Gym name join
    adminClient.from('members').select('*, gyms(gym_name)').gte('expiry_date', todayStr).lte('expiry_date', nextWeekStr).order('expiry_date', { ascending: true }),
    // Expenses this month
    adminClient.from('expenses').select('amount').gte('expense_date', firstDayOfMonth)
  ])

  // Aggregations
  const totalPending = pendingData?.reduce((sum, item) => sum + (item.pending_amount || 0), 0) || 0
  const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
  const totalExpenses = expensesData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
  const netProfit = totalRevenue - totalExpenses

  const expiringMembers = (expiringMembersData as unknown as Member[]) || []

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const getStatusBadge = (status: string, expiryDate: string) => {
    const isExpired = new Date(expiryDate) < today
    if (isExpired || status === 'expired') return <Badge variant="destructive" className="bg-red-500">Expired</Badge>
    if (new Date(expiryDate) <= nextWeek) return <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">Expiring Soon</Badge>
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="pb-12">
      <div className="border-b bg-background">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Gym overview &amp; management</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 mt-4">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
              <Users className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActive || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring This Week</CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringThisWeek || 0}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
              <Activity className="w-4 h-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-green-100 dark:border-green-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-bold text-muted-foreground">Net Profit (This Month)</CardTitle>
              <IndianRupee className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(netProfit)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue {formatCurrency(totalRevenue)} - Exp {formatCurrency(totalExpenses)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Members Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Members Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members are expiring in the next 7 days.
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringMembers.map((member) => {
                      const gymObj = Array.isArray(member.gyms) ? member.gyms[0] : member.gyms;
                      const gymName = gymObj?.gym_name || "Gym";
                      const fDate = formatDate(member.expiry_date);
                      
                      const waMessage = `Hi ${member.name}, aapki ${gymName} membership ${fDate} ko expire ho rahi hai. Renewal ke liye contact karein.`;
                      const waLink = `https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium whitespace-nowrap">{member.name}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{member.plan}</TableCell>
                          <TableCell className="whitespace-nowrap">{fDate}</TableCell>
                          <TableCell>
                            {getStatusBadge(member.status, member.expiry_date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: 'sm', variant: 'outline' }) + ' bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20'}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </a>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
