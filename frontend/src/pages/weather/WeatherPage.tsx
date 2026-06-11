import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { useWeather, useWeatherForecast, useWeatherAlerts } from '@/hooks/useOther'
import { useWsStore } from '@/store/wsStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Wind, Waves, Eye, Thermometer, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function WeatherPage() {
  const [port, setPort] = useState('aktau')
  const subscribeChannel = useWsStore((s) => s.subscribeChannel)
  const { data: weather, isLoading } = useWeather(port)
  const { data: forecast } = useWeatherForecast(port)
  const { data: alerts } = useWeatherAlerts()

  useEffect(() => {
    subscribeChannel('weather', port)
    return () => { useWsStore.getState().unsubscribeChannel('weather') }
  }, [subscribeChannel, port])

  const portAlerts = alerts?.filter((a) => a.port === port && a.storm_alert) || []
  const hasAlert = portAlerts.length > 0

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Weather Monitoring" description="Real-time marine weather conditions">
        <select value={port} onChange={(e) => setPort(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white">
          <option value="aktau">Aktau</option><option value="kuryk">Kuryk</option>
        </select>
      </PageHeader>

      {hasAlert && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Storm Alert</h3>
            {portAlerts.map((a, i) => (
              <p key={i} className="text-sm text-red-700 mt-1">{a.storm_alert_message}</p>
            ))}
            <p className="text-xs text-red-500 mt-1">Operations may be restricted</p>
          </div>
        </div>
      )}

      {isLoading ? <Skeleton className="h-48" /> : weather && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2"><Wind className="w-4 h-4" /><span className="text-xs font-medium">Wind Speed</span></div>
            <p className="text-2xl font-bold text-slate-800">{weather.wind_speed?.toFixed(1)} <span className="text-sm font-normal text-slate-500">m/s</span></p>
            {weather.wind_direction && <p className="text-xs text-slate-500">Direction: {weather.wind_direction}°</p>}
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-600 mb-2"><Waves className="w-4 h-4" /><span className="text-xs font-medium">Wave Height</span></div>
            <p className="text-2xl font-bold text-slate-800">{weather.wave_height?.toFixed(1)} <span className="text-sm font-normal text-slate-500">m</span></p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 mb-2"><Eye className="w-4 h-4" /><span className="text-xs font-medium">Visibility</span></div>
            <p className="text-2xl font-bold text-slate-800">{(weather.visibility / 1000)?.toFixed(1)} <span className="text-sm font-normal text-slate-500">km</span></p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-red-600 mb-2"><Thermometer className="w-4 h-4" /><span className="text-xs font-medium">Water Temp</span></div>
            <p className="text-2xl font-bold text-slate-800">{weather.water_temperature?.toFixed(1) ?? '—'} <span className="text-sm font-normal text-slate-500">°C</span></p>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">7-Day Forecast - Wind Speed</h3>
        {forecast && forecast.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: 'short' })} tick={{ fontSize: 12 }} />
              <YAxis unit=" m/s" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="wind_speed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Wind (m/s)" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500">Forecast data unavailable</p>}
      </div>
    </div>
  )
}
