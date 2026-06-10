'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Search, FileText, CheckCircle, Clock, AlertCircle, X, Star
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TaskCard from '@/components/tasks/TaskCard'
import type { Document, Membership } from '@/lib/types'

const AUTHOR_ROLES = ['owner', 'admin', 'author']
const FAV_KEY = 'tp_favourites'

type StatusFilter = 'all' | 'Draft' | 'In Review' | 'Approved' | 'Rejected' | 'Archived' | 'favourites'
type TypeFilter = 'all' | 'Task' | 'Work Instruction'

function loadFavourites(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')) } catch { return new Set() }
}

function saveFavourites(ids: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...ids]))
}

export default function LibraryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tasks, setTasks] = useState<Document[]>([])
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [favourites, setFavourites] = useState<Set<string>>(new Set())

  useEffect(() => {
    setFavourites(loadFavourites())
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: mem } = await supabase
        .from('memberships')
        .select('*, companies(*)')
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

      if (!mem) { router.push('/register'); return }
      setMembership(mem)

      const isViewer = mem.app_role === 'viewer'
      let query = supabase
        .from('documents')
        .select('*')
        .eq('company_id', mem.company_id)
        .eq('active', true)
        .order('updated_at', { ascending: false })

      if (isViewer) query = query.eq('status', 'Approved')

      const { data } = await query
      setTasks(data ?? [])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFavourite = useCallback((id: string) => {
    setFavourites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveFavourites(next)
      return next
    })
  }, [])

  const departments = useMemo(() => {
    const depts = [...new Set(tasks.map(t => t.department).filter(Boolean))] as string[]
    return depts.sort()
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.document_type.toLowerCase().includes(search.toLowerCase()) ||
        (t.department ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' ? true
        : statusFilter === 'favourites' ? favourites.has(t.id)
        : t.status === statusFilter
      const matchType = typeFilter === 'all' || t.document_type === typeFilter
      const matchDept = deptFilter === 'all' || t.department === deptFilter
      return matchSearch && matchStatus && matchType && matchDept
    })
  }, [tasks, search, statusFilter, typeFilter, deptFilter, favourites])

  const stats = useMemo(() => ({
    total: tasks.length,
    draft: tasks.filter(t => t.status === 'Draft').length,
    inReview: tasks.filter(t => t.status === 'In Review').length,
    approved: tasks.filter(t => t.status === 'Approved').length,
    favourites: tasks.filter(t => favourites.has(t.id)).length,
  }), [tasks, favourites])

  const canCreate = AUTHOR_ROLES.includes(membership?.app_role ?? '')
  const isViewer = membership?.app_role === 'viewer'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Library</h1>
          <p className="text-gray-400 mt-0.5 text-sm">{filtered.length} of {tasks.length} tasks</p>
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

      {!isViewer && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: FileText, color: 'text-gray-700', bg: 'bg-gray-50', filter: 'all' as StatusFilter },
            { label: 'Draft', value: stats.draft, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', filter: 'Draft' as StatusFilter },
            { label: 'In Review', value: stats.inReview, icon: AlertCircle, color: 'text-blue-700', bg: 'bg-blue-50', filter: 'In Review' as StatusFilter },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50', filter: 'Approved' as StatusFilter },
            { label: 'Favourites', value: stats.favourites, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', filter: 'favourites' as StatusFilter },
          ].map(({ label, value, icon: Icon, color, bg, filter }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(statusFilter === filter ? 'all' : filter)}
              className={`${bg} rounded-xl p-4 text-left transition-all border-2 ${statusFilter === filter ? 'border-indigo-400' : 'border-transparent'} hover:border-indigo-300`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">{label}</span>
                <Icon className={`w-4 h-4 ${color} ${label === 'Favourites' && value > 0 ? 'fill-amber-400' : ''}`} />
              </div>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </button>
          ))}
        </div>
      )}

      {isViewer && stats.favourites > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setStatusFilter(statusFilter === 'favourites' ? 'all' : 'favourites')}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${statusFilter === 'favourites' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Star className={`w-4 h-4 ${statusFilter === 'favourites' ? 'fill-amber-400 text-amber-400' : ''}`} />
            Favourites ({stats.favourites})
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as TypeFilter)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All types</option>
          <option value="Task">Task</option>
          <option value="Work Instruction">Work Instruction</option>
        </select>
        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        {!isViewer && (
          <select
            value={statusFilter === 'favourites' ? 'all' : statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="In Review">In Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
          </select>
        )}
      </div>

      {!filtered.length ? (
        <div className="text-center py-24">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {tasks.length === 0
              ? 'Create your first task to get your team started.'
              : 'Try adjusting your search or filters.'}
          </p>
          {canCreate && tasks.length === 0 && (
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
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canCreate}
              isFavourite={favourites.has(task.id)}
              onToggleFavourite={toggleFavourite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
