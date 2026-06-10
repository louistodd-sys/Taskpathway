import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChangelogClient from './ChangelogClient'

export default async function ChangelogPage() {
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

  const allowedRoles = ['owner', 'admin', 'reviewer']
  if (!allowedRoles.includes(membership.app_role)) redirect('/library')

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('company_id', membership.company_id)
    .eq('entity', 'document')
    .order('created_at', { ascending: false })
    .limit(200)

  return <ChangelogClient logs={logs ?? []} />
}
