import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkeletonTable } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { Deal } from '@/types'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  client_approved: 'bg-blue-100 text-blue-800',
  driver_approved: 'bg-blue-100 text-blue-800',
  captain_approved: 'bg-blue-100 text-blue-800',
  both_approved: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function DealsListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/deals').then((r) => r.data),
  })

  const approveCaptain = useMutation({
    mutationFn: (id: number) => api.post(`/deals/${id}/approve-captain`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  })

  const approveClient = useMutation({
    mutationFn: (id: number) => api.post(`/deals/${id}/approve-client`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  })

  const approveDriver = useMutation({
    mutationFn: (id: number) => api.post(`/deals/${id}/approve-driver`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  })

  const cancelDeal = useMutation({
    mutationFn: (id: number) => api.post(`/deals/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals'] }),
  })

  if (isLoading) return <SkeletonTable rows={5} cols={7} />

  if (isError) {
    return (
      <div>
        <PageHeader title="Deals" description="View and manage transport deals" />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 mx-6">
          <p className="font-semibold">Failed to load deals</p>
          <p className="text-sm mt-1">{(error as any)?.message || 'An error occurred'}</p>
        </div>
      </div>
    )
  }

  const deals: Deal[] = data?.items ?? []

  return (
    <div>
      <PageHeader title="Deals" description="View and manage transport deals" />
      {deals.length === 0 ? (
        <EmptyState title="No deals yet" description="Deals appear when captains claim orders or negotiate contracts." />
      ) : (
        <DataTable
          columns={[
            { key: 'id', header: 'ID', render: (item: Deal) => `#${item.id}` },
            { key: 'type', header: 'Type', render: (item: Deal) => <Badge>{item.type.replace('_', ' ')}</Badge> },
            {
              key: 'status',
              header: 'Status',
              render: (item: Deal) => (
                <Badge className={statusColors[item.status]}>{item.status.replace('_', ' ')}</Badge>
              ),
            },
            {
              key: 'proposed_price',
              header: 'Price',
              render: (item: Deal) => (item.proposed_price ? `${item.proposed_price} ${item.currency}` : '—'),
            },
            {
              key: 'approvals',
              header: 'Approvals',
              render: (item: Deal) => (
                <span className="text-xs">
                  {item.client_approved ? '✓ Client' : '○ Client'}
                  {item.driver_id ? (item.driver_approved ? ', ✓ Driver' : ', ○ Driver') : ''}
                  {item.captain_id ? (item.captain_approved ? ', ✓ Captain' : ', ○ Captain') : ''}
                </span>
              ),
            },
            {
              key: 'created_at',
              header: 'Created',
              render: (item: Deal) => new Date(item.created_at).toLocaleDateString(),
            },
            {
              key: 'actions',
              header: '',
              render: (item: Deal) => (
                <div className="flex gap-1">
                  {item.status === 'pending' && user?.role === 'captain' && !item.captain_approved && (
                    <Button size="sm" onClick={() => approveCaptain.mutate(item.id)}>
                      ✓ Approve
                    </Button>
                  )}
                  {item.status === 'pending' && user?.role === 'client' && !item.client_approved && (
                    <Button size="sm" onClick={() => approveClient.mutate(item.id)}>
                      ✓ Approve
                    </Button>
                  )}
                  {item.status === 'pending' && user?.role === 'driver' && !item.driver_approved && (
                    <Button size="sm" onClick={() => approveDriver.mutate(item.id)}>
                      ✓ Approve
                    </Button>
                  )}
                  {(item.status === 'both_approved' || item.status === 'pending') && user && (
                    <Button size="sm" variant="ghost" onClick={() => cancelDeal.mutate(item.id)}>
                      Cancel
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/deals/${item.id}`)}>
                    View
                  </Button>
                </div>
              ),
            },
          ]}
          data={deals}
          keyExtractor={(item: Deal) => item.id}
        />
      )}
    </div>
  )
}
