'use client'

import { useToast } from '@/context/ToastContext'

const variantIcons = {
  success: 'ti-check',
  error: 'ti-x',
  warning: 'ti-alert-triangle',
  info: 'ti-info-circle'
}

const variantColors = {
  success: 'text-teal-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-gray-400'
}

export function Toast() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-3 shadow-none animate-in slide-in-from-right"
        >
          <i className={`ti ${variantIcons[toast.variant]} ${variantColors[toast.variant]} text-lg`} />
          <span className="text-sm text-gray-900 flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ti ti-x" />
          </button>
        </div>
      ))}
    </div>
  )
}
