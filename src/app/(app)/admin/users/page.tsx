import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: membership } = await supabase.from('memberships').select('company_id, app_role').eq('user_id', user.id).eq('active', true).single()
  if (!membership) redirect('/register')
  if (!['owner', 'admin'].includes(membership.app_role)) redirect('/library')
  const { data: members } = await supabase.from('memberships').select('*').eq('company_id', membership.company_id).eq('active', true).order('created_at', { ascending: true })
  return <UsersClient members={members ?? []} currentUserId={user.id} currentUserRole={membership.app_role} />
}
