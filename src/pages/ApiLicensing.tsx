import { useState } from 'react'

interface LicenseTier {
  name: string
  price: string
  callsPerMonth: string
  features: string[]
  highlight?: boolean
}

const TIERS: LicenseTier[] = [
  {
    name: 'Starter',
    price: '€0',
    callsPerMonth: '10.000',
    features: [
      'Accesso endpoint /me/*',
      'Lettura dati soci (read-only)',
      'Webhook base',
      'Rate limit: 100 req/min',
      'SLA: best effort',
    ],
  },
  {
    name: 'Growth',
    price: '€99/mese',
    callsPerMonth: '200.000',
    features: [
      'Tutti gli endpoint pubblici',
      'Write access (con approval)',
      'Webhook avanzati + retry',
      'Rate limit: 500 req/min',
      'SLA: 99.5% uptime',
      'Dashboard utilizzo API',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Su misura',
    callsPerMonth: 'Illimitato',
    features: [
      'Accesso completo + admin',
      'Custom scopes',
      'IP allowlist',
      'Rate limit dedicato',
      'SLA: 99.9% + SLA finanziario',
      'Dedicated support',
      'Audit log completo',
    ],
  },
]

interface ApiKey {
  id: string
  name: string
  tier: string
  callsThisMonth: number
  limit: number
  createdAt: string
  lastUsed: string
}

const STUB_KEYS: ApiKey[] = [
  { id: '1', name: 'NutriSync Pro', tier: 'Growth', callsThisMonth: 14230, limit: 200000, createdAt: '2026-03-10', lastUsed: '2026-06-24' },
  { id: '2', name: 'BoxerTrack', tier: 'Starter', callsThisMonth: 3890, limit: 10000, createdAt: '2026-04-22', lastUsed: '2026-06-23' },
]

export default function ApiLicensing() {
  const [tab, setTab] = useState<'tiers' | 'keys'>('tiers')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">API Licensing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestione licenze API per sviluppatori e app di terze parti.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {[['tiers', '📋 Piani'], ['keys', '🔑 API Keys attive']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val as typeof tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === val ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'tiers' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map(tier => (
            <div key={tier.name} className={`rounded-xl border-2 p-6 ${tier.highlight ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
              {tier.highlight && (
                <div className="mb-3 inline-block rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white">
                  Più popolare
                </div>
              )}
              <div className="text-xl font-bold text-ink">{tier.name}</div>
              <div className="mt-1 text-3xl font-black text-ink">{tier.price}</div>
              <div className="mt-1 text-sm text-slate-500">{tier.callsPerMonth} API call/mese</div>
              <ul className="mt-4 space-y-2">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition ${tier.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                {tier.price === 'Su misura' ? 'Contattaci' : 'Attiva piano'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'keys' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + Nuova API Key
            </button>
          </div>
          {STUB_KEYS.map(key => {
            const pct = Math.round((key.callsThisMonth / key.limit) * 100)
            return (
              <div key={key.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-ink">{key.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Piano {key.tier} · Creata {new Date(key.createdAt).toLocaleDateString('it-IT')} · Ultimo uso {new Date(key.lastUsed).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">Ruota</button>
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">Revoca</button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{key.callsThisMonth.toLocaleString('it-IT')} call questo mese</span>
                    <span>{pct}% del limite</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 80 ? 'bg-amber-500' : 'bg-brand-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Limite: {key.limit.toLocaleString('it-IT')}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
