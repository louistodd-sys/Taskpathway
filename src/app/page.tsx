import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TaskPathway — SOP & Work Instruction Software',
  description: 'Create, manage, and execute standard operating procedures and work instructions. Role-based approval flows, version control, and an interactive step-by-step viewer for manufacturing and operations teams.',
}

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/library')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TP</span>
            </div>
            <span className="font-bold text-gray-900">TaskPathway</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2">
              Sign in
            </Link>
            <Link href="/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          SOP &amp; Work Instruction Software
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6 max-w-3xl mx-auto">
          Your team&apos;s operating procedures,{' '}
          <span className="text-indigo-600">done right</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create interactive SOPs and work instructions, enforce approval workflows, track versions, and give every team member exactly what they need — nothing more.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm text-base">
            Get started free
          </Link>
          <Link href="/login" className="text-gray-600 px-8 py-3.5 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-base">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Everything your ops team needs</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Built for manufacturing, logistics, food production, and any team that runs on repeatable processes.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Create SOPs & Work Instructions',
                desc: 'Rich step-by-step builder with images, videos, warnings, acknowledgement gates, and annotated diagrams.',
                icon: '📋',
              },
              {
                title: 'Approval Workflow',
                desc: 'Draft → Review → Approve. Role-based gates ensure only authorised content reaches the floor.',
                icon: '✅',
              },
              {
                title: 'Version Control',
                desc: 'Every approval auto-increments the version. Full audit trail so you always know what changed and who approved it.',
                icon: '🔄',
              },
              {
                title: 'Interactive Viewer',
                desc: 'Workers follow steps one at a time, check off tools, acknowledge safety gates, and confirm completion.',
                icon: '▶️',
              },
              {
                title: 'Role-Based Access',
                desc: 'Owner, Admin, Author, Reviewer, Viewer — each role sees and can do exactly the right things.',
                icon: '🔐',
              },
              {
                title: 'Multi-Team Workspaces',
                desc: 'Each company gets its own isolated workspace. Invite team members by email with the right role.',
                icon: '🏭',
              },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create', desc: 'Authors build step-by-step procedures with media, safety info, and required tools.' },
              { step: '2', title: 'Review & Approve', desc: 'Reviewers and admins approve content before it goes live — with rejection notes if changes are needed.' },
              { step: '3', title: 'Execute', desc: 'Workers launch the interactive viewer and follow steps on any device, confirming each action as they go.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to standardise your operations?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Set up your workspace in minutes. No credit card required.</p>
          <Link href="/register" className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-base inline-block">
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">TP</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">TaskPathway</span>
          </div>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} TaskPathway. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="/login" className="hover:text-gray-600">Sign in</Link>
            <Link href="/register" className="hover:text-gray-600">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
