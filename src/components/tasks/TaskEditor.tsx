'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Save, CheckCircle, ArrowLeft, Send, ThumbsUp, ThumbsDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { recordChange } from '@/lib/changelog'
import StepsEditor from './StepsEditor'
import type { Document, Step, StepFormData, TaskFormData, AppRole } from '@/lib/types'

interface TaskEditorProps {
  companyId: string
  userId: string
  userRole: AppRole
  task?: Document
  steps?: Step[]
}

function stepToForm(s: Step): StepFormData {
  return {
    id: s.id,
    step_title: s.step_title ?? '',
    instruction_text: s.instruction_text,
    warning_text: s.warning_text ?? '',
    image_url: s.image_url ?? '',
    video_url: s.video_url ?? '',
    requires_acknowledgement: s.requires_acknowledgement,
    sort_order: s.sort_order,
    annotations: s.annotations ?? [],
  }
}

const APPROVER_ROLES: AppRole[] = ['owner', 'admin']
const AUTHOR_ROLES: AppRole[] = ['owner', 'admin', 'author']

export default function TaskEditor({ companyId, userId, userRole, task, steps: initialSteps }: TaskEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!task

  const canApprove = APPROVER_ROLES.includes(userRole)
  const canAuthor = AUTHOR_ROLES.includes(userRole)
  const isReadOnly = task?.status === 'Approved' && !canApprove

  const [form, setForm] = useState<TaskFormData>({
    title: task?.title ?? '',
    document_type: task?.document_type ?? 'Task',
    department: task?.department ?? '',
    critical_safety_info: task?.critical_safety_info ?? '',
    estimated_time: task?.estimated_time ?? '',
    required_tools: task?.required_tools ?? [],
    status: task?.status ?? 'Draft',
  })
  const [steps, setSteps] = useState<StepFormData[]>(
    initialSteps ? initialSteps.map(stepToForm) : []
  )
  const [newTool, setNewTool] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  function setField<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function addTool() {
    const t = newTool.trim()
    if (!t || form.required_tools.includes(t)) return
    setField('required_tools', [...form.required_tools, t])
    setNewTool('')
  }

  function removeTool(tool: string) {
    setField('required_tools', form.required_tools.filter(t => t !== tool))
  }

  const handleSave = useCallback(async (options: {
    statusOverride?: string
    reviewerNote?: string
    reviewedAt?: string
    submittedAt?: string
  } = {}) => {
    if (!form.title.trim()) { setError('Task title is required.'); return }
    setSaving(true)
    setError('')

    const prevStatus = task?.status ?? 'Draft'
    const prevVersion = task?.current_version_number ?? '1'
    const prevStepCount = initialSteps?.length ?? 0
    const newStatus = options.statusOverride ?? form.status

    const newVersion = newStatus === 'Approved' && prevStatus !== 'Approved'
      ? String(parseInt(prevVersion) + 1)
      : prevVersion

    const documentData: Record<string, unknown> = {
      company_id: companyId,
      owner_user_id: userId,
      title: form.title.trim(),
      document_type: form.document_type,
      department: form.department || null,
      critical_safety_info: form.critical_safety_info || null,
      estimated_time: form.estimated_time || null,
      required_tools: form.required_tools,
      status: newStatus,
      current_version_number: newVersion,
    }

    if (options.reviewerNote !== undefined) documentData.reviewer_note = options.reviewerNote || null
    if (options.reviewedAt !== undefined) documentData.reviewed_at = options.reviewedAt
    if (options.submittedAt !== undefined) documentData.submitted_at = options.submittedAt

    let documentId = task?.id

    if (isEdit) {
      const { error } = await supabase
        .from('documents')
        .update(documentData)
        .eq('id', task!.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase
        .from('documents')
        .insert({ ...documentData, current_version_number: '1' })
        .select()
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      documentId = data.id
    }

    const existingIds = new Set(initialSteps?.map(s => s.id) ?? [])
    const formIds = new Set(steps.filter(s => !s.id.startsWith('new-')).map(s => s.id))
    const toDelete = [...existingIds].filter(id => !formIds.has(id))
    if (toDelete.length) {
      await supabase.from('steps').delete().in('id', toDelete)
    }
    if (steps.length > 0) {
      const stepRows = steps.map((s, i) => ({
        ...(s.id.startsWith('new-') ? {} : { id: s.id }),
        company_id: companyId,
        document_id: documentId,
        step_number: i + 1,
        sort_order: i,
        step_title: s.step_title || null,
        instruction_text: s.instruction_text,
        warning_text: s.warning_text || null,
        image_url: s.image_url || null,
        video_url: s.video_url || null,
        requires_acknowledgement: s.requires_acknowledgement,
        annotations: s.annotations,
      }))
      await supabase.from('steps').upsert(stepRows)
    }

    const stepDelta = steps.length - prevStepCount
    let actionType = 'Updated'
    let summary = `"${form.title}" updated`
    if (!isEdit) { actionType = 'Created'; summary = `"${form.title}" created as draft` }
    else if (newStatus === 'In Review' && prevStatus !== 'In Review') { actionType = 'Status Change'; summary = `"${form.title}" submitted for review` }
    else if (newStatus === 'Approved') { actionType = 'Approved'; summary = `"${form.title}" approved — v${newVersion}` }
    else if (newStatus === 'Rejected') { actionType = 'Rejected'; summary = `"${form.title}" rejected${options.reviewerNote ? ': ' + options.reviewerNote : ''}` }
    else if (stepDelta > 0) { actionType = 'Steps Added'; summary = `"${form.title}" — ${stepDelta} step(s) added` }
    else if (stepDelta < 0) { actionType = 'Steps Removed'; summary = `"${form.title}" — ${Math.abs(stepDelta)} step(s) removed` }

    await recordChange(supabase, {
      companyId,
      userId,
      documentId: documentId!,
      documentTitle: form.title.trim(),
      actionType,
      summary,
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    if (!isEdit && documentId) {
      router.push(`/edit/${documentId}`)
    } else {
      router.refresh()
    }
  }, [form, steps, companyId, userId, task, isEdit, initialSteps, supabase, router])

  const handleSubmitForReview = () =>
    handleSave({ statusOverride: 'In Review', submittedAt: new Date().toISOString() })

  const handleApprove = () =>
    handleSave({ statusOverride: 'Approved', reviewedAt: new Date().toISOString(), reviewerNote: '' })

  const handleReject = () => {
    if (!rejectNote.trim()) { setError('Please provide a reason for rejection.'); return }
    handleSave({ statusOverride: 'Rejected', reviewedAt: new Date().toISOString(), reviewerNote: rejectNote })
    setShowRejectInput(false)
  }

  const statusBadgeColors: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-600',
    'In Review': 'bg-blue-100 text-blue-700',
    'Approved': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Archived': 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/library')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Task' : 'Create Task'}
          </h1>
          {task && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeColors[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {task.status}
              </span>
              <span className="text-xs text-gray-400">v{task.current_version_number}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {canAuthor && task?.status !== 'Approved' && (
            <button
              onClick={() => handleSave()}
              disabled={saving || isReadOnly}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saved ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved' : saving ? 'Saving…' : 'Save draft'}
            </button>
          )}

          {canAuthor && !canApprove && (task?.status === 'Draft' || task?.status === 'Rejected' || !isEdit) && (
            <button
              onClick={handleSubmitForReview}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              Submit for review
            </button>
          )}

          {canApprove && task?.status === 'In Review' && (
            <>
              <button
                onClick={() => { setShowRejectInput(v => !v); setError('') }}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Approve
              </button>
            </>
          )}

          {canApprove && (task?.status === 'Draft' || task?.status === 'Rejected' || !isEdit) && (
            <button
              onClick={() => handleSave({ statusOverride: 'Approved', reviewedAt: new Date().toISOString() })}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Publish
            </button>
          )}
        </div>
      </div>

      {showRejectInput && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800 mb-2">Reason for rejection</p>
          <textarea
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={2}
            placeholder="Explain what needs to be changed…"
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleReject} disabled={saving}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              Confirm rejection
            </button>
            <button onClick={() => { setShowRejectInput(false); setRejectNote('') }}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {task?.status === 'Rejected' && task.reviewer_note && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Rejection feedback</p>
          <p className="text-sm text-red-800">{task.reviewer_note}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className={`bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
        <h2 className="font-semibold text-gray-900">Task details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            placeholder="e.g. Machine start-up procedure"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
          <input
            value={form.department}
            onChange={e => setField('department', e.target.value)}
            placeholder="e.g. Production, Maintenance, Quality"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.document_type}
              onChange={e => setField('document_type', e.target.value as 'Task' | 'Work Instruction')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option>Task</option>
              <option>Work Instruction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated time</label>
            <input
              value={form.estimated_time}
              onChange={e => setField('estimated_time', e.target.value)}
              placeholder="e.g. 15 mins"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Critical safety information (optional)
          </label>
          <textarea
            value={form.critical_safety_info}
            onChange={e => setField('critical_safety_info', e.target.value)}
            rows={2}
            placeholder="Any critical safety information workers must know before starting…"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Required tools / PPE</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.required_tools.map(tool => (
              <span
                key={tool}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {tool}
                <button type="button" onClick={() => removeTool(tool)} className="hover:text-indigo-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTool}
              onChange={e => setNewTool(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTool())}
              placeholder="Add tool or PPE item…"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addTool}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${isReadOnly ? 'opacity-75 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Steps</h2>
          <span className="text-xs text-gray-400">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
        </div>
        <StepsEditor steps={steps} onChange={setSteps} />
      </div>
    </div>
  )
}
