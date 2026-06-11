import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCargoList } from '@/hooks/useCargo'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { formatDate, formatWeight } from '@/lib/utils'
import { Plus, Sparkles, Eye } from 'lucide-react'
import type { Cargo } from '@/types'

export function CargoListPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useCargoList()
  const user = useAuthStore((s) => s.user)

  const columns = [
    { key: 'id', header: t('common.id'), render: (c: Cargo) => <span className="font-mono text-xs text-slate-400">#{c.id}</span> },
    { key: 'cargo_type', header: t('cargo.type'), render: (c: Cargo) => <span className="font-medium text-slate-800">{c.cargo_type}</span> },
    { key: 'weight', header: t('cargo.weight'), render: (c: Cargo) => <span className="text-slate-600">{formatWeight(c.weight)}</span> },
    { key: 'origin', header: t('cargo.origin'), render: (c: Cargo) => c.origin },
    { key: 'destination', header: t('cargo.destination'), render: (c: Cargo) => c.destination },
    { key: 'status', header: t('cargo.status'), render: (c: Cargo) => <StatusBadge status={c.status} /> },
    { key: 'created_at', header: t('cargo.created'), render: (c: Cargo) => <span className="text-slate-500">{formatDate(c.created_at)}</span> },
    {
      key: 'actions', header: t('common.actions'), className: 'text-right',
      render: (c: Cargo) => (
        <Link
          to={`/cargo/${c.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          {t('common.viewAll')}
        </Link>
      ),
    },
  ]

  const canCreate = user && (user.role === 'client' || user.role === 'admin')

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('cargo.title')}
        description={`${data?.total ?? 0} ${t('common.status')}`}
        actions={
          canCreate ? (
            <div className="flex gap-2">
              <Link to={ROUTES.CARGO_AI_ORDER}>
                <Button variant="outline" size="sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Order
                </Button>
              </Link>
              <Link to={ROUTES.CARGO_NEW}>
                <Button size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  {t('cargo.new')}
                </Button>
              </Link>
            </div>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(c: Cargo) => c.id}
        loading={isLoading}
        emptyMessage={t('cargo.title')}
        emptyDescription={t('cargo.create')}
      />
    </div>
  )
}
