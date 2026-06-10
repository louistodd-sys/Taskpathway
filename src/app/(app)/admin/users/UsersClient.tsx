'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Membership, AppRole } from '@/lib/types'
const ROLES: AppRole[] = ['admin', 'author', 'reviewer', 'viewer']
const roleBadge: Record<string, string> = { owner: 'bg-purple-100 text-purple-700', admin: 'bg-indigo-100 text-indigo-700', author: 'bg-blue-100 text-blue-700', reviewer: 'bg-yellow-100 text-yellow-700', viewer: 'bg-gray-100 text-gray-600' }
export default function UsersClient({ members, currentUserId, currentUserRole }: { members: Membership[], currentUserId: string, currentUserRole: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')
  async function updateRole(id: string, role: AppRole) { setUpdating(id); const { error } = await supabase.from('memberships').update({ app_role: role }).eq('id', id); if (error) setError(error.message); setUpdating(null); router.refresh() }
  async function deactivate(id: string) { if (!confirm('Remove this user?')) return; setUpdating(id); await supabase.from('memberships').update({ active: false }).eq('id', id); setUpdating(null); router.refresh() }
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><Link href="/admin" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link><div><h1 className="text-2xl font-bold text-gray-900">Team Members</h1><p className="text-sm text-gray-400 mt-0.5">{members.length} active</p></div></div>
      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {members.map((m, i) => {
          const isMe = m.user_id === currentUserId
          const canModify = currentUserRole === 'owner' && !isMe
          return (
            <div key={m.id} className={`flex items-center gap-4 px-6 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-indigo-400" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{m.user_id}{isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}</p></div>
              <div className="flex items-center gap-3">
                {canModify ? <select value={m.app_role} disabled={updating === m.id} onChange={e => updateRole(m.id, e.target.value as AppRole)} className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white">{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  : <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge[m.app_role] ?? 'bg-gray-100 text-gray-600'}`}>{m.app_role}</span>}
                {canModify && <button onClick={() => deactivate(m.id)} disabled={updating === m.id} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg">Remove</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
