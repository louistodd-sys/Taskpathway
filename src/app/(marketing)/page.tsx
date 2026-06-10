import Link from 'next/link'
import {
  CheckCircle, Shield, Users, GitBranch, Zap, BookOpen,
  ChevronRight, Play, Star, ArrowRight
} from 'lucide-react'

export const metadata = {
  title: 'TaskPathway — SOP & Work Instruction Software for Teams',
  description: 'Create, manage, and execute standard operating procedures and work instructions with TaskPathway. Role-based approval flows, version control, and an interactive step-by-step viewer built for manufacturing and operations teams.',
}

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Task Viewer',
    desc: 'Step-by-step guided execution with safety pre-checks, tools checklists, images, and video support. Built for the shop floor.',
  },
  {
    icon: CheckCircle,
    title: 'Approval Workflows',
    desc: 'Structured Draft → Review → Approve flow. Authors submit, reviewers approve. Full version history on every change.',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    desc: 'Every approval auto-increments the version. Full audit trail shows who changed what, when — your Management of Change log.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    desc: 'Owners, Admins, Authors, Reviewers, and Viewers. Each role sees only what they need to do their job.',
  },
  {
    icon: Shield,
    title: 'Built for Compliance',
    desc: 'Safety acknowledgements, PPE checklists, and documented approval chains keep your operations audit-ready.',
  },
  {
    icon: Zap,
    title: 'Multi-Tenant SaaS',
    desc: 'Every organisation gets their own isolated workspace. Invite your team, set roles, and get up and running in minutes.',
  },
]

const steps = [
  { n: '01', title: 'Create a Task', desc: 'Build step-by-step procedures with instructions, warnings, images, and required PPE. Add as many steps as you need.' },
  { n: '02', title: 'Review & Approve', desc: 'Authors submit for review. Reviewers approve or send back with feedback. Version automatically increments on approval.' },
  { n: '03', title: 'Execute with Confidence', desc: "Team members follow the interactive viewer on any device. Safety gates ensure they're prepared before starting." },
]

const industries = [
  'Manufacturing', 'Food Production', 'Logistics', 'Healthcare',
  'Construction', 'Hospitality', 'Retail', 'Facilities'
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5 fill-indigo-500" />
            SOP & Work Instruction Software
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Create, Approve & Execute<br />
            <span className="text-indigo-600">Standard Operating Procedures</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            TaskPathway is the multi-tenant SOP and work instruction platform for manufacturing and operations teams. Build procedures, manage approvals, and guide your team step-by-step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors text-base shadow-lg shadow-indigo-200"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-gray-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-base border border-gray-200 shadow-sm"
            >
              Sign in
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-5">No credit card required · Free to start</p>
        </div>
      </section>

      {/* Industry bar */}
      <section className="py-10 border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-gray-400 mb-6">Built for teams across every industry</p>
          <div className="flex flex-wrap justify-center gap-3">
            {industries.map(ind => (
              <span key={ind} className="bg-white border border-gray-200 text-gray-500 text-sm font-medium px-4 py-2 rounded-lg shadow-sm">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything your team needs to run safe, consistent operations
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From creating your first SOP to running a compliant, version-controlled document library — TaskPathway has it covered.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-500">Three steps from creation to execution</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div className="text-5xl font-black text-indigo-100 mb-3">{n}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Viewer callout */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gray-950 rounded-3xl p-10 md:p-16 text-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The interactive viewer your team will actually use
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Full-screen step-by-step interface with safety pre-checks, tools checklists, image annotations, and keyboard navigation. Designed for the shop floor, not the office.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Try it free
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to standardise your operations?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Join operations teams using TaskPathway to create safer, more consistent work procedures.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-base shadow-lg"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-indigo-300 text-sm mt-4">No credit card required</p>
        </div>
      </section>
    </>
  )
}
