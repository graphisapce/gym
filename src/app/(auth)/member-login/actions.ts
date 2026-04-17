'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function memberLogin(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!email || !password) redirect('/member-login?message=' + encodeURIComponent('Email aur password dono zaroori hain.'))

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/member-login?message=' + encodeURIComponent('Email ya password galat hai. Pehli baar login kar rahe hain? "Password bhool gaye?" use karo password set karne ke liye.'))

  redirect('/member/dashboard')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string).trim()

  if (!email) redirect('/member-login?mode=forgot&message=' + encodeURIComponent('Email daalna zaroori hai.'))

  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/auth/callback?next=/reset-password`,
  })

  // Always show success (security best practice — don't reveal if email exists)
  if (error) console.error('Password reset error:', error.message)
  redirect('/member-login?mode=forgot&sent=1')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 6)
    return { error: 'Password kam se kam 6 characters ka hona chahiye.' }
  if (password !== confirm) return { error: 'Dono passwords match nahi kar rahe.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: 'Password reset nahi ho paya: ' + error.message }

  redirect('/member-login?message=Password reset ho gaya! Ab login karo.')
}
