import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ComposedChart, Legend, Line, LineChart, Pie, PieChart,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../lib/api'

// ── Stub demo data ────────────────────────────────────────────────────────────

const MRR_12M = [
  { m: 'Lug', mrr: 3200, nuovi: 480, expansion: 120, contraction: -80, churn: -320 },
  { m: 'Ago', mrr: 3850, nuovi: 720, expansion: 150, contraction: -90, churn: -130 },
  { m: 'Set', mrr: 4100, nuovi: 540, expansion: 200, contraction: -110, churn: -380 },
  { m: 'Ott', mrr: 4480, nuovi: 600, expansion: 180, contraction: -100, churn: -300 },
  { m: 'Nov', mrr: 4920, nuovi: 680, expansion: 210, contraction: -70, churn: -380 },
  { m: 'Dic', mrr: 5260, nuovi: 560, expansion: 240, contraction: -120, churn: -340 },
  { m: 'Gen', mrr: 5640, nuovi: 740, expansion: 190, contraction: -90, churn: -460 },
  { m: 'Feb', mrr: 6150, nuovi: 820, expansion: 220, contraction: -80, churn: -450 },
  { m: 'Mar', mrr: 6430, nuovi: 600, expansion: 260, contraction: -130, churn: -480 },
  { m: 'Apr', mrr: 6810, nuovi: 780, expansion: 200, contraction: -110, churn: -500 },
  { m: 'Mag', mrr: 7220, nuovi: 840, expansion: 230, contraction: -100, churn: -560 },
  { m: 'Giu', mrr: 7840, nuovi: 960, expansion: 280, contraction: -90, churn: -530 },
]

const CHURN_TREND = [
  { m: 'Lug', churn: 5.8, settore: 6.2 },
  { m: 'Ago', churn: 5.1, settore: 6.1 },
  { m: 'Set', churn: 4.9, settore: 6.0 },
  { m: 'Ott', churn: 4.5, settore: 5.9 },
  { m: 'Nov', churn: 4.2, settore: 5.8 },
  { m: 'Dic', churn: 3.9, settore: 5.7 },
  { m: 'Gen', churn: 3.8, settore: 5.6 },
  { m: 'Feb', churn: 3.5, settore: 5.5 },
  { m: 'Mar', churn: 3.4, settore: 5.4 },
  { m: 'Apr', churn: 3.3, settore: 5.3 },
  { m: 'Mag', churn: 3.2, settore: 5.2 },
  { m: 'Giu', churn: 3.1, settore: 5.1 },
]

const MEMBERS_TREND = [
  { m: 'Lug', attivi: 78, nuovi: 9, cancellati: 3 },
  { m: 'Ago', attivi: 89, nuovi: 14, cancellati: 3 },
  { m: 'Set', attivi: 98, nuovi: 12, cancellati: 3 },
  { m: 'Ott', attivi: 104, nuovi: 10, cancellati: 4 },
  { m: 'Nov', attivi: 110, nuovi: 11, cancellati: 5 },
  { m: 'Dic', attivi: 115, nuovi: 9, cancellati: 4 },
  { m: 'Gen', attivi: 118, nuovi: 12, cancellati: 9 },
  { m: 'Feb', attivi: 116, nuovi: 18, cancellati: 5 },
  { m: 'Mar', attivi: 121, nuovi: 24, cancellati: 4 },
  { m: 'Apr', attivi: 119, nuovi: 16, cancellati: 6 },
  { m: 'Mag', attivi: 122, nuovi: 22, cancellati: 3 },
  { m: 'Giu', attivi: 124, nuovi: 29, cancellati: 5 },
]

const COHORT_RETENTION = [
  { coorte: 'Gen \'26', m1: 100, m2: 91, m3: 85, m4: 78, m5: 74, m6: 71 },
  { coorte: 'Feb \'26', m1: 100, m2: 89, m3: 82, m4: 76, m5: 72 },
  { coorte: 'Mar \'26', m1: 100, m2: 92, m3: 87, m4: 80 },
  { coorte: 'Apr \'26', m1: 100, m2: 90, m3: 84 },
  { coorte: 'Mag \'26', m1: 100, m2: 93 },
  { coorte: 'Giu \'26', m1: 100 },
]

