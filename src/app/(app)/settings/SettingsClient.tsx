'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Membership } from '@/lib/types'
const INDUSTRIES = ['Manufacturing', 'Food Production', 'Hospitality', 'Logistics', 'Healthcare', 'Construction', 'Retail', 'Other']
export default function SettingsClient({ membership }: { membership: Membership }) {
  const router = useRouter()
  const supabase = createClient()
  const company = membership.companies
  const [name, setName] = useState(company?.name ?? '')
  const [industry, setIndustry] = useState(company?.industry_type ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const { error } = await supabase.from('companies').update({ name: name.trim(), industry_type: industry }).eq('id', membership.company_id)
    setSaving(false)
    if (error) { setError(error.message); return }
    setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh()
  }
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8"><Link href="/admin" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></Link><h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1></div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company name</label><input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"><option value="">Select industry…</option>{INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}{saved ? 'Saved!' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
