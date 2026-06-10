'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'account' | 'workspace'

const INDUSTRIES = [
  'Manufacturing', 'Food Production', 'Hospitality', 'Logistics',
  'Healthcare', 'Construction', 'Retail', 'Other',
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('account')

  // All data collected client-side — no API calls until final submit
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1: validate only, no Supabase calls
  function handleAccountNext(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!email.trim()) { setError('Please enter your email.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setStep('workspace')
  }

  // Step 2: signUp + signIn + company + membership in one atomic sequence
  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!companyName.trim()) { setError('Please enter your company name.'); return }
    if (!industry) { setError('Please select your industry.'); return }

    setLoading(true)

    // 1. Sign up
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    })

    if (signUpError && !signUpError.message.toLowerCase().includes('already registered')) {
      setError(`Sign-up failed: ${signUpError.message}`)
      setLoading(false)
      return
    }

    // 2. Sign in immediately — establishes the session cookie
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      if (signInError.message.toLowerCase().includes('email') || signInError.message.toLowerCase().includes('confirm')) {
        setError('Please check your inbox and confirm your email address before continuing.')
      } else {
        setError(`Sign-in failed: ${signInError.message}`)
      }
      setLoading(false)
      return
    }

    const userId = signInData.user?.id
    if (!userId) {
      setError('Could not retrieve user after sign-in. Please try again.')
      setLoading(false)
      return
    }

    // 3. Create company
    const slug = companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName.trim(),
        slug: `${slug}-${Date.now()}`,
        industry_type: industry,
        plan_type: 'free',
        task_limit: 50,
        active: true,
      })
      .select('id')
      .single()

    if (companyError) {
      setError(`Could not create workspace: ${companyError.message}`)
      setLoading(false)
      return
    }

    // 4. Create membership (owner)
    const { error: memberError } = await supabase
      .from('memberships')
      .insert({
        company_id: company.id,
        user_id: userId,
        app_role: 'owner',
        active: true,
        user_email: email.trim(),
        user_name: fullName.trim(),
      })

    if (memberError) {
      setError(`Could not create membership: ${memberError.message}`)
      setLoading(false)
      return
    }

    // 5. All done
    router.push('/library')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-white font-bold text-xl">TP</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">TaskPathway</h1>
        <p className="text-gray-500 mt-1 text-sm">Get started in minutes</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
            step === 'account' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
          }`}>
            {step === 'workspace' ? '✓' : '1'}
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 relative overflow-hidden rounded">
            <div className={`h-full bg-indigo-600 transition-all duration-300 ${step === 'workspace' ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
            step === 'workspace' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            2
          </div>
        </div>

        {step === 'account' ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
            <p className="text-sm text-gray-500 mb-6">You&apos;ll set up your workspace on the next step.</p>

            <form onSubmit={handleAccountNext} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Continue →
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Set up your workspace</h2>
            <p className="text-sm text-gray-500 mb-6">
              Creating account for <span className="font-medium text-gray-700">{email}</span>
            </p>

            <form onSubmit={handleLaunch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company / organisation name</label>
                <input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Acme Manufacturing Ltd"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {error && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting up your workspace…
                  </span>
                ) : 'Launch TaskPathway'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('account'); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                ← Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
