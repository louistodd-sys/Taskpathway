'use client'

import { useState, useMemo } from 'react'
import { GitBranch, Search, ChevronDown, ChevronRight, Clock, FileText, X } from 'lucide-react'
import Link from 'next/link'
import type { AuditLogEntry } from '@/lib/types'

const ACTION_COLORS: Record<string, string> = {
  Created: 'bg-green-100 text-green-800',
  Updated: 'bg-blue-100 text-blue-800',
  'Status Change': 'bg-purple-100 text-purple-800',
  'Steps Added': 'bg-teal-100 text-teal-800',
  'Steps Removed': 'bg-orange-100 text-orange-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
}

function LogEntry({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const color = ACTION_COLORS[log.action_type] ?? 'bg-gray-100 text-gray-700'
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded(v => !v)}>
        <div className="mt-0.5 text-gray-400 shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{log.action_type}</span>
          </div>
          <p className="font-medium text-gray-800 text-sm truncate">{log.summary}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </button>
      {expanded && log.entity_id && (
        <div className="px-4 pb-4 pt-0 ml-7 border-t border-gray-100">
          <Link href={`/edit/${log.entity_id}`} className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline mt-2">
            <FileText className="w-3.5 h-3.5" />Open task
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ChangelogClient({ logs }: { logs: AuditLogEntry[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const filtered = useMemo(() => logs.filter(l => {
    const matchSearch = !search || l.summary.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || l.action_type === typeFilter
    return matchSearch && matchType
  }), [logs, search, typeFilter])
  const stats = { total: logs.length, created: logs.filter(l => l.action_type === 'Created').length, approved: logs.filter(l => l.action_type === 'Approved').length, rejected: logs.filter(l => l.action_type === 'Rejected').length }
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><GitBranch className="w-5 h-5 text-indigo-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management of Change</h1>
          <p className="text-sm text-gray-400">Full audit trail of all task changes, versions, and approvals</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{ label: 'Total changes', value: stats.total, color: 'text-gray-700' }, { label: 'Created', value: stats.created, color: 'text-green-700' }, { label: 'Approvals', value: stats.approved, color: 'text-emerald-700' }, { label: 'Rejections', value: stats.rejected, color: 'text-red-700' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search changes…" className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="all">All changes</option>
          <option value="Created">Created</option><option value="Updated">Updated</option><option value="Status Change">Status Change</option><option value="Steps Added">Steps Added</option><option value="Steps Removed">Steps Removed</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No change log entries found.</p></div>
      ) : (
        <div className="space-y-3"><p className="text-sm text-gray-500">{filtered.length} change{filtered.length !== 1 ? 's' : ''}</p>{filtered.map(log => <LogEntry key={log.id} log={log} />)}</div>
      )}
    </div>
  )
}
