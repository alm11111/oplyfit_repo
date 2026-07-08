import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'

// ── Demo / fallback data ──────────────────────────────────────────────────────

const DEMO_MRR_12M = [
  { m: 'Lug', mrr: 3200, target: 3500 },
  { m: 'Ago', mrr: 3850, target: 4000 },
  { m: 'Set', mrr: 4100, target: 4200 },
  { m: 'Ott', mrr: 4480, target: 4500 },
  { m: 'Nov', mrr: 4920, target: 5000 },
  { m: 'Dic', mrr: 5260, target: 5200 },
  { m: 'Gen', mrr: 5640, target: 5500 },
  { m: 'Feb', mrr: 6150, target: 6000 },
  { m: 'Mar', mrr: 6430, target: 6400 },
  { m: 'Apr', mrr: 6810, target: 6800 },
  { m: 'Mag', mrr: 7220, target: 7000 },
  { m: 'Giu', mrr: 7840, target: 7500 },
]

const DEMO_MEMBERS_6M = [
  { m: 'Gen', nuovi: 12, cancellati: 3 },
  { m: 'Feb', nuovi: 18, cancellati: 5 },
  { m: 'Mar', nuovi: 24, cancellati: 4 },
  { m: 'Apr', nuovi: 16, cancellati: 6 },
  { m: 'Mag', nuovi: 22, cancellati: 3 },
  { m: 'Giu', nuovi: 29, cancellati: 5 },
]

const DEMO_ATTENDANCE_7D = [
  { d: 'Lun', presenze: 42 },
  { d: 'Mar', presenze: 58 },
  { d: 'Mer', presenze: 71 },
  { d: 'Gio', presenze: 65 },
  { d: 'Ven', presenze: 80 },
  { d: 'Sab', presenze: 93 },
  { d: 'Dom', presenze: 45 },
]

const DEMO_SUB = [
  { name: 'Attivi', value: 124, color: '#10b981' },
  { name: 'In prova', value: 18, color: '#6366f1' },
  { name: 'In pausa', value: 14, color: '#f59e0b' },
  { name: 'Disdetti', value: 8, color: '#94a3b8' },
]

const DEMO_ACTIVITY = [
  { time: '09:14', event: 'Nuovo socio iscritto', detail: 'Marco Bellini — Piano Gold', icon: '👤', bg: 'bg-emerald-50', fg: 'text-emerald-700' },
  { time: '09:02', event: 'Prenotazione confermata', detail: 'Yoga Mattutino — 10 posti rimasti', icon: '📅', bg: 'bg-brand-50', fg: 'text-brand-700' },
  { time: '08:47', event: 'Pagamento ricevuto', detail: '€149 — Abbonamento annuale', icon: '💳', bg: 'bg-violet-50', fg: 'text-violet-700' },
  { time: '08:31', event: 'Check-in biometrico', detail: 'Sala Pesi — 7 presenti', icon: '🖐', bg: 'bg-amber-50', fg: 'text-amber-700' },
  { time: '08:15', event: 'Sessione live avviata', detail: 'CrossFit Advanced — Trainer: Luca R.', icon: '🔴', bg: 'bg-red-50', fg: 'text-red-700' },
]

const DEMO_SESSIONS_TODAY = [
  { time: '08:00', name: 'CrossFit Advanced', trainer: 'Luca R.', booked: 12, capacity: 15, status: 'live' },
  { time: '10:30', name: 'Yoga Mattutino', trainer: 'Sara M.', booked: 9, capacity: 10, status: 'upcoming' },
  { time: '12:00', name: 'HIIT Express', trainer: 'Marco T.', booked: 14, capacity: 20, status: 'upcoming' },
  { time: '18:00', name: 'Pilates Pro', trainer: 'Elena V.', booked: 6, capacity: 12, status: 'upcoming' },
  { time: '19:30', name: 'Spinning', trainer: 'Gianni B.', booked: 20, capacity: 20, status: 'upcoming' },
]

