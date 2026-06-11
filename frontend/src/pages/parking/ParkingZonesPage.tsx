import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SkeletonTable } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { ParkingZone, ParkingZoneCreateRequest } from '@/types'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  full: 'bg-red-100 text-red-800',
}

export function ParkingZonesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canDelete = user && (user.role === 'admin' || user.role === 'super_admin')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('10')
  const [port, setPort] = useState('aktau')

  const { data, isLoading } = useQuery({
    queryKey: ['parking-zones'],
    queryFn: () => api.get('/parking/zones').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (body: ParkingZoneCreateRequest) => api.post('/parking/zones', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-zones'] })
      setShowForm(false)
      setName('')
      setCapacity('10')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/parking/zones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parking-zones'] }),
  })

  if (isLoading) return <SkeletonTable rows={5} cols={5} />

  const zones: ParkingZone[] = data?.items ?? []

  return (
    <div>
      <PageHeader
        title={t('parking.zones')}
        description="Manage car/truck parking zones"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? t('common.cancel') : t('parking.newZone')}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-lg border space-y-3">
          <Input placeholder={t('parking.zoneName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={t('parking.capacity')} type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <select
            className="border rounded px-3 py-2 text-sm"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          >
            <option value="aktau">Aktau</option>
            <option value="kuryk">Kuryk</option>
          </select>
          <Button
            onClick={() => createMutation.mutate({ name, capacity: Number(capacity), port })}
            disabled={!name || !capacity}
          >
            {t('common.create')}
          </Button>
        </div>
      )}

      {zones.length === 0 ? (
        <EmptyState title={t('parking.noZones')} description={t('parking.createFirstZone')} />
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: t('parking.zoneName'), render: (z: ParkingZone) => <span className="font-medium">{z.name}</span> },
            { key: 'port', header: t('parking.port'), render: (z: ParkingZone) => <span>{z.port}</span> },
            {
              key: 'status',
              header: t('common.status'),
              render: (z: ParkingZone) => <Badge className={statusColors[z.status]}>{z.status}</Badge>,
            },
            { key: 'capacity', header: t('parking.capacity'), render: (z: ParkingZone) => <span>{z.capacity}</span> },
            {
              key: 'occupied',
              header: t('parking.occupied'),
              render: (z: ParkingZone) => <span>{(z as any).free_spots != null ? z.capacity - (z as any).free_spots : '—'}</span>,
            },
            ...(canDelete ? [{
              key: 'actions' as const,
              header: '' as const,
              render: (z: ParkingZone) => (
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(z.id)}>
                  {t('common.delete')}
                </Button>
              ),
            }] : []),
          ]}
          data={zones}
          keyExtractor={(z: ParkingZone) => z.id}
        />
      )}
    </div>
  )
}