const PLAN_REVENUE = [
  { piano: 'Bronze', soci: 32, rev: 1280, colore: '#94a3b8' },
  { piano: 'Silver', soci: 48, rev: 2880, colore: '#2563eb' },
  { piano: 'Gold', soci: 30, rev: 2700, colore: '#f59e0b' },
  { piano: 'Platinum', soci: 14, rev: 1960, colore: '#8b5cf6' },
]

const CHECKIN_WEEK = [
  { ora: '06:00', Lun: 8, Mar: 6, Mer: 9, Gio: 7, Ven: 10, Sab: 18, Dom: 4 },
  { ora: '07:00', Lun: 22, Mar: 18, Mer: 25, Gio: 20, Ven: 28, Sab: 40, Dom: 12 },
  { ora: '08:00', Lun: 35, Mar: 30, Mer: 38, Gio: 32, Ven: 42, Sab: 55, Dom: 20 },
  { ora: '09:00', Lun: 28, Mar: 24, Mer: 30, Gio: 26, Ven: 35, Sab: 48, Dom: 30 },
  { ora: '10:00', Lun: 18, Mar: 15, Mer: 20, Gio: 17, Ven: 22, Sab: 38, Dom: 35 },
  { ora: '12:00', Lun: 30, Mar: 28, Mer: 32, Gio: 29, Ven: 35, Sab: 15, Dom: 10 },
  { ora: '18:00', Lun: 58, Mar: 52, Mer: 61, Gio: 55, Ven: 70, Sab: 20, Dom: 8 },
  { ora: '19:00', Lun: 72, Mar: 68, Mer: 78, Gio: 71, Ven: 80, Sab: 12, Dom: 5 },
  { ora: '20:00', Lun: 45, Mar: 40, Mer: 48, Gio: 43, Ven: 50, Sab: 8, Dom: 3 },
  { ora: '21:00', Lun: 18, Mar: 16, Mer: 20, Gio: 17, Ven: 22, Sab: 4, Dom: 2 },
]

const CLASS_POPULARITY = [
  { nome: 'CrossFit', prenotazioni: 142, rating: 4.8, fill_rate: 92 },
  { nome: 'Spinning', prenotazioni: 128, rating: 4.7, fill_rate: 98 },
  { nome: 'Yoga', prenotazioni: 96, rating: 4.9, fill_rate: 78 },
  { nome: 'HIIT', prenotazioni: 88, rating: 4.6, fill_rate: 85 },
  { nome: 'Pilates', prenotazioni: 74, rating: 4.8, fill_rate: 70 },
  { nome: 'Boxe', prenotazioni: 62, rating: 4.5, fill_rate: 88 },
]

const WELLNESS_RADAR = [
  { metrica: 'Umore', value: 82 },
  { metrica: 'Motivazione', value: 76 },
  { metrica: 'Focus', value: 71 },
  { metrica: 'Energia', value: 68 },
  { metrica: 'Recupero', value: 74 },
  { metrica: 'Sonno', value: 79 },
]

const WELLNESS_TREND = [
  { m: 'Gen', wellness: 68, sleep: 72, recovery: 65 },
  { m: 'Feb', wellness: 70, sleep: 74, recovery: 68 },
  { m: 'Mar', wellness: 72, sleep: 75, recovery: 70 },
  { m: 'Apr', wellness: 73, sleep: 77, recovery: 72 },
  { m: 'Mag', wellness: 76, sleep: 78, recovery: 74 },
  { m: 'Giu', wellness: 78, sleep: 79, recovery: 74 },
]

const NPS_TREND = [
  { m: 'Gen', nps: 58 }, { m: 'Feb', nps: 61 }, { m: 'Mar', nps: 63 },
  { m: 'Apr', nps: 65 }, { m: 'Mag', nps: 69 }, { m: 'Giu', nps: 72 },
]

// ── Color helpers ─────────────────────────────────────────────────────────────

