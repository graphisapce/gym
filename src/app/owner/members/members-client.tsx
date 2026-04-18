'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addMember, deleteMember, markAttendance, editMember, saveMemberPlan } from './actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MoreHorizontal, Plus, Search, MessageCircle, UserCheck, Trash2, Edit, Dumbbell, BellRing, Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function MembersClient({ initialMembers, initialQuery }: { initialMembers: any[], initialQuery: string }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add Form state
  const [selectedPlan, setSelectedPlan] = useState('1 month')
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0])

  // Edit Form state
  const [memberToEdit, setMemberToEdit] = useState<any | null>(null)
  const [editPlan, setEditPlan] = useState('1 month')
  const [editJoiningDate, setEditJoiningDate] = useState('')

  // Member Plan state
  const [memberToPlan, setMemberToPlan] = useState<any | null>(null)
  const [planType, setPlanType] = useState('workout')

  // Bulk Notification state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/owner/members?query=${encodeURIComponent(searchQuery)}`)
  }

  const dueMembers = initialMembers.filter(m => {
    const isExpired = new Date(m.expiry_date) < new Date()
    const isExpiringSoon = new Date(m.expiry_date) <= new Date(new Date().setDate(new Date().getDate() + 7))
    return isExpired || isExpiringSoon || m.pending_amount > 0
  })

  const copyBulkNumbers = () => {
    const numbers = dueMembers.map(m => m.phone).filter(Boolean).map(phone => phone.replace(/[^0-9]/g, ''))
    if (numbers.length === 0) return toast.info('No phone numbers found.')
    navigator.clipboard.writeText(numbers.join(', '))
    toast.success(`${numbers.length} numbers copied to clipboard!`)
  }

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set('plan', selectedPlan) // explicitly add select value
    
    const result = await addMember(formData)
    setIsSubmitting(false)

    if (result.error) {
      toast.error('Failed to add member: ' + result.error)
    } else {
      if (result.invited) {
        toast.success('Member added! Invite email sent to their inbox for password setup.')
      } else {
        toast.success('Member added successfully!')
      }
      setIsAddModalOpen(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return
    const result = await deleteMember(memberToDelete)
    if (result.error) toast.error('Failed to delete: ' + result.error)
    else toast.success('Member deleted successfully.')
    setMemberToDelete(null)
  }

  const handleMarkAttendance = async (id: string) => {
    const result = await markAttendance(id)
    if (result.error) toast.error('Attendance failed: ' + result.error)
    else toast.success('Attendance marked!')
  }

  const openEditModal = (member: any) => {
    setMemberToEdit(member)
    setEditPlan(member.plan || '1 month')
    setEditJoiningDate(member.joining_date ? new Date(member.joining_date).toISOString().split('T')[0] : '')
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!memberToEdit) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set('plan', editPlan)
    
    const result = await editMember(memberToEdit.id, formData)
    setIsSubmitting(false)

    if (result.error) {
      toast.error('Failed to update member: ' + result.error)
    } else {
      toast.success('Member details updated successfully!')
      setMemberToEdit(null)
    }
  }

  const handlePlanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!memberToPlan) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const content = formData.get('content') as string
    
    const result = await saveMemberPlan(memberToPlan.id, planType, content)
    setIsSubmitting(false)

    if (result.error) {
      toast.error('Failed to assign plan: ' + result.error)
    } else {
      toast.success('Plan assigned and saved successfully!')
      setMemberToPlan(null)
    }
  }

  const getStatusBadge = (status: string, expiryDate: string) => {
    const isExpired = new Date(expiryDate) < new Date()
    const isExpiringSoon = new Date(expiryDate) <= new Date(new Date().setDate(new Date().getDate() + 7))
    
    if (isExpired || status === 'expired') return <Badge variant="destructive" className="bg-red-500">Expired</Badge>
    if (isExpiringSoon) return <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">Expiring Soon</Badge>
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
  }

  return (
    <>
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Members</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your gym members</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name or phone..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:text-orange-700" onClick={() => setIsBulkModalOpen(true)}>
                <BellRing className="h-4 w-4 mr-2" /> Reminders 
                {dueMembers.length > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 min-w-5 justify-center rounded-full text-[10px]">
                    {dueMembers.length}
                  </Badge>
                )}
              </Button>

              <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" /> Add 
              </Button>
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddSubmit}>
                  <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new member. Expiry date will be calculated automatically.
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
                      <Label htmlFor="email" className="text-right">Email</Label>
                      <Input id="email" name="email" type="email" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plan" className="text-right">Plan</Label>
                      <div className="col-span-3">
                        <Select value={selectedPlan} onValueChange={(v) => v !== null && setSelectedPlan(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1 month">1 Month</SelectItem>
                            <SelectItem value="3 month">3 Months</SelectItem>
                            <SelectItem value="6 month">6 Months</SelectItem>
                            <SelectItem value="1 year">1 Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="joining_date" className="text-right">Joined On</Label>
                      <Input id="joining_date" name="joining_date" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount_paid" className="text-right">Paid (₹)</Label>
                      <Input id="amount_paid" name="amount_paid" type="number" defaultValue="0" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pending_amount" className="text-right">Pending (₹)</Label>
                      <Input id="pending_amount" name="pending_amount" type="number" defaultValue="0" className="col-span-3" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Member'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Member Modal */}
            <Dialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
              <DialogContent className="sm:max-w-[425px]">
                {memberToEdit && (
                  <form onSubmit={handleEditSubmit}>
                    <DialogHeader>
                      <DialogTitle>Edit Member</DialogTitle>
                      <DialogDescription>
                        Update the details for {memberToEdit.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">Name</Label>
                        <Input id="edit-name" name="name" defaultValue={memberToEdit.name} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                        <Input id="edit-phone" name="phone" type="tel" defaultValue={memberToEdit.phone} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">Email</Label>
                        <Input id="edit-email" name="email" type="email" defaultValue={memberToEdit.email} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-plan" className="text-right">Plan</Label>
                        <div className="col-span-3">
                          <Select value={editPlan} onValueChange={(v) => v !== null && setEditPlan(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1 month">1 Month</SelectItem>
                              <SelectItem value="3 month">3 Months</SelectItem>
                              <SelectItem value="6 month">6 Months</SelectItem>
                              <SelectItem value="1 year">1 Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-joining_date" className="text-right">Joined On</Label>
                        <Input id="edit-joining_date" name="joining_date" type="date" value={editJoiningDate} onChange={(e) => setEditJoiningDate(e.target.value)} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-amount_paid" className="text-right">Paid (₹)</Label>
                        <Input id="edit-amount_paid" name="amount_paid" type="number" defaultValue={memberToEdit.amount_paid} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-pending_amount" className="text-right">Pending (₹)</Label>
                        <Input id="edit-pending_amount" name="pending_amount" type="number" defaultValue={memberToEdit.pending_amount} className="col-span-3" required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setMemberToEdit(null)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Member'}</Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Bulk Reminders Modal */}
            <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
              <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Pending Dues & Expiries</DialogTitle>
                  <DialogDescription>
                    Members requiring attention for renewal or outstanding balances.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4 -mx-1 px-1">
                  {dueMembers.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">All clear! No members have pending dues or upcoming expiries.</div>
                  ) : (
                    <div className="space-y-3">
                      {dueMembers.map(m => {
                        const isExpired = new Date(m.expiry_date) < new Date()
                        const waMsg = `Hi ${m.name}, this is a gentle reminder regarding your gym membership.`
                        const waLink = `https://wa.me/${m.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`
                        return (
                          <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 gap-3">
                            <div>
                              <div className="font-semibold text-sm">{m.name}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                                {m.pending_amount > 0 && <span className="text-orange-600 font-medium">Due: ₹{m.pending_amount}</span>}
                                {(isExpired || new Date(m.expiry_date) <= new Date(new Date().setDate(new Date().getDate() + 7))) && (
                                  <span className={isExpired ? "text-red-600 font-medium" : "text-yellow-600 font-medium"}>
                                    Expiry: {new Date(m.expiry_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className={`${buttonVariants({ variant: "outline", size: "sm" })} shrink-0`}>
                              <MessageCircle className="w-4 h-4 mr-2 text-green-500" /> Notify
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <DialogFooter className="sm:justify-between items-center sm:items-center border-t pt-4">
                  <span className="text-xs text-muted-foreground mb-4 sm:mb-0">
                    Need to use a broadcast tool? (e.g. Wati)
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setIsBulkModalOpen(false)} className="flex-1 sm:flex-none">Close</Button>
                    <Button onClick={copyBulkNumbers} className="flex-1 sm:flex-none" disabled={dueMembers.length === 0}>
                      <Copy className="w-4 h-4 mr-2" /> Copy All Numbers
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Assign Plan Modal */}
            <Dialog open={!!memberToPlan} onOpenChange={(open) => !open && setMemberToPlan(null)}>
              <DialogContent className="sm:max-w-[500px]">
                {memberToPlan && (
                  <form onSubmit={handlePlanSubmit}>
                    <DialogHeader>
                      <DialogTitle>Assign Daily Plan</DialogTitle>
                      <DialogDescription>
                        Create a daily workout or diet schedule for {memberToPlan.name}. 
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex gap-4 items-center">
                        <Label>Plan Type</Label>
                        <Select value={planType} onValueChange={(v) => v !== null && setPlanType(v)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workout">Workout Routine</SelectItem>
                            <SelectItem value="diet">Diet Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="planContent">Schedule / Routine Notes</Label>
                        <Textarea 
                          id="planContent" 
                          name="content" 
                          placeholder="Monday: Chest & Triceps...&#10;Tuesday: Back & Biceps..." 
                          className="min-h-[150px]"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setMemberToPlan(null)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Plan'}</Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">No members found.</TableCell>
                </TableRow>
              ) : (
                initialMembers.map((member) => {
                  const gymName = Array.isArray(member.gyms) ? member.gyms[0]?.gym_name : member.gyms?.gym_name;
                  const waMessage = `Hi ${member.name}, aapki ${gymName || 'Gym'} membership ${new Date(member.expiry_date).toLocaleDateString()} ko expire ho rahi hai. Renewal ke liye contact karein.`;
                  const waLink = `https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium whitespace-nowrap">{member.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{member.phone}</TableCell>
                      <TableCell className="capitalize whitespace-nowrap">{member.plan}</TableCell>
                      <TableCell className="whitespace-nowrap">{new Date(member.joining_date).toLocaleDateString()}</TableCell>
                      <TableCell className="whitespace-nowrap">{new Date(member.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell className="whitespace-nowrap">₹{member.amount_paid}</TableCell>
                      <TableCell className="whitespace-nowrap">₹{member.pending_amount}</TableCell>
                      <TableCell>{getStatusBadge(member.status, member.expiry_date)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => handleMarkAttendance(member.id)}>
                                <UserCheck className="mr-2 h-4 w-4" /> Mark Attendance
                              </DropdownMenuItem>
                              <DropdownMenuItem className="p-0 border-none bg-transparent">
                                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-2 py-1.5 text-sm">
                                  <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" /> WhatsApp reminder
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => setMemberToPlan(member)}>
                                <Dumbbell className="mr-2 h-4 w-4" /> Assign Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditModal(member)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => setMemberToDelete(member.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Member
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this member and remove their data (including attendance and payment history) from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
