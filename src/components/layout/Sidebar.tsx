'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Plus, LogOut, GitBranch, Shield, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Membership } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const AUTHOR_ROLES = ['owner', 'admin', 'author']
const ADMIN_ROLES = ['owner', 'admin']

interface SidebarProps {
  user: User
  membership: Membership
}

export default function Sidebar({ user, membership }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const canCreate = AUTHOR_ROLES.includes(membership.app_role)
  const isAdmin = ADMIN_ROLES.includes(membership.app_role)
  const canViewChangelog = ['owner', 'admin', 'reviewer'].includes(membership.app_role)

  const navItems = [
    { href: '/library', label: 'Task Library', icon: BookOpen },
    ...(canCreate ? [{ href: '/create', label: 'Create Task', icon: Plus }] : []),
  ]

  const adminItems = [
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: Shield }] : []),
    ...(canViewChangelog ? [{ href: '/changelog', label: 'Change Log', icon: GitBranch }] : []),
    ...(isAdmin ? [{ href: '/settings', label: 'Settings', icon: Settings }] : []),
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/library' && pathname.startsWith(href))

  const navLink = (href: string, label: string, Icon: React.ElementType) => (
    <li key={href}>
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive(href)
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    </li>
  )

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Branding */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">TP</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 text-sm">TaskPathway</h1>
            <p className="text-xs text-gray-400 truncate">{membership.companies?.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Workspace</p>
          <ul className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
          </ul>
        </div>

        {adminItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Management</p>
            <ul className="space-y-0.5">
              {adminItems.map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
            </ul>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
          <div className="flex gap-1.5 mt-1.5">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              {membership.app_role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors px-1"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
