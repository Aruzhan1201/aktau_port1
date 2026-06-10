import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateShip } from '@/hooks/useShip'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Ship, Hash, Weight } from 'lucide-react'

export function ShipCreatePage() {
  const navigate = useNavigate()
  const create = useCreateShip()
  const [form, setForm] = useState({ name: '', imo_number: '', capacity: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await create.mutateAsync({ name: form.name, imo_number: form.imo_number || undefined, capacity: Number(form.capacity) })
    navigate('/ships')
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="New Ship"
        description="Register a new vessel"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Ship className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Vessel Details</h2>
          </div>
          <div className="space-y-5">
            <Input
              id="name"
              label="Ship Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., M/V Caspian Star"
              icon={<Ship className="w-4 h-4" />}
              required
            />
            <Input
              id="imo"
              label="IMO Number"
              value={form.imo_number}
              onChange={(e) => setForm({ ...form, imo_number: e.target.value })}
              placeholder="7-digit IMO number"
              helperText="International Maritime Organization identifier (e.g., 1234567)"
              icon={<Hash className="w-4 h-4" />}
            />
            <Input
              id="capacity"
              label="Capacity (tons)"
              type="number"
              min="0"
              step="0.1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="10000"
              icon={<Weight className="w-4 h-4" />}
              required
            />
          </div>
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
            <Button type="submit" loading={create.isPending} size="lg">
              <Plus className="w-4 h-4" />
              Create Ship
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
