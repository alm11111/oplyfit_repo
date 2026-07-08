import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
interface MindsetTrendDto { avgMood: number; avgStress: number; avgMotivation: number; avgFocus: number; avgWellness: number; totalEntries: number }
interface MemberDto { id: string; firstName: string; lastName: string; email: string }

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_TREND: MindsetTrendDto = { avgMood: 3.8, avgStress: 2.4, avgMotivation: 4.1, avgFocus: 3.7, avgWellness: 74, totalEntries: 312 }

const seed = (day: number, base: number, amp: number) => +(Math.min(5, Math.max(1, base + Math.sin(day * 0.7) * amp + (day % 3 === 0 ? 0.3 : -0.1))).toFixed(1))
const DEMO_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-06-24'); d.setDate(d.getDate() - (29 - i))
  const mood = seed(i, 3.8, 0.6); const stress = seed(i, 2.4, 0.8); const mot = seed(i, 4.1, 0.5); const focus = seed(i, 3.7, 0.7)
  const wellness = Math.round(((mood + (6 - stress) + mot + focus) / 4) * 20)
  return { day: `${d.getDate()}/${d.getMonth() + 1}`, mood, stress, motivazione: mot, focus, wellness }
})

const DEMO_MEMBERS: MemberDto[] = [
  { id: 'dm1', firstName: 'Giulia', lastName: 'Ferretti', email: 'giulia@demo.it' },
  { id: 'dm2', firstName: 'Marco', lastName: 'Bianchi', email: 'marco@demo.it' },
  { id: 'dm3', firstName: 'Alessia', lastName: 'Romano', email: 'alessia@demo.it' },
  { id: 'dm4', firstName: 'Roberto', lastName: 'Martini', email: 'roberto@demo.it' },
]
const DEMO_MEMBER_STATS: Record<string, { avgMood: number; avgStress: number; avgMotivation: number; avgFocus: number; streak: number; lastCheckin: string }> = {
  dm1: { avgMood: 4.2, avgStress: 2.0, avgMotivation: 4.5, avgFocus: 4.1, streak: 18, lastCheckin: '2026-06-24' },
  dm2: { avgMood: 3.9, avgStress: 2.6, avgMotivation: 4.3, avgFocus: 4.0, streak: 12, lastCheckin: '2026-06-24' },
  dm3: { avgMood: 4.0, avgStress: 2.2, avgMotivation: 4.2, avgFocus: 3.8, streak: 22, lastCheckin: '2026-06-24' },
  dm4: { avgMood: 2.8, avgStress: 3.9, avgMotivation: 2.5, avgFocus: 2.6, streak: 3, lastCheckin: '2026-06-22' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function wellnessScore(m: { avgMood: number; avgStress: number; avgMotivation: number; avgFocus: number }) {
  return Math.round(((m.avgMood + (6 - m.avgStress) + m.avgMotivation + m.avgFocus) / 4) * 20)
}
const dotColor = (v: number) => v >= 4 ? 'bg-emerald-400' : v >= 3 ? 'bg-amber-400' : 'bg-red-400'
const textColor = (v: number) => v >= 4 ? 'text-emerald-600' : v >= 3 ? 'text-amber-600' : 'text-red-600'
function ScoreDot({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${dotColor(value)}`}>{value.toFixed(1)}</div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}
const AVATAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']

// ── Component ─────────────────────────────────────────────────────────────────
export default function SportsPsychology() {
  const today = new Date('2026-06-24')
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(today.toISOString().slice(0, 10))
  const [query, setQuery] = useState({ from, to })
  const [tab, setTab] = useState<'gym' | 'members' | 'trend'>('gym')

  // Member search
  const [memberQuery, setMemberQuery] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null)
  const debMQ = useDebounce(memberQuery, 300)

  const { data: searchData } = useQuery({
    queryKey: ['members-search-psych', debMQ],
    queryFn: () => api.get<any>(`/api/v1/members/search?q=${encodeURIComponent(debMQ)}&limit=8`),
    enabled: debMQ.length >= 2 && !(selectedMember?.id.startsWith('dm') ?? false),
    retry: false,
  })
  const remoteM: MemberDto[] = (searchData?.data as any)?.data ?? searchData?.data ?? []
  const demoFiltered = DEMO_MEMBERS.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(debMQ.toLowerCase()))
  const displayMembers = remoteM.length > 0 ? remoteM : demoFiltered

  const { data: gymData, isLoading } = useQuery({
    queryKey: ['sportspsych', 'trend', query.from, query.to],
    queryFn: () => api.get<MindsetTrendDto>(`/api/v1/sportspsych/trend?from=${query.from}T00:00:00Z&to=${query.to}T23:59:59Z`),
    retry: false,
  })
  const trend: MindsetTrendDto = (gymData?.data as any) ?? DEMO_TREND

  const rankedMembers = [...DEMO_MEMBERS].map(m => ({ m, stats: DEMO_MEMBER_STATS[m.id]!, ws: wellnessScore(DEMO_MEMBER_STATS[m.id]!) })).sort((a, b) => b.ws - a.ws)
  const atRisk = rankedMembers.filter(x => x.ws < 55)
  const memberStats = selectedMember ? DEMO_MEMBER_STATS[selectedMember.id] : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Psicologia Sportiva</h1>
        <p className="mt-0.5 text-sm text-slate-500">Check-in mentali giornalieri — umore, stress, motivazione, focus (scala 1–5).</p>
      </div>

      {/* Metric legend */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: '😊', label: 'Umore',       desc: '1 = pessimo, 5 = ottimo' },
          { icon: '😤', label: 'Stress',       desc: '1 = rilassato, 5 = stressato' },
          { icon: '🔥', label: 'Motivazione',  desc: '1 = demotivato, 5 = carico' },
          { icon: '🎯', label: 'Focus',        desc: '1 = distratto, 5 = concentrato' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl">{m.icon}</p>
            <p className="mt-1 font-semibold text-slate-800">{m.label}</p>
            <p className="text-xs text-slate-400">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Wellness medio', value: trend.avgWellness.toFixed(0), sub: 'score /100', color: trend.avgWellness >= 70 ? 'text-emerald-600' : trend.avgWellness >= 55 ? 'text-amber-600' : 'text-red-600' },
          { label: 'Check-in totali', value: trend.totalEntries, sub: 'nel periodo selezionato', color: 'text-slate-800' },
          { label: 'A rischio', value: atRisk.length, sub: 'wellness < 55', color: atRisk.length > 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Streak max', value: '22 gg', sub: 'Alessia Romano', color: 'text-brand-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([['gym', '🏟 Palestra'], ['trend', '📈 Trend 30gg'], ['members', '👤 Per membro']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB GYM ── */}
      {tab === 'gym' && (
        <div className="space-y-4">
          {/* Date filter */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Trend palestra</h2>
            <div className="flex flex-wrap gap-3">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <span className="self-center text-slate-400">→</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <button onClick={() => setQuery({ from, to })}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Carica
              </button>
            </div>
          </div>

          {isLoading ? <p className="text-sm text-slate-400">Caricamento…</p> : (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500">{trend.totalEntries} check-in nel periodo</p>
                <div className="text-center">
                  <p className={`text-4xl font-black ${textColor(trend.avgWellness / 20)}`}>{trend.avgWellness.toFixed(0)}</p>
                  <p className="text-xs text-slate-400">Wellness medio /100</p>
                </div>
              </div>
              <div className="flex justify-around">
                <ScoreDot value={trend.avgMood} label="Umore" />
                <ScoreDot value={trend.avgStress} label="Stress" />
                <ScoreDot value={trend.avgMotivation} label="Motivazione" />
                <ScoreDot value={trend.avgFocus} label="Focus" />
              </div>
              <p className="mt-6 text-xs text-slate-400 text-center">Wellness = media di (Umore + (6-Stress) + Motivazione + Focus) × 20</p>
            </div>
          )}

          {/* At-risk section */}
          {atRisk.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-800 mb-3">⚠️ Soci a rischio (wellness &lt; 55)</p>
              <div className="space-y-2">
                {atRisk.map(({ m, stats, ws }) => (
                  <div key={m.id} className="rounded-lg bg-white border border-red-100 p-3 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[m.id.charCodeAt(1) % AVATAR_COLORS.length]}`}>
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-red-600">Stress {stats.avgStress.toFixed(1)} · Umore {stats.avgMood.toFixed(1)} · Motivazione {stats.avgMotivation.toFixed(1)}</p>
                    </div>
                    <div className="text-xl font-black text-red-600">{ws}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB TREND ── */}
      {tab === 'trend' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-1 text-sm font-semibold text-slate-700">Umore e Motivazione — ultimi 30 giorni</p>
            <p className="text-xs text-slate-400 mb-4">Media giornaliera palestra (scala 1–5)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={DEMO_DAILY} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="mood" name="Umore" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="motivazione" name="Motivazione" stroke="#7c3aed" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="focus" name="Focus" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-1 text-sm font-semibold text-slate-700">Stress — ultimi 30 giorni</p>
            <p className="text-xs text-slate-400 mb-4">Valori bassi = soci rilassati (auspicabile)</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={DEMO_DAILY} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} ticks={[1, 2, 3, 4, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="stress" name="Stress" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB MEMBERS ── */}
      {tab === 'members' && (
        <div className="space-y-4">
          {/* Leaderboard */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <p className="text-sm font-semibold text-slate-700">Classifica wellness</p>
            </div>
            <table className="min-w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <tr>
                  {['#', 'Socio', 'Umore', 'Stress', 'Motivazione', 'Focus', 'Wellness', 'Streak'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rankedMembers.map(({ m, stats, ws }, i) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${AVATAR_COLORS[m.id.charCodeAt(1) % AVATAR_COLORS.length]}`}>
                          {m.firstName[0]}{m.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-800">{m.firstName} {m.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`font-semibold ${dotColor(stats.avgMood).replace('bg-', 'text-').replace('-400', '-600')}`}>{stats.avgMood.toFixed(1)}</span></td>
                    <td className="px-4 py-3"><span className={`font-semibold ${dotColor(6 - stats.avgStress).replace('bg-', 'text-').replace('-400', '-600')}`}>{stats.avgStress.toFixed(1)}</span></td>
                    <td className="px-4 py-3"><span className={`font-semibold ${dotColor(stats.avgMotivation).replace('bg-', 'text-').replace('-400', '-600')}`}>{stats.avgMotivation.toFixed(1)}</span></td>
                    <td className="px-4 py-3"><span className={`font-semibold ${dotColor(stats.avgFocus).replace('bg-', 'text-').replace('-400', '-600')}`}>{stats.avgFocus.toFixed(1)}</span></td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${ws >= 70 ? 'bg-emerald-100 text-emerald-700' : ws >= 55 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{ws}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">🔥 {stats.streak}gg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Per-member detail */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Dettaglio socio</p>
            <div className="relative max-w-sm mb-4">
              <input value={memberQuery} onChange={e => { setMemberQuery(e.target.value); setShowDrop(true) }}
                onFocus={() => setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 180)}
                placeholder="Cerca per nome…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              {showDrop && memberQuery.length >= 1 && displayMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {displayMembers.map(m => (
                    <button key={m.id} onMouseDown={() => { setSelectedMember(m); setMemberQuery(`${m.firstName} ${m.lastName}`); setShowDrop(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0">
                      {m.firstName} {m.lastName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMember && memberStats ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${AVATAR_COLORS[selectedMember.id.charCodeAt(1) % AVATAR_COLORS.length]}`}>
                    {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedMember.firstName} {selectedMember.lastName}</p>
                    <p className="text-xs text-slate-400">Ultimo check-in: {memberStats.lastCheckin} · Streak: 🔥{memberStats.streak}gg</p>
                  </div>
                  <div className="ml-auto text-center">
                    <p className={`text-3xl font-black ${wellnessScore(memberStats) >= 70 ? 'text-emerald-600' : wellnessScore(memberStats) >= 55 ? 'text-amber-600' : 'text-red-600'}`}>{wellnessScore(memberStats)}</p>
                    <p className="text-xs text-slate-400">Wellness</p>
                  </div>
                </div>
                <div className="flex justify-around pt-3 border-t border-slate-50">
                  <ScoreDot value={memberStats.avgMood} label="Umore" />
                  <ScoreDot value={memberStats.avgStress} label="Stress" />
                  <ScoreDot value={memberStats.avgMotivation} label="Motivazione" />
                  <ScoreDot value={memberStats.avgFocus} label="Focus" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Seleziona un socio per vedere i dettagli.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
