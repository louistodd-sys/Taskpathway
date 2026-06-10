import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ReviewClient from './ReviewClient'

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('company_id, app_role')
    .eq('user_id', user.id)
    .eq('active', true)
    .single()

  if (!membership) redirect('/register')

  const canReview = ['owner', 'admin', 'reviewer'].includes(membership.app_role)
  if (!canReview) redirect(`/view/${params.id}`)

  const { data: task } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .eq('company_id', membership.company_id)
    .single()

  if (!task) notFound()

  if (task.status !== 'In Review') {
    redirect(`/edit/${params.id}`)
  }

  const { data: steps } = await supabase
    .from('steps')
    .select('*')
    .eq('document_id', params.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/library"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Task</h1>
          <p className="text-sm text-gray-500">Submitted for review — approve or reject below</p>
        </div>
      </div>

      <ReviewClient
        task={task}
        steps={steps ?? []}
        userId={user.id}
        companyId={membership.company_id}
        userRole={membership.app_role}
      />
    </div>
  )
}
