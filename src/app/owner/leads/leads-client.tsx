'use client'

import { useState } from 'react'
import { addLead, updateLeadStatus } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PlusCircle, Search, MessageCircle, MoreHorizontal, CheckCircle, Clock, XCircle, Sparkles, Filter } from 'lucide-react'

export default function LeadsClient({ initialLeads }: { initialLeads: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [interestSelection, setInterestSelection] = useState('General Fitness')

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set('interest', interestSelection) // Enforce select state natively
    
    const result = await addLead(formData)
    setIsSubmitting(false)

    if (result.error) toast.error(result.error)
    else {
      toast.success('Lead populated successfully!')
      setIsModalOpen(false)
      setInterestSelection('General Fitness') // reset
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const result = await updateLeadStatus(id, newStatus)
    if (result.error) toast.error('Failed to change status: ' + result.error)
    else toast.success(`Status updated to ${newStatus}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>
      case 'contacted': 
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Contacted</Badge>
      case 'converted': 
        return <Badge className="bg-green-500 hover:bg-green-600">Converted</Badge>
      case 'lost': 
        return <Badge variant="destructive" className="bg-red-500">Lost</Badge>
      default: 
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Get localized TODAY format bounding strictly to timezone standard
  const todayDate = new Date()
  const todayStr = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]

  // Sorting & Filtering Computation Engine
  const processedLeads = initialLeads
    .filter(lead => statusFilter === 'ALL' || lead.status === statusFilter.toLowerCase())
    .sort((a, b) => {
      // Priority 1: Today's follow-ups pinned strictly mathematically resolving to -1 or 1 positions
      const aIsToday = a.follow_up_date === todayStr ? 1 : 0
      const bIsToday = b.follow_up_date === todayStr ? 1 : 0
      
      if (bIsToday - aIsToday !== 0) return bIsToday - aIsToday
      
      // Secondary: Sort sequentially by latest created
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-none bg-transparent">
        <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pipeline Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Pipeline</SelectItem>
                  <SelectItem value="new">🟢 New Only</SelectItem>
                  <SelectItem value="contacted">🟡 Contacted</SelectItem>
                  <SelectItem value="converted">✅ Converted</SelectItem>
                  <SelectItem value="lost">❌ Lost Pipeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
          </Button>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddSubmit}>
                <DialogHeader>
                  <DialogTitle>Capture New Prospect</DialogTitle>
                  <DialogDescription>
                    Fill out the lead details natively to track them dynamically.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone</Label>
                    <Input id="phone" name="phone" type="tel" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Interest</Label>
                    <div className="col-span-3">
                      <Select value={interestSelection} onValueChange={(v) => v !== null && setInterestSelection(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Focus Target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                          <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                          <SelectItem value="General Fitness">General Fitness</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="follow_up_date" className="text-right">Follow-up</Label>
                    <Input 
                      id="follow_up_date" 
                      name="follow_up_date" 
                      type="date" 
                      className="col-span-3" 
                      defaultValue={todayStr} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Capturing...' : 'Save Prospect'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-0 border rounded-lg bg-card overflow-hidden">
          {processedLeads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>Your pipeline is crystal clear. Try adding or finding new prospects!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Lead details</TableHead>
                    <TableHead>Interest Focus</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Action Sequence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedLeads.map((lead) => {
                    const isToday = lead.follow_up_date === todayStr
                    
                    const waMessage = `Hi ${lead.name}, thanking you for your interest regarding ${lead.interest}! Please let us know when we can help get you started.`
                    const waLink = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`

                    return (
                      <TableRow 
                        key={lead.id} 
                        className={isToday ? "bg-primary/5 hover:bg-primary/10 transition-colors duration-300" : ""}
                      >
                        <TableCell className="pl-6">
                          <div className="font-medium whitespace-nowrap">{lead.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {lead.phone}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{lead.interest || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {lead.follow_up_date ? (
                            <div className={`flex items-center gap-1.5 ${isToday ? 'text-primary font-semibold' : ''}`}>
                              {isToday && <Sparkles className="h-3.5 w-3.5" />}
                              {new Date(lead.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              {isToday && <span className="text-xs bg-primary/20 px-1.5 rounded-sm">Today</span>}
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(lead.status)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'new')}>
                                  Mark as New
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'contacted')}>
                                  <Clock className="mr-2 h-4 w-4 text-orange-500" /> Mark Contacted
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'converted')} className="text-green-600 font-medium">
                                  <CheckCircle className="mr-2 h-4 w-4" /> Converted Won
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'lost')} className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" /> Pipeline Lost
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem className="p-0 border-none bg-transparent">
                                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-2 py-1.5 text-sm">
                                    <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" /> Send WhatsApp
                                  </a>
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
  )
}
