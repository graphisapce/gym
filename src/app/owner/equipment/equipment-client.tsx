'use client'

import { useState } from 'react'
import { addEquipment, updateEquipment, deleteEquipment } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  PlusCircle,
  Pencil,
  Trash2,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  WrenchIcon,
} from 'lucide-react'

export interface Equipment {
  id: string
  name: string
  purchase_date: string | null
  last_service_date: string | null
  next_service_date: string | null
  warranty_expiry: string | null
  status: 'working' | 'needs_service' | 'out_of_order'
}

type EquipmentStatus = Equipment['status']

const STATUS_CONFIG: Record<
  EquipmentStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  working: {
    label: 'Working',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  needs_service: {
    label: 'Needs Service',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    icon: <WrenchIcon className="h-3.5 w-3.5" />,
  },
  out_of_order: {
    label: 'Out of Order',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isRowAlert(eq: Equipment): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(today.getDate() + 30)

  if (eq.next_service_date) {
    const nextService = new Date(eq.next_service_date)
    if (nextService < today) return true
  }
  if (eq.warranty_expiry) {
    const warranty = new Date(eq.warranty_expiry)
    if (warranty <= thirtyDaysLater) return true
  }
  return false
}

const EMPTY_FORM = {
  name: '',
  purchase_date: '',
  last_service_date: '',
  next_service_date: '',
  warranty_expiry: '',
  status: 'working' as EquipmentStatus,
}

export default function EquipmentClient({
  initialEquipment,
}: {
  initialEquipment: Equipment[]
}) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setIsAddOpen(true)
  }

  const openEdit = (eq: Equipment) => {
    setForm({
      name: eq.name,
      purchase_date: eq.purchase_date ?? '',
      last_service_date: eq.last_service_date ?? '',
      next_service_date: eq.next_service_date ?? '',
      warranty_expiry: eq.warranty_expiry ?? '',
      status: eq.status,
    })
    setEditingEquipment(eq)
  }

  const closeDialogs = () => {
    setIsAddOpen(false)
    setEditingEquipment(null)
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.set('name', form.name)
    fd.set('purchase_date', form.purchase_date)
    fd.set('last_service_date', form.last_service_date)
    fd.set('next_service_date', form.next_service_date)
    fd.set('warranty_expiry', form.warranty_expiry)
    fd.set('status', form.status)
    return fd
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const result = await addEquipment(buildFormData())
    setIsSubmitting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Equipment add ho gaya!')
      closeDialogs()
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEquipment) return
    setIsSubmitting(true)
    const result = await updateEquipment(editingEquipment.id, buildFormData())
    setIsSubmitting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Equipment update ho gaya!')
      closeDialogs()
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    const result = await deleteEquipment(deleteId)
    if (result.error) toast.error(result.error)
    else toast.success('Equipment delete ho gaya!')
    setDeleteId(null)
  }

  // Summary counts
  const counts = {
    working: initialEquipment.filter((e) => e.status === 'working').length,
    needs_service: initialEquipment.filter((e) => e.status === 'needs_service').length,
    out_of_order: initialEquipment.filter((e) => e.status === 'out_of_order').length,
    alerts: initialEquipment.filter(isRowAlert).length,
  }

  const equipmentFormFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="eq-name" className="text-right">
          Name
        </Label>
        <Input
          id="eq-name"
          className="col-span-3"
          placeholder="e.g. Treadmill, Dumbbell Set"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="eq-purchase" className="text-right">
          Purchase Date
        </Label>
        <Input
          id="eq-purchase"
          type="date"
          className="col-span-3"
          value={form.purchase_date}
          onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="eq-last-svc" className="text-right text-sm">
          Last Service
        </Label>
        <Input
          id="eq-last-svc"
          type="date"
          className="col-span-3"
          value={form.last_service_date}
          onChange={(e) => setForm((f) => ({ ...f, last_service_date: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="eq-next-svc" className="text-right text-sm">
          Next Service
        </Label>
        <Input
          id="eq-next-svc"
          type="date"
          className="col-span-3"
          value={form.next_service_date}
          onChange={(e) => setForm((f) => ({ ...f, next_service_date: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="eq-warranty" className="text-right text-sm">
          Warranty Expiry
        </Label>
        <Input
          id="eq-warranty"
          type="date"
          className="col-span-3"
          value={form.warranty_expiry}
          onChange={(e) => setForm((f) => ({ ...f, warranty_expiry: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="eq-status" className="text-right">
          Status
        </Label>
        <div className="col-span-3">
          <Select
            value={form.status}
            onValueChange={(val) =>
              val !== null && setForm((f) => ({ ...f, status: val as EquipmentStatus }))
            }
          >
            <SelectTrigger id="eq-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="working">✅ Working</SelectItem>
              <SelectItem value="needs_service">🔧 Needs Service</SelectItem>
              <SelectItem value="out_of_order">❌ Out of Order</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm border-green-200 dark:border-green-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              Working
            </div>
            <div className="text-2xl font-bold text-green-600">{counts.working}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-orange-200 dark:border-orange-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <WrenchIcon className="h-3.5 w-3.5 text-orange-500" />
              Needs Service
            </div>
            <div className="text-2xl font-bold text-orange-500">{counts.needs_service}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200 dark:border-red-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              Out of Order
            </div>
            <div className="text-2xl font-bold text-red-500">{counts.out_of_order}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              Needs Attention
            </div>
            <div className="text-2xl font-bold text-red-600">{counts.alerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialEquipment.length} equipment item{initialEquipment.length !== 1 ? 's' : ''} total
        </p>
        <Button id="add-equipment-btn" onClick={openAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Equipment Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {initialEquipment.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-t border-dashed">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p>Abhi tak koi equipment add nahi hua.</p>
              <p className="text-sm mt-1">Upar &quot;Add Equipment&quot; button dabao!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">Purchase Date</TableHead>
                    <TableHead className="min-w-[130px]">Last Service</TableHead>
                    <TableHead className="min-w-[130px]">Next Service</TableHead>
                    <TableHead className="min-w-[130px]">Warranty Expiry</TableHead>
                    <TableHead className="min-w-[130px]">Status</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialEquipment.map((eq) => {
                    const alert = isRowAlert(eq)
                    return (
                      <TableRow
                        key={eq.id}
                        className={
                          alert
                            ? 'bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                            : ''
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {alert && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            )}
                            {eq.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(eq.purchase_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(eq.last_service_date)}
                        </TableCell>
                        <TableCell>
                          <ServiceDateCell date={eq.next_service_date} />
                        </TableCell>
                        <TableCell>
                          <WarrantyDateCell date={eq.warranty_expiry} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${STATUS_CONFIG[eq.status].className}`}
                          >
                            {STATUS_CONFIG[eq.status].icon}
                            {STATUS_CONFIG[eq.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              id={`edit-eq-${eq.id}`}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(eq)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              id={`delete-eq-${eq.id}`}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => setDeleteId(eq.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Naya Equipment Add Karo</DialogTitle>
              <DialogDescription>
                Equipment ki saari details fill karo aur save karo.
              </DialogDescription>
            </DialogHeader>
            {equipmentFormFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Equipment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingEquipment} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Equipment Edit Karo</DialogTitle>
              <DialogDescription>
                Details update karo aur save karo.
              </DialogDescription>
            </DialogHeader>
            {equipmentFormFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Equipment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sach mein delete karna hai?</AlertDialogTitle>
            <AlertDialogDescription>
              Ye equipment permanently delete ho jayega. Ye action undo nahi ho sakta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Haan, Delete Karo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ──────────────────────────────────────────────────
// Helper sub-components for date cells with coloring
// ──────────────────────────────────────────────────

function ServiceDateCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  const overdue = d < today

  return (
    <span className={overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
      {overdue && <AlertTriangle className="inline h-3 w-3 mr-1 -mt-0.5" />}
      {formatDate(date)}
    </span>
  )
}

function WarrantyDateCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(today.getDate() + 30)
  const d = new Date(date)

  const expired = d < today
  const expiringSoon = !expired && d <= thirtyDaysLater

  if (expired) {
    return (
      <span className="text-red-600 font-semibold">
        <AlertTriangle className="inline h-3 w-3 mr-1 -mt-0.5" />
        {formatDate(date)}
      </span>
    )
  }
  if (expiringSoon) {
    return (
      <span className="text-orange-600 font-medium">
        ⚠ {formatDate(date)}
      </span>
    )
  }
  return <span className="text-muted-foreground">{formatDate(date)}</span>
}
