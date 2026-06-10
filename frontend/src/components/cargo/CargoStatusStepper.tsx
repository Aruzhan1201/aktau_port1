import type { CargoStatus } from '@/types'
import { Check } from 'lucide-react'

const steps: { key: CargoStatus; label: string }[] = [
  { key: 'created', label: 'Created' },
  { key: 'approved', label: 'Approved' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'loading', label: 'Loading' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'delivered', label: 'Delivered' },
]

const statusOrder: Record<CargoStatus, number> = {
  created: 0, approved: 1, assigned: 2, loading: 3, in_transit: 4, arrived: 5, delivered: 6, cancelled: -1,
}

export function CargoStatusStepper({ status }: { status: CargoStatus }) {
  const currentIdx = statusOrder[status]

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
          <Check className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-red-700">Cargo has been cancelled</span>
      </div>
    )
  }

  return (
    <div className="mb-6 overflow-x-auto animate-fade-in">
      <div className="flex items-center min-w-max py-2">
        {steps.map((step, idx) => {
          const isCompleted = currentIdx !== undefined && idx < currentIdx
          const isCurrent = idx === currentIdx
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200'
                        : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 whitespace-nowrap font-medium transition-colors duration-200 ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-10 md:w-16 h-0.5 mx-1.5 rounded-full transition-colors duration-300 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
