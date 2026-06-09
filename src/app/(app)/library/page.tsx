import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import TaskCard from '@/components/tasks/TaskCard'

const AUTHOR_ROLES = ['owner', 'admin', 'author']

export default async function LibraryPage() {
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

  const { data: tasks } = await supabase
    .from('documents')
    .select('*')
    .eq('company_id', membership.company_id)
    .eq('active', true)
    .order('updated_at', { ascending: false })

  const canCreate = AUTHOR_ROLES.includes(membership.app_role)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Library</h1>
          <p className="text-gray-400 mt-1 text-sm">{tasks?.length ?? 0} tasks</p>
        </div>
        {canCreate && (
          <Link
            href="/create"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Link>
        )}
      </div>

      {!tasks?.length ? (
        <div className="text-center py-24">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-400 text-sm mb-6">
            Create your first task to get your team started.
          </p>
          {canCreate && (
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first task
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canCreate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
