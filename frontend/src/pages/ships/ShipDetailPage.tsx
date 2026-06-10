import { useParams, Link } from 'react-router-dom'
import { useShip } from '@/hooks/useShip'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Ship, MapPin, Hash, Weight, User, Calendar } from 'lucide-react'

export function ShipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const shipId = Number(id)
  const { data: ship, isLoading } = useShip(shipId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Ship className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900">Ship not found</h2>
        <p className="text-sm text-slate-500 mt-1">This vessel doesn't exist in the system.</p>
        <Link to={ROUTES.SHIPS} className="mt-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Ships
          </Button>
        </Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-700',
    berthed: 'bg-blue-50 text-blue-700',
    in_transit: 'bg-violet-50 text-violet-700',
    maintenance: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title={ship.name}
        description={`IMO: ${ship.imo_number || 'N/A'}`}
        actions={
          <Link to={ROUTES.SHIPS}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Ship className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Vessel Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon={Ship} label="Status" value={
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ship.status] || 'bg-slate-50 text-slate-600'}`}>
              {ship.status.replace('_', ' ')}
            </span>
          } />
          <InfoRow icon={Hash} label="IMO Number" value={ship.imo_number || '—'} />
          <InfoRow icon={Weight} label="Capacity" value={`${ship.capacity.toLocaleString()}t`} />
          <InfoRow icon={User} label="Captain ID" value={ship.captain_id?.toString() || '—'} />
          <InfoRow icon={MapPin} label="Location" value={
            ship.current_location
              ? `${ship.current_location.latitude.toFixed(4)}, ${ship.current_location.longitude.toFixed(4)}`
              : '—'
          } />
          <InfoRow icon={Calendar} label="Created" value={formatDate(ship.created_at)} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Ship; label: string; value: React.ReactNode }) {
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
