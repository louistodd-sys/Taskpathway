import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TaskEditor from '@/components/tasks/TaskEditor'

export default async function CreatePage() {
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

  const canCreate = ['owner', 'admin', 'author'].includes(membership.app_role)
  if (!canCreate) redirect('/library')

  return (
    <div className="p-8">
      <TaskEditor
        companyId={membership.company_id}
        userId={user.id}
        userRole={membership.app_role}
      />
    </div>
  )
}
