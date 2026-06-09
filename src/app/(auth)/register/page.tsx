'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [step, setStep] = useState<'account' | 'company'>('account')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAccountStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('company')
  }

  async function handleCompanyStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session lost. Please try again.'); setLoading(false); return }

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName, slug: `${slug}-${Date.now()}`, industry_type: industry })
      .select()
      .single()

    if (companyError) { setError(companyError.message); setLoading(false); return }

    const { error: memberError } = await supabase
      .from('memberships')
      .insert({ company_id: company.id, user_id: user.id, app_role: 'owner' })

    if (memberError) { setError(memberError.message); setLoading(false); return }

    router.push('/library')
    router.refresh()
  }

  const industries = [
    'Manufacturing', 'Food Production', 'Hospitality', 'Logistics',
    'Healthcare', 'Construction', 'Retail', 'Other',
  ]

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
          <span className="text-white font-bold text-lg">TP</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">TaskPathway</h1>
        <p className="text-gray-500 mt-1">Get started in minutes</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === 'account' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>1</div>
          <div className="flex-1 h-0.5 bg-gray-200">
            <div className={`h-full bg-indigo-600 transition-all ${step === 'company' ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === 'company' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
        </div>

        {step === 'account' ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>
            <form onSubmit={handleAccountStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@company.com"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Min. 8 characters"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Creating account…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Set up your workspace</h2>
            <form onSubmit={handleCompanyStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                <input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Acme Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">Select industry…</option>
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Creating workspace…' : 'Launch TaskPathway'}
              </button>
            </form>
          </>
        )}

        {step === 'account' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}
