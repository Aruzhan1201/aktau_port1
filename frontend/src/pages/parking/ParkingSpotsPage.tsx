import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SkeletonTable } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { ParkingSpot } from '@/types'

const statusColors: Record<string, string> = {
  free: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  occupied: 'bg-red-100 text-red-800',
  maintenance: 'bg-gray-100 text-gray-800',
}

export function ParkingSpotsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [assignSpotId, setAssignSpotId] = useState<number | null>(null)
  const [assignDriverId, setAssignDriverId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['parking-spots'],
    queryFn: () => api.get('/parking/spots').then((r) => r.data),
  })

  const releaseMutation = useMutation({
    mutationFn: (id: number) => api.post(`/parking/spots/${id}/release`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parking-spots'] }),
  })

  const assignMutation = useMutation({
    mutationFn: ({ spotId, driverId }: { spotId: number; driverId: number }) =>
      api.post(`/parking/spots/${spotId}/assign`, { driver_id: driverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-spots'] })
      setAssignSpotId(null)
      setAssignDriverId('')
    },
  })

  if (isLoading) return <SkeletonTable rows={5} cols={6} />

  const spots: ParkingSpot[] = data?.items ?? []

  return (
    <div>
      <PageHeader
        title={t('parking.spots')}
        description="View and manage parking spot assignments"
      />

      {spots.length === 0 ? (
        <EmptyState title={t('parking.spots')} description="Create a parking zone first." />
      ) : (
        <DataTable
          columns={[
            { key: 'spot_number', header: t('parking.spots'), render: (s: ParkingSpot) => <span className="font-medium">{s.spot_number}</span> },
            { key: 'zone_id', header: 'Zone ID', render: (s: ParkingSpot) => <span>{s.zone_id}</span> },
            {
              key: 'status',
              header: t('common.status'),
              render: (s: ParkingSpot) => <Badge className={statusColors[s.status]}>{s.status}</Badge>,
            },
            { key: 'driver_id', header: 'Driver ID', render: (s: ParkingSpot) => <span>{s.driver_id ?? '—'}</span> },
            { key: 'tariff_per_hour', header: 'Tariff/hr', render: (s: ParkingSpot) => <span>{s.tariff_per_hour ?? '—'}</span> },
            {
              key: 'time_in',
              header: t('common.time'),
              render: (s: ParkingSpot) => <span>{s.time_in ? new Date(s.time_in).toLocaleString() : '—'}</span>,
            },
            {
              key: 'actions',
              header: '',
              render: (s: ParkingSpot) =>
                s.status === 'free' ? (
                  assignSpotId === s.id ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        placeholder="Driver ID"
                        type="number"
                        className="w-20 h-8 text-xs"
                        value={assignDriverId}
                        onChange={(e) => setAssignDriverId(e.target.value)}
                      />
                      <Button size="sm" onClick={() => assignMutation.mutate({ spotId: s.id, driverId: Number(assignDriverId) })} disabled={!assignDriverId}>
                        OK
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAssignSpotId(null); setAssignDriverId('') }}>X</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setAssignSpotId(s.id); setAssignDriverId('') }}>
                      Assign
                    </Button>
                  )
                ) : s.status === 'occupied' ? (
                  <Button variant="ghost" size="sm" onClick={() => releaseMutation.mutate(s.id)}>
                    Release
                  </Button>
                ) : null,
            },
          ]}
          data={spots}
          keyExtractor={(s: ParkingSpot) => s.id}
        />
      )}
    </div>
  )
}
