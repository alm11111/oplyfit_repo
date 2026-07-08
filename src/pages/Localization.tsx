import { useState } from 'react'

interface Language {
  code: string
  name: string
  flag: string
  status: 'active' | 'partial' | 'planned'
  coverage: number  // % stringhe tradotte
}

const LANGUAGES: Language[] = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹', status: 'active', coverage: 100 },
  { code: 'es', name: 'Español', flag: '🇪🇸', status: 'partial', coverage: 62 },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', status: 'partial', coverage: 48 },
  { code: 'fr', name: 'Français', flag: '🇫🇷', status: 'planned', coverage: 15 },
  { code: 'en', name: 'English', flag: '🇬🇧', status: 'partial', coverage: 85 },
]

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  planned: 'bg-slate-100 text-slate-500',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Attiva',
  partial: 'Parziale',
  planned: 'Pianificata',
}

const CURRENCY_MAP: Record<string, string> = {
  it: 'EUR (€)',
  es: 'EUR (€)',
  de: 'EUR (€)',
  fr: 'EUR (€)',
  en: 'GBP (£) / EUR (€)',
}

const TIMEZONE_MAP: Record<string, string> = {
  it: 'Europe/Rome',
  es: 'Europe/Madrid',
  de: 'Europe/Berlin',
  fr: 'Europe/Paris',
  en: 'Europe/London',
}

export default function Localization() {
  const [gymLanguage, setGymLanguage] = useState('it')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Localizzazione</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lingua dell'interfaccia, valuta e fuso orario — espansione EU (mese 18+).
        </p>
      </div>

      {/* Impostazione palestra */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-ink">Impostazioni palestra</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lingua predefinita</label>
            <select
              value={gymLanguage}
              onChange={e => setGymLanguage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {LANGUAGES.filter(l => l.status !== 'planned').map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valuta</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {CURRENCY_MAP[gymLanguage]}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fuso orario</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {TIMEZONE_MAP[gymLanguage]}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            onClick={() => alert('Impostazioni salvate (endpoint /api/v1/gym/profile PUT)')}
          >
            Salva impostazioni
          </button>
        </div>
      </div>

      {/* Stato traduzioni */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-ink">Stato traduzioni</h2>
          <p className="text-xs text-slate-500 mt-0.5">Le traduzioni incomplete usano l'italiano come fallback.</p>
        </div>
        <div className="divide-y divide-slate-50">
          {LANGUAGES.map(lang => (
            <div key={lang.code} className="flex items-center gap-4 px-6 py-4">
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{lang.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[lang.status]}`}>
                    {STATUS_LABEL[lang.status]}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${lang.coverage >= 80 ? 'bg-emerald-500' : lang.coverage >= 40 ? 'bg-amber-500' : 'bg-slate-300'}`}
                    style={{ width: `${lang.coverage}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-ink">{lang.coverage}%</div>
                <div className="text-xs text-slate-400">copertura</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note espansione */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="font-medium text-blue-800 mb-2">🗺️ Piano espansione EU</div>
        <div className="space-y-1 text-sm text-blue-700">
          <div>🇮🇹 <strong>Italia</strong> — Go-to-market attuale (100% completato)</div>
          <div>🇪🇸 <strong>Spagna</strong> — Q1 2027 target (62% tradotto)</div>
          <div>🇩🇪 <strong>Germania</strong> — Q2 2027 target (48% tradotto)</div>
          <div>🇫🇷 <strong>Francia</strong> — Q3 2027 target (15% tradotto)</div>
        </div>
      </div>
    </div>
  )
}
