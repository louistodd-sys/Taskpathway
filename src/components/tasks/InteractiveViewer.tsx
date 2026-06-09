'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, X, CheckCircle2, Circle,
  AlertTriangle, Shield, Wrench, LayoutList, CheckCheck,
  Clock
} from 'lucide-react'
import type { Document, Step } from '@/lib/types'

interface InteractiveViewerProps {
  task: Document
  steps: Step[]
}

export default function InteractiveViewer({ task, steps }: InteractiveViewerProps) {
  const router = useRouter()
  // -1 = pre-procedure, 0..n-1 = steps, steps.length = done
  const [currentStep, setCurrentStep] = useState(-1)
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false)
  const [checkedTools, setCheckedTools] = useState<Set<number>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [fadeIn, setFadeIn] = useState(true)

  const totalSteps = steps.length
  const allToolsChecked = task.required_tools.length === 0 || checkedTools.size === task.required_tools.length
  const canProceed = safetyAcknowledged && allToolsChecked

  const progressPct =
    currentStep < 0 ? 0 : Math.round(((currentStep) / totalSteps) * 100)

  function navigate(to: number) {
    setFadeIn(false)
    setTimeout(() => {
      setCurrentStep(to)
      setFadeIn(true)
    }, 120)
  }

  function goNext() {
    if (currentStep === -1 && !canProceed) return
    if (currentStep < totalSteps) navigate(currentStep + 1)
  }

  function goPrev() {
    if (currentStep > -1) navigate(currentStep - 1)
  }

  function markComplete(stepId: string) {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.has(stepId) ? next.delete(stepId) : next.add(stepId)
      return next
    })
  }

  function toggleTool(i: number) {
    setCheckedTools(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goNext()
    if (e.key === 'ArrowLeft') goPrev()
    if (e.key === 'Escape') router.push('/library')
  }, [currentStep, canProceed]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const step = currentStep >= 0 && currentStep < totalSteps ? steps[currentStep] : null
  const isDone = currentStep === totalSteps && totalSteps > 0

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Task</p>
            <h2 className="font-semibold text-white text-sm leading-snug">{task.title}</h2>
            {task.estimated_time && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />{task.estimated_time}
              </p>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {/* Pre-procedure */}
            <button
              onClick={() => navigate(-1)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left mb-1 transition-colors ${
                currentStep === -1 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Pre-procedure checks</span>
            </button>

            {/* Steps */}
            <div className="space-y-0.5">
              {steps.map((s, i) => {
                const isActive = currentStep === i
                const isDone = completedSteps.has(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0">
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : <span className={`flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold border ${isActive ? 'border-white text-white' : 'border-gray-600 text-gray-500'}`}>{i + 1}</span>
                      }
                    </span>
                    <span className="truncate">{s.step_title || s.instruction_text.slice(0, 40)}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => router.push('/library')}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors py-2"
            >
              <X className="w-3.5 h-3.5" />
              Exit task
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-800 bg-gray-900">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <LayoutList className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <span className="text-xs text-gray-400 shrink-0">
            {currentStep < 0 ? 'Pre-check' : isDone ? 'Complete' : `${currentStep + 1} of ${totalSteps}`}
          </span>

          <button
            onClick={() => router.push('/library')}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div
          className={`flex-1 overflow-y-auto px-8 py-10 transition-opacity duration-150 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* PRE-PROCEDURE */}
          {currentStep === -1 && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{task.title}</h1>
                <p className="text-gray-400">{task.document_type} · v{task.current_version_number}</p>
              </div>

              {/* Safety acknowledgment */}
              <div className={`rounded-xl p-5 border ${safetyAcknowledged ? 'bg-green-950/40 border-green-800' : 'bg-red-950/40 border-red-800'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <Shield className={`w-5 h-5 mt-0.5 shrink-0 ${safetyAcknowledged ? 'text-green-400' : 'text-red-400'}`} />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Safety acknowledgement</h3>
                    {task.critical_safety_info ? (
                      <p className="text-sm text-gray-300">{task.critical_safety_info}</p>
                    ) : (
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>Ensure appropriate PPE is worn before starting.</li>
                        <li>Do not proceed if the area is unsafe.</li>
                        <li>Ask a supervisor if you are unsure of any step.</li>
                      </ul>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safetyAcknowledged}
                    onChange={e => setSafetyAcknowledged(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 bg-gray-800"
                  />
                  <span className="text-sm font-medium text-white">
                    I have read and understood the safety requirements
                  </span>
                </label>
              </div>

              {/* Tools checklist */}
              {task.required_tools.length > 0 && (
                <div className="rounded-xl p-5 bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <h3 className="font-semibold text-white">Tools & PPE checklist</h3>
                    <span className="text-xs text-gray-400 ml-auto">
                      {checkedTools.size}/{task.required_tools.length} checked
                    </span>
                  </div>
                  <div className="space-y-2">
                    {task.required_tools.map((tool, i) => {
                      const checked = checkedTools.has(i)
                      return (
                        <label
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            checked ? 'bg-green-900/30 border border-green-800' : 'bg-gray-800 border border-gray-700 hover:border-amber-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTool(i)}
                            className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500 bg-gray-700"
                          />
                          <span className="text-sm text-white">{tool}</span>
                          {checked && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {!canProceed && (
                <p className="text-sm text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {!safetyAcknowledged
                    ? 'Acknowledge the safety requirements to continue.'
                    : 'Check off all tools and PPE to continue.'}
                </p>
              )}
            </div>
          )}

          {/* STEP */}
          {step && (
            <div className="max-w-3xl mx-auto">
              <div className={`grid gap-10 ${step.image_url || step.video_url ? 'lg:grid-cols-2' : ''}`}>
                <div>
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold">{currentStep + 1}</span>
                    </div>
                    {step.step_title && (
                      <h2 className="text-lg font-semibold text-white">{step.step_title}</h2>
                    )}
                  </div>

                  {/* Instruction */}
                  <p className="text-2xl text-white leading-relaxed mb-6">
                    {step.instruction_text}
                  </p>

                  {/* Warning */}
                  {step.warning_text && (
                    <div className="flex gap-3 p-4 bg-amber-900/30 border border-amber-700 rounded-xl mb-6">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-200">{step.warning_text}</p>
                    </div>
                  )}

                  {/* Mark complete */}
                  <button
                    onClick={() => markComplete(step.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      completedSteps.has(step.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {completedSteps.has(step.id)
                      ? <><CheckCircle2 className="w-4 h-4" /> Completed</>
                      : <><Circle className="w-4 h-4" /> Mark complete</>
                    }
                  </button>
                </div>

                {/* Media */}
                {(step.image_url || step.video_url) && (
                  <div className="relative">
                    {step.video_url ? (
                      <video
                        key={step.video_url}
                        src={step.video_url}
                        controls
                        className="w-full rounded-xl bg-black"
                      />
                    ) : step.image_url ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={step.image_url}
                          alt={`Step ${currentStep + 1}`}
                          className="w-full rounded-xl object-cover"
                        />
                        {/* Annotations */}
                        {step.annotations?.map((ann, i) => (
                          <div
                            key={ann.id}
                            style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                          >
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-default">
                              {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DONE */}
          {isDone && (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Task complete!</h2>
              <p className="text-gray-400 mb-8">
                You completed all {totalSteps} step{totalSteps !== 1 ? 's' : ''} of <strong className="text-white">{task.title}</strong>.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => { setCurrentStep(-1); setCompletedSteps(new Set()); setSafetyAcknowledged(false); setCheckedTools(new Set()) }}
                  className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  Start again
                </button>
                <button
                  onClick={() => router.push('/library')}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Back to library
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        {!isDone && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-gray-800 bg-gray-900">
            <button
              onClick={goPrev}
              disabled={currentStep === -1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <p className="text-xs text-gray-600">
              Use ← → arrow keys to navigate
            </p>

            <button
              onClick={goNext}
              disabled={currentStep === -1 && !canProceed}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === -1 ? 'Start task' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
