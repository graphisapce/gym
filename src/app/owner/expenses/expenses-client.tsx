'use client'

import { useState } from 'react'
import { addExpense, deleteExpense } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, PlusCircle, Calendar, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'

export default function ExpensesClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [monthFilter, setMonthFilter] = useState('ALL')
  const [selectedCategory, setSelectedCategory] = useState('rent')

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set('category', selectedCategory)
    
    const result = await addExpense(formData)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Expense recorded!')
      setIsAddOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you certain you want to delete this expense logging?')) return
    const result = await deleteExpense(id)
    if (result.error) toast.error(result.error)
    else toast.success('Expense deleted.')
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  // Filter Logic
  const filteredList = initialExpenses.filter(e => {
    if (monthFilter === 'ALL') return true
    return e.expense_date.substring(0, 7) === monthFilter
  })

  // Group by category to show sum
  const categoryTotals = filteredList.reduce((acc: any, cur) => {
    acc[cur.category] = (acc[cur.category] || 0) + Number(cur.amount)
    return acc
  }, {})

  const allMonths = Array.from(new Set(initialExpenses.map(h => h.expense_date.substring(0, 7)))).sort().reverse()

  return (
    <div className="space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-muted/30 p-1.5 rounded-lg items-center gap-2 border w-full sm:w-auto">
          <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
          <Select value={monthFilter} onValueChange={(v) => v !== null && setMonthFilter(v)}>
            <SelectTrigger className="w-[180px] h-9 border-0 bg-transparent focus:ring-0 shadow-none">
              <SelectValue placeholder="Timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Time Expenses</SelectItem>
              {allMonths.map(ym => (
                <SelectItem key={ym} value={ym}>
                  {new Date(ym + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Button>} />
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddSubmit}>
              <DialogHeader>
                <DialogTitle>Log New Expense</DialogTitle>
                <DialogDescription>Record a business cost like rent or electricity.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Category</Label>
                  <div className="col-span-3">
                    <Select value={selectedCategory} onValueChange={(v) => v && setSelectedCategory(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="salary">Salaries</SelectItem>
                        <SelectItem value="electricity">Electricity / Utility</SelectItem>
                        <SelectItem value="equipment_repair">Equipment Repair</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other Misc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input id="date" name="expense_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" className="col-span-3" placeholder="e.g. 5000" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desc" className="text-right">Note</Label>
                  <Input id="desc" name="description" className="col-span-3" placeholder="Vendor name, bill number..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Expense'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.keys(categoryTotals).length === 0 ? (
          <div className="col-span-full p-4 border rounded-lg text-center text-sm text-muted-foreground bg-muted/20">
            No expenses found for this period.
          </div>
        ) : (
          Object.entries(categoryTotals).map(([cat, total]: [string, any]) => (
            <Card key={cat} className="shadow-none flex flex-col justify-center bg-card">
              <CardContent className="p-4 flex text-center flex-col items-center justify-center h-full">
                <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">{cat.replace('_', ' ')}</span>
                <span className="text-lg font-bold text-red-600/80">{formatCurrency(total)}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs font-normal">
                    {expense.category.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {expense.description || '—'}
                </TableCell>
                <TableCell className="text-right font-semibold text-red-600/90">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(expense.id)} className="h-8 w-8 text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  )
}