const DEMO_RENEWALS = [
  { id: '1', name: 'Marco Bellini', plan: 'Gold Annual', expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(), daysLeft: 2 },
  { id: '2', name: 'Giulia Ferrara', plan: 'Standard Mensile', expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(), daysLeft: 5 },
  { id: '3', name: 'Luca Moretti',   plan: 'Pro Trimestrale', expiresAt: new Date(Date.now() + 9 * 86400000).toISOString(), daysLeft: 9 },
  { id: '4', name: 'Sara Conti',     plan: 'Standard Mensile', expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(), daysLeft: 14 },
  { id: '5', name: 'Davide Ricci',   plan: 'Gold Annual',     expiresAt: new Date(Date.now() + 21 * 86400000).toISOString(), daysLeft: 21 },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberRow { id: string; createdAtUtc: string }
interface TreasuryDto {
  mrr: number; currency: string
  activeCount: number; trialingCount: number
  pausedCount: number; cancelledCount: number
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, trend, up, hint, accent,
}: {
  icon: string; label: string; value: string; trend: string; up: boolean; hint: string; accent: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-1 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${accent}`}>{icon}</span>
        <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {up ? '▲' : '▼'} {trend}
        </span>
      </div>
      <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{value}</div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="text-xs text-slate-400">{hint}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{children}</h2>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Overview() {
  const claims = useAuth((s) => s.claims)
  const [mrrPeriod, setMrrPeriod] = useState<'6m' | '12m'>('12m')

  const membersQ = useQuery({
    queryKey: ['overview-members'],
    queryFn: () => api.get<MemberRow[]>('/api/v1/members?pageSize=500'),
    retry: false,
  })
  const plansQ = useQuery({
    queryKey: ['kpi-plans'],
    queryFn: () => api.get<unknown[]>('/api/v1/plans'),
    retry: false,
  })
  const staffQ = useQuery({
    queryKey: ['kpi-staff'],
    queryFn: () => api.get<unknown[]>('/api/v1/staff'),
    retry: false,
  })
  const treasuryQ = useQuery({
    queryKey: ['treasury'],
    queryFn: () => api.get<TreasuryDto>('/api/v1/treasury'),
    retry: false,
  })

  const t = treasuryQ.data?.data
  const totalMembers = membersQ.data?.meta?.totalCount ?? membersQ.data?.data?.length
  const totalPlans = plansQ.data?.data?.length
  const totalStaff = staffQ.data?.data?.length

  // live data se disponibile, altrimenti stub
  const mrrValue = t ? `€${t.mrr.toFixed(0)}` : '€7.840'
  const membersValue = totalMembers != null ? String(totalMembers) : '124'
  const plansValue = totalPlans != null ? String(totalPlans) : '6'
  const staffValue = totalStaff != null ? String(totalStaff) : '9'

  const subData = t
    ? [
        { name: 'Attivi', value: t.activeCount, color: '#10b981' },
        { name: 'In prova', value: t.trialingCount, color: '#6366f1' },
        { name: 'In pausa', value: t.pausedCount, color: '#f59e0b' },
        { name: 'Disdetti', value: t.cancelledCount, color: '#94a3b8' },
      ].filter((d) => d.value > 0)
    : DEMO_SUB

  const mrrData = mrrPeriod === '6m' ? DEMO_MRR_12M.slice(6) : DEMO_MRR_12M

  const now = new Date()
  const dateStr = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Panoramica</h1>
          <p className="text-sm text-slate-500 capitalize">{dateStr}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/members/new" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
            + Socio
          </Link>
          <Link to="/classes" className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 shadow-sm">
            + Sessione
          </Link>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon="👥" label="Soci attivi" value={membersValue} trend="8%" up hint="18 in prova" accent="bg-brand-50" />
        <KpiCard icon="€" label="MRR" value={mrrValue} trend="9.1%" up hint="vs mese scorso" accent="bg-emerald-50" />
        <KpiCard icon="🏃" label="Presenze oggi" value="38" trend="12%" up hint="media: 34/giorno" accent="bg-violet-50" />
        <KpiCard icon="✨" label="Nuovi (mese)" value="29" trend="32%" up hint="vs maggio" accent="bg-amber-50" />
        <KpiCard icon="📉" label="Churn rate" value="3.2%" trend="0.8%" up={false} hint="target: < 5%" accent="bg-rose-50" />
        <KpiCard icon="⭐" label="NPS Score" value="72" trend="5 pt" up hint="eccellente > 70" accent="bg-teal-50" />
      </div>

      {/* ── MRR Area chart + Donut ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Area MRR — 2/3 */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <SectionTitle>Andamento MRR</SectionTitle>
              <div className="mt-0.5 text-xs text-slate-400">Revenue mensile ricorrente + obiettivo</div>
            </div>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              {(['6m', '12m'] as const).map(p => (
                <button key={p} onClick={() => setMrrPeriod(p)}
                  className={`px-3 py-1.5 font-medium transition ${mrrPeriod === p ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(v: number, name: string) => [`€${v.toLocaleString('it-IT')}`, name === 'mrr' ? 'MRR' : 'Target']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#2563eb" strokeWidth={2.5}
                fill="url(#mrrGrad)" dot={false} activeDot={{ r: 5, fill: '#2563eb' }} />
              <Line type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={1.5}
                strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut abbonamenti — 1/3 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 min-w-0">
          <SectionTitle>Abbonamenti</SectionTitle>
          <div className="mt-0.5 mb-2 text-xs text-slate-400">Distribuzione per stato</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={subData} cx="50%" cy="50%"
                innerRadius={48} outerRadius={72}
                paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {subData.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v: number, name: string) => [v, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {subData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bar nuovi soci + Line presenze + Activity ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Bar: nuovi vs cancellati */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 min-w-0">
          <SectionTitle>Nuovi vs Cancellati</SectionTitle>
          <div className="mt-0.5 mb-3 text-xs text-slate-400">Ultimi 6 mesi</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DEMO_MEMBERS_6M} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="nuovi" name="Nuovi" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cancellati" name="Cancellati" fill="#fca5a5" radius={[3, 3, 0, 0]} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line: presenze settimanali */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 min-w-0">
          <SectionTitle>Presenze settimanali</SectionTitle>
          <div className="mt-0.5 mb-3 text-xs text-slate-400">Accessi biometrici questa settimana</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={DEMO_ATTENDANCE_7D} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v: number) => [v, 'Presenze']} />
              <Line type="monotone" dataKey="presenze" stroke="#8b5cf6" strokeWidth={2.5}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Attività recente</SectionTitle>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="space-y-2.5">
            {DEMO_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${a.bg}`}>
                  {a.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${a.fg}`}>{a.event}</div>
                  <div className="text-xs text-slate-500 truncate">{a.detail}</div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sessioni oggi + Moduli ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* Sessioni oggi — 3/5 */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <SectionTitle>Sessioni di oggi</SectionTitle>
            <Link to="/classes" className="text-xs font-medium text-brand-600 hover:text-brand-700">Gestisci →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {DEMO_SESSIONS_TODAY.map((s, i) => {
              const pct = Math.round((s.booked / s.capacity) * 100)
              const full = pct >= 100
              return (
                <div key={i} className="flex items-center gap-3 px-3 sm:px-5 py-3">
                  <div className="shrink-0 text-right w-10 sm:w-12">
                    <div className="text-sm font-bold text-slate-700">{s.time}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 truncate">{s.name}</span>
                      {s.status === 'live' && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{s.trainer}</div>
                  </div>
                  <div className="shrink-0 w-24 hidden sm:block">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{s.booked}/{s.capacity}</span>
                      <span className={full ? 'font-semibold text-rose-600' : 'text-slate-400'}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${full ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-brand-500'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 sm:hidden">{s.booked}/{s.capacity}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rinnovi imminenti — 2/5 */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <SectionTitle>Rinnovi imminenti</SectionTitle>
              <p className="text-xs text-slate-400 mt-0.5">Abbonamenti in scadenza entro 30 giorni</p>
            </div>
            <Link to="/members" className="text-xs font-medium text-brand-600 hover:text-brand-700 shrink-0">Tutti →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {DEMO_RENEWALS.map((r) => {
              const urgent = r.daysLeft <= 5
              const soon   = r.daysLeft <= 14
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${urgent ? 'bg-rose-100 text-rose-700' : soon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {r.daysLeft}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                    <p className="text-xs text-slate-400 truncate">{r.plan}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${urgent ? 'bg-rose-100 text-rose-700' : soon ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {urgent ? '⚠ urgente' : soon ? 'presto' : `${r.daysLeft}g`}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-400">
              💡 Contatta i soci con scadenza entro 7 giorni per ridurre il churn.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
