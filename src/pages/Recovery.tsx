import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MemberDto { id: string; fullName: string; email: string; status: string }
interface RecoveryScoreBreakdown { scoreHrv: number; scoreSleep: number; scoreRestingHr: number; scoreStress: number }
interface RecoveryLogDto {
  id: string; loggedAtUtc: string
  hrvMs: number | null; sleepHours: number | null; sleepQuality: number | null
  restingHeartRate: number | null; stressLevel: number | null
  recoveryScore: number; recoveryGrade: string
  breakdown: RecoveryScoreBreakdown; source: string; notes: string | null
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MEMBERS: MemberDto[] = [
  { id: 'dm1', fullName: 'Giulia Ferretti',  email: 'giulia.ferretti@email.it',  status: 'Active' },
  { id: 'dm2', fullName: 'Marco Bianchi',    email: 'marco.bianchi@email.it',    status: 'Active' },
  { id: 'dm3', fullName: 'Alessia Romano',   email: 'alessia.romano@email.it',   status: 'Active' },
  { id: 'dm4', fullName: 'Roberto Martini',  email: 'roberto.martini@email.it',  status: 'Active' },
]

function makeDay(memberId: string, daysAgo: number, score: number, hrv: number, sleep: number, hr: number, stress: number): RecoveryLogDto {
  const d = new Date('2026-06-24'); d.setDate(d.getDate() - daysAgo)
  const grade = score >= 80 ? 'Ottimo' : score >= 65 ? 'Buono' : score >= 50 ? 'Discreto' : score >= 35 ? 'Affaticato' : 'Scarso'
  const scoreHrv     = Math.round((hrv / 80) * 35)
  const scoreSleep   = Math.round((Math.min(sleep, 9) / 9) * 35)
  const scoreRestHr  = Math.round(Math.max(0, (85 - hr) / 30) * 20)
  const scoreStress  = Math.round((10 - stress) / 9 * 10)
  return {
    id: `${memberId}-${daysAgo}`, loggedAtUtc: d.toISOString(),
    hrvMs: hrv, sleepHours: sleep, sleepQuality: Math.round(sleep / 9 * 10),
    restingHeartRate: hr, stressLevel: stress, recoveryScore: score, recoveryGrade: grade,
    breakdown: { scoreHrv, scoreSleep, scoreRestingHr: scoreRestHr, scoreStress },
    source: daysAgo % 4 === 0 ? 'Garmin' : daysAgo % 3 === 0 ? 'Oura' : 'Manual', notes: null,
  }
}

const DEMO_LOGS: Record<string, RecoveryLogDto[]> = {
  dm1: [
    makeDay('dm1', 0,  82, 58, 7.5, 58, 2),
    makeDay('dm1', 1,  78, 54, 7.0, 60, 3),
    makeDay('dm1', 2,  85, 62, 8.0, 57, 2),
    makeDay('dm1', 3,  71, 48, 6.5, 63, 4),
    makeDay('dm1', 4,  67, 44, 6.8, 65, 5),
    makeDay('dm1', 5,  80, 56, 7.2, 59, 3),
    makeDay('dm1', 6,  88, 65, 8.5, 55, 1),
    makeDay('dm1', 7,  75, 51, 7.0, 61, 3),
    makeDay('dm1', 8,  72, 49, 7.2, 62, 4),
    makeDay('dm1', 9,  83, 60, 7.8, 57, 2),
    makeDay('dm1', 10, 79, 55, 7.4, 60, 3),
    makeDay('dm1', 11, 86, 63, 8.2, 56, 2),
    makeDay('dm1', 12, 74, 50, 6.8, 62, 4),
    makeDay('dm1', 13, 70, 46, 6.5, 64, 5),
  ],
  dm2: [
    makeDay('dm2', 0,  65, 42, 6.5, 65, 5),
    makeDay('dm2', 1,  72, 48, 7.0, 62, 4),
    makeDay('dm2', 2,  58, 36, 6.0, 70, 6),
    makeDay('dm2', 3,  60, 39, 6.2, 68, 6),
    makeDay('dm2', 4,  75, 50, 7.5, 60, 3),
    makeDay('dm2', 5,  70, 46, 7.0, 63, 4),
    makeDay('dm2', 6,  80, 55, 7.8, 58, 2),
    makeDay('dm2', 7,  55, 34, 5.8, 72, 7),
    makeDay('dm2', 8,  62, 40, 6.5, 67, 5),
    makeDay('dm2', 9,  68, 44, 7.0, 64, 4),
    makeDay('dm2', 10, 74, 49, 7.2, 61, 3),
    makeDay('dm2', 11, 66, 43, 6.8, 66, 5),
    makeDay('dm2', 12, 71, 47, 7.0, 63, 4),
    makeDay('dm2', 13, 63, 41, 6.4, 68, 6),
  ],
  dm3: [
    makeDay('dm3', 0,  90, 70, 8.5, 52, 1),
    makeDay('dm3', 1,  88, 68, 8.2, 53, 1),
    makeDay('dm3', 2,  85, 65, 8.0, 55, 2),
    makeDay('dm3', 3,  82, 62, 7.8, 56, 2),
    makeDay('dm3', 4,  87, 67, 8.1, 54, 1),
    makeDay('dm3', 5,  84, 63, 7.9, 55, 2),
    makeDay('dm3', 6,  91, 72, 8.6, 51, 1),
    makeDay('dm3', 7,  79, 58, 7.5, 58, 3),
    makeDay('dm3', 8,  83, 63, 7.9, 55, 2),
    makeDay('dm3', 9,  88, 68, 8.3, 53, 1),
    makeDay('dm3', 10, 86, 66, 8.1, 54, 2),
    makeDay('dm3', 11, 90, 71, 8.5, 52, 1),
    makeDay('dm3', 12, 84, 64, 7.9, 55, 2),
    makeDay('dm3', 13, 81, 61, 7.7, 57, 3),
  ],
  dm4: [
    makeDay('dm4', 0,  45, 30, 5.5, 78, 8),
    makeDay('dm4', 1,  52, 34, 6.0, 74, 7),
    makeDay('dm4', 2,  48, 31, 5.8, 77, 8),
    makeDay('dm4', 3,  60, 38, 6.5, 70, 6),
    makeDay('dm4', 4,  55, 35, 6.2, 73, 7),
    makeDay('dm4', 5,  63, 41, 6.8, 68, 5),
    makeDay('dm4', 6,  50, 32, 5.9, 76, 8),
    makeDay('dm4', 7,  58, 37, 6.4, 71, 6),
    makeDay('dm4', 8,  62, 40, 6.7, 69, 5),
    makeDay('dm4', 9,  47, 30, 5.7, 78, 8),
    makeDay('dm4', 10, 54, 35, 6.1, 74, 7),
    makeDay('dm4', 11, 59, 38, 6.5, 71, 6),
    makeDay('dm4', 12, 51, 33, 5.9, 76, 8),
    makeDay('dm4', 13, 44, 29, 5.5, 79, 9),
  ],
}

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADE_COLOR: Record<string, string> = {
  Ottimo: 'text-emerald-600', Buono: 'text-blue-600',
  Discreto: 'text-amber-600', Affaticato: 'text-orange-600',
  Scarso: 'text-red-600', 'N/D': 'text-slate-400',
}
const GRADE_BG: Record<string, string> = {
  Ottimo: 'bg-emerald-100', Buono: 'bg-blue-100',
  Discreto: 'bg-amber-100', Affaticato: 'bg-orange-100',
  Scarso: 'bg-red-100', 'N/D': 'bg-slate-100',
}
const SCORE_RING_COLOR = (s: number) =>
  s >= 80 ? '#059669' : s >= 65 ? '#2563eb' : s >= 50 ? '#d97706' : '#dc2626'

const TRAINING_ADVICE: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  Ottimo:     { icon: '💪', label: 'Allenamento intenso',    desc: 'Recovery eccellente. Ottimo per sessioni di forza o HIIT ad alta intensità.',        color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  Buono:      { icon: '🏃', label: 'Allenamento standard',   desc: 'Buon recupero. Procedi con il piano normale mantenendo i carichi previsti.',         color: 'bg-blue-50 border-blue-200 text-blue-800' },
  Discreto:   { icon: '🚶', label: 'Allenamento moderato',   desc: 'Recupero parziale. Riduci i carichi del 15–20% e privilegia il lavoro tecnico.',     color: 'bg-amber-50 border-amber-200 text-amber-800' },
  Affaticato: { icon: '🧘', label: 'Recupero attivo',        desc: 'Corpo affaticato. Preferisci stretching, yoga o cardio leggero a bassa intensità.',  color: 'bg-orange-50 border-orange-200 text-orange-800' },
  Scarso:     { icon: '🛌', label: 'Riposo consigliato',     desc: 'Recovery critico. Giornata di riposo completo. Controlla sonno e idratazione.',      color: 'bg-red-50 border-red-200 text-red-800' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t) }, [value, delay])
  return debounced
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700']
  const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }
  return (
    <div className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${sizeMap[size]} ${colors[name.charCodeAt(0) % colors.length]}`}>
      {initials}
    </div>
  )
}

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const r = 64, cx = 80, cy = 80
  const C   = 2 * Math.PI * r
  const ARC = (270 / 360) * C
  const fill = (score / 100) * ARC
  const color = SCORE_RING_COLOR(score)
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="168" height="168" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${C}`}
          transform={`rotate(135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${C}`}
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-black text-slate-900">{score}</div>
        <div className="text-xs text-slate-400 font-medium">/ 100</div>
        <div className={`mt-1 text-xs font-bold ${GRADE_COLOR[grade] ?? 'text-slate-500'}`}>{grade}</div>
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Recovery() {
  const qc = useQueryClient()
  const [searchText, setSearchText]     = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchText, 300)

  const [tab, setTab]   = useState<'overview' | 'log' | 'history' | 'wearable'>('overview')
  const [garminId, setGarminId] = useState('')
  const [whoopId, setWhoopId]   = useState('')
  const [form, setForm] = useState({
    hrvMs: '', sleepHours: '', sleepQuality: '', restingHeartRate: '', stressLevel: '',
    source: 'Manual', notes: '',
  })

  const { data: membersData } = useQuery({
    queryKey: ['members-search-rec', debouncedSearch],
    queryFn:  () => api.get<MemberDto[]>(`/api/v1/members?search=${encodeURIComponent(debouncedSearch)}&pageSize=8`),
    enabled:  debouncedSearch.length >= 2, staleTime: 10_000, retry: false,
  })
  const remoteMembers: MemberDto[] = membersData?.data ?? []
  const displayMembers = remoteMembers.length > 0
    ? remoteMembers
    : debouncedSearch.length >= 2
      ? DEMO_MEMBERS.filter(m => m.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) || m.email.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : []

  const isDemoMember = selectedMember?.id.startsWith('dm') ?? false
  const lookupId     = isDemoMember ? '' : (selectedMember?.id ?? '')

  const { data: latestData, isLoading } = useQuery({
    queryKey: ['recovery', 'latest', lookupId],
    queryFn:  () => api.get<RecoveryLogDto>(`/api/v1/recovery/members/${lookupId}/latest`),
    enabled:  !!lookupId, retry: false,
  })
  const { data: histData } = useQuery({
    queryKey: ['recovery', 'history', lookupId],
    queryFn:  () => api.get<RecoveryLogDto[]>(`/api/v1/recovery/members/${lookupId}/history?days=14`),
    enabled:  !!lookupId && (tab === 'history' || tab === 'overview'), retry: false,
  })

  const latest  = latestData?.data ?? (isDemoMember && selectedMember ? DEMO_LOGS[selectedMember.id]?.[0] : null)
  const history = histData?.data   ?? (isDemoMember && selectedMember ? DEMO_LOGS[selectedMember.id] ?? [] : [])

  // Derived KPI
  const avg14  = history.length ? Math.round(history.reduce((s, l) => s + l.recoveryScore, 0) / history.length) : null
  const avgHrv = history.length && history[0].hrvMs != null
    ? Math.round(history.reduce((s, l) => s + (l.hrvMs ?? 0), 0) / history.filter(l => l.hrvMs != null).length)
    : null
  const avgSleep = history.length && history[0].sleepHours != null
    ? (history.reduce((s, l) => s + (l.sleepHours ?? 0), 0) / history.filter(l => l.sleepHours != null).length).toFixed(1)
    : null

  const trendData = [...history].reverse().map((l, i) => ({
    day: `G${i + 1}`,
    score:  l.recoveryScore,
    hrv:    l.hrvMs,
    sonno:  l.sleepHours,
  }))

  const logMutation = useMutation({
    mutationFn: (body: object) => api.post(`/api/v1/recovery/members/${selectedMember!.id}/log`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recovery'] }); setTab('overview')
      setForm({ hrvMs:'',sleepHours:'',sleepQuality:'',restingHeartRate:'',stressLevel:'',source:'Manual',notes:'' })
    },
  })
  const garminMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/recovery/members/${selectedMember!.id}/import/garmin`, { externalId: garminId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recovery'] }); setGarminId('') },
  })
  const whoopMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/recovery/members/${selectedMember!.id}/import/whoop`, { externalId: whoopId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recovery'] }); setWhoopId('') },
  })
  const ouraMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/recovery/members/${selectedMember!.id}/import/oura`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recovery'] }),
  })

  function handleLog() {
    logMutation.mutate({
      hrvMs:            form.hrvMs           ? parseFloat(form.hrvMs)            : null,
      sleepHours:       form.sleepHours      ? parseFloat(form.sleepHours)       : null,
      sleepQuality:     form.sleepQuality    ? parseInt(form.sleepQuality)       : null,
      restingHeartRate: form.restingHeartRate ? parseInt(form.restingHeartRate)  : null,
      stressLevel:      form.stressLevel     ? parseInt(form.stressLevel)        : null,
      source: form.source, notes: form.notes || null,
    })
  }

  function selectMember(m: MemberDto) {
    setSelectedMember(m); setSearchText(m.fullName); setShowDropdown(false); setTab('overview')
  }

  const advice = latest ? TRAINING_ADVICE[latest.recoveryGrade] : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recovery Score</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          HRV, sonno, FC a riposo e stress — punteggio giornaliero di recupero con raccomandazione allenamento.
        </p>
      </div>

      {/* Member selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Seleziona un socio</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
          <input ref={searchRef} value={searchText}
            onChange={e => { setSearchText(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedMember(null) }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
            placeholder="Cerca per nome o email…"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          {selectedMember && (
            <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-medium">✓ selezionato</span>
          )}
          {showDropdown && displayMembers.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {displayMembers.map(m => (
                <button key={m.id} onMouseDown={() => selectMember(m)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left">
                  <Avatar name={m.fullName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{m.fullName}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {m.status === 'Active' ? 'Attivo' : m.status}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && debouncedSearch.length >= 2 && displayMembers.length === 0 && (
            <div className="absolute z-20 mt-1 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow px-4 py-3 text-sm text-slate-400">
              Nessun socio trovato
            </div>
          )}
        </div>
        {!selectedMember && (
          <p className="mt-2 text-xs text-slate-400">Prova: "Giulia", "Marco", "Alessia", "Roberto"</p>
        )}
      </div>

      {!selectedMember && (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-5xl">😴</p>
          <p className="mt-3 text-lg font-semibold text-slate-700">Seleziona un socio per iniziare</p>
          <p className="text-sm text-slate-400 mt-1">Cerca per nome o email nel campo sopra.</p>
        </div>
      )}

      {selectedMember && (
        <>
          {/* KPI strip */}
          {latest && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Score oggi',    value: latest.recoveryScore,  unit: '/100', color: `font-black`, style: { color: SCORE_RING_COLOR(latest.recoveryScore) } },
                { label: 'Media 14 gg',  value: avg14  ?? '—', unit: avg14  ? '/100' : '', color: 'text-slate-800 font-black', style: {} },
                { label: 'HRV medio',    value: avgHrv ?? '—', unit: avgHrv ? ' ms'  : '', color: 'text-violet-700 font-black', style: {} },
                { label: 'Sonno medio',  value: avgSleep ?? '—', unit: avgSleep ? 'h' : '', color: 'text-blue-700 font-black',  style: {} },
              ].map(k => (
                <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className={`text-2xl ${k.color}`} style={k.style}>{k.value}<span className="text-sm font-normal text-slate-400">{k.unit}</span></p>
                  <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
            {([
              ['overview',  '📊 Panoramica'],
              ['log',       '✏️ Registra'],
              ['history',   '📅 Storico 14gg'],
              ['wearable',  '⌚ Wearable'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {(isLoading && !isDemoMember) && (
                <div className="flex items-center gap-3 text-sm text-slate-400 py-4">
                  <span className="animate-spin">⚙</span> Caricamento…
                </div>
              )}

              {latest ? (
                <>
                  {/* Score card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                      {/* Gauge */}
                      <div className="flex flex-col items-center gap-3 flex-shrink-0">
                        <ScoreGauge score={latest.recoveryScore} grade={latest.recoveryGrade} />
                        <div className="text-center">
                          <p className="text-xs text-slate-400">{new Date(latest.loggedAtUtc).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' })}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 mt-1 inline-block">{latest.source}</span>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="flex-1 space-y-4">
                        <h2 className="font-semibold text-slate-800 mb-1">Breakdown punteggio</h2>
                        {[
                          { label: 'HRV (RMSSD)', score: latest.breakdown.scoreHrv,       max: 35, val: latest.hrvMs != null ? `${latest.hrvMs} ms` : null, color: 'bg-violet-500' },
                          { label: 'Sonno',        score: latest.breakdown.scoreSleep,     max: 35, val: latest.sleepHours != null ? `${latest.sleepHours}h (qualità ${latest.sleepQuality}/10)` : null, color: 'bg-blue-500' },
                          { label: 'FC a riposo',  score: latest.breakdown.scoreRestingHr, max: 20, val: latest.restingHeartRate != null ? `${latest.restingHeartRate} bpm` : null, color: 'bg-emerald-500' },
                          { label: 'Stress',       score: latest.breakdown.scoreStress,    max: 10, val: latest.stressLevel != null ? `${latest.stressLevel}/10` : null, color: 'bg-orange-500' },
                        ].map(c => (
                          <div key={c.label}>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">
                                {c.label}
                                {c.val && <span className="ml-2 text-xs text-slate-400 font-normal">({c.val})</span>}
                              </span>
                              <span className="text-xs font-bold text-slate-500">{c.score} / {c.max} pt</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${c.color} transition-all duration-500`}
                                style={{ width: `${(c.score / c.max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                        {latest.notes && (
                          <p className="text-xs text-slate-400 mt-2 italic">📝 {latest.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation card */}
                  {advice && (
                    <div className={`rounded-xl border p-4 ${advice.color}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{advice.icon}</span>
                        <div>
                          <p className="font-bold text-sm">{advice.label}</p>
                          <p className="text-xs mt-0.5 opacity-80">{advice.desc}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 14-day trend chart */}
                  {trendData.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <p className="mb-4 text-sm font-semibold text-slate-700">Trend recovery score — 14 giorni</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: number) => [`${v}`, 'Score']} />
                          <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2}
                            fill="url(#gScore)" dot={false} activeDot={{ r: 4 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* HRV + Sleep chart */}
                  {trendData.length > 0 && trendData[0].hrv != null && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <p className="mb-3 text-sm font-semibold text-slate-700">HRV (ms) — 14 giorni</p>
                        <ResponsiveContainer width="100%" height={130}>
                          <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} unit=" ms" />
                            <Tooltip formatter={(v: number) => [`${v} ms`, 'HRV']} />
                            <Line type="monotone" dataKey="hrv" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <p className="mb-3 text-sm font-semibold text-slate-700">Ore di sonno — 14 giorni</p>
                        <ResponsiveContainer width="100%" height={130}>
                          <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                            <YAxis domain={[4, 10]} tick={{ fontSize: 9 }} unit="h" />
                            <Tooltip formatter={(v: number) => [`${v}h`, 'Sonno']} />
                            <Area type="monotone" dataKey="sonno" stroke="#3b82f6" strokeWidth={2}
                              fill="url(#gSleep)" dot={false} activeDot={{ r: 3 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              ) : (!isLoading && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-5xl">😴</p>
                  <p className="mt-3 text-lg font-semibold text-slate-700">Nessuna rilevazione disponibile</p>
                  <p className="mt-1 text-sm text-slate-400">Vai su "Registra" per inserire i dati manualmente, o importa da wearable.</p>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB LOG ── */}
          {tab === 'log' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-slate-800">Registra rilevazione manuale</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {([
                  ['HRV RMSSD (ms)',       'hrvMs',            'number'],
                  ['Sonno (ore)',           'sleepHours',       'number'],
                  ['Qualità sonno (1–10)',  'sleepQuality',     'number'],
                  ['FC a riposo (bpm)',     'restingHeartRate', 'number'],
                  ['Stress percepito (1–10)', 'stressLevel',   'number'],
                ] as const).map(([label, key]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs text-slate-500">{label}</label>
                    <input type="number" value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Fonte</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                    {['Manual','AppleHealth','Garmin','Whoop','Oura'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs text-slate-500">Note opzionali</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="es. allenamento pesante ieri, riposo scarso…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
              </div>
              <button onClick={handleLog} disabled={logMutation.isPending}
                className="mt-4 rounded-lg bg-brand-600 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition">
                {logMutation.isPending ? '⚙ Salvataggio…' : '💾 Salva rilevazione'}
              </button>
              {logMutation.isError && (
                <p className="mt-2 text-xs text-red-600">Errore durante il salvataggio. Riprova.</p>
              )}
            </div>
          )}

          {/* ── TAB HISTORY ── */}
          {tab === 'history' && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {history.length === 0 ? (
                <p className="p-6 text-sm text-slate-400">Nessuna rilevazione negli ultimi 14 giorni.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-400 uppercase tracking-wide">
                        <th className="px-6 py-3">Data</th>
                        <th className="px-4 py-3 text-center">Score</th>
                        <th className="px-4 py-3">Grado</th>
                        <th className="px-4 py-3 text-center">HRV</th>
                        <th className="px-4 py-3 text-center">Sonno</th>
                        <th className="px-4 py-3 text-center">FC riposo</th>
                        <th className="px-4 py-3 text-center">Stress</th>
                        <th className="px-4 py-3">Fonte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {history.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-3 font-medium text-slate-800 whitespace-nowrap">
                            {new Date(l.loggedAtUtc).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-base font-black" style={{ color: SCORE_RING_COLOR(l.recoveryScore) }}>
                              {l.recoveryScore}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${GRADE_BG[l.recoveryGrade]} ${GRADE_COLOR[l.recoveryGrade]}`}>
                              {l.recoveryGrade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">{l.hrvMs != null ? `${l.hrvMs} ms` : '—'}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{l.sleepHours != null ? `${l.sleepHours}h` : '—'}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{l.restingHeartRate != null ? `${l.restingHeartRate} bpm` : '—'}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{l.stressLevel ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{l.source}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB WEARABLE ── */}
          {tab === 'wearable' && (
            <div className="space-y-4">
              {[
                { label: '⌚ Garmin Connect', id: garminId, setId: setGarminId, mutation: garminMutation, placeholder: 'Garmin User ID' },
                { label: '💪 Whoop', id: whoopId, setId: setWhoopId, mutation: whoopMutation, placeholder: 'Whoop User ID' },
              ].map(w => (
                <div key={w.label} className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 font-semibold text-slate-800">{w.label}</p>
                  <div className="flex gap-3">
                    <input value={w.id} onChange={e => w.setId(e.target.value)} placeholder={w.placeholder}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                    <button onClick={() => w.mutation.mutate()} disabled={!w.id || w.mutation.isPending}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 transition">
                      {w.mutation.isPending ? '…' : 'Importa'}
                    </button>
                  </div>
                  {w.mutation.isSuccess && <p className="mt-2 text-xs text-emerald-600 font-medium">✓ Importato con successo</p>}
                </div>
              ))}

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-1 font-semibold text-slate-800">💍 Oura Ring</p>
                <p className="mb-3 text-xs text-slate-500">Connetti il tuo anello Oura per importare dati di recupero e sonno.</p>
                <button onClick={() => ouraMutation.mutate()} disabled={ouraMutation.isPending}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 transition">
                  {ouraMutation.isPending ? '…' : 'Importa da Oura'}
                </button>
                {ouraMutation.isSuccess && <p className="mt-2 text-xs text-emerald-600 font-medium">✓ Importato con successo</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
