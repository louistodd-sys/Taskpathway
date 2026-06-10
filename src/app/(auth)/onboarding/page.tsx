'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Factory, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const INDUSTRIES = [
  { value: 'Manufacturing', icon: '🏭', desc: 'Production lines, assembly, fabrication' },
  { value: 'Food Production', icon: '🍽️', desc: 'Processing, packaging, quality control' },
  { value: 'Logistics', icon: '🚚', desc: 'Warehousing, distribution, transport' },
  { value: 'Healthcare', icon: '🏥', desc: 'Clinical, care, medical procedures' },
  { value: 'Construction', icon: '🏗️', desc: 'Civil, mechanical, fit-out' },
  { value: 'Hospitality', icon: '🏨', desc: 'Hotels, restaurants, catering' },
  { value: 'Retail', icon: '🛒', desc: 'In-store operations, stock management' },
  { value: 'Other', icon: '💼', desc: 'Any other industry' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/register'); return }
      const { data: mem } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('active', true).maybeSingle()
      if (mem) { router.replace('/library'); return }
      setUserId(user.id)
      setUserEmail(user.email ?? '')
      setUserName(sessionStorage.getItem('tp_pending_name') || user.user_metadata?.full_name || '')
      setCheckingAuth(false)
    }
    checkSession()
  }, [router, supabase])

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!companyName.trim()) { setError('Please enter your company name.'); return }
    if (!industry) { setError('Please select your industry.'); return }
    if (!userId) { setError('Session expired. Please sign in again.'); return }
    setLoading(true)

    const slug = companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data: company, error: companyError } = await supabase
      .from('companies').insert({ name: companyName.trim(), slug: `${slug}-${Date.now()}`, industry_type: industry, plan_type: 'free', task_limit: 50, active: true })
      .select('id').single()

    if (companyError) { setError(`Could not create workspace: ${companyError.message}`); setLoading(false); return }

    const { error: memberError } = await supabase.from('memberships').insert({
      company_id: company.id, user_id: userId, app_role: 'owner', active: true, user_email: userEmail, user_name: userName,
    })

    if (memberError) { setError(`Could not create workspace: ${memberError.message}`); setLoading(false); return }

    sessionStorage.removeItem('tp_pending_email')
    sessionStorage.removeItem('tp_pending_name')
    router.push('/library')
    router.refresh()
  }

  if (checkingAuth) return (
    <div className="flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
  )

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your workspace</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {userName ? `Welcome, ${userName.split(' ')[0]}! ` : ''}Tell us about your organisation.
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleLaunch} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Factory className="w-4 h-4 inline mr-1.5 text-gray-400" />
              Company / organisation name
            </label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} required autoFocus
              placeholder="e.g. Acme Manufacturing Ltd"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map(ind => (
                <button key={ind.value} type="button" onClick={() => setIndustry(ind.value)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                    industry === ind.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                  }`}>
                  <span className="text-lg leading-none mt-0.5">{ind.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${industry === ind.value ? 'text-indigo-700' : 'text-gray-700'}`}>{ind.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{ind.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {error && <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <button type="submit" disabled={loading || !companyName.trim() || !industry}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Setting up your workspace…</>) : (<>Launch TaskPathway<ChevronRight className="w-4 h-4" /></>)}
          </button>
        </form>
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">
        Signed in as <span className="font-medium">{userEmail}</span> ·{' '}
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/register') }} className="text-indigo-500 hover:underline">Use different account</button>
      </p>
    </div>
  )
}
