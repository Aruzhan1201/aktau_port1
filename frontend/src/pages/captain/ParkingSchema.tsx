import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBerthList } from '@/hooks/useBerth'
import { useShipList } from '@/hooks/useShip'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Anchor, CheckCircle2, X } from 'lucide-react'
import type { Berth } from '@/types'

interface TariffOption {
  id: string
  name: string
  description: string
  pricePerHour: number
  features: string[]
}

const TARIFFS: TariffOption[] = [
  { id: 'economy', name: 'Economy', description: 'Basic berth access', pricePerHour: 50, features: ['Standard mooring', 'Basic utilities', '24/7 security'] },
  { id: 'standard', name: 'Standard', description: 'Full service berth', pricePerHour: 120, features: ['Priority mooring', 'Water & electricity', 'Waste disposal', '24/7 security', 'Crane access'] },
  { id: 'premium', name: 'Premium', description: 'VIP berth with concierge', pricePerHour: 300, features: ['Guaranteed berth', 'All utilities', 'Catering service', 'Crane & forklift', 'Concierge service', 'Secure storage'] },
]

export function ParkingSchema() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: berths, isLoading } = useBerthList()
  const { data: ships } = useShipList()
  const myShip = ships?.items?.find((s) => s.captain_id === user?.id)
  const [selectedBerth, setSelectedBerth] = useState<Berth | null>(null)
  const [selectedTariff, setSelectedTariff] = useState<string>('standard')
  const [hours, setHours] = useState(24)
  const [bookingStep, setBookingStep] = useState<'select' | 'tariff' | 'review' | 'done'>('select')

  const tariff = TARIFFS.find((t) => t.id === selectedTariff)!
  const totalCost = tariff ? tariff.pricePerHour * hours : 0

  const handleStartBooking = (berth: Berth) => {
    setSelectedBerth(berth)
    setBookingStep('tariff')
  }

  const handleConfirmBooking = async () => {
    if (!selectedBerth || !user || !myShip) return
    try {
      await api.post('/deals/', {
        type: 'berth_rental',
        client_id: user.id,
        captain_id: user.id,
        cargo_id: null,
        proposed_price: totalCost,
        currency: 'USD',
        notes: `Berth ${selectedBerth.name} — ${tariff.name}, ${hours}h`,
      })
      setBookingStep('done')
    } catch {
      setBookingStep('select')
    }
  }

  const berthColor = (status: string) => {
    switch (status) {
      case 'free': return { bg: 'bg-emerald-100 border-emerald-400', dot: 'bg-emerald-500', text: 'text-emerald-700' }
      case 'occupied': return { bg: 'bg-red-100 border-red-400', dot: 'bg-red-500', text: 'text-red-700' }
      case 'maintenance': return { bg: 'bg-amber-100 border-amber-400', dot: 'bg-amber-500', text: 'text-amber-700' }
      default: return { bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-400', text: 'text-slate-600' }
    }
  }

  const berthList = berths?.items ?? []
  const freeBerths = berthList.filter((b) => b.status === 'free')
  const occupiedBerths = berthList.filter((b) => b.status === 'occupied')

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Port Parking Schema"
        description={`${freeBerths.length} free · ${occupiedBerths.length} occupied · ${berthList.length - freeBerths.length - occupiedBerths.length} maintenance`}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs">
            {[
              { label: 'Free', cls: 'bg-emerald-500' },
              { label: 'Occupied', cls: 'bg-red-500' },
              { label: 'Maintenance', cls: 'bg-amber-500' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${l.cls}`} />
                <span className="text-slate-600">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Berth Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
            {berthList.map((berth) => {
              const colors = berthColor(berth.status)
              const isFree = berth.status === 'free'
              return (
                <div
                  key={berth.id}
                  onClick={() => isFree && handleStartBooking(berth)}
                  className={`rounded-xl border-2 p-4 transition-all duration-200 ${
                    isFree
                      ? `${colors.bg} cursor-pointer hover:scale-[1.02] hover:shadow-md`
                      : `${colors.bg} opacity-80`
                  } ${selectedBerth?.id === berth.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-slate-600" />
                      <span className="font-semibold text-slate-800 text-sm">{berth.name}</span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>Capacity: {berth.capacity.toLocaleString()}t</p>
                    {berth.location_coords && (
                      <p className="text-slate-400 font-mono">
                        {berth.location_coords.lat.toFixed(3)}, {berth.location_coords.lng.toFixed(3)}
                      </p>
                    )}
                  </div>
                  {isFree && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center text-[10px] font-semibold uppercase ${colors.text}`}>
                        Available
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Booking Modal */}
      {selectedBerth && bookingStep !== 'done' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedBerth(null); setBookingStep('select') }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Anchor className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Book {selectedBerth.name}</h3>
              </div>
              <button onClick={() => { setSelectedBerth(null); setBookingStep('select') }} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {bookingStep === 'tariff' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Choose a parking tariff plan</p>
                <div className="space-y-2">
                  {TARIFFS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTariff(t.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedTariff === t.id
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900">{t.name}</span>
                        <span className="font-bold text-blue-600">{formatCurrency(t.pricePerHour)}/hr</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{t.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {t.features.map((f) => (
                          <span key={f} className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1">
                    <Input
                      id="hours"
                      label="Duration (hours)"
                      type="number"
                      min={1}
                      max={720}
                      value={hours.toString()}
                      onChange={(e) => setHours(Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="text-right pt-5">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(totalCost)}</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setBookingStep('review')} size="lg">
                  Continue to Review
                </Button>
              </div>
            )}

            {bookingStep === 'review' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Berth</span><span className="font-medium">{selectedBerth.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Ship</span><span className="font-medium">{myShip?.name || 'N/A'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Tariff</span><span className="font-medium">{tariff.name} — {formatCurrency(tariff.pricePerHour)}/hr</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Duration</span><span className="font-medium">{hours}h</span></div>
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-2"><span className="font-semibold text-slate-700">Total</span><span className="font-bold text-lg text-blue-600">{formatCurrency(totalCost)}</span></div>
                </div>
                <p className="text-xs text-slate-400">A deal request will be sent to port management for approval. Both sides must approve to proceed.</p>
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={handleConfirmBooking} size="lg">
                    <CheckCircle2 className="w-4 h-4" />
                    Send Booking Request
                  </Button>
                  <Button variant="outline" onClick={() => setBookingStep('tariff')}>Back</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success state */}
      {bookingStep === 'done' && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Booking Request Sent!</h3>
            <p className="text-sm text-slate-500 mb-6">Port management will review your request. Track it in your deals.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setSelectedBerth(null); setBookingStep('select') }}>
                Done
              </Button>
              <Button variant="outline" onClick={() => navigate('/deals')}>
                View Deals
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
