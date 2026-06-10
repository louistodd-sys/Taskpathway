'use client'

import { useState, useCallback } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp, Image, Video } from 'lucide-react'
import type { StepFormData } from '@/lib/types'

function newStep(sortOrder: number): StepFormData {
  return {
    id: `new-${Date.now()}-${Math.random()}`,
    step_title: '',
    instruction_text: '',
    warning_text: '',
    image_url: '',
    video_url: '',
    requires_acknowledgement: false,
    sort_order: sortOrder,
    annotations: [],
    video_captions: [],
  }
}

interface StepsEditorProps {
  steps: StepFormData[]
  onChange: (steps: StepFormData[]) => void
}

function SortableStep({ step, index, onUpdate, onRemove }: {
  step: StepFormData
  index: number
  onUpdate: (id: string, field: keyof StepFormData, value: unknown) => void
  onRemove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-100">
        <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-gray-500 w-6">#{index + 1}</span>
        <input
          value={step.step_title}
          onChange={e => onUpdate(step.id, 'step_title', e.target.value)}
          placeholder={`Step ${index + 1} title (optional)`}
          className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
        />
        <button onClick={() => setExpanded(v => !v)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button onClick={() => onRemove(step.id)} className="text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Instruction <span className="text-red-400">*</span></label>
            <textarea
              value={step.instruction_text}
              onChange={e => onUpdate(step.id, 'instruction_text', e.target.value)}
              rows={3}
              placeholder="Describe exactly what the worker should do at this step…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Safety warning (optional)</label>
            <input
              value={step.warning_text}
              onChange={e => onUpdate(step.id, 'warning_text', e.target.value)}
              placeholder="e.g. Ensure power is isolated before proceeding"
              className="w-full px-3 py-2 border border-yellow-200 bg-yellow-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><Image className="w-3 h-3" />Image URL (optional)</label>
              <input value={step.image_url} onChange={e => onUpdate(step.id, 'image_url', e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><Video className="w-3 h-3" />Video URL (optional)</label>
              <input value={step.video_url} onChange={e => onUpdate(step.id, 'video_url', e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={step.requires_acknowledgement}
              onChange={e => onUpdate(step.id, 'requires_acknowledgement', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400" />
            <span className="text-xs font-medium text-gray-600">Require worker acknowledgement before continuing</span>
          </label>
        </div>
      )}
    </div>
  )
}

export default function StepsEditor({ steps, onChange }: StepsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function addStep() {
    const step = newStep(steps.length)
    onChange([...steps, step])
  }

  const updateStep = useCallback((id: string, field: keyof StepFormData, value: unknown) => {
    onChange(steps.map(s => s.id === id ? { ...s, [field]: value } : s))
  }, [steps, onChange])

  function removeStep(id: string) {
    onChange(steps.filter(s => s.id !== id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = steps.findIndex(s => s.id === active.id)
    const newIndex = steps.findIndex(s => s.id === over.id)
    onChange(arrayMove(steps, oldIndex, newIndex).map((s, i) => ({ ...s, sort_order: i })))
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {steps.map((step, index) => (
            <SortableStep key={step.id} step={step} index={index} onUpdate={updateStep} onRemove={removeStep} />
          ))}
        </SortableContext>
      </DndContext>

      <button onClick={addStep}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
        <Plus className="w-4 h-4" />
        Add step
      </button>
    </div>
  )
}
