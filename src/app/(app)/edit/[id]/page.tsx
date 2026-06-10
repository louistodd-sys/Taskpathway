import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import TaskEditor from '@/components/tasks/TaskEditor'

export default async function EditPage({ params }: { params: { id: string } }) {
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

  // Reviewers and admins can view in edit mode to approve/reject
  const allowedRoles = ['owner', 'admin', 'author', 'reviewer']
  if (!allowedRoles.includes(membership.app_role)) redirect('/library')

  const { data: task } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('company_id', membership.company_id)
    .single()

  if (!task) notFound()

  const { data: steps } = await supabase
    .from('steps')
    .select('*')
    .eq('document_id', params.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8">
      <TaskEditor
        companyId={membership.company_id}
        userId={user.id}
        userRole={membership.app_role}
        task={task}
        steps={steps ?? []}
      />
    </div>
  )
}
