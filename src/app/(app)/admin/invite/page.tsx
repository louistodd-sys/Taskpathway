import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InviteClient from './InviteClient'

export default async function InvitePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('company_id, app_role')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (!membership) redirect('/register')
  if (!['owner', 'admin'].includes(membership.app_role)) redirect('/library')

  const { data: pendingInvites } = await supabase
    .from('tp_invitations')
    .select('*')
    .eq('company_id', membership.company_id)
    .eq('accepted', false)
    .order('created_at', { ascending: false })

  return (
    <InviteClient
      companyId={membership.company_id}
      userId={user.id}
      userDisplayName={user.user_metadata?.full_name || user.email || 'Admin'}
      pendingInvites={pendingInvites ?? []}
    />
  )
}
