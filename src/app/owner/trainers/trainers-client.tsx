'use client'

import { useState } from 'react'
import { addTrainer, deleteTrainer, assignMembersToTrainer } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PlusCircle, Users, Trash2, IndianRupee, Phone, Calendar, UserCheck } from 'lucide-react'

interface Trainer {
  id: string
  name: string
  phone: string
  salary: number
  joining_date: string | null
  memberCount: number
  assignedMembers?: { id: string, name: string, phone: string }[]
}

interface Member {
  id: string
  name: string
  trainer_id: string | null
}

export default function TrainersClient({ 
  initialTrainers, 
  allMembers 
}: { 
  initialTrainers: Trainer[], 
  allMembers: Member[] 
}) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trainerToDelete, setTrainerToDelete] = useState<string | null>(null)
  
  // Assign state
  const [selectedTrainer, setSelectedTrainer] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await addTrainer(formData)
    setIsSubmitting(false)

    if (result.error) toast.error(result.error)
    else {
      toast.success('Trainer add ho gaya!')
      setIsAddOpen(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!trainerToDelete) return
    const result = await deleteTrainer(trainerToDelete)
    if (result.error) toast.error(result.error)
    else toast.success('Trainer delete ho gaya!')
    setTrainerToDelete(null)
  }

  const handleAssignSubmit = async () => {
    if (!selectedTrainer) {
      toast.error('Pehle trainer select karo!')
      return
    }
    setIsSubmitting(true)
    const result = await assignMembersToTrainer(selectedTrainer, selectedMembers)
    setIsSubmitting(false)

    if (result.error) toast.error(result.error)
    else {
      toast.success('Members assign ho gaye trainer ko!')
      setIsAssignOpen(false)
      setSelectedTrainer('')
      setSelectedMembers([])
    }
  }

  // Jab trainer select ho toh uske current assigned members pre-select karo
  const handleTrainerSelect = (trainerId: string) => {
    setSelectedTrainer(trainerId)
    const currentlyAssigned = allMembers
      .filter(m => m.trainer_id === trainerId)
      .map(m => m.id)
    setSelectedMembers(currentlyAssigned)
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId) 
        : [...prev, memberId]
    )
  }

  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', currency: 'INR', maximumFractionDigits: 0 
  }).format(val)

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Naya Trainer Add Karo
        </Button>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddSubmit}>
              <DialogHeader>
                <DialogTitle>Naya Trainer</DialogTitle>
                <DialogDescription>Trainer ki details bharo aur save karo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Naam</Label>
                  <Input id="name" name="name" className="col-span-3" placeholder="e.g. Rahul Sharma" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input id="phone" name="phone" type="tel" className="col-span-3" placeholder="e.g. 919876543210" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary" className="text-right">Salary (₹)</Label>
                  <Input id="salary" name="salary" type="number" className="col-span-3" placeholder="e.g. 15000" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="joining_date" className="text-right">Joining</Label>
                  <Input id="joining_date" name="joining_date" type="date" className="col-span-3" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Trainer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => setIsAssignOpen(true)}>
          <UserCheck className="mr-2 h-4 w-4" /> Members Assign Karo
        </Button>
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Members ko Trainer ke saath Assign karo</DialogTitle>
              <DialogDescription>Trainer select karo aur fir unke members choose karo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="mb-2 block">Trainer Select Karo</Label>
                <Select value={selectedTrainer} onValueChange={(v) => v !== null && handleTrainerSelect(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kaunsa trainer?" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialTrainers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTrainer && (
                <div>
                  <Label className="mb-2 block">Members Select Karo (click karke toggle karo)</Label>
                  <div className="border rounded-lg max-h-[250px] overflow-y-auto">
                    {allMembers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">Koi member nahi mila</div>
                    ) : (
                      allMembers.map(member => {
                        const isSelected = selectedMembers.includes(member.id)
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleMember(member.id)}
                            className={`w-full text-left px-4 py-2.5 flex items-center justify-between border-b last:border-b-0 transition-colors text-sm ${
                              isSelected 
                                ? 'bg-primary/10 text-primary font-medium' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <span>{member.name}</span>
                            {isSelected && (
                              <Badge className="bg-primary text-primary-foreground text-xs">Selected</Badge>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{selectedMembers.length} members selected</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignSubmit} disabled={isSubmitting || !selectedTrainer}>
                {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trainer Cards Grid */}
      {initialTrainers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p>Abhi tak koi trainer add nahi hua. Upar "Naya Trainer Add Karo" button dabao!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialTrainers.map((trainer) => (
            <Card key={trainer.id} className="shadow-sm relative group overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {trainer.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{trainer.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {trainer.phone}
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setTrainerToDelete(trainer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                      <Users className="h-3.5 w-3.5" /> Assigned Members
                    </div>
                    <div className="text-2xl font-bold">{trainer.memberCount}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                      <IndianRupee className="h-3.5 w-3.5" /> Monthly Salary
                    </div>
                    <div className="text-2xl font-bold text-green-600">{formatINR(trainer.salary || 0)}</div>
                  </div>
                </div>
                {trainer.assignedMembers && trainer.assignedMembers.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-wider">Member Roster</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                      {trainer.assignedMembers.map(m => (
                        <Badge key={m.id} variant="secondary" className="text-[10px] font-medium bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 px-1.5 py-0">
                          {m.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {trainer.joining_date && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined: {new Date(trainer.joining_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!trainerToDelete} onOpenChange={() => setTrainerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sach mein delete karna hai?</AlertDialogTitle>
            <AlertDialogDescription>
              Ye trainer permanently delete ho jayega aur iske saare assigned members unassigned ho jayenge.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Haan, Delete Karo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
