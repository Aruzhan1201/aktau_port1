import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Deal } from '@/types'

export function DealDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.get(`/deals/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const approveClient = useMutation({
    mutationFn: () => api.post(`/deals/${id}/approve-client`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const approveDriver = useMutation({
    mutationFn: () => api.post(`/deals/${id}/approve-driver`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const approveCaptain = useMutation({
    mutationFn: () => api.post(`/deals/${id}/approve-captain`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const rejectClient = useMutation({
    mutationFn: () => api.post(`/deals/${id}/reject-client`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const rejectDriver = useMutation({
    mutationFn: () => api.post(`/deals/${id}/reject-driver`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const rejectCaptain = useMutation({
    mutationFn: () => api.post(`/deals/${id}/reject-captain`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const completeDeal = useMutation({
    mutationFn: () => api.post(`/deals/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const revealPhone = useMutation({
    mutationFn: () => api.post(`/deals/${id}/reveal-phone`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const cancelDeal = useMutation({
    mutationFn: () => api.post(`/deals/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  })

  if (isLoading) return <div className="p-6"><Skeleton className="h-40" /></div>
  if (!deal) return <div className="p-6 text-slate-500">Deal not found</div>

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    both_approved: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/deals')}>← {t('common.back')}</Button>
        <h1 className="text-xl font-semibold">{t('deals.deal')} #{deal.id}</h1>
        <Badge className={statusColor[deal.status] || 'bg-gray-100'}>
          {deal.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Type:</span> <span className="font-medium">{deal.type}</span></div>
          <div><span className="text-slate-500">Price:</span> <span className="font-medium">{deal.proposed_price ? `${deal.proposed_price} ${deal.currency}` : '—'}</span></div>
          <div><span className="text-slate-500">Client ID:</span> <span className="font-medium">{deal.client_id}</span></div>
          <div><span className="text-slate-500">Driver ID:</span> <span className="font-medium">{deal.driver_id || '—'}</span></div>
          <div><span className="text-slate-500">Captain ID:</span> <span className="font-medium">{deal.captain_id || '—'}</span></div>
          <div><span className="text-slate-500">Cargo ID:</span> <span className="font-medium">{deal.cargo_id || '—'}</span></div>
          <div><span className="text-slate-500">{t('deals.approvalStatus')}:</span></div>
          <div className="col-span-2 grid grid-cols-3 gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${deal.client_approved ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
              Client: {deal.client_approved ? '✅' : '❌'}
            </span>
            <span className={`px-2 py-1 rounded ${deal.driver_approved ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
              Driver: {deal.driver_approved ? '✅' : '❌'}
            </span>
            <span className={`px-2 py-1 rounded ${deal.captain_approved ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
              Captain: {deal.captain_approved ? '✅' : '❌'}
            </span>
          </div>
          {deal.phone_revealed_at && (
            <div className="col-span-2">
              <span className="text-slate-500">Phone revealed:</span>{' '}
              <span className="font-medium text-green-600">{new Date(deal.phone_revealed_at).toLocaleString()}</span>
            </div>
          )}
          <div className="col-span-2"><span className="text-slate-500">Notes:</span> <span className="font-medium">{deal.notes || '—'}</span></div>
          <div className="col-span-2"><span className="text-slate-500">Created:</span> <span className="font-medium">{new Date(deal.created_at).toLocaleString()}</span></div>
        </div>
      </div>

      {deal.status === 'both_approved' && !deal.phone_revealed_at && (
        <div className="flex justify-center">
          <Button onClick={() => revealPhone.mutate()} size="lg">
            Reveal Contact Info
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!deal.client_approved && deal.status === 'pending' && (
          <>
            <Button onClick={() => approveClient.mutate()} color="green">{t('common.approve')} as Client</Button>
            <Button onClick={() => rejectClient.mutate()} variant="outline" color="red">{t('common.reject')} as Client</Button>
          </>
        )}
        {!deal.driver_approved && deal.status === 'pending' && (
          <>
            <Button onClick={() => approveDriver.mutate()} color="green">{t('common.approve')} as Driver</Button>
            <Button onClick={() => rejectDriver.mutate()} variant="outline" color="red">{t('common.reject')} as Driver</Button>
          </>
        )}
        {!deal.captain_approved && deal.status === 'pending' && (
          <>
            <Button onClick={() => approveCaptain.mutate()} color="green">{t('common.approve')} as Captain</Button>
            <Button onClick={() => rejectCaptain.mutate()} variant="outline" color="red">{t('common.reject')} as Captain</Button>
          </>
        )}
        {deal.status === 'both_approved' && (
          <Button onClick={() => completeDeal.mutate()}>{t('deals.complete')}</Button>
        )}
        {deal.status !== 'completed' && deal.status !== 'cancelled' && (
          <Button onClick={() => cancelDeal.mutate()} variant="outline" color="red">{t('deals.cancel')}</Button>
        )}
      </div>
    </div>
  )
}
