import { useParams, Link } from 'react-router-dom'
import { useBerth } from '@/hooks/useBerth'
import { PageHeader } from '@/components/common/PageHeader'
import { BerthStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/constants'
import { ArrowLeft, Anchor, Weight, User, MapPin } from 'lucide-react'

export function BerthDetailPage() {
  const { id } = useParams<{ id: string }>()
  const berthId = Number(id)
  const { data: berth, isLoading } = useBerth(berthId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!berth) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Anchor className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900">Berth not found</h2>
        <p className="text-sm text-slate-500 mt-1">This berth doesn't exist in the system.</p>
        <Link to={ROUTES.BERTHS} className="mt-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Berths
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title={berth.name}
        actions={
          <Link to={ROUTES.BERTHS}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Anchor className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Berth Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon={Anchor} label="Status" value={<BerthStatusBadge status={berth.status} />} />
          <InfoRow icon={Weight} label="Capacity" value={`${berth.capacity.toLocaleString()}t`} />
          <InfoRow icon={User} label="Manager" value={berth.manager_id?.toString() || '—'} />
          <InfoRow icon={MapPin} label="Location" value={
            berth.location_coords
              ? `${berth.location_coords.latitude.toFixed(4)}, ${berth.location_coords.longitude.toFixed(4)}`
              : '—'
          } />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Anchor; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm font-medium text-slate-900 mt-0.5">{value}</div>
      </div>
    </div>
  )
}
