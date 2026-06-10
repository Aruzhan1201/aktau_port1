import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAIOrder, useCreateCargo } from '@/hooks/useCargo'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowLeft, CheckCircle2, AlertTriangle, Brain, Package, MapPin, Weight, Calendar } from 'lucide-react'
import type { AIOrderOutput } from '@/types'

export function AIOrderPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<AIOrderOutput | null>(null)
  const aiOrder = useAIOrder()
  const createCargo = useCreateCargo()
  const navigate = useNavigate()

  const handleParse = async () => {
    if (!text.trim()) return
    const res = await aiOrder.mutateAsync({ text })
    setResult(res)
  }

  const handleConfirm = async () => {
    if (!result?.cargo_type || !result?.weight || !result?.origin || !result?.destination) return
    const cargo = await createCargo.mutateAsync({
      cargo_type: result.cargo_type,
      weight: result.weight,
      origin: result.origin,
      destination: result.destination,
      eta: result.deadline,
    })
    navigate(`/cargo/${cargo.id}`)
  }

  const confidenceColor = result
    ? result.confidence >= 0.7
      ? 'text-emerald-600'
      : result.confidence >= 0.4
        ? 'text-amber-600'
        : 'text-red-600'
    : ''

  const confidenceBg = result
    ? result.confidence >= 0.7
      ? 'bg-emerald-500'
      : result.confidence >= 0.4
        ? 'bg-amber-500'
        : 'bg-red-500'
    : ''

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader
        title="AI Cargo Order"
        description="Describe your shipment in natural language"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-700">Describe your shipment</h3>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. I need to ship 5000 tons of grain from Aktau to Baku by June 15th"
              className="w-full rounded-lg border border-slate-300 p-3.5 text-sm h-32 resize-none outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 text-slate-900"
            />
            <Button
              onClick={handleParse}
              loading={aiOrder.isPending}
              disabled={!text.trim()}
              className="mt-3 w-full"
            >
              <Sparkles className="w-4 h-4" />
              Parse with AI
            </Button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Try saying:</strong> "Ship 200 tons of electronics from Aktau to Istanbul arriving July 10th"
            </p>
          </div>
        </div>
        {result && (
          <div className="space-y-4 animate-slide-up">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Parsed Result</h3>
                <Badge className={result.requires_review ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}>
                  {result.requires_review ? (
                    <><AlertTriangle className="w-3 h-3 mr-1" /> Needs Review</>
                  ) : (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Ready</>
                  )}
                </Badge>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">Confidence</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${confidenceBg}`}
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${confidenceColor}`}>
                    {(result.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldDisplay icon={Package} label="Type" value={result.cargo_type} />
                <FieldDisplay icon={Weight} label="Weight" value={result.weight ? `${result.weight}t` : '—'} />
                <FieldDisplay icon={MapPin} label="Origin" value={result.origin} />
                <FieldDisplay icon={MapPin} label="Destination" value={result.destination} />
                <FieldDisplay icon={Calendar} label="Deadline" value={result.deadline} className="col-span-2" />
              </div>
              {result.missing_fields.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-amber-700 mb-1">Missing information</p>
                  <p className="text-xs text-amber-600">{result.missing_fields.join(', ')}</p>
                </div>
              )}
              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleConfirm}
                  loading={createCargo.isPending}
                  disabled={result.requires_review}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Create
                </Button>
                <Button variant="outline" onClick={() => setResult(null)}>
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldDisplay({ icon: Icon, label, value, className }: { icon: typeof Package; label: string; value?: string | null; className?: string }) {
  return (
    <div className={`flex items-start gap-2 ${className || ''}`}>
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
      </div>
    </div>
  )
}
