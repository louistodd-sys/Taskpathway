import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, UserPlus, Settings, GitBranch, ChevronRight } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('company_id, app_role, companies(*)')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (!membership) redirect('/register')
  if (!['owner', 'admin'].includes(membership.app_role)) redirect('/library')

  const [{ count: userCount }, { count: pendingInvites }, { count: taskCount }] = await Promise.all([
    supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('company_id', membership.company_id).eq('active', true),
    supabase.from('tp_invitations').select('*', { count: 'exact', head: true }).eq('company_id', membership.company_id).eq('accepted', false),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('company_id', membership.company_id).eq('active', true),
  ])

  const cards = [
    { href: '/admin/users', icon: Users, label: 'Team Members', desc: 'Manage user roles and access', stat: userCount, statLabel: 'active members' },
    { href: '/admin/invite', icon: UserPlus, label: 'Invite People', desc: 'Add team members by email', stat: pendingInvites, statLabel: 'pending invites' },
    { href: '/settings', icon: Settings, label: 'Workspace Settings', desc: 'Company name, logo, and preferences', stat: null, statLabel: '' },
    { href: '/changelog', icon: GitBranch, label: 'Change Log', desc: 'Full audit trail of all task activity', stat: taskCount, statLabel: 'tasks tracked' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your workspace, team, and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(({ href, icon: Icon, label, desc, stat, statLabel }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
              {stat !== null && (
                <p className="text-xs font-medium text-indigo-600 mt-3">{stat} {statLabel}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