function retentionColor(v: number | undefined) {
  if (v === undefined) return 'bg-slate-100 text-slate-400'
  if (v >= 90) return 'bg-emerald-600 text-white'
  if (v >= 80) return 'bg-emerald-500 text-white'
  if (v >= 70) return 'bg-emerald-400 text-white'
  if (v >= 60) return 'bg-amber-400 text-white'
  if (v >= 50) return 'bg-amber-500 text-white'
  return 'bg-red-400 text-white'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, trend, up, sub, accent, big,
}: {
  icon: string; label: string; value: string; trend?: string; up?: boolean
  sub: string; accent: string; big?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-1 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${accent}`}>{icon}</span>
        {trend && (
          <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {up ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>
      <div className={`mt-2 font-black tracking-tight text-slate-900 ${big ? 'text-3xl' : 'text-2xl'}`}>{value}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  )
}

function SectionTitle({ children, sub }: { children: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{children}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, sub, children, action }: {
  title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const TABS = [
  { id: 'finanziario', label: '💰 Finanziario' },
  { id: 'soci', label: '👥 Soci & Retention' },
  { id: 'operativo', label: '⚙️ Operativo' },
  { id: 'wellness', label: '💚 Wellness' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KpiDashboard() {
  const [tab, setTab] = useState('finanziario')

  // Real API (fallback su demo se non risponde)
  useQuery({
    queryKey: ['kpi-advanced'],
    queryFn: () => api.get('/api/v1/kpi/advanced'),
    retry: false,
  })

  const arr = (7840 * 12).toLocaleString('it-IT')
  const arpu = Math.round(7840 / 124)
  const ltv = arpu * 18  // 18 mesi vita media
  const nrr = 108.4

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">KPI Avanzati</h1>
        <p className="text-sm text-slate-500">Analisi completa performance, retention, operatività e wellness — dati demo</p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ TAB FINANZIARIO ══════════════════ */}
      {tab === 'finanziario' && (
        <div className="space-y-5">

          {/* KPI row 1 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard icon="€" label="MRR" value="€7.840" trend="9.1%" up sub="vs mese scorso" accent="bg-brand-50" />
            <KpiCard icon="📅" label="ARR" value={`€${arr}`} trend="9.1%" up sub="proiezione annuale" accent="bg-violet-50" />
            <KpiCard icon="👤" label="ARPU" value={`€${arpu}`} trend="2.3%" up sub="avg revenue / socio" accent="bg-emerald-50" />
            <KpiCard icon="♾️" label="LTV" value={`€${ltv.toLocaleString()}`} trend="5.1%" up sub="vita media 18 mesi" accent="bg-teal-50" />
            <KpiCard icon="📊" label="NRR" value={`${nrr}%`} trend="3.2pt" up sub="net revenue retention" accent="bg-amber-50" />
            <KpiCard icon="⏱" label="Payback" value="4.2 mesi" trend="0.8m" up={false} sub="CAC / ARPU" accent="bg-rose-50" />
          </div>

          {/* MRR trend + MRR movement */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Andamento MRR (12 mesi)" sub="Revenue mensile ricorrente">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={MRR_12M} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `€${(v / 1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => [`€${v.toLocaleString('it-IT')}`, 'MRR']} />
                  <Area type="monotone" dataKey="mrr" stroke="#2563eb" strokeWidth={2.5}
                    fill="url(#gMrr)" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="MRR Movement" sub="Nuovo + Expansion − Contraction − Churn">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={MRR_12M.slice(-6)} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barGap={1}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="nuovi" name="Nuovo" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="expansion" name="Expansion" stackId="a" fill="#10b981" />
                  <Bar dataKey="contraction" name="Contraction" stackId="b" fill="#fbbf24" />
                  <Bar dataKey="churn" name="Churn" stackId="b" fill="#f87171" radius={[0, 0, 3, 3]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Revenue per piano */}
          <ChartCard title="Revenue per piano abbonamento" sub="Distribuzione fatturato mensile">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
              {PLAN_REVENUE.map(p => (
                <div key={p.piano} className="rounded-lg border border-slate-100 p-4 text-center">
                  <div className="text-lg font-black text-slate-800">€{p.rev.toLocaleString()}</div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: p.colore }}>{p.piano}</div>
                  <div className="text-xs text-slate-400 mt-1">{p.soci} soci · €{Math.round(p.rev / p.soci)}/cad</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={PLAN_REVENUE} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `€${v}`} />
                <YAxis type="category" dataKey="piano" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: number) => [`€${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="rev" radius={[0, 4, 4, 0]}>
                  {PLAN_REVENUE.map(p => <Cell key={p.piano} fill={p.colore} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ══════════════════ TAB SOCI & RETENTION ══════════════════ */}
      {tab === 'soci' && (
        <div className="space-y-5">

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard icon="👥" label="Soci attivi" value="124" trend="2pt" up sub="+18 in prova" accent="bg-brand-50" />
            <KpiCard icon="✨" label="Nuovi (mese)" value="29" trend="32%" up sub="vs mag +7" accent="bg-emerald-50" />
            <KpiCard icon="🚪" label="Cancellati" value="5" trend="2pt" up={false} sub="vs mag 3" accent="bg-rose-50" />
            <KpiCard icon="📈" label="Net new" value="+24" trend="forte" up sub="nuovi − cancellati" accent="bg-violet-50" />
            <KpiCard icon="📉" label="Churn rate" value="3.1%" trend="0.1pt" up sub="miglior mese ever" accent="bg-teal-50" />
            <KpiCard icon="⭐" label="NPS" value="72" trend="3pt" up sub="eccellente (> 70)" accent="bg-amber-50" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Crescita soci (12 mesi)" sub="Attivi, nuovi, cancellati">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={MEMBERS_TREND} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="attivi" name="Attivi" fill="url(#gAtt)" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Bar dataKey="nuovi" name="Nuovi" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cancellati" name="Cancellati" fill="#fca5a5" radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Churn rate vs benchmark settore" sub="% mensile — Oplyfit vs media palestre italiane">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={CHURN_TREND} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} domain={[0, 8]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v: number) => [`${v}%`]} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="churn" name="Oplyfit" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="settore" name="Settore IT" stroke="#e2e8f0" strokeWidth={2}
                    strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Cohort retention heatmap */}
          <ChartCard title="Cohort Retention — Heatmap" sub="% soci ancora attivi dopo N mesi dall'iscrizione">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-400 pb-3 pr-4 w-24">Coorte</th>
                    {['M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6'].map(h => (
                      <th key={h} className="text-center text-xs font-semibold text-slate-400 pb-3 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {COHORT_RETENTION.map(row => (
                    <tr key={row.coorte}>
                      <td className="text-xs font-medium text-slate-600 pr-4 py-1.5">{row.coorte}</td>
                      {[row.m1, row.m2, row.m3, row.m4, row.m5, row.m6].map((v, i) => (
                        <td key={i} className="px-2 py-1">
                          <div className={`rounded-lg px-2 py-2 text-center text-xs font-bold ${retentionColor(v)}`}>
                            {v !== undefined ? `${v}%` : '—'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-600 inline-block" />≥ 90%</div>
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-400 inline-block" />70–89%</div>
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400 inline-block" />50–69%</div>
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-400 inline-block" />&lt; 50%</div>
              </div>
            </div>
          </ChartCard>

          {/* NPS trend */}
          <ChartCard title="Evoluzione NPS (6 mesi)" sub="Net Promoter Score — target > 70 (eccellente)">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={NPS_TREND} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[50, 80]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: number) => [v, 'NPS']} />
                <Area type="monotone" dataKey="nps" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#gNps)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ══════════════════ TAB OPERATIVO ══════════════════ */}
      {tab === 'operativo' && (
        <div className="space-y-5">

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard icon="🏃" label="Presenze oggi" value="38" trend="12%" up sub="media: 34/giorno" accent="bg-brand-50" />
            <KpiCard icon="📅" label="Sessioni oggi" value="5" trend="0" up sub="2 CrossFit, 1 Yoga…" accent="bg-emerald-50" />
            <KpiCard icon="🔴" label="Live ora" value="1" sub="CrossFit Advanced" accent="bg-red-50" />
            <KpiCard icon="📈" label="Fill rate medio" value="85%" trend="3pt" up sub="posti occupati / tot" accent="bg-violet-50" />
            <KpiCard icon="⏱" label="Durata media" value="62 min" trend="2min" up sub="sessione per socio" accent="bg-amber-50" />
            <KpiCard icon="🏋️" label="Macchinari attivi" value="24/28" sub="4 in manutenzione" accent="bg-teal-50" />
          </div>

          {/* Heatmap presenze */}
          <ChartCard title="Heatmap presenze settimanale" sub="Numero di accessi per fascia oraria e giorno">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-slate-400 font-semibold pb-2 pr-3 w-14">Ora</th>
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                      <th key={d} className="text-center text-slate-400 font-semibold pb-2 px-1">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CHECKIN_WEEK.map(row => {
                    const vals = [row.Lun, row.Mar, row.Mer, row.Gio, row.Ven, row.Sab, row.Dom]
                    const max = Math.max(...vals)
                    return (
                      <tr key={row.ora}>
                        <td className="text-slate-500 pr-3 py-1 font-mono">{row.ora}</td>
                        {vals.map((v, i) => {
                          const intensity = max > 0 ? v / max : 0
                          const bg = intensity > 0.8 ? 'bg-brand-600 text-white' :
                            intensity > 0.6 ? 'bg-brand-400 text-white' :
                            intensity > 0.4 ? 'bg-brand-200 text-brand-800' :
                            intensity > 0.2 ? 'bg-brand-100 text-brand-700' :
                            'bg-slate-50 text-slate-400'
                          return (
                            <td key={i} className="px-1 py-1">
                              <div className={`rounded text-center py-1.5 px-1 font-semibold ${bg}`}>{v}</div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Classi più popolari */}
          <ChartCard title="Classi più popolari (mese)" sub="Prenotazioni totali, rating e fill rate">
            <div className="space-y-3">
              {CLASS_POPULARITY.map((c, i) => (
                <div key={c.nome} className="flex items-center gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-sm font-semibold text-slate-700">{c.nome}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>⭐ {c.rating}</span>
                        <span className={`font-semibold ${c.fill_rate >= 90 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {c.fill_rate}% fill
                        </span>
                        <span className="text-slate-400">{c.prenotazioni} pren.</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(c.prenotazioni / CLASS_POPULARITY[0].prenotazioni) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ══════════════════ TAB WELLNESS ══════════════════ */}
      {tab === 'wellness' && (
        <div className="space-y-5">

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard icon="💚" label="Wellness score" value="78/100" trend="2pt" up sub="media soci attivi" accent="bg-emerald-50" />
            <KpiCard icon="😊" label="Umore medio" value="4.1/5" trend="0.2" up sub="check-in mensili" accent="bg-amber-50" />
            <KpiCard icon="🔥" label="Motivazione" value="3.8/5" trend="0.1" up sub="vs mese scorso" accent="bg-rose-50" />
            <KpiCard icon="😴" label="Sonno (Oura)" value="7.4h" trend="0.2h" up sub="media soci con Oura" accent="bg-violet-50" />
            <KpiCard icon="⌚" label="Recovery (WHOOP)" value="72%" trend="4pt" up sub="avg score giornaliero" accent="bg-brand-50" />
            <KpiCard icon="🧠" label="Postura score" value="81/100" trend="3pt" up sub="analisi Azure CV" accent="bg-teal-50" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Radar benessere medio soci" sub="Punteggi normalizzati 0–100">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={WELLNESS_RADAR} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metrica" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Radar name="Soci" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Trend benessere (6 mesi)" sub="Wellness, sonno e recovery score medi">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={WELLNESS_TREND} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 85]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="wellness" name="Wellness" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="sleep" name="Sonno" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="recovery" name="Recovery" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Distribuzione score */}
          <ChartCard title="Distribuzione wellness score soci" sub="Quanti soci rientrano in ogni fascia (0–100)">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {[
                { range: '0–39', label: 'Critico', count: 4, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
                { range: '40–59', label: 'Da migliorare', count: 11, color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
                { range: '60–74', label: 'Nella media', count: 28, color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
                { range: '75–89', label: 'Buono', count: 56, color: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                { range: '90–100', label: 'Eccellente', count: 25, color: 'bg-emerald-600', text: 'text-emerald-800', bg: 'bg-emerald-50' },
              ].map(s => (
                <div key={s.range} className={`rounded-xl border border-slate-200 ${s.bg} p-4 text-center`}>
                  <div className="text-2xl font-black text-slate-800">{s.count}</div>
                  <div className={`text-xs font-bold mt-1 ${s.text}`}>{s.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.range}</div>
                  <div className={`mt-2 h-1.5 rounded-full ${s.color}`}
                    style={{ width: `${(s.count / 56) * 100}%`, minWidth: '20%' }} />
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
