import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface GymProfileDto {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  timezone: string
  currency: string
  defaultLanguage: string
}

export default function WhiteLabel() {
  const { data } = useQuery({
    queryKey: ['gym', 'profile'],
    queryFn: () => api.get<GymProfileDto>('/api/v1/gym/profile'),
  })

  const gym = data?.data

  const [primaryColor, setPrimaryColor] = useState(gym?.primaryColor ?? '#6366f1')
  const [accentColor, setAccentColor] = useState(gym?.accentColor ?? '#f59e0b')
  const [logoUrl, setLogoUrl] = useState(gym?.logoUrl ?? '')

  const brandItems = [
    { label: 'Colore primario (brand)', key: 'primaryColor', value: primaryColor, setter: setPrimaryColor },
    { label: 'Colore accentuazione', key: 'accentColor', value: accentColor, setter: setAccentColor },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">White Label</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalizzazione del brand nell'app mobile e nel portale web.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <strong>Funzionalità in roadmap:</strong> il white label completo (custom domain, app branded) è pianificato per il piano Enterprise.
        La configurazione colori/logo è già disponibile e viene usata nell'app mobile.
      </div>

      {/* Colori */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-ink">Brand colors</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {brandItems.map(item => (
            <div key={item.key} className="flex items-center gap-4">
              <input
                type="color"
                value={item.value}
                onChange={e => item.setter(e.target.value)}
                className="h-10 w-10 rounded-lg cursor-pointer border border-slate-200"
              />
              <div>
                <div className="text-sm font-medium text-ink">{item.label}</div>
                <code className="text-xs text-slate-400">{item.value}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-ink">Logo palestra</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-contain border border-slate-100" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
              🏋️
            </div>
          )}
          <div className="flex-1">
            <input
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="URL del logo (https://...)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-slate-400">Carica il logo su Azure Blob Storage e incolla l'URL qui.</p>
          </div>
        </div>
      </div>

      {/* Anteprima */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Anteprima</h2>
        <div
          className="rounded-xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
        >
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white/20" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-xl">🏋️</div>
            )}
            <div>
              <div className="font-bold text-lg">{gym?.name ?? 'Nome Palestra'}</div>
              <div className="text-white/70 text-sm">Powered by Oplyfit</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700"
          onClick={() => alert('Salvataggio branding — endpoint /api/v1/gym/profile PUT (in roadmap)')}
        >
          Salva configurazione
        </button>
      </div>
    </div>
  )
}
