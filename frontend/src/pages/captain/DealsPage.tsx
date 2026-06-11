import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDealStore } from '@/store/dealStore'
import { useChatStore } from '@/store/chatStore'
import { useWsStore } from '@/store/wsStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatCurrency } from '@/lib/utils'
import { HandshakeIcon, CheckCircle2, XCircle, Phone, Anchor, Package, Clock, MessageCircle } from 'lucide-react'
import type { Deal, ChatMessage } from '@/types'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
}

export function DealsPage() {
  const user = useAuthStore((s) => s.user)
  const allDeals = useDealStore((s) => s.deals)
  const deals = useMemo(
    () => allDeals.filter((d) => d.initiatorId === user?.id || d.targetId === user?.id),
    [allDeals, user?.id]
  )
  const updateDealStatus = useDealStore((s) => s.updateDealStatus)
  const approvePhoneReveal = useDealStore((s) => s.approvePhoneReveal)
  const addMessage = useChatStore((s) => s.addMessage)
  const wsSend = useWsStore((s) => s.send)
  const setSelectedDeal = (_deal: Deal | null) => {}

  const handleApprove = (deal: Deal) => {
    updateDealStatus(deal.id, 'approved')
    if (user) {
      approvePhoneReveal(deal.id, user.id)
    }
    const msg: ChatMessage = {
      id: `sys-${Date.now()}`,
      fromUserId: user?.id ?? 0,
      toUserId: deal.initiatorId === user?.id ? deal.targetId : deal.initiatorId,
      text: 'Deal approved! Phone numbers will be revealed once both sides approve.',
      timestamp: new Date().toISOString(),
      status: 'delivered',
      dealId: deal.id,
    }
    addMessage(msg)
    if (user) {
      wsSend({
        type: 'deal_update',
        deal_id: deal.id,
        action: 'approved',
        to_user_id: deal.initiatorId === user.id ? deal.targetId : deal.initiatorId,
        payload: { status: 'approved' },
      }).catch(() => {})
    }
  }

  const handleReject = (deal: Deal) => {
    updateDealStatus(deal.id, 'rejected')
    if (user) {
      wsSend({
        type: 'deal_update',
        deal_id: deal.id,
        action: 'rejected',
        to_user_id: deal.initiatorId === user.id ? deal.targetId : deal.initiatorId,
        payload: { status: 'rejected' },
      }).catch(() => {})
    }
  }

  const isBothApproved = (deal: Deal) => deal.initiatorPhoneRevealed && deal.targetPhoneRevealed

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Deals"
        description={`${deals.length} total · ${deals.filter((d) => d.status === 'pending').length} pending`}
      />

      {deals.length === 0 ? (
        <EmptyState
          icon={<HandshakeIcon className="w-6 h-6" />}
          title="No deals yet"
          description="Deals are created when you claim an order or book a berth."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {deal.type === 'berth_booking' ? (
                    <Anchor className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Package className="w-4 h-4 text-emerald-500" />
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{deal.title}</h3>
                    <p className="text-xs text-slate-400 capitalize">{deal.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[deal.status] || 'bg-slate-50 text-slate-600'}`}>
                  {deal.status}
                </span>
              </div>

              {deal.description && (
                <p className="text-xs text-slate-500 mb-3">{deal.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                {deal.amount && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatCurrency(deal.amount)}
                  </span>
                )}
                {deal.tariffName && (
                  <span className="flex items-center gap-1">
                    {deal.tariffName}
                  </span>
                )}
                <span>{formatDate(deal.createdAt)}</span>
              </div>

              {/* Action Buttons */}
              {deal.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button size="sm" onClick={() => handleApprove(deal)}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(deal)}>
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedDeal(deal)}>
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                  </Button>
                </div>
              )}

              {deal.status === 'approved' && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {isBothApproved(deal) ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Both sides approved — contact info revealed
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        {deal.initiatorPhone && (
                          <span className="flex items-center gap-1 text-slate-700">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {deal.initiatorPhone}
                          </span>
                        )}
                        {deal.targetPhone && (
                          <span className="flex items-center gap-1 text-slate-700">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {deal.targetPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        Waiting for other party to approve
                      </div>
                      {!deal.initiatorPhoneRevealed && user && deal.initiatorId === user.id && (
                        <Button size="sm" variant="primary" onClick={() => approvePhoneReveal(deal.id, user.id)}>
                          Reveal My Phone
                        </Button>
                      )}
                      {!deal.targetPhoneRevealed && user && deal.targetId === user.id && (
                        <Button size="sm" variant="primary" onClick={() => approvePhoneReveal(deal.id, user.id)}>
                          Reveal My Phone
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
