import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateCargo } from '@/hooks/useCargo'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Package, MapPin, Weight, Calendar } from 'lucide-react'

export function CargoCreatePage() {
  const navigate = useNavigate()
  const create = useCreateCargo()
  const [form, setForm] = useState({ cargo_type: '', weight: '', origin: '', destination: '', eta: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.cargo_type.trim()) e.cargo_type = 'Required'
    if (!form.weight || Number(form.weight) <= 0) e.weight = 'Must be a positive number'
    if (!form.origin.trim()) e.origin = 'Required'
    if (!form.destination.trim()) e.destination = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const cargo = await create.mutateAsync({
      ...form,
      weight: Number(form.weight),
      eta: form.eta || undefined,
    })
    navigate(`/cargo/${cargo.id}`)
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="New Cargo"
        description="Create a new cargo shipment"
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
            <Package className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Shipment Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              id="cargo_type"
              label="Cargo Type"
              value={form.cargo_type}
              onChange={(e) => setForm({ ...form, cargo_type: e.target.value })}
              placeholder="e.g., Electronics, Grain, Oil"
              helperText="Describe the type of cargo you're shipping"
              error={errors.cargo_type}
              icon={<Package className="w-4 h-4" />}
              required
            />
            <Input
              id="weight"
              label="Weight (tons)"
              type="number"
              min="0"
              step="0.1"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              placeholder="500"
              error={errors.weight}
              icon={<Weight className="w-4 h-4" />}
              required
            />
            <Input
              id="origin"
              label="Origin"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              placeholder="Aktau"
              helperText="Departure port or location"
              error={errors.origin}
              icon={<MapPin className="w-4 h-4" />}
              required
            />
            <Input
              id="destination"
              label="Destination"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Baku"
              helperText="Arrival port or location"
              error={errors.destination}
              icon={<MapPin className="w-4 h-4" />}
              required
            />
            <Input
              id="eta"
              label="ETA"
              type="datetime-local"
              value={form.eta}
              onChange={(e) => setForm({ ...form, eta: e.target.value })}
              icon={<Calendar className="w-4 h-4" />}
              helperText="Estimated time of arrival (optional)"
            />
          </div>
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
            <Button type="submit" loading={create.isPending} size="lg">
              <Plus className="w-4 h-4" />
              Create Shipment
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
