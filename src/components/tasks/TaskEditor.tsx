'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Save, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import StepsEditor from './StepsEditor'
import type { Document, Step, StepFormData, TaskFormData } from '@/lib/types'

interface TaskEditorProps {
  companyId: string
  userId: string
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

export default function TaskEditor({ companyId, userId, task, steps: initialSteps }: TaskEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!task

  const [form, setForm] = useState<TaskFormData>({
    title: task?.title ?? '',
    document_type: task?.document_type ?? 'Task',
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

  const handleSave = useCallback(async (statusOverride?: string) => {
    if (!form.title.trim()) { setError('Task title is required.'); return }
    setSaving(true)
    setError('')

    const documentData = {
      company_id: companyId,
      owner_user_id: userId,
      title: form.title.trim(),
      document_type: form.document_type,
      critical_safety_info: form.critical_safety_info || null,
      estimated_time: form.estimated_time || null,
      required_tools: form.required_tools,
      status: statusOverride ?? form.status,
    }

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
        .insert(documentData)
        .select()
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      documentId = data.id
    }

    // Upsert steps
    const existingIds = new Set(initialSteps?.map(s => s.id) ?? [])
    const formIds = new Set(steps.filter(s => !s.id.startsWith('new-')).map(s => s.id))

    // Delete removed steps
    const toDelete = [...existingIds].filter(id => !formIds.has(id))
    if (toDelete.length) {
      await supabase.from('steps').delete().in('id', toDelete)
    }

    // Upsert all steps
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

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    if (!isEdit) {
      router.push(`/edit/${documentId}`)
    }
  }, [form, steps, companyId, userId, task, isEdit, initialSteps, supabase, router])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saved ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : saving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            onClick={() => handleSave('Approved')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Task metadata */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5">
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

      {/* Steps */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Steps</h2>
          <span className="text-xs text-gray-400">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
        </div>
        <StepsEditor steps={steps} onChange={setSteps} />
      </div>
    </div>
  )
}
