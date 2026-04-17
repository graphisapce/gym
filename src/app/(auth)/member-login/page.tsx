import { memberLogin, forgotPassword } from './actions'
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
import { Dumbbell, Mail, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function MemberLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; mode?: string; sent?: string }>
}) {
  const { message, mode, sent } = await searchParams
  const isForgot = mode === 'forgot'
  const emailSent = sent === '1'

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-sm space-y-4">

        {/* Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isForgot ? 'Password Reset' : 'Member Login'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isForgot
              ? 'Apna registered email daalo — reset link bhejenge'
              : 'Apne gym account mein login karo'}
          </p>
        </div>

        {/* Success / error message from redirects */}
        {message && (() => {
          const isError = message.includes('galat') || message.includes('zaroori') || message.includes('nahi')
          return (
            <div className={`text-sm p-3 rounded-md text-center border ${
              isError
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            }`}>
              {message}
            </div>
          )
        })()}

        <Card className="shadow-sm">
          {isForgot ? (
            emailSent ? (
              /* ── Email Sent Confirmation ── */
              <CardContent className="pt-8 pb-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-semibold text-base">Email Bhej Diya!</h3>
                <p className="text-sm text-muted-foreground">
                  Agar aapka email registered hai toh reset link bhej diya gaya hai.
                  Inbox check karo aur link pe click karo.
                </p>
                <Link
                  href="/member-login"
                  className="text-sm text-primary underline underline-offset-2 block mt-2"
                >
                  ← Wapas Login pe jao
                </Link>
              </CardContent>
            ) : (
              /* ── Forgot Password Form ── */
              <form action={forgotPassword}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Password Reset</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Email daalo — aapko reset link milega
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      name="email"
                      type="email"
                      placeholder="aapka@email.com"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full">
                    Reset Link Bhejo
                  </Button>
                  <Link
                    href="/member-login"
                    className="text-sm text-muted-foreground hover:text-foreground text-center w-full"
                  >
                    ← Wapas Login pe jao
                  </Link>
                </CardFooter>
              </form>
            )
          ) : (
            /* ── Login Form ── */
            <form action={memberLogin}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Login</CardTitle>
                <CardDescription className="text-xs">
                  Owner ne jo email diya ho woh daalo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="aapka@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/member-login?mode=forgot"
                      className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                    >
                      Password bhool gaye?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Login Karo
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Pehli baar? &quot;Password bhool gaye?&quot; se apna password set karo.
                </p>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Owner hain?{' '}
          <Link href="/login" className="underline hover:text-foreground">
            Owner login
          </Link>
        </p>
      </div>
    </div>
  )
}
