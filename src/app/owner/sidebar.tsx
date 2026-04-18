'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  IndianRupee,
  Activity,
  Dumbbell,
  WrenchIcon,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/owner/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/owner/qr',         label: 'Print QR',   icon: ClipboardCheck },
  { href: '/owner/members',    label: 'Members',    icon: Users },
  { href: '/owner/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/owner/payments',   label: 'Payments',   icon: IndianRupee },
  { href: '/owner/expenses',   label: 'Expenses',   icon: ClipboardCheck },
  { href: '/owner/leads',      label: 'Leads',      icon: Activity },
  { href: '/owner/trainers',   label: 'Trainers',   icon: Dumbbell },
  { href: '/owner/equipment',  label: 'Equipment',  icon: WrenchIcon },
]

interface SidebarProps {
  gymName: string
  ownerName: string
}

function NavContent({ gymName, ownerName, onNavClick }: SidebarProps & { onNavClick?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Gym Name Header */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">{gymName}</p>
            <p className="text-xs text-muted-foreground">Owner Portal</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/owner/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Owner Info + Logout */}
      <div className="border-t px-3 py-4">
        <div className="flex items-center gap-3 mb-3 px-1">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {ownerName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{ownerName}</p>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit" className="w-full gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function OwnerSidebar({ gymName, ownerName }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r bg-background shrink-0 sticky top-0 h-screen">
        <NavContent gymName={gymName} ownerName={ownerName} />
      </aside>

      {/* Mobile: Top Bar + Sheet */}
      <div className="lg:hidden sticky top-0 z-40 w-full shrink-0 flex items-center gap-3 border-b bg-background px-4 h-14">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <NavContent
              gymName={gymName}
              ownerName={ownerName}
              onNavClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm truncate">{gymName}</span>
        </div>
      </div>
    </>
  )
}
