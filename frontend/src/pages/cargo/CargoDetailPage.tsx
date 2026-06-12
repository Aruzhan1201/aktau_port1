import { useParams, Link } from 'react-router-dom'
import { useCargo, useUpdateCargoStatus } from '@/hooks/useCargo'
import { useDocuments, useVerifyDocument } from '@/hooks/useOther'
import { PageHeader } from '@/components/common/PageHeader'
import { CargoStatusStepper } from '@/components/cargo/CargoStatusStepper'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { StatusBadge, VerificationBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatWeight } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import {
  ArrowLeft,
  ArrowRight,
  XCircle,
  Package,
  MapPin,
  Calendar,
  Weight,
  Shuffle,
  Flag,
  FileText,
} from 'lucide-react'
import type { CargoStatus } from '@/types'

const STATUS_FLOW: CargoStatus[] = ['created', 'approved', 'assigned', 'loading', 'in_transit', 'arrived', 'delivered']

export function CargoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const cargoId = Number(id)
  const { data: cargo, isLoading } = useCargo(cargoId)
  const { data: docs } = useDocuments(cargoId)
  const verifyDoc = useVerifyDocument(cargoId)
  const updateStatus = useUpdateCargoStatus(cargoId)
  const user = useAuthStore((s) => s.user)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!cargo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900">Cargo not found</h2>
        <p className="text-sm text-slate-500 mt-1">This shipment doesn't exist or has been removed.</p>
        <Link to={ROUTES.CARGO} className="mt-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Cargo
          </Button>
        </Link>
      </div>
    )
  }

  const canManage = user && (user.role === 'admin' || user.role === 'parking_manager')
  const currentIdx = STATUS_FLOW.indexOf(cargo.status)
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null

  const detailRows = [
    { label: 'Status', value: <StatusBadge status={cargo.status} /> },
    { label: 'Cargo Type', value: cargo.cargo_type },
    { label: 'Weight', value: formatWeight(cargo.weight), icon: Weight },
    { label: 'Origin', value: cargo.origin, icon: MapPin },
    { label: 'Destination', value: cargo.destination, icon: MapPin },
    { label: 'ETA', value: cargo.eta ? formatDate(cargo.eta) : '—', icon: Calendar },
    { label: 'Priority', value: (cargo.priority_score ?? 0).toFixed(1), icon: Shuffle },
    { label: 'Flagged', value: cargo.is_flagged ? 'Yes' : 'No', icon: Flag },
    ...(cargo.ai_generated ? [{ label: 'AI Confidence', value: `${((cargo.ai_confidence ?? 0) * 100).toFixed(0)}%`, icon: SparklesIcon }] : []),
  ]

  const docsSection = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Documents</h3>
      </div>
      <DocumentUpload cargoId={cargoId} />
      {(!docs || docs.length === 0) ? (
        <p className="text-sm text-slate-400 mt-4 text-center py-4">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2 mt-4">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700">{doc.document_type.replace('_', ' ')}</span>
                <span className="text-slate-400 truncate">{doc.file_url?.split('/').pop() ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <VerificationBadge status={doc.verification_status} />
                {canManage && doc.verification_status === 'pending' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => verifyDoc.mutate({ documentId: doc.id, data: { verification_status: 'verified' } })}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => verifyDoc.mutate({ documentId: doc.id, data: { verification_status: 'flagged', flagged_reason: 'manual' } })}
                    >
                      Flag
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Cargo #${cargo.id}`}
        description={`${cargo.cargo_type} from ${cargo.origin} to ${cargo.destination}`}
        actions={
          <Link to={ROUTES.CARGO}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <CargoStatusStepper status={cargo.status} />
      {canManage && (
        <div className="flex gap-2 mb-6 animate-slide-up">
          {nextStatus && (
            <Button
              onClick={() => updateStatus.mutate({ status: nextStatus })}
              disabled={updateStatus.isPending}
              size="sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Advance to {nextStatus.replace('_', ' ')}
            </Button>
          )}
          {cargo.status !== 'cancelled' && cargo.status !== 'delivered' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => updateStatus.mutate({ status: 'cancelled' })}
              disabled={updateStatus.isPending}
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Cargo
            </Button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {detailRows.map((row) => {
              const Icon = row.icon
              return (
                <div key={row.label} className="flex items-start gap-2">
                  {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{row.label}</p>
                    <div className="text-sm font-medium text-slate-900 mt-0.5">{row.value}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {docsSection}
      </div>
    </div>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>
}
