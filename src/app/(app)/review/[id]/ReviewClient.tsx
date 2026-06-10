'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, ThumbsDown, AlertTriangle, Clock, Wrench, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { recordChange } from '@/lib/changelog'
import type { Document, Step, AppRole } from '@/lib/types'

interface ReviewClientProps {
  task: Document
  steps: Step[]
  userId: string
  companyId: string
  userRole: AppRole
}

export default function ReviewClient({ task, steps, userId, companyId, userRole }: ReviewClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canApprove = ['owner', 'admin'].includes(userRole)

  async function handleApprove() {
    setSaving(true)
    setError('')
    const prevVersion = task.current_version_number ?? '1'
    const newVersion = String(parseInt(prevVersion) + 1)

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'Approved',
        reviewed_at: new Date().toISOString(),
        reviewer_note: null,
        current_version_number: newVersion,
      })
      .eq('id', task.id)

    if (updateError) { setError(updateError.message); setSaving(false); return }

    await recordChange(supabase, {
      companyId,
      userId,
      documentId: task.id,
      documentTitle: task.title,
      actionType: 'Approved',
      summary: `"${task.title}" approved — v${newVersion}`,
    })

    router.push('/library')
    router.refresh()
  }

  async function handleReject() {
    if (!rejectNote.trim()) { setError('Please provide a reason for rejection.'); return }
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'Rejected',
        reviewed_at: new Date().toISOString(),
        reviewer_note: rejectNote.trim(),
      })
      .eq('id', task.id)

    if (updateError) { setError(updateError.message); setSaving(false); return }

    await recordChange(supabase, {
      companyId,
      userId,
      documentId: task.id,
      documentTitle: task.title,
      actionType: 'Rejected',
      summary: `"${task.title}" rejected: ${rejectNote.trim()}`,
    })

    router.push('/library')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Task summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{task.document_type}</span>
              {task.department && <span className="text-xs text-gray-400">{task.department}</span>}
              <span className="text-xs text-gray-400">v{task.current_version_number}</span>
            </div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">In Review</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {task.estimated_time && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              {task.estimated_time}
            </div>
          )}
          {task.required_tools?.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Wrench className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              {task.required_tools.join(', ')}
            </div>
          )}
        </div>

        {task.critical_safety_info && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">{task.critical_safety_info}</p>
          </div>
        )}
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">{steps.length} Step{steps.length !== 1 ? 's' : ''}</h3>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.id} className="flex gap-4">
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1">
                  {step.step_title && <p className="text-sm font-medium text-gray-900 mb-1">{step.step_title}</p>}
                  <p className="text-sm text-gray-700">{step.instruction_text}</p>
                  {step.warning_text && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {step.warning_text}
                    </div>
                  )}
                  {step.requires_acknowledgement && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Requires acknowledgement
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision panel — only for owner/admin */}
      {canApprove && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Review Decision</h3>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {showRejectForm ? (
            <div className="space-y-3">
              <textarea
                value={rejectNote}
                onChange={e => { setRejectNote(e.target.value); setError('') }}
                placeholder="Reason for rejection…"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                  {saving ? 'Rejecting…' : 'Confirm rejection'}
                </button>
                <button
                  onClick={() => { setShowRejectForm(false); setRejectNote(''); setError('') }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                {saving ? 'Approving…' : 'Approve'}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reviewer (non-admin) sees read-only notice */}
      {!canApprove && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          You are reviewing this task. Only owners and admins can approve or reject.
        </div>
      )}
    </div>
  )
}
