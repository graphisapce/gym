'use client'

import { useState } from 'react'
import { resetPassword } from '@/app/(auth)/member-login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { KeyRound, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await resetPassword(fd)
    setLoading(false)
    if (result?.error) setError(result.error)
    // on success, resetPassword() redirects so we won't reach here
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-sm space-y-4">

        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Naya Password Set Karo</h1>
          <p className="text-muted-foreground text-sm">
            Apna naya password enter karo
          </p>
        </div>

        <Card className="shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Password Reset</CardTitle>
              <CardDescription className="text-xs">
                Naya strong password choose karo (minimum 6 characters)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Naya Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Password Confirm Karo</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <CheckCircle2 className="h-4 w-4" />
                {loading ? 'Saving...' : 'Password Save Karo'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
