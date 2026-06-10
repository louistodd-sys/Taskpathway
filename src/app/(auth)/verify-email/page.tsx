'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const stored = sessionStorage.getItem('tp_pending_email')
    if (!stored) { router.replace('/register'); return }
    setEmail(stored)
  }, [router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  function handleOtpChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[idx] = digit; setOtp(next); setError('')
    if (digit && idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) { setOtp(digits.split('')); inputs.current[5]?.focus() }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const token = otp.join('')
    if (token.length < 6) { setError('Please enter the full 6-digit code.'); return }
    setLoading(true); setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })

    if (verifyError) {
      setError(verifyError.message.includes('expired') || verifyError.message.includes('invalid')
        ? 'That code is incorrect or has expired. Request a new one below.'
        : verifyError.message)
      setLoading(false); return
    }

    if (!data.user) { setError('Verification failed. Please try again.'); setLoading(false); return }
    router.push('/onboarding')
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setResending(true); setError('')
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (resendError) { setError(`Could not resend: ${resendError.message}`) }
    else { setResendCooldown(60); setOtp(['', '', '', '', '', '']); inputs.current[0]?.focus() }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <Mail className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-gray-500 mt-2 text-sm">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-gray-700">{email}</span>
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter your 6-digit code</label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input key={idx} ref={el => { inputs.current[idx] = el }}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`w-11 h-14 text-center text-xl font-bold border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    digit ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          {error && <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">{error}</div>}
          <button type="submit" disabled={loading || otp.join('').length < 6}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying…
              </span>
            ) : 'Verify email'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive it? Check spam or</p>
          <button onClick={handleResend} disabled={resendCooldown > 0 || resending}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
        <div className="mt-4 text-center">
          <button onClick={() => router.push('/register')} className="text-xs text-gray-400 hover:text-gray-600">
            ← Use a different email
          </button>
        </div>
      </div>
    </div>
  )
}
