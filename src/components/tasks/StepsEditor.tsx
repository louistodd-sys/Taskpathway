'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { StepFormData } from '@/lib/types'

interface StepsEditorProps {
  steps: StepFormData[]
  onChange: (steps: StepFormData[]) => void
}

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

export default function StepsEditor({ steps, onChange }: StepsEditorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addStep() {
    const step = newStep(steps.length)
    onChange([...steps, step])
    setExpanded(prev => new Set([...prev, step.id]))
  }

  function updateStep(id: string, field: keyof StepFormData, value: unknown) {
    onChange(steps.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function deleteStep(id: string) {
    onChange(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, sort_order: i })))
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const reordered = Array.from(steps)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)
    onChange(reordered.map((s, i) => ({ ...s, sort_order: i })))
  }

  return (
    <div className="space-y-3">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="steps">
          {provided => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white border rounded-xl overflow-hidden transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg border-indigo-300' : 'border-gray-200'
                      }`}
                    >
                      {/* Step header */}
                      <div className="flex items-center gap-3 p-4">
                        <div {...provided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {step.step_title || step.instruction_text || `Step ${index + 1}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {step.warning_text && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          <button
                            type="button"
                            onClick={() => toggleExpand(step.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {expanded.has(step.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteStep(step.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Step fields */}
                      {expanded.has(step.id) && (
                        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Step title (optional)</label>
                            <input
                              value={step.step_title}
                              onChange={e => updateStep(step.id, 'step_title', e.target.value)}
                              placeholder="e.g. Power down the machine"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Instruction <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={step.instruction_text}
                              onChange={e => updateStep(step.id, 'instruction_text', e.target.value)}
                              rows={3}
                              placeholder="Describe exactly what the worker needs to do…"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                Warning / caution (optional)
                              </span>
                            </label>
                            <input
                              value={step.warning_text}
                              onChange={e => updateStep(step.id, 'warning_text', e.target.value)}
                              placeholder="Any safety warnings for this step…"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL (optional)</label>
                              <input
                                value={step.image_url}
                                onChange={e => updateStep(step.id, 'image_url', e.target.value)}
                                placeholder="https://…"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Video URL (optional)</label>
                              <input
                                value={step.video_url}
                                onChange={e => updateStep(step.id, 'video_url', e.target.value)}
                                placeholder="https://…"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                              />
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.requires_acknowledgement}
                              onChange={e => updateStep(step.id, 'requires_acknowledgement', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-medium text-gray-600">
                              Require acknowledgement before continuing
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        type="button"
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add step
      </button>
    </div>
  )
}
