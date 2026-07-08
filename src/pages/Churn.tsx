import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChurnRisk {
  memberId: string; fullName: string; email: string
  riskScore: number; riskLevel: string
  daysSinceLastActivity: number; currentStreak: number
  recommendedAction: string
  plan?: string; joinedMonths?: number; lastClass?: string
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_CHURN: ChurnRisk[] = [
  { memberId: 'm1',  fullName: 'Marco Bianchi',     email: 'marco.bianchi@email.it',     riskScore: 91, riskLevel: 'VeryHigh', daysSinceLastActivity: 62,  currentStreak: 0, recommendedAction: 'Chiamata diretta + offerta win-back 25%',        plan: 'Base Mensile',    joinedMonths: 14, lastClass: 'CrossFit' },
  { memberId: 'm2',  fullName: 'Alessia Romano',    email: 'alessia.romano@email.it',    riskScore: 87, riskLevel: 'VeryHigh', daysSinceLastActivity: 48,  currentStreak: 0, recommendedAction: 'Email personalizzata + 1 PT session omaggio',    plan: 'Premium Mensile', joinedMonths: 8,  lastClass: 'Yoga Flow' },
  { memberId: 'm3',  fullName: 'Davide Mancini',    email: 'davide.mancini@email.it',    riskScore: 83, riskLevel: 'VeryHigh', daysSinceLastActivity: 55,  currentStreak: 0, recommendedAction: 'Offerta congelamento abbonamento',               plan: 'Annuale Top',     joinedMonths: 22, lastClass: 'HIIT Power' },
  { memberId: 'm4',  fullName: 'Irene Costa',       email: 'irene.costa@email.it',       riskScore: 79, riskLevel: 'High',     daysSinceLastActivity: 38,  currentStreak: 0, recommendedAction: 'Notifica push + sconto rinnovo 15%',             plan: 'Base Mensile',    joinedMonths: 5,  lastClass: 'Pilates' },
  { memberId: 'm5',  fullName: 'Francesco Vitale',  email: 'f.vitale@email.it',          riskScore: 74, riskLevel: 'High',     daysSinceLastActivity: 31,  currentStreak: 1, recommendedAction: 'Invito classe gratuita del giovedì',             plan: 'Student',         joinedMonths: 3,  lastClass: 'Spinning' },
  { memberId: 'm6',  fullName: 'Elena Russo',       email: 'elena.russo@email.it',       riskScore: 71, riskLevel: 'High',     daysSinceLastActivity: 29,  currentStreak: 2, recommendedAction: 'Email con programma personalizzato',            plan: 'Premium Mensile', joinedMonths: 11, lastClass: 'Zumba' },
  { memberId: 'm7',  fullName: 'Simone Rizzo',      email: 'simone.rizzo@email.it',      riskScore: 68, riskLevel: 'High',     daysSinceLastActivity: 26,  currentStreak: 0, recommendedAction: 'Offerta upgrade a Trimestrale con sconto 10%',   plan: 'Base Mensile',    joinedMonths: 7,  lastClass: 'Boxe Fit' },
  { memberId: 'm8',  fullName: 'Chiara Lombardi',   email: 'chiara.lombardi@email.it',   riskScore: 55, riskLevel: 'Medium',   daysSinceLastActivity: 21,  currentStreak: 3, recommendedAction: 'Messaggio di incoraggiamento + challenge settimanale', plan: 'Annuale Top', joinedMonths: 18, lastClass: 'Functional TRX' },
  { memberId: 'm9',  fullName: 'Luigi Moretti',     email: 'luigi.moretti@email.it',     riskScore: 51, riskLevel: 'Medium',   daysSinceLastActivity: 18,  currentStreak: 2, recommendedAction: 'Ricorda le classi nuove in programma',           plan: 'Premium Mensile', joinedMonths: 9,  lastClass: 'CrossFit' },
  { memberId: 'm10', fullName: 'Valentina Greco',   email: 'valentina.greco@email.it',   riskScore: 48, riskLevel: 'Medium',   daysSinceLastActivity: 15,  currentStreak: 4, recommendedAction: 'Invito a sessione di orientamento nutrizionale',  plan: 'Trimestrale',     joinedMonths: 6,  lastClass: 'Yoga Flow' },
  { memberId: 'm11', fullName: 'Roberto Martini',   email: 'roberto.martini@email.it',   riskScore: 44, riskLevel: 'Medium',   daysSinceLastActivity: 13,  currentStreak: 5, recommendedAction: 'Proposta personal training introduttivo',        plan: 'Base Mensile',    joinedMonths: 4,  lastClass: 'Spinning' },
  { memberId: 'm12', fullName: 'Anna Santoro',      email: 'anna.santoro@email.it',      riskScore: 32, riskLevel: 'Low',      daysSinceLastActivity: 10,  currentStreak: 6, recommendedAction: 'Nessuna azione urgente — monitoraggio standard', plan: 'Premium Mensile', joinedMonths: 26, lastClass: 'Pilates' },
  { memberId: 'm13', fullName: 'Fabio De Luca',     email: 'fabio.deluca@email.it',      riskScore: 28, riskLevel: 'Low',      daysSinceLastActivity: 8,   currentStreak: 8, recommendedAction: 'Badge fedeltà — 25 presenze consecutive',        plan: 'Annuale Top',     joinedMonths: 31, lastClass: 'HIIT Power' },
  { memberId: 'm14', fullName: 'Matteo Ferrari',    email: 'matteo.ferrari@email.it',    riskScore: 21, riskLevel: 'Low',      daysSinceLastActivity: 5,   currentStreak: 11, recommendedAction: 'Programma ambassador — referral attivo',         plan: 'Premium Mensile', joinedMonths: 20, lastClass: 'CrossFit' },
  { memberId: 'm15', fullName: 'Giulia Ferretti',   email: 'giulia.ferretti@email.it',   riskScore: 12, riskLevel: 'Low',      daysSinceLastActivity: 3,   currentStreak: 15, recommendedAction: 'Mantieni engagement — ottima fidelizzazione',    plan: 'Annuale Top',     joinedMonths: 36, lastClass: 'Yoga Flow' },
]

const TREND_CHURN = [
  { mese: 'Lug \'25', tasso: 4.2, aRischio: 18, recuperati: 6 },
  { mese: 'Ago \'25', tasso: 5.1, aRischio: 22, recuperati: 7 },
  { mese: 'Set \'25', tasso: 3.8, aRischio: 16, recuperati: 9 },
  { mese: 'Ott \'25', tasso: 3.2, aRischio: 14, recuperati: 8 },
  { mese: 'Nov \'25', tasso: 4.6, aRischio: 19, recuperati: 5 },
  { mese: 'Dic \'25', tasso: 6.1, aRischio: 26, recuperati: 4 },
  { mese: 'Gen \'26', tasso: 5.4, aRischio: 23, recuperati: 8 },
  { mese: 'Feb \'26', tasso: 4.8, aRischio: 20, recuperati: 9 },
  { mese: 'Mar \'26', tasso: 3.9, aRischio: 17, recuperati: 11 },
  { mese: 'Apr \'26', tasso: 3.5, aRischio: 15, recuperati: 10 },
  { mese: 'Mag \'26', tasso: 3.1, aRischio: 13, recuperati: 8 },
  { mese: 'Giu \'26', tasso: 3.3, aRischio: 15, recuperati: 7 },
]

const ACTION_LOG = [
  { date: '2026-06-22', member: 'Marco Bianchi',    action: 'Email win-back inviata',          result: 'Aperta — nessuna risposta',   icon: '📧' },
  { date: '2026-06-21', member: 'Alessia Romano',   action: 'Notifica push "Ci manchi"',       result: 'Cliccata — rinnovo effettuato ✓', icon: '📲' },
  { date: '2026-06-20', member: 'Luigi Moretti',    action: 'Chiamata del front desk',         result: 'Risposto — tornerà la prossima settimana', icon: '📞' },
  { date: '2026-06-18', member: 'Irene Costa',      action: 'Offerta congelamento abbonamento', result: 'Accettata — congelato 30 gg', icon: '🧊' },
  { date: '2026-06-17', member: 'Simone Rizzo',     action: 'Email classe gratuita',           result: 'Aperta — prenotato giovedì',   icon: '📧' },
  { date: '2026-06-15', member: 'Davide Mancini',   action: 'Notifica push sconto 15%',        result: 'Non cliccata',                icon: '📲' },
  { date: '2026-06-14', member: 'Francesco Vitale', action: 'Email reminder PT session',       result: 'Aperta — confermato appuntamento ✓', icon: '📧' },
]

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVEL_ORDER = ['VeryHigh', 'High', 'Medium', 'Low'] as const
type Level = typeof LEVEL_ORDER[number]

const LEVEL_META: Record<Level, { label: string; bg: string; text: string; border: string; icon: string }> = {
  VeryHigh: { label: 'Critico', bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    icon: '🚨' },
  High:     { label: 'Alto',    bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', icon: '⚠️' },
  Medium:   { label: 'Medio',   bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' },
  Low:      { label: 'Basso',   bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  icon: '✅' },
}

// ── Sub-components ────────────────────────────────────────────────────────────
function RiskGauge({ score, level }: { score: number; level: string }) {
  const color = level === 'VeryHigh' ? '#ef4444' : level === 'High' ? '#f97316' : level === 'Medium' ? '#eab308' : '#22c55e'
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 94.2} 94.2`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color }}>{score}</span>
    </div>
  )
}

function ContactModal({ member, onClose, onSent }: { member: ChurnRisk; onClose: () => void; onSent: (id: string) => void }) {
  const meta = LEVEL_META[member.riskLevel as Level] ?? LEVEL_META.Medium
  const [title, setTitle] = useState('Ci manchi! 💪')
  const [body, setBody]   = useState(member.recommendedAction)
  const send = useMutation({
    mutationFn: () => api.post('/api/v1/notifications/broadcast', { title, body }),
    onSuccess: () => { onSent(member.memberId); onClose() },
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.bg} text-xl`}>{meta.icon}</div>
          <div>
            <p className="font-bold text-slate-900">{member.fullName}</p>
            <p className="text-xs text-slate-400">{member.email} · {member.daysSinceLastActivity} gg inattivo · {member.plan}</p>
          </div>
        </div>
        <div className={`mb-4 rounded-lg ${meta.bg} ${meta.border} border px-4 py-2.5 text-xs ${meta.text} font-medium`}>
          {meta.icon} Rischio {meta.label} — {member.recommendedAction}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Titolo notifica push</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Messaggio</label>
            <textarea rows={3} value={body} onChange={e => setBody(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => send.mutate()} disabled={send.isPending || !title || !body}
            className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {send.isPending ? 'Invio…' : '📨 Invia notifica push'}
          </button>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">Broadcast a tutti i dispositivi registrati del socio.</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Churn() {
  const [tab, setTab]             = useState<'rischio' | 'trend' | 'storico'>('rischio')
  const [minRisk, setMinRisk]     = useState(0)
  const [levelFilter, setLevelFilter] = useState('all')
  const [handled, setHandled]     = useState<Set<string>>(new Set())
  const [contactingMember, setContactingMember] = useState<ChurnRisk | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['churn', minRisk],
    queryFn:  () => api.get<ChurnRisk[]>(`/api/v1/churn/report?minRiskScore=${minRisk}`),
    retry: false,
  })

  const all: ChurnRisk[] = useMemo(() => {
    const remote = data?.data ?? []
    return remote.length > 0 ? remote : DEMO_CHURN
  }, [data])

  const filtered = useMemo(() => all.filter(m =>
    m.riskScore >= minRisk &&
    (levelFilter === 'all' || m.riskLevel === levelFilter) &&
    !handled.has(m.memberId)
  ), [all, minRisk, levelFilter, handled])

  const byLevel = {
    VeryHigh: all.filter(m => m.riskLevel === 'VeryHigh').length,
    High:     all.filter(m => m.riskLevel === 'High').length,
    Medium:   all.filter(m => m.riskLevel === 'Medium').length,
    Low:      all.filter(m => m.riskLevel === 'Low').length,
  }
  const avgRisk = all.length ? Math.round(all.reduce((s, m) => s + m.riskScore, 0) / all.length) : 0
  const critici  = filtered.filter(m => m.riskLevel === 'VeryHigh' || m.riskLevel === 'High')
  const restanti = filtered.filter(m => m.riskLevel === 'Medium'   || m.riskLevel === 'Low')

  function markHandled(id: string) { setHandled(prev => new Set([...prev, id])) }

  const avgChurn = (TREND_CHURN.reduce((a,t) => a + t.tasso, 0) / TREND_CHURN.length).toFixed(1)
  const lastChurn = TREND_CHURN[TREND_CHURN.length - 1]
  const recovered = TREND_CHURN.reduce((a,t) => a + t.recuperati, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Churn Predictor</h1>
          <p className="mt-0.5 text-sm text-slate-500">Analisi rischio abbandono · score basato su attività, frequenza e storico</p>
        </div>
        {handled.size > 0 && (
          <button onClick={() => setHandled(new Set())} className="text-xs text-slate-400 hover:text-slate-600 underline">
            Ripristina {handled.size} gestiti
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
          <div className={`text-2xl font-black ${avgRisk >= 60 ? 'text-red-600' : avgRisk >= 30 ? 'text-orange-500' : 'text-emerald-600'}`}>{avgRisk}</div>
          <div className="text-xs text-slate-400 mt-0.5">Score medio</div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${avgRisk}%`, backgroundColor: avgRisk >= 60 ? '#ef4444' : avgRisk >= 30 ? '#f97316' : '#22c55e' }} />
          </div>
        </div>
        {(['VeryHigh', 'High', 'Medium', 'Low'] as Level[]).map(lvl => {
          const m = LEVEL_META[lvl]
          return (
            <div key={lvl} onClick={() => setLevelFilter(levelFilter === lvl ? 'all' : lvl)}
              className={`rounded-xl border cursor-pointer transition-all hover:opacity-90 ${m.border} ${m.bg} px-4 py-3 text-center ${levelFilter === lvl ? 'ring-2 ring-brand-400 ring-offset-1' : ''}`}>
              <div className={`text-xs font-medium ${m.text}`}>{m.icon} {m.label}</div>
              <div className={`text-3xl font-black mt-0.5 ${m.text}`}>{byLevel[lvl]}</div>
            </div>
          )
        })}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
          <div className="text-2xl font-black text-emerald-600">{recovered}</div>
          <div className="text-xs text-slate-400 mt-0.5">Recuperati<br />12 mesi</div>
        </div>
      </div>

      {/* Retention funnel */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Funnel retention — mese corrente</p>
        <div className="flex items-center gap-0">
          {[
            { label: 'Soci attivi',  value: 120, color: 'bg-slate-200 text-slate-700' },
            { label: 'A rischio',    value: all.filter(m => m.riskLevel !== 'Low').length, color: 'bg-amber-100 text-amber-700' },
            { label: 'Contattati',   value: handled.size + 7, color: 'bg-blue-100 text-blue-700' },
            { label: 'Recuperati',   value: lastChurn.recuperati, color: 'bg-emerald-100 text-emerald-700' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center flex-1 min-w-0">
              <div className={`flex-1 rounded-xl ${step.color} p-3 text-center`}>
                <p className="text-xl font-bold">{step.value}</p>
                <p className="text-xs font-medium">{step.label}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="w-6 text-center text-slate-300 text-lg flex-shrink-0">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          ['rischio', '🎯 Rischio attuale'],
          ['trend',   '📈 Trend storico'],
          ['storico', '📋 Storico azioni'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === key
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB RISCHIO ATTUALE ── */}
      {tab === 'rischio' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {[['all','Tutti'],['VeryHigh','🚨 Critici'],['High','⚠️ Alti'],['Medium','⏳ Medi'],['Low','✅ Bassi']].map(([v,l]) => (
                <button key={v} onClick={() => setLevelFilter(v)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${levelFilter === v ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Score min:</label>
              <input type="range" min={0} max={80} step={10} value={minRisk}
                onChange={e => setMinRisk(+e.target.value)} className="w-24" />
              <span className="text-xs font-semibold text-slate-700 w-5">{minRisk}</span>
            </div>
            {handled.size > 0 && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{handled.size} nascosti</span>
            )}
          </div>

          {isLoading && <p className="py-12 text-center text-sm text-slate-400">Calcolo rischio in corso…</p>}

          {!isLoading && (
            <>
              {/* Cards critici/alti */}
              {critici.length > 0 && (
                <div>
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">🚨 Critici & Alti — intervento urgente ({critici.length})</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {critici.map(m => {
                      const meta = LEVEL_META[m.riskLevel as Level]
                      return (
                        <div key={m.memberId} className={`rounded-xl border-2 ${meta.border} ${meta.bg} p-4 flex flex-col gap-3`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow text-xs font-black text-slate-700">
                                {m.fullName.split(' ').map(w=>w[0]).join('').slice(0,2)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm leading-tight">{m.fullName}</p>
                                <p className="text-xs text-slate-400">{m.plan} · {m.joinedMonths}m</p>
                              </div>
                            </div>
                            <RiskGauge score={m.riskScore} level={m.riskLevel} />
                          </div>
                          <div className="flex gap-3 text-xs text-slate-500">
                            <span className={`font-semibold ${meta.text}`}>{meta.icon} {meta.label}</span>
                            <span>· {m.daysSinceLastActivity}gg inattivo</span>
                            {m.currentStreak > 0 && <span className="text-orange-500">🔥 {m.currentStreak}</span>}
                          </div>
                          {m.lastClass && <p className="text-xs text-slate-400">Ultima classe: <span className="font-medium text-slate-600">{m.lastClass}</span></p>}
                          <div className="rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600 italic">"{m.recommendedAction}"</div>
                          <div className="flex gap-2">
                            <button onClick={() => setContactingMember(m)}
                              className="flex-1 rounded-lg bg-white border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                              📨 Notifica
                            </button>
                            <button onClick={() => markHandled(m.memberId)}
                              className="flex-1 rounded-lg bg-white border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                              ✅ Gestito
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tabella medi/bassi */}
              {restanti.length > 0 && (
                <div>
                  {critici.length > 0 && <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">⏳ Medi & Bassi ({restanti.length})</h2>}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {['Membro','Piano','Score','Livello','Inattivo','Streak','Azione consigliata',''].map(h => (
                            <th key={h} className="px-4 py-3 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {restanti.map(m => {
                          const meta = LEVEL_META[m.riskLevel as Level] ?? LEVEL_META.Low
                          return (
                            <tr key={m.memberId} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-800">{m.fullName}</p>
                                <p className="text-xs text-slate-400">{m.email}</p>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">{m.plan}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${m.riskScore}%`, backgroundColor: m.riskScore >= 60 ? '#ef4444' : m.riskScore >= 30 ? '#f97316' : '#22c55e' }} />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600">{m.riskScore}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.text}`}>
                                  {meta.icon} {meta.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">{m.daysSinceLastActivity} gg</td>
                              <td className="px-4 py-3 text-xs">{m.currentStreak > 0 ? `🔥 ${m.currentStreak}` : '—'}</td>
                              <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">{m.recommendedAction}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  <button onClick={() => setContactingMember(m)} title="Invia notifica"
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-100 transition">📨</button>
                                  <button onClick={() => markHandled(m.memberId)} title="Gestito"
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-100 transition">✅</button>
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

              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                  <p className="text-3xl">🎉</p>
                  <p className="mt-2 font-semibold text-slate-700">
                    {handled.size > 0 ? 'Tutti i soci a rischio sono stati gestiti!' : 'Nessun socio a rischio con questi filtri.'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {handled.size > 0 ? `${handled.size} gestiti — clicca "Ripristina" per vederli.` : 'Abbassa lo score minimo o cambia filtro.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB TREND ── */}
      {tab === 'trend' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Churn medio 12m', value: `${avgChurn}%`, color: 'text-amber-600' },
              { label: 'Churn attuale',   value: `${lastChurn.tasso}%`, color: lastChurn.tasso < +avgChurn ? 'text-emerald-600' : 'text-red-600' },
              { label: 'Soci recuperati', value: String(recovered), color: 'text-violet-600' },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-500 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Tasso churn mensile (%) — ultimi 12 mesi</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={TREND_CHURN} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="churnFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mese" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 8]} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Churn']} />
                <Area type="monotone" dataKey="tasso" name="Churn %" stroke="#ef4444" fill="url(#churnFill)" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Soci a rischio vs recuperati per mese</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={TREND_CHURN} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mese" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="aRischio"   name="A rischio"   fill="#f97316" radius={[3,3,0,0]} />
                <Bar dataKey="recuperati" name="Recuperati"  fill="#10b981" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Analisi per piano */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Distribuzione rischio per piano</p>
            <div className="space-y-2.5">
              {[
                { plan: 'Base Mensile',    aRischio: 4, totale: 35 },
                { plan: 'Premium Mensile', aRischio: 3, totale: 48 },
                { plan: 'Annuale Top',     aRischio: 2, totale: 18 },
                { plan: 'Trimestrale',     aRischio: 1, totale: 11 },
                { plan: 'Student',         aRischio: 2, totale: 8  },
              ].map(r => {
                const riskPct = Math.round(r.aRischio / r.totale * 100)
                return (
                  <div key={r.plan} className="flex items-center gap-3">
                    <span className="w-32 text-xs text-slate-500 flex-shrink-0">{r.plan}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${riskPct}%` }} />
                    </div>
                    <span className="w-24 text-right text-xs text-slate-500">{r.aRischio}/{r.totale} ({riskPct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB STORICO AZIONI ── */}
      {tab === 'storico' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Ultime azioni di retention eseguite — aggiornate manualmente o via automazioni.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Membro</th>
                  <th className="px-4 py-3 text-left">Azione</th>
                  <th className="px-4 py-3 text-left">Risultato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ACTION_LOG.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.member}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span>{a.icon}</span>{a.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{a.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-400">
            Le azioni future verranno registrate automaticamente quando invii notifiche o email dal pannello rischio.
          </div>
        </div>
      )}

      {contactingMember && (
        <ContactModal member={contactingMember} onClose={() => setContactingMember(null)} onSent={markHandled} />
      )}
    </div>
  )
}
