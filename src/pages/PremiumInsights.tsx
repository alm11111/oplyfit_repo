import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface KpiDto {
  totalMembers: number
  activeMembers: number
  mrr: number
  churnRate: number
  avgRevenuePerMember: number
  avgSessionsPerWeek: number
}

function InsightCard({ icon, title, value, sub, trend }: { icon: string; title: string; value: string; sub?: string; trend?: 'up' | 'down' | 'flat' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl">{icon}</div>
          <div className="mt-2 text-2xl font-black text-ink">{value}</div>
          <div className="text-sm font-medium text-slate-600">{title}</div>
          {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function PremiumInsights() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  const { data, isLoading } = useQuery({
    queryKey: ['kpi', period],
    queryFn: () => api.get<KpiDto>(`/api/v1/kpi/summary?period=${period}`),
  })

  const kpi = data?.data

  const b2bInsights = [
    { label: 'Palestre nella rete FitChain', value: '3', icon: '🏢', sub: 'day pass cross-gym attivi' },
    { label: 'Utenti Corporate Wellness', value: '47', icon: '🏛️', sub: '4 aziende partner' },
    { label: 'Affiliati Franchise', value: '2', icon: '📋', sub: 'in onboarding: 1' },
    { label: 'API calls / mese', value: '12.4K', icon: '📡', sub: 'da app terze parti' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Premium Data Insights</h1>
        <p className="mt-1 text-sm text-slate-500">
          Analytics avanzate B2B — dati aggregati e benchmark di settore.
        </p>
      </div>

      {/* Periodo */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([['week', '7 giorni'], ['month', 'Mese'], ['quarter', 'Trimestre']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setPeriod(val)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${period === val ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* KPI principali */}
      {isLoading ? (
        <p className="text-sm text-slate-400">Caricamento…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <InsightCard icon="👥" title="Soci attivi" value={kpi?.activeMembers.toLocaleString('it-IT') ?? '—'} sub={`su ${kpi?.totalMembers ?? '—'} totali`} trend="up" />
          <InsightCard icon="💰" title="MRR" value={kpi ? `€${kpi.mrr.toLocaleString('it-IT')}` : '—'} sub="ricavi ricorrenti mensili" trend="up" />
          <InsightCard icon="📉" title="Churn rate" value={kpi ? `${kpi.churnRate.toFixed(1)}%` : '—'} sub="abbandoni nel periodo" trend="down" />
          <InsightCard icon="💳" title="ARPM" value={kpi ? `€${kpi.avgRevenuePerMember.toFixed(0)}` : '—'} sub="revenue medio per socio" trend="up" />
          <InsightCard icon="🏋️" title="Sessioni/settimana" value={kpi ? kpi.avgSessionsPerWeek.toFixed(1) : '—'} sub="media per socio attivo" trend="flat" />
          <InsightCard icon="📊" title="LTV stimato" value={kpi ? `€${((kpi.avgRevenuePerMember * 12) / Math.max(kpi.churnRate / 100, 0.01)).toFixed(0)}` : '—'} sub="lifetime value proiettato" trend="up" />
        </div>
      )}

      {/* B2B network */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink mb-4">Network B2B</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {b2bInsights.map(i => (
            <div key={i.label} className="text-center p-4 rounded-lg bg-slate-50">
              <div className="text-2xl mb-1">{i.icon}</div>
              <div className="text-xl font-black text-ink">{i.value}</div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">{i.label}</div>
              <div className="text-xs text-slate-400">{i.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark di settore */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink mb-4">Benchmark settore — Italia</h2>
        <div className="space-y-3">
          {[
            { metric: 'Churn mensile medio settore', benchmark: '3.5-5%', yours: `${kpi?.churnRate.toFixed(1) ?? '—'}%`, good: (kpi?.churnRate ?? 99) < 3.5 },
            { metric: 'Sessioni/settimana benchmark', benchmark: '2.1', yours: kpi?.avgSessionsPerWeek.toFixed(1) ?? '—', good: (kpi?.avgSessionsPerWeek ?? 0) > 2.1 },
            { metric: 'ARPM benchmark palestre IT', benchmark: '€38-55', yours: `€${kpi?.avgRevenuePerMember.toFixed(0) ?? '—'}`, good: (kpi?.avgRevenuePerMember ?? 0) > 38 },
          ].map(row => (
            <div key={row.metric} className="flex items-center gap-4 rounded-lg bg-slate-50 p-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700">{row.metric}</div>
                <div className="text-xs text-slate-400">Settore: {row.benchmark}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-ink">{row.yours}</div>
                <div className={`text-xs font-medium ${row.good ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {row.good ? '✓ Sopra media' : '⚠ Sotto media'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <strong>Piano Enterprise:</strong> export CSV/Excel, benchmark personalizzati per categoria palestra, e report white-label per investitori disponibili nel piano Enterprise.
      </div>
    </div>
  )
}
