import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, GitBranch, FileText } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  Created: 'bg-green-100 text-green-800',
  Updated: 'bg-blue-100 text-blue-800',
  'Status Change': 'bg-purple-100 text-purple-800',
  'Steps Added': 'bg-teal-100 text-teal-800',
  'Steps Removed': 'bg-orange-100 text-orange-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
}

export default async function DocumentHistoryPage({ params }: { params: { id: string } }) {
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

  const { data: task } = await supabase
    .from('documents')
    .select('id, title, status, current_version_number')
    .eq('id', params.id)
    .eq('company_id', membership.company_id)
    .single()

  if (!task) notFound()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_id', params.id)
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false })

  const STATUS_COLORS: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-600',
    'In Review': 'bg-blue-100 text-blue-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Archived: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/edit/${params.id}`}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{task.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {task.status}
            </span>
            <span className="text-xs text-gray-400">v{task.current_version_number}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">{logs?.length ?? 0} events</span>
        </div>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="text-center py-16">
          <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No history recorded yet.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-4 pl-12">
            {logs.map((log, i) => {
              const color = ACTION_COLORS[log.action_type] ?? 'bg-gray-100 text-gray-700'
              return (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[2.15rem] w-3 h-3 rounded-full bg-indigo-400 border-2 border-white ring-1 ring-indigo-300 mt-1.5" />

                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
                            {log.action_type}
                          </span>
                          {i === 0 && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Latest</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800">{log.summary}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link
          href={`/edit/${params.id}`}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <FileText className="w-4 h-4" />
          Back to task editor
        </Link>
      </div>
    </div>
  )
}
