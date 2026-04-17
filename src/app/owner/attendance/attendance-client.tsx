'use client'

import { useState, useEffect } from 'react'
import { searchMembers, markPresent } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Loader2, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function AttendanceClient({ 
  todaysList, 
  thisWeek, 
  lastWeek 
}: { 
  todaysList: any[], 
  thisWeek: number, 
  lastWeek: number 
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMarking, setIsMarking] = useState<string | null>(null)
  const [localTodaysList, setLocalTodaysList] = useState(todaysList)

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true)
        const found = await searchMembers(query.toLowerCase())
        setResults(found)
        setIsSearching(false)
      } else {
        setResults([])
      }
    }, 300) // Debounce

    return () => clearTimeout(handler)
  }, [query])

  const handleMarkPresent = async (id: string, name: string) => {
    setIsMarking(id)
    const res = await markPresent(id)
    setIsMarking(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`${name} marked present!`)
      // Optimistically add to today's list so UI updates immediately
      setLocalTodaysList(prev => [{
        id: Date.now().toString(),
        check_in: new Date().toISOString(),
        name,
      }, ...prev])
      setQuery('') // Clear search
      setResults([]) // Clear results
    }
  }

  const trend = thisWeek - lastWeek
  const trendPercent = lastWeek > 0 ? ((trend / lastWeek) * 100).toFixed(1) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: Search & Spotlight */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Search Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Type member name or phone..."
                className="pl-10 h-12 text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Live Search Results */}
            {results.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {results.map((member) => {
                  const isExpired = new Date(member.expiry_date) < new Date()
                  return (
                    <Card key={member.id} className={`overflow-hidden transition-all ${isExpired ? 'border-red-200' : 'border-green-200'}`}>
                      <div className="p-4 flex items-center justify-between gap-4 bg-muted/30">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {member.name.substring(0,2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg leading-none">{member.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{member.phone}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                          {isExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge className="bg-green-500">Active</Badge>
                          )}
                          
                          <Button 
                            disabled={isExpired || isMarking === member.id}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                            onClick={() => handleMarkPresent(member.id, member.name)}
                          >
                            {isMarking === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Present'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {query.length >= 2 && !isSearching && results.length === 0 && (
              <div className="mt-4 text-center p-8 bg-muted/20 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No members found matching "{query}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Full List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Today's Check-ins ({localTodaysList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {localTodaysList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                <Clock className="h-12 w-12 mb-3 text-muted-foreground/30" />
                No one has checked in today yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Member Name</TableHead>
                    <TableHead className="text-right pr-6">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localTodaysList.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-6 font-medium">{entry.name}</TableCell>
                      <TableCell className="text-right pr-6 text-muted-foreground">
                        {new Date(entry.check_in).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Trends Sidebar */}
      <div className="space-y-6">
        <Card className="shadow-sm bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground/80 text-sm font-medium">This Week vs Last Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-5xl font-bold">{thisWeek}</div>
                <p className="text-primary-foreground/70 mt-1">Total visits (7 days)</p>
              </div>
              
              {trend !== 0 && (
                <div className={`flex flex-col items-end ${trend > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  <div className="flex items-center text-xl font-semibold">
                    {trend > 0 ? <ArrowUpRight className="h-6 w-6 mr-1" /> : <ArrowDownRight className="h-6 w-6 mr-1" />}
                    {Math.abs(Number(trendPercent))}%
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-primary-foreground/20 flex justify-between text-sm">
              <span className="text-primary-foreground/80">Previous 7 days</span>
              <span className="font-semibold">{lastWeek} visits</span>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
