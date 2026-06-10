'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [invitation, setInvitation] = useState<{ email: string; app_role: string; company_id: string; accepted: boolean; expires_at: string } | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [step, setStep] = useState<'loading' | 'register' | 'login' | 'done'>('loading')

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadInvite() {
      const { data } = await supabase
        .from('tp_invitations')
        .select('email, app_role, company_id, accepted, expires_at')
        .eq('token', token)
        .single()

      if (!data || data.accepted || new Date(data.expires_at) < new Date()) {
        setInvalid(true)
      } else {
        setInvitation(data)
        setStep('register')
      }
      setLoadingInvite(false)
    }
    loadInvite()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    setSubmitting(true)
    setError('')

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: invitation.email, password })
      if (signInError) { setError(signUpError.message); setSubmitting(false); return }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Could not create account. Try again.'); setSubmitting(false); return }

    const { error: memberError } = await supabase
      .from('memberships')
      .upsert({ company_id: invitation.company_id, user_id: user.id, app_role: invitation.app_role, active: true })

    if (memberError) { setError(memberError.message); setSubmitting(false); return }

    await supabase.from('tp_invitations').update({ accepted: true }).eq('token', token)

    setStep('done')
    setTimeout(() => router.push('/library'), 2000)
  }

  if (loadingInvite) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid or expired invite</h1>
        <p className="text-gray-500 text-sm">This invite link is no longer valid. Ask your admin to send a new one.</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome to TaskPathway!</h1>
        <p className="text-gray-500 text-sm">Taking you to the app…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
          <span className="text-white font-bold text-lg">TP</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Join TaskPathway</h1>
        <p className="text-gray-500 mt-1 text-sm">You've been invited as a <strong>{invitation?.app_role}</strong></p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p className="text-sm text-gray-600 mb-6 bg-indigo-50 px-4 py-3 rounded-lg">
          Signing up as <strong>{invitation?.email}</strong>
        </p>
        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Setting up account…' : 'Accept invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}
