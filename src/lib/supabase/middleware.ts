import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT use supabase.auth.getSession() here! It's not secure.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const pathname = request.nextUrl.pathname

  // Public routes — never redirect these
  const isPublicRoute =
    pathname.startsWith('/auth/') ||         // Supabase OAuth callback
    pathname.startsWith('/reset-password')   // Password set page for invited members

  if (isPublicRoute) return supabaseResponse

  // Auth pages (login screens — redirect AWAY if already logged in)
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/member-login')

  // Protected routes — note: use /member/ (with slash) to avoid matching /member-login
  const isOwnerRoute = pathname.startsWith('/owner')
  const isMemberRoute = pathname.startsWith('/member/')  // exact prefix with trailing slash

  if (user) {
    const role = user.user_metadata?.role

    // Logged-in → redirect away from login pages to correct dashboard
    if (isAuthRoute) {
      if (role === 'owner') {
        url.pathname = '/owner/dashboard'
        return NextResponse.redirect(url)
      } else if (role === 'member') {
        url.pathname = '/member/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Role-based route protection
    if (isOwnerRoute && role !== 'owner') {
      url.pathname = role === 'member' ? '/member/dashboard' : '/login'
      return NextResponse.redirect(url)
    }

    if (isMemberRoute && role !== 'member') {
      url.pathname = role === 'owner' ? '/owner/dashboard' : '/login'
      return NextResponse.redirect(url)
    }
  } else {
    // Not logged in — block protected routes
    if (isOwnerRoute || isMemberRoute) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
