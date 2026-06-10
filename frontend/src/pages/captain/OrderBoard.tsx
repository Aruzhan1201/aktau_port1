import { useState } from 'react'
import { useCargoList, useUpdateCargoStatus, useAssignShip } from '@/hooks/useCargo'
import { useAuthStore } from '@/store/authStore'
import { useDealStore } from '@/store/dealStore'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { useShipList } from '@/hooks/useShip'
import { formatDate, formatWeight } from '@/lib/utils'
import { CheckCircle, XCircle, MessageCircle, HandshakeIcon, Package } from 'lucide-react'
import type { Cargo } from '@/types'
import { useNavigate } from 'react-router-dom'

export function OrderBoard() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useCargoList()
  const { data: ships } = useShipList()
  const updateStatus = useUpdateCargoStatus(0)
  const assignShip = useAssignShip()
  const createDeal = useDealStore((s) => s.createDeal)
  const navigate = useNavigate()

  const myShip = ships?.items?.find((s) => s.captain_id === user?.id)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const availableCargoes = data?.items?.filter(
    (c) => c.status === 'created' || c.status === 'approved'
  ) ?? []

  const handleClaim = async (cargo: Cargo) => {
    if (!myShip || !user) return
    setActionLoading(cargo.id)
    try {
      if (cargo.status === 'created') {
        await updateStatus.mutateAsync({ status: 'approved' })
      }
      await assignShip.mutateAsync({ cargo_id: cargo.id, ship_id: myShip.id })

      createDeal({
        type: 'cargo_contract',
        title: `Cargo #${cargo.id} — ${cargo.cargo_type}`,
        description: `${cargo.origin} → ${cargo.destination}, ${cargo.weight}t`,
        initiatorId: user.id,
        targetId: cargo.client_id,
        status: 'pending',
        cargoId: cargo.id,
        shipId: myShip.id,
      })

      navigate('/captain/deals')
    } finally {
      setActionLoading(null)
    }
  }

  const columns = [
    { key: 'id', header: 'ID', render: (c: Cargo) => <span className="font-mono text-xs text-slate-400">#{c.id}</span> },
    { key: 'cargo_type', header: 'Type', render: (c: Cargo) => (
      <div className="flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-medium text-slate-800">{c.cargo_type}</span>
      </div>
    )},
    { key: 'weight', header: 'Weight', render: (c: Cargo) => <span className="text-slate-600">{formatWeight(c.weight)}</span> },
    { key: 'origin', header: 'Route', render: (c: Cargo) => (
      <span className="text-slate-600 text-xs">{c.origin} → {c.destination}</span>
    )},
    { key: 'status', header: 'Status', render: (c: Cargo) => <StatusBadge status={c.status} /> },
    { key: 'created', header: 'Created', render: (c: Cargo) => <span className="text-slate-500 text-xs">{formatDate(c.created_at)}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (c: Cargo) => (
        <div className="flex gap-1 justify-end">
          <Button
            size="sm"
            onClick={() => handleClaim(c)}
            loading={actionLoading === c.id}
            disabled={!myShip || actionLoading === c.id}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Claim
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              createDeal({
                type: 'cargo_contract',
                title: `Cargo #${c.id} — ${c.cargo_type}`,
                description: `${c.origin} → ${c.destination}, ${c.weight}t`,
                initiatorId: user!.id,
                targetId: c.client_id,
                status: 'pending',
                cargoId: c.id,
              })
              navigate('/captain/deals')
            }}
          >
            <HandshakeIcon className="w-3.5 h-3.5" />
            Negotiate
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Order Board"
        description={`${availableCargoes.length} open orders awaiting a captain`}
      />
      {!myShip && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">No ship assigned to you</p>
            <p className="text-xs text-amber-600">Contact an admin to assign a ship to your captain profile before claiming orders.</p>
          </div>
        </div>
      )}
      <DataTable
        columns={columns}
        data={availableCargoes}
        keyExtractor={(c: Cargo) => c.id}
        loading={isLoading}
        emptyMessage="No open orders"
        emptyDescription="All cargoes have been assigned. Check back later."
      />
    </div>
  )
}
