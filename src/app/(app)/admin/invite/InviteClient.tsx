'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Copy, Check, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TpInvitation, AppRole } from '@/lib/types'

const ROLES: { value: AppRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Full access, manage users' },
  { value: 'author', label: 'Author', desc: 'Create and edit tasks' },
  { value: 'reviewer', label: 'Reviewer', desc: 'Review and approve tasks' },
  { value: 'viewer', label: 'Viewer', desc: 'View approved tasks only' },
]

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://taskpathway.com'

export default function InviteClient({
  companyId, userId, userDisplayName, pendingInvites
}: {
  companyId: string
  userId: string
  userDisplayName: string
  pendingInvites: TpInvitation[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AppRole>('author')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newInviteLink, setNewInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase
      .from('tp_invitations')
      .insert({
        company_id: companyId,
        email: email.toLowerCase().trim(),
        app_role: role,
        invited_by: userId,
        invited_by_name: userDisplayName,
      })
      .select()
      .single()

    setLoading(false)
    if (error) { setError(error.message); return }

    const link = `${APP_URL}/accept-invite/${data.token}`
    setNewInviteLink(link)
    setEmail('')
    router.refresh()
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invite People</h1>
          <p className="text-sm text-gray-400 mt-0.5">Generate invite links to add team members</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">New invitation</h2>
        <form onSubmit={sendInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="colleague@company.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${role === r.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.label}</p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating link…' : 'Generate invite link'}
          </button>
        </form>

        {newInviteLink && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">Invite link created!</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={newInviteLink}
                className="flex-1 text-xs bg-white border border-green-300 rounded px-2 py-1.5 font-mono"
              />
              <button
                onClick={() => copyLink(newInviteLink)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-green-600 mt-2">Link expires in 7 days. Share this with your team member.</p>
          </div>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Pending invites ({pendingInvites.length})</h2>
          <div className="space-y-3">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{inv.email}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    Expires {new Date(inv.expires_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{inv.app_role}</span>
                  <button
                    onClick={() => copyLink(`${APP_URL}/accept-invite/${inv.token}`)}
                    className="text-xs text-gray-400 hover:text-indigo-600 p-1.5 rounded hover:bg-gray-50"
                    title="Copy invite link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
