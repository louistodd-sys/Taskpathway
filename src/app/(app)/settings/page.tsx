import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: membership } = await supabase.from('memberships').select('*, companies(*)').eq('user_id', user.id).eq('active', true).single()
  if (!membership) redirect('/register')
  if (!['owner', 'admin'].includes(membership.app_role)) redirect('/library')
  return <SettingsClient membership={membership} />
}
