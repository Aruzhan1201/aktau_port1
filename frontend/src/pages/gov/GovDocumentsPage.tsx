import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { documentApi } from '@/api/other'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkeletonTable } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, XCircle } from 'lucide-react'
import type { CargoDocument } from '@/types'

interface GovernanceDocument extends CargoDocument {
  cargo_origin?: string
  cargo_destination?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-green-100 text-green-800',
  flagged: 'bg-red-100 text-red-800',
}

export function GovDocumentsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')

  const { data: docs, isLoading } = useQuery({
    queryKey: ['governance-documents', statusFilter],
    queryFn: () =>
      api
        .get<GovernanceDocument[]>('/governance/documents', {
          params: statusFilter ? { status: statusFilter } : {},
        })
        .then((r) => r.data),
  })

  const verifyMutation = useMutation({
    mutationFn: ({
      cargoId,
      documentId,
      status,
      reason,
    }: {
      cargoId: number
      documentId: number
      status: 'verified' | 'flagged'
      reason?: string
    }) => documentApi.verify(cargoId, documentId, { verification_status: status, flagged_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-documents'] })
    },
  })

  const [flagReason, setFlagReason] = useState<Record<number, string>>({})

  if (isLoading) return <SkeletonTable rows={5} cols={6} />

  const documentList = docs ?? []

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (doc: GovernanceDocument) => (
        <span className="font-mono text-xs text-slate-400">#{doc.id}</span>
      ),
    },
    {
      key: 'cargo_id',
      header: 'Cargo',
      render: (doc: GovernanceDocument) => (
        <span className="font-medium text-slate-800">Cargo #{doc.cargo_id}</span>
      ),
    },
    {
      key: 'cargo_origin',
      header: 'Route',
      render: (doc: GovernanceDocument) => (
        <span className="text-xs text-slate-500">
          {doc.cargo_origin ?? '?'} → {doc.cargo_destination ?? '?'}
        </span>
      ),
    },
    {
      key: 'document_type',
      header: 'Type',
      render: (doc: GovernanceDocument) => (
        <span className="capitalize text-slate-700">
          {doc.document_type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'verification_status',
      header: 'Status',
      render: (doc: GovernanceDocument) => (
        <Badge className={statusColors[doc.verification_status] ?? ''}>{doc.verification_status}</Badge>
      ),
    },
    {
      key: 'uploaded_at',
      header: 'Uploaded',
      render: (doc: GovernanceDocument) => (
        <span className="text-xs text-slate-400">
          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (doc: GovernanceDocument) => {
        if (doc.verification_status !== 'pending') return null
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() =>
                verifyMutation.mutate({
                  cargoId: doc.cargo_id,
                  documentId: doc.id,
                  status: 'verified',
                })
              }
              loading={verifyMutation.isPending}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify
            </Button>
            <div className="flex items-center gap-1">
              <Input
                placeholder="Flag reason"
                className="w-28 text-xs"
                value={flagReason[doc.id] ?? ''}
                onChange={(e) =>
                  setFlagReason((prev) => ({ ...prev, [doc.id]: e.target.value }))
                }
              />
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  verifyMutation.mutate({
                    cargoId: doc.cargo_id,
                    documentId: doc.id,
                    status: 'flagged',
                    reason: flagReason[doc.id] || 'Suspicious document',
                  })
                }
                loading={verifyMutation.isPending}
                disabled={!flagReason[doc.id]}
              >
                <XCircle className="w-3.5 h-3.5" />
                Flag
              </Button>
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('document.reviewDocuments')}
        description={
          documentList.filter((d) => d.verification_status === 'pending').length
            ? `${documentList.filter((d) => d.verification_status === 'pending').length} ${t('gov.documentsToReview')}`
            : t('gov.noDocumentsToReview')
        }
        actions={
          <div className="flex gap-2">
            {['pending', 'verified', 'flagged', ''].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>
        }
      />
      {documentList.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-6 h-6" />}
          title={t('document.noDocuments')}
          description={t('gov.noDocumentsToReview')}
        />
      ) : (
        <DataTable columns={columns} data={documentList} keyExtractor={(d: GovernanceDocument) => d.id} />
      )}
    </div>
  )
}
