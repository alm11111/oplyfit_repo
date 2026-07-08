import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface ThirdPartyApp {
  id: string
  name: string
  developer: string
  description: string
  category: string
  status: 'active' | 'pending' | 'suspended'
  revenueSharePct: number
  installCount: number
  ratingAvg: number
}

const STUB_APPS: ThirdPartyApp[] = [
  { id: '1', name: 'NutriSync Pro', developer: 'HealthTech Srl', description: 'Integrazione avanzata con MyFitnessPal e Yummly', category: 'Nutrizione', status: 'active', revenueSharePct: 30, installCount: 142, ratingAvg: 4.7 },
  { id: '2', name: 'BoxerTrack', developer: 'Combat Apps', description: 'Tracker specifico per sport da combattimento e MMA', category: 'Sport', status: 'active', revenueSharePct: 30, installCount: 89, ratingAvg: 4.4 },
  { id: '3', name: 'Physiо Connect', developer: 'Physio Digital', description: 'Protocolli riabilitazione e comunicazione con fisioterapisti', category: 'Recovery', status: 'pending', revenueSharePct: 30, installCount: 0, ratingAvg: 0 },
]

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
}

export default function DeveloperMarketplace() {
  const [tab, setTab] = useState<'apps' | 'docs' | 'submit'>('apps')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Developer Marketplace</h1>
        <p className="mt-1 text-sm text-slate-500">
          App di terze parti che estendono Oplyfit — revenue share 70/30 (developer/Oplyfit).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {[
          { id: 'apps', label: '🏪 App disponibili' },
          { id: 'docs', label: '📡 API Reference' },
          { id: 'submit', label: '📤 Sottometti app' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'apps' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-black text-ink">{STUB_APPS.filter(a => a.status === 'active').length}</div>
              <div className="text-sm text-slate-500">App attive</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-black text-ink">{STUB_APPS.reduce((s, a) => s + a.installCount, 0)}</div>
              <div className="text-sm text-slate-500">Installazioni totali</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-black text-ink">70%</div>
              <div className="text-sm text-slate-500">Revenue ai developer</div>
            </div>
          </div>

          {STUB_APPS.map(app => (
            <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-ink text-lg">{app.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[app.status]}`}>
                      {app.status === 'active' ? 'Attiva' : app.status === 'pending' ? 'In revisione' : 'Sospesa'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">{app.developer} · {app.category}</div>
                  <div className="text-sm text-slate-600 mt-2">{app.description}</div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {app.installCount > 0 && (
                    <>
                      <div className="text-sm font-semibold text-ink">{app.installCount} install</div>
                      <div className="text-xs text-amber-500">★ {app.ratingAvg.toFixed(1)}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">Revenue share: developer {100 - app.revenueSharePct}% / Oplyfit {app.revenueSharePct}%</span>
                {app.status === 'active' && (
                  <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Gestisci
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'docs' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-ink">Oplyfit Open API v1</h2>
          <p className="text-sm text-slate-600">
            I developer possono integrare con Oplyfit tramite le API REST.
            Autenticazione OAuth2 con scopo limitato al tenant.
          </p>
          <div className="space-y-3">
            {[
              { title: 'Autenticazione OAuth2', desc: 'Client credentials + authorization code flow' },
              { title: 'Webhook', desc: 'Ricevi eventi in real-time (nuovi membri, pagamenti, sessioni)' },
              { title: 'Sandbox', desc: 'Ambiente di test isolato con dati stub' },
              { title: 'Rate limits', desc: '1000 req/min per app registrata' },
              { title: 'Versioning', desc: 'Prefix /api/v1/ — backward compatible per 18 mesi' },
            ].map(d => (
              <div key={d.title} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                <div className="text-brand-600 font-mono text-sm">→</div>
                <div>
                  <div className="font-medium text-ink text-sm">{d.title}</div>
                  <div className="text-xs text-slate-500">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'submit' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-ink">Sottometti una nuova app</h2>
          <p className="text-sm text-slate-500">
            Le app vengono revisionate dal team Oplyfit entro 5 giorni lavorativi.
          </p>
          <div className="space-y-3">
            {['Nome app', 'Nome sviluppatore / azienda', 'Descrizione', 'Categoria'].map(f => (
              <div key={f}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{f}</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder={f} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL documentazione API</label>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="https://..." />
            </div>
            <button className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Invia per revisione
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
