import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge } from '../components/ui'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
  ComposedChart, Line,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface TreasuryDto {
  mrr: number; currency: string; activeCount: number; trialingCount: number
  pausedCount: number; cancelledCount: number; plansCount: number
}
interface SubscriptionDto {
  id: string; memberId: string; memberName?: string; planId: string; planName?: string
  status: string; currentPeriodEndUtc: string; amount?: number
}
interface PaymentDto {
  id: string; memberName: string; description: string; amount: number
  currency: string; method: string; status: string; paidAt: string
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_TREASURY: TreasuryDto = { mrr: 7740, currency: 'EUR', activeCount: 116, trialingCount: 4, pausedCount: 7, cancelledCount: 3, plansCount: 5 }

const MRR_TREND = [
  { mese: 'Lug \'25', mrr: 5980, nuovo: 620, expansion: 80, contraction: -40, churn: -180 },
  { mese: 'Ago \'25', mrr: 6120, nuovo: 540, expansion: 60, contraction: -30, churn: -150 },
  { mese: 'Set \'25', mrr: 6380, nuovo: 680, expansion: 100, contraction: -50, churn: -120 },
  { mese: 'Ott \'25', mrr: 6640, nuovo: 720, expansion: 90, contraction: -70, churn: -110 },
  { mese: 'Nov \'25', mrr: 6900, nuovo: 580, expansion: 120, contraction: -60, churn: -130 },
  { mese: 'Dic \'25', mrr: 7100, nuovo: 640, expansion: 80, contraction: -40, churn: -140 },
  { mese: 'Gen \'26', mrr: 7200, nuovo: 580, expansion: 70, contraction: -110, churn: -200 },
  { mese: 'Feb \'26', mrr: 7380, nuovo: 660, expansion: 90, contraction: -50, churn: -110 },
  { mese: 'Mar \'26', mrr: 7560, nuovo: 700, expansion: 110, contraction: -60, churn: -100 },
  { mese: 'Apr \'26', mrr: 7620, nuovo: 580, expansion: 80, contraction: -80, churn: -130 },
  { mese: 'Mag \'26', mrr: 7680, nuovo: 600, expansion: 90, contraction: -50, churn: -110 },
  { mese: 'Giu \'26', mrr: 7740, nuovo: 620, expansion: 100, contraction: -40, churn: -120 },
]
const REVENUE_PER_PIANO = [
  { name: 'Premium Mensile', value: 2456, color: '#7c3aed' },
  { name: 'Annuale Top',     value: 1206, color: '#10b981' },
  { name: 'Base Mensile',    value: 1117, color: '#3b82f6' },
  { name: 'Trimestrale',     value: 602,  color: '#f59e0b' },
  { name: 'Student',         value: 359,  color: '#ec4899' },
]
const DEMO_SUBS: SubscriptionDto[] = [
  { id: 's1',  memberId: 'm1',  memberName: 'Giulia Ferretti',  planId: 'p3', planName: 'Annuale Top',     status: 'Active',    currentPeriodEndUtc: '2027-01-15', amount: 499/12  },
  { id: 's2',  memberId: 'm2',  memberName: 'Marco Bianchi',    planId: 'p2', planName: 'Premium Mensile', status: 'Active',    currentPeriodEndUtc: '2026-07-24', amount: 59.90   },
  { id: 's3',  memberId: 'm3',  memberName: 'Alessia Romano',   planId: 'p1', planName: 'Base Mensile',    status: 'Active',    currentPeriodEndUtc: '2026-07-10', amount: 39.90   },
  { id: 's4',  memberId: 'm4',  memberName: 'Luca Conti',       planId: 'p2', planName: 'Premium Mensile', status: 'Trialing',  currentPeriodEndUtc: '2026-07-01', amount: 0       },
  { id: 's5',  memberId: 'm5',  memberName: 'Sara Esposito',    planId: 'p4', planName: 'Trimestrale',     status: 'Active',    currentPeriodEndUtc: '2026-07-01', amount: 129/3   },
  { id: 's6',  memberId: 'm6',  memberName: 'Fabio De Luca',    planId: 'p5', planName: 'Student',         status: 'Active',    currentPeriodEndUtc: '2026-07-24', amount: 29.90   },
  { id: 's7',  memberId: 'm7',  memberName: 'Chiara Lombardi',  planId: 'p3', planName: 'Annuale Top',     status: 'Paused',    currentPeriodEndUtc: '2026-08-01', amount: 499/12  },
  { id: 's8',  memberId: 'm8',  memberName: 'Antonio Ricci',    planId: 'p1', planName: 'Base Mensile',    status: 'Cancelled', currentPeriodEndUtc: '2026-06-01', amount: 0       },
  { id: 's9',  memberId: 'm9',  memberName: 'Valentina Greco',  planId: 'p2', planName: 'Premium Mensile', status: 'Active',    currentPeriodEndUtc: '2026-07-28', amount: 59.90   },
  { id: 's10', memberId: 'm10', memberName: 'Roberto Martini',  planId: 'p3', planName: 'Annuale Top',     status: 'Active',    currentPeriodEndUtc: '2027-01-20', amount: 499/12  },
]
const DEMO_PAYMENTS: PaymentDto[] = [
  { id: 'pay1',  memberName: 'Marco Bianchi',    description: 'Premium Mensile — Giu \'26',  amount: 59.90,  currency: 'EUR', method: 'Visa •••• 4242', status: 'Succeeded', paidAt: '2026-06-24T09:12:00Z' },
  { id: 'pay2',  memberName: 'Alessia Romano',   description: 'Base Mensile — Giu \'26',     amount: 39.90,  currency: 'EUR', method: 'Mastercard •••• 1234', status: 'Succeeded', paidAt: '2026-06-23T14:30:00Z' },
  { id: 'pay3',  memberName: 'Fabio De Luca',    description: 'Student — Giu \'26',          amount: 29.90,  currency: 'EUR', method: 'SEPA Direct Debit',    status: 'Succeeded', paidAt: '2026-06-23T08:00:00Z' },
  { id: 'pay4',  memberName: 'Valentina Greco',  description: 'Premium Mensile — Giu \'26',  amount: 59.90,  currency: 'EUR', method: 'Visa •••• 9876',        status: 'Succeeded', paidAt: '2026-06-22T18:45:00Z' },
  { id: 'pay5',  memberName: 'Roberto Martini',  description: 'Annuale Top — Anno 2026',     amount: 499.00, currency: 'EUR', method: 'Mastercard •••• 5678',  status: 'Succeeded', paidAt: '2026-06-20T10:00:00Z' },
  { id: 'pay6',  memberName: 'Luigi Moretti',    description: 'Base Mensile — Giu \'26',     amount: 39.90,  currency: 'EUR', method: 'Visa •••• 1111',        status: 'Failed',    paidAt: '2026-06-19T16:20:00Z' },
  { id: 'pay7',  memberName: 'Anna Santoro',     description: 'Premium Mensile — Giu \'26',  amount: 59.90,  currency: 'EUR', method: 'SEPA Direct Debit',     status: 'Succeeded', paidAt: '2026-06-18T09:00:00Z' },
  { id: 'pay8',  memberName: 'Giulia Ferretti',  description: 'Annuale Top — Anno 2026',     amount: 499.00, currency: 'EUR', method: 'Visa •••• 4242',        status: 'Succeeded', paidAt: '2026-01-15T10:00:00Z' },
]
const CASHFLOW_MONTHLY = [
  { mese: 'Gen', entrate: 7200, uscite: 1840 }, { mese: 'Feb', entrate: 7380, uscite: 1920 },
  { mese: 'Mar', entrate: 7560, uscite: 1780 }, { mese: 'Apr', entrate: 7620, uscite: 1950 },
  { mese: 'Mag', entrate: 7680, uscite: 1870 }, { mese: 'Giu', entrate: 7740, uscite: 1900 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const SUB_STATUS: Record<string, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'slate' }> = {
  Active:    { label: 'Attivo',   tone: 'green' }, Trialing: { label: 'Prova',   tone: 'blue'  },
  Paused:    { label: 'Sospeso', tone: 'amber' }, Cancelled: { label: 'Disdetto', tone: 'slate' },
  PastDue:   { label: 'Scaduto', tone: 'red'   },
}
const PAY_STATUS: Record<string, { label: string; tone: 'green' | 'red' | 'amber' | 'slate' }> = {
  Succeeded: { label: 'Pagato',   tone: 'green' },
  Failed:    { label: 'Fallito',  tone: 'red'   },
  Pending:   { label: 'In corso', tone: 'amber' },
  Refunded:  { label: 'Rimborsato', tone: 'slate' },
}
function fmt(n: number) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) }
function fmtD(n: number) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n) }
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700']
  return <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>{initials}</div>
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Treasury() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'cashflow' | 'abbonamenti' | 'pagamenti'>('cashflow')
  const [subStatusFilter, setSubStatusFilter] = useState('')
  const [chartRange, setChartRange] = useState<6 | 12>(12)

  const { data: treasuryData } = useQuery({
    queryKey: ['treasury'], queryFn: () => api.get<TreasuryDto>('/api/v1/treasury'), retry: false,
  })
  const { data: subsData } = useQuery({
    queryKey: ['subscriptions'], queryFn: () => api.get<SubscriptionDto[]>('/api/v1/subscriptions'), retry: false,
  })

  const t    = treasuryData?.data ?? DEMO_TREASURY
  const subs = subsData?.data ?? DEMO_SUBS

  const action = useMutation({
    mutationFn: ({ id, verb }: { id: string; verb: 'pause' | 'resume' | 'cancel' }) =>
      api.post(`/api/v1/subscriptions/${id}/${verb}`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); qc.invalidateQueries({ queryKey: ['treasury'] }) },
  })

  // KPIs calcolati
  const arpu     = t.activeCount > 0 ? t.mrr / t.activeCount : 0
  const arr      = t.mrr * 12
  const ltv      = arpu * 24
  const churnPct = t.cancelledCount / (t.activeCount + t.cancelledCount) * 100
  const mrrData  = MRR_TREND.slice(chartRange === 6 ? -6 : 0)

  const filteredSubs = subs.filter(s => !subStatusFilter || s.status === subStatusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tesoreria</h1>
          <p className="mt-0.5 text-sm text-slate-500">Ricavi ricorrenti, cashflow e gestione pagamenti</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
          {([6, 12] as const).map(r => (
            <button key={r} onClick={() => setChartRange(r)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${chartRange === r ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {r} mesi
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          { label: 'MRR',        value: fmt(t.mrr),    sub: 'Ricavo mensile ricorrente', color: 'text-brand-600',   accent: 'bg-brand-500'   },
          { label: 'ARR',        value: fmt(arr),      sub: 'Annualizzato',              color: 'text-violet-600',  accent: 'bg-violet-500'  },
          { label: 'ARPU',       value: fmt(arpu),     sub: 'Per utente attivo',         color: 'text-blue-600',    accent: 'bg-blue-500'    },
          { label: 'LTV est.',   value: fmt(ltv),      sub: 'Lifetime Value medio',      color: 'text-emerald-600', accent: 'bg-emerald-500' },
          { label: 'Attivi',     value: String(t.activeCount + t.trialingCount), sub: `${t.trialingCount} in prova`, color: 'text-slate-800', accent: 'bg-slate-400' },
          { label: 'Churn MRR',  value: `${churnPct.toFixed(1)}%`, sub: 'Tasso disdetta', color: churnPct > 5 ? 'text-red-600' : 'text-slate-600', accent: churnPct > 5 ? 'bg-red-500' : 'bg-slate-300' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 h-1 w-8 rounded-full ${k.accent}`} />
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* MRR trend */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Andamento MRR</p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={mrrData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mese" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: number, n: string) => [fmt(v), n === 'mrr' ? 'MRR' : n]} />
              <Area type="monotone" dataKey="mrr" stroke="#7c3aed" fill="url(#mrrFill)" strokeWidth={2.5} dot={false} name="MRR" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {/* Revenue per piano */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Revenue per piano</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={REVENUE_PER_PIANO} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                {REVENUE_PER_PIANO.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [fmt(v), 'MRR']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {REVENUE_PER_PIANO.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-slate-500 truncate max-w-[110px]">{p.name}</span>
                </div>
                <span className="font-medium text-slate-700">{fmt(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MRR Movement */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Movimenti MRR — Nuovo · Expansion · Contraction · Churn</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={mrrData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mese" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${v}`} />
            <Tooltip formatter={(v: number) => [fmt(Math.abs(v))]} />
            <Bar dataKey="nuovo"      name="Nuovo"       fill="#10b981" stackId="pos" radius={[2,2,0,0]} />
            <Bar dataKey="expansion"  name="Expansion"   fill="#3b82f6" stackId="pos" />
            <Bar dataKey="contraction" name="Contraction" fill="#f59e0b" stackId="neg" />
            <Bar dataKey="churn"      name="Churn"       fill="#ef4444" stackId="neg" radius={[0,0,2,2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['cashflow', 'abbonamenti', 'pagamenti'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'cashflow' ? '📊 Cashflow mensile'
              : t === 'abbonamenti' ? `💳 Abbonamenti (${subs.length})`
              : `🧾 Pagamenti recenti (${DEMO_PAYMENTS.length})`}
          </button>
        ))}
      </div>

      {/* ── CASHFLOW ── */}
      {tab === 'cashflow' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Entrate totali',  value: CASHFLOW_MONTHLY.reduce((a, m) => a + m.entrate, 0), color: 'text-emerald-600' },
              { label: 'Uscite totali',   value: CASHFLOW_MONTHLY.reduce((a, m) => a + m.uscite, 0),  color: 'text-red-500'     },
              { label: 'Utile operativo', value: CASHFLOW_MONTHLY.reduce((a, m) => a + m.entrate - m.uscite, 0), color: 'text-brand-600' },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{fmt(k.value)}</p>
                <p className="text-xs text-slate-400 mt-1">{k.label} (6 mesi)</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Entrate vs Uscite mensili</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CASHFLOW_MONTHLY} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v)]} />
                <Bar dataKey="entrate" name="Entrate" fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="uscite"  name="Uscite"  fill="#f87171" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Mese</th>
                  <th className="px-4 py-3 text-right">Entrate</th>
                  <th className="px-4 py-3 text-right">Uscite</th>
                  <th className="px-4 py-3 text-right">Utile</th>
                  <th className="px-4 py-3 text-right">Margine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {CASHFLOW_MONTHLY.map(m => {
                  const utile   = m.entrate - m.uscite
                  const margine = Math.round(utile / m.entrate * 100)
                  return (
                    <tr key={m.mese} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700">{m.mese}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">{fmtD(m.entrate)}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-500">{fmtD(m.uscite)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{fmtD(utile)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${margine >= 70 ? 'bg-emerald-100 text-emerald-700' : margine >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                          {margine}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABBONAMENTI ── */}
      {tab === 'abbonamenti' && (
        <div className="space-y-4">
          <div className="flex gap-1 flex-wrap">
            {['', 'Active', 'Trialing', 'Paused', 'Cancelled'].map(s => (
              <button key={s} onClick={() => setSubStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${subStatusFilter === s
                  ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {s === '' ? 'Tutti' : SUB_STATUS[s]?.label ?? s}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Membro</th>
                  <th className="px-4 py-3">Piano</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3 text-right">MRR contrib.</th>
                  <th className="px-4 py-3">Prossimo rinnovo</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubs.map(s => {
                  const st = SUB_STATUS[s.status] ?? { label: s.status, tone: 'slate' as const }
                  const days = Math.floor((new Date(s.currentPeriodEndUtc).getTime() - Date.now()) / 86_400_000)
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {s.memberName && <Avatar name={s.memberName} />}
                          <span className="font-medium text-slate-800">{s.memberName ?? s.memberId.slice(0,8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.planName ?? s.planId.slice(0,8)}</td>
                      <td className="px-4 py-3"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                        {(s.amount ?? 0) > 0 ? fmtD(s.amount!) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={days <= 7 && s.status === 'Active' ? 'font-semibold text-amber-600' : 'text-slate-500'}>
                          {new Date(s.currentPeriodEndUtc).toLocaleDateString('it-IT')}
                          {days <= 7 && days >= 0 && s.status === 'Active' && <span className="ml-1">({days}gg)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {(s.status === 'Active' || s.status === 'Trialing') && (
                            <button onClick={() => action.mutate({ id: s.id, verb: 'pause' })}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                              Sospendi
                            </button>
                          )}
                          {s.status === 'Paused' && (
                            <button onClick={() => action.mutate({ id: s.id, verb: 'resume' })}
                              className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors">
                              Riattiva
                            </button>
                          )}
                          {s.status !== 'Cancelled' && (
                            <button onClick={() => action.mutate({ id: s.id, verb: 'cancel' })}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">
                              Disdici
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAGAMENTI ── */}
      {tab === 'pagamenti' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Data</th>
                <th className="px-4 py-3">Membro</th>
                <th className="px-4 py-3">Descrizione</th>
                <th className="px-4 py-3">Metodo</th>
                <th className="px-4 py-3 text-right">Importo</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {DEMO_PAYMENTS.map(p => {
                const st = PAY_STATUS[p.status] ?? { label: p.status, tone: 'slate' as const }
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {new Date(p.paidAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}{' '}
                      <span className="text-slate-400">{new Date(p.paidAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.memberName} />
                        <span className="font-medium text-slate-800">{p.memberName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.description}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{p.method}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{fmtD(p.amount)}</td>
                    <td className="px-4 py-3"><Badge tone={st.tone}>{st.label}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
