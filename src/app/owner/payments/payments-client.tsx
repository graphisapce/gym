'use client'

import { useState } from 'react'
import { recordPayment } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { PlusCircle, Search, Calendar, History, TrendingUp, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PaymentsClient({
  pendingMembers,
  allMembers,
  historyList,
  chartData
}: {
  pendingMembers: any[],
  allMembers: any[],
  historyList: any[],
  chartData: any[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  
  // History Filter States
  const [historySearch, setHistorySearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('ALL')
  const [exactDateFilter, setExactDateFilter] = useState('')

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedMember) {
      toast.error('Please select a member first.')
      return
    }

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set('member_id', selectedMember)
    
    const result = await recordPayment(formData)
    setIsSubmitting(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Payment recorded successfully!')
      setIsModalOpen(false)
      setSelectedMember('')
    }
  }

  // Filter history logic
  const filteredHistory = historyList.filter(item => {
    const matchSearch = item.memberName.toLowerCase().includes(historySearch.toLowerCase()) || 
                        item.memberPhone.includes(historySearch)
    
    if (!matchSearch) return false

    // Exact Date filter overrides month filter if set
    if (exactDateFilter) {
      return item.date.startsWith(exactDateFilter)
    }
    
    // YYYY-MM based filtering (e.g., '2026-04')
    if (monthFilter !== 'ALL') {
      const itemMonth = item.date.substring(0, 7)
      if (itemMonth !== monthFilter) return false
    }

    return true
  })

  // Format currency locally
  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-6">
      
      {/* TOP ROW: Pending Dues & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Pending Payments Focus */}
        <Card className="border-red-500/20 shadow-sm flex flex-col h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl text-red-600 dark:text-red-400">Pending Dues Focus</CardTitle>
              <CardDescription>Members with active outstanding balances</CardDescription>
            </div>
            
            {/* Record Payment Dialog */}
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Record Payment
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handlePaymentSubmit}>
                  <DialogHeader>
                    <DialogTitle>Record New Payment</DialogTitle>
                    <DialogDescription>
                      This will securely deduct their pending debt.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Member</Label>
                      <div className="col-span-3">
                        <Select value={selectedMember} onValueChange={(v) => v !== null && setSelectedMember(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Member" />
                          </SelectTrigger>
                          <SelectContent>
                            {allMembers.map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
                      <Input id="amount" name="amount" type="number" className="col-span-3" placeholder="e.g. 1500" required />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="payment_date" className="text-right">Date</Label>
                      <Input id="payment_date" name="payment_date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="col-span-3" required />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="note" className="text-right">Note</Label>
                      <Input id="note" name="note" type="text" className="col-span-3" placeholder="Optional notes" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Confirm Paid'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {pendingMembers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Hooray! No pending member dues currently. 💸
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-50/50 dark:bg-red-950/20">
                      <TableHead className="pl-6">Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right pr-6">Due Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="pl-6 font-medium">{m.name}</TableCell>
                        <TableCell className="text-muted-foreground">{m.phone}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge variant="destructive" className="text-sm px-2 py-0.5">
                            {formatINR(m.pending_amount)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Revenue Chart */}
        <Card className="shadow-sm h-[400px] flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl">6-Month Revenue</CardTitle>
            </div>
            <CardDescription>Trailing aggregated revenue metrics</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.4} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                  width={60}
                />
                <Tooltip 
                  formatter={(value) => value != null ? [formatINR(Number(value)), 'Revenue'] : ['', '']}
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM: Detailed Payment History */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full xl:w-auto flex-1">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl">Payment History</CardTitle>
              </div>
              <CardDescription>Log book of all chronological payments</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const headers = "Date,Name,Phone,Plan,Note,Amount\n"
              const csvContent = filteredHistory.map(row => 
                `"${row.date}","${row.memberName}","${row.memberPhone}","${row.plan}","${row.note || ''}",${row.amount}`
              ).join("\n")
              
              const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' })
              const link = document.createElement('a')
              link.href = URL.createObjectURL(blob)
              link.download = `gym-payments-${new Date().toISOString().split('T')[0]}.csv`
              link.click()
            }}>
              <Download className="w-4 h-4 mr-2" /> Download CSV
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-8"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="w-[140px]">
                <Select value={monthFilter} onValueChange={(v) => { if (v !== null) { setMonthFilter(v); setExactDateFilter('') } }}>
                  <SelectTrigger className="h-10">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Time</SelectItem>
                    {/* Create distinct months from history list specifically */}
                    {Array.from(new Set(historyList.map(h => h.date.substring(0, 7)))).sort().reverse().map(ym => (
                      <SelectItem key={ym} value={ym}>
                        {new Date(ym + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Input 
                  type="date"
                  value={exactDateFilter}
                  onChange={(e) => {
                    setExactDateFilter(e.target.value)
                    if (e.target.value) setMonthFilter('ALL') 
                  }}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No matching historic payments found.
              </div>
            ) : (
              <div className="overflow-x-auto border-t">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-6 w-[120px]">Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Plan Assigned</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right pr-6">Credited</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="pl-6 whitespace-nowrap text-muted-foreground text-sm">
                          {new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year:'numeric'})}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium whitespace-nowrap">{h.memberName}</div>
                          <div className="text-xs text-muted-foreground">{h.memberPhone}</div>
                        </TableCell>
                        <TableCell className="capitalize whitespace-nowrap">{h.plan}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {h.note || '—'}
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-green-600 dark:text-green-400">
                          +{formatINR(h.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
