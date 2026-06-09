import Link from 'next/link'
import { Clock, Play, Pencil, ChevronRight } from 'lucide-react'
import { formatDate, STATUS_COLORS } from '@/lib/utils'
import type { Document } from '@/lib/types'

interface TaskCardProps {
  task: Document
  canEdit: boolean
}

export default function TaskCard({ task, canEdit }: TaskCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
          {task.title}
        </h3>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {task.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
          {task.document_type}
        </span>
        <span>v{task.current_version_number}</span>
        {task.estimated_time && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimated_time}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">Updated {formatDate(task.updated_at)}</p>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Link
          href={`/view/${task.id}`}
          className="flex items-center gap-1.5 flex-1 justify-center bg-indigo-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Launch
        </Link>
        {canEdit && (
          <Link
            href={`/edit/${task.id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
        )}
      </div>
    </div>
  )
}
