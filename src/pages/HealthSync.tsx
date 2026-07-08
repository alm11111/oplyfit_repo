import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MemberDto { id: string; fullName: string; email: string; status: string }
interface HealthSyncLogDto {
  id: string; dataDate: string; syncedAtUtc: string; source: string
  steps: number | null; activeCaloriesKcal: number | null; activeDistanceKm: number | null
  activeMinutes: number | null; restingHeartRateBpm: number | null; avgHeartRateBpm: number | null
  hrvRmssdMs: number | null; sleepHours: number | null; deepSleepHours: number | null
  remSleepHours: number | null; sleepQuality: number | null; vo2MaxMlKgMin: number | null
  stressScore: number | null; workoutCount: number | null
}
interface HealthSummaryDto {
  memberId: string; daysCovered: number; avgStepsPerDay: number; avgActiveCalories: number
  avgSleepHours: number; avgHrvMs: number; avgRestingHr: number; avgVo2Max: number
  totalWorkouts: number; recentLogs: HealthSyncLogDto[]
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MEMBERS: MemberDto[] = [
  { id: 'dm1', fullName: 'Giulia Ferretti',  email: 'giulia.ferretti@email.it',  status: 'Active' },
  { id: 'dm2', fullName: 'Marco Bianchi',    email: 'marco.bianchi@email.it',    status: 'Active' },
  { id: 'dm3', fullName: 'Alessia Romano',   email: 'alessia.romano@email.it',   status: 'Active' },
  { id: 'dm4', fullName: 'Roberto Martini',  email: 'roberto.martini@email.it',  status: 'Active' },
]

const DEMO_SUMMARY: Record<string, HealthSummaryDto> = {
  dm1: { memberId: 'dm1', daysCovered: 14, avgStepsPerDay: 8540, avgActiveCalories: 418,
         avgSleepHours: 7.4, avgHrvMs: 56, avgRestingHr: 59, avgVo2Max: 38.2,
         totalWorkouts: 12, recentLogs: [] },
  dm2: { memberId: 'dm2', daysCovered: 14, avgStepsPerDay: 11200, avgActiveCalories: 582,
         avgSleepHours: 7.0, avgHrvMs: 47, avgRestingHr: 63, avgVo2Max: 44.5,
         totalWorkouts: 16, recentLogs: [] },
  dm3: { memberId: 'dm3', daysCovered: 14, avgStepsPerDay: 9800, avgActiveCalories: 352,
         avgSleepHours: 8.2, avgHrvMs: 65, avgRestingHr: 55, avgVo2Max: 41.0,
         totalWorkouts: 10, recentLogs: [] },
  dm4: { memberId: 'dm4', daysCovered: 14, avgStepsPerDay: 5240, avgActiveCalories: 275,
         avgSleepHours: 6.0, avgHrvMs: 33, avgRestingHr: 76, avgVo2Max: 29.5,
         totalWorkouts: 4, recentLogs: [] },
}

const MEMBER_SOURCES: Record<string, string[]> = {
  dm1: ['AppleHealth', 'Garmin'],
  dm2: ['Garmin'],
  dm3: ['AppleHealth'],
  dm4: ['GoogleFit'],
}

function makeLog(memberId: string, daysAgo: number,
  steps: number, sleep: number, hrv: number, hr: number, kcal: number, vo2: number, src: string
): HealthSyncLogDto {
  const d = new Date('2026-06-24'); d.setDate(d.getDate() - daysAgo)
  const dd = d.toISOString().split('T')[0]
  return {
    id: `${memberId}-${daysAgo}`, dataDate: dd, syncedAtUtc: d.toISOString(), source: src,
    steps, activeCaloriesKcal: kcal, activeDistanceKm: parseFloat((steps / 1300).toFixed(1)),
    activeMinutes: Math.round(steps / 100), restingHeartRateBpm: hr,
    avgHeartRateBpm: hr + Math.round(Math.random() * 10 + 8),
    hrvRmssdMs: hrv, sleepHours: sleep,
    deepSleepHours: parseFloat((sleep * 0.18).toFixed(1)),
    remSleepHours: parseFloat((sleep * 0.22).toFixed(1)),
    sleepQuality: Math.min(10, Math.round(sleep * 1.2)),
    vo2MaxMlKgMin: vo2, stressScore: Math.round(50 - hrv * 0.3), workoutCount: daysAgo % 3 === 0 ? 1 : 0,
  }
}

const DEMO_LOGS: Record<string, HealthSyncLogDto[]> = {
  dm1: [
    makeLog('dm1', 0,  9200, 7.5, 58, 58, 445, 38, 'AppleHealth'),
    makeLog('dm1', 1,  7800, 7.0, 54, 60, 380, 38, 'Garmin'),
    makeLog('dm1', 2, 10500, 8.0, 62, 57, 510, 39, 'AppleHealth'),
    makeLog('dm1', 3,  6500, 6.5, 48, 63, 320, 37, 'Garmin'),
    makeLog('dm1', 4,  7200, 6.8, 44, 65, 350, 37, 'AppleHealth'),
    makeLog('dm1', 5,  8800, 7.2, 56, 59, 420, 38, 'Garmin'),
    makeLog('dm1', 6, 11000, 8.5, 65, 55, 540, 40, 'AppleHealth'),
    makeLog('dm1', 7,  8200, 7.0, 51, 61, 400, 38, 'Garmin'),
    makeLog('dm1', 8,  7600, 7.2, 49, 62, 370, 37, 'AppleHealth'),
    makeLog('dm1', 9,  9400, 7.8, 60, 57, 460, 39, 'Garmin'),
    makeLog('dm1', 10, 8700, 7.4, 55, 60, 425, 38, 'AppleHealth'),
    makeLog('dm1', 11, 10200, 8.2, 63, 56, 495, 39, 'Garmin'),
    makeLog('dm1', 12, 7900, 6.8, 50, 62, 385, 37, 'AppleHealth'),
    makeLog('dm1', 13, 7300, 6.5, 46, 64, 355, 37, 'Garmin'),
  ],
  dm2: [
    makeLog('dm2', 0, 12500, 6.5, 42, 65, 620, 44, 'Garmin'),
    makeLog('dm2', 1, 10800, 7.0, 48, 62, 540, 45, 'Garmin'),
    makeLog('dm2', 2,  9200, 6.0, 36, 70, 460, 43, 'Garmin'),
    makeLog('dm2', 3, 11000, 6.2, 39, 68, 550, 44, 'Garmin'),
    makeLog('dm2', 4, 13500, 7.5, 50, 60, 670, 46, 'Garmin'),
    makeLog('dm2', 5, 11800, 7.0, 46, 63, 590, 45, 'Garmin'),
    makeLog('dm2', 6, 14200, 7.8, 55, 58, 710, 47, 'Garmin'),
    makeLog('dm2', 7,  8500, 5.8, 34, 72, 425, 43, 'Garmin'),
    makeLog('dm2', 8, 10500, 6.5, 40, 67, 525, 44, 'Garmin'),
    makeLog('dm2', 9, 11200, 7.0, 44, 64, 560, 44, 'Garmin'),
    makeLog('dm2', 10, 12000, 7.2, 49, 61, 600, 45, 'Garmin'),
    makeLog('dm2', 11, 10500, 6.8, 43, 66, 525, 44, 'Garmin'),
    makeLog('dm2', 12, 11500, 7.0, 47, 63, 575, 44, 'Garmin'),
    makeLog('dm2', 13,  9800, 6.4, 41, 68, 490, 43, 'Garmin'),
  ],
  dm3: [
    makeLog('dm3', 0, 10200, 8.5, 70, 52, 360, 41, 'AppleHealth'),
    makeLog('dm3', 1,  9500, 8.2, 68, 53, 335, 41, 'AppleHealth'),
    makeLog('dm3', 2,  8800, 8.0, 65, 55, 310, 40, 'AppleHealth'),
    makeLog('dm3', 3,  9200, 7.8, 62, 56, 325, 41, 'AppleHealth'),
    makeLog('dm3', 4, 10500, 8.1, 67, 54, 370, 42, 'AppleHealth'),
    makeLog('dm3', 5,  9800, 7.9, 63, 55, 345, 41, 'AppleHealth'),
    makeLog('dm3', 6, 11200, 8.6, 72, 51, 395, 42, 'AppleHealth'),
    makeLog('dm3', 7,  8500, 7.5, 58, 58, 300, 40, 'AppleHealth'),
    makeLog('dm3', 8,  9200, 7.9, 63, 55, 325, 41, 'AppleHealth'),
    makeLog('dm3', 9,  9800, 8.3, 68, 53, 345, 42, 'AppleHealth'),
    makeLog('dm3', 10, 10500, 8.1, 66, 54, 370, 41, 'AppleHealth'),
    makeLog('dm3', 11, 10200, 8.5, 71, 52, 360, 42, 'AppleHealth'),
    makeLog('dm3', 12, 9500, 7.9, 64, 55, 335, 41, 'AppleHealth'),
    makeLog('dm3', 13, 8800, 7.7, 61, 57, 310, 40, 'AppleHealth'),
  ],
  dm4: [
    makeLog('dm4', 0,  5800, 5.5, 30, 78, 290, 29, 'GoogleFit'),
    makeLog('dm4', 1,  6200, 6.0, 34, 74, 310, 30, 'GoogleFit'),
    makeLog('dm4', 2,  4800, 5.8, 31, 77, 240, 29, 'GoogleFit'),
    makeLog('dm4', 3,  5500, 6.2, 38, 70, 275, 30, 'GoogleFit'),
    makeLog('dm4', 4,  6500, 6.5, 35, 73, 325, 31, 'GoogleFit'),
    makeLog('dm4', 5,  5200, 6.8, 33, 75, 260, 29, 'GoogleFit'),
    makeLog('dm4', 6,  4500, 5.9, 32, 76, 225, 28, 'GoogleFit'),
    makeLog('dm4', 7,  5900, 6.4, 37, 71, 295, 30, 'GoogleFit'),
    makeLog('dm4', 8,  6100, 6.7, 40, 69, 305, 30, 'GoogleFit'),
    makeLog('dm4', 9,  4700, 5.7, 30, 79, 235, 29, 'GoogleFit'),
    makeLog('dm4', 10, 5400, 6.1, 35, 74, 270, 30, 'GoogleFit'),
    makeLog('dm4', 11, 5800, 6.5, 38, 71, 290, 30, 'GoogleFit'),
    makeLog('dm4', 12, 4900, 5.9, 31, 76, 245, 29, 'GoogleFit'),
    makeLog('dm4', 13, 4400, 5.5, 29, 79, 220, 28, 'GoogleFit'),
  ],
}

// Steps goal reference lines by member profile
const STEPS_GOAL: Record<string, number> = { dm1: 8000, dm2: 10000, dm3: 9000, dm4: 7000 }

// ── Constants ─────────────────────────────────────────────────────────────────
const SOURCE_ICON: Record<string, string>  = { AppleHealth: '🍎', GoogleFit: '🏃', Garmin: '⌚', Manual: '✏️' }
const SOURCE_COLOR: Record<string, string> = {
  AppleHealth: 'bg-red-100 text-red-700', GoogleFit: 'bg-blue-100 text-blue-700',
  Garmin: 'bg-slate-100 text-slate-700', Manual: 'bg-slate-100 text-slate-500',
}
const SOURCE_DETAILS: Record<string, { icon: string; color: string; note: string; auth: string }> = {
  AppleHealth: { icon: '🍎', color: 'border-red-200 bg-red-50',   note: 'iOS HealthKit — sync via app mobile Oplyfit',      auth: 'OAuth 2.0 via HealthKit' },
  GoogleFit:   { icon: '🏃', color: 'border-blue-200 bg-blue-50', note: 'Android Fitness API — sync via app mobile Oplyfit', auth: 'OAuth 2.0 via Google' },
  Garmin:      { icon: '⌚', color: 'border-slate-200 bg-slate-50', note: 'Garmin Health API — webhook server-to-server',     auth: 'Garmin Connect API Key' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 350): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700']
  const sz = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }
  return (
    <div className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${sz[size]} ${colors[name.charCodeAt(0) % colors.length]}`}>
      {initials}
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${accent ?? ''}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function HealthSync() {
  const [searchText, setSearchText]     = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchText, 300)

  const [tab, setTab] = useState<'sommario' | 'tendenze' | 'log' | 'sorgenti'>('sommario')
  const [days, setDays] = useState(14)

  const { data: membersData } = useQuery({
    queryKey: ['members-search-hs', debouncedSearch],
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

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['healthsync', 'summary', lookupId, days],
    queryFn:  () => api.get<HealthSummaryDto>(`/api/v1/health/members/${lookupId}/summary?days=${days}`),
    enabled:  !!lookupId, retry: false,
  })
  const { data: histData } = useQuery({
    queryKey: ['healthsync', 'history', lookupId],
    queryFn:  () => api.get<HealthSyncLogDto[]>(`/api/v1/health/members/${lookupId}/history?days=30`),
    enabled:  !!lookupId, retry: false,
  })

  const summary = summaryData?.data ?? (isDemoMember && selectedMember ? DEMO_SUMMARY[selectedMember.id] : null)
  const history = histData?.data     ?? (isDemoMember && selectedMember ? DEMO_LOGS[selectedMember.id] ?? [] : [])
  const memberSources = isDemoMember && selectedMember ? (MEMBER_SOURCES[selectedMember.id] ?? []) : []

  // Trend chart data (oldest → newest)
  const trendData = [...history].reverse().map((l, i) => ({
    day:    `G${i + 1}`,
    passi:  l.steps,
    sonno:  l.sleepHours,
    hrv:    l.hrvRmssdMs,
    fc:     l.restingHeartRateBpm,
    kcal:   l.activeCaloriesKcal,
  }))

  const stepsGoal = selectedMember ? (STEPS_GOAL[selectedMember.id] ?? 8000) : 8000

  function selectMember(m: MemberDto) {
    setSelectedMember(m); setSearchText(m.fullName); setShowDropdown(false); setTab('sommario')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Health Sync</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Passi, sonno, HRV, FC, VO₂ Max — dati sincronizzati da Apple Health, Google Fit e Garmin.
        </p>
      </div>

      {/* Sources badge strip */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Apple Health', icon: '🍎', color: 'border-red-200 bg-red-50 text-red-700' },
          { label: 'Google Fit',   icon: '🏃', color: 'border-blue-200 bg-blue-50 text-blue-700' },
          { label: 'Garmin',       icon: '⌚', color: 'border-slate-200 bg-slate-50 text-slate-700' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${s.color}`}>
            {s.icon} {s.label}
          </div>
        ))}
      </div>

      {/* Member selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Seleziona un socio</label>
        <div className="flex gap-3 items-end">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
            <input ref={searchRef} value={searchText}
              onChange={e => { setSearchText(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedMember(null) }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
              placeholder="Cerca per nome o email…"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            {selectedMember && <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-medium">✓ selezionato</span>}
            {showDropdown && displayMembers.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {displayMembers.map(m => (
                  <button key={m.id} onMouseDown={() => selectMember(m)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left">
                    <Avatar name={m.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{m.fullName}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                    {MEMBER_SOURCES[m.id] && (
                      <div className="flex gap-1 flex-shrink-0">
                        {MEMBER_SOURCES[m.id].map(s => <span key={s} title={s}>{SOURCE_ICON[s]}</span>)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={days} onChange={e => setDays(+e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none flex-shrink-0">
            {[7, 14, 30].map(d => <option key={d} value={d}>Ultimi {d}gg</option>)}
          </select>
        </div>
        {!selectedMember && <p className="mt-2 text-xs text-slate-400">Prova: "Giulia", "Marco", "Alessia", "Roberto"</p>}
      </div>

      {!selectedMember && (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-5xl">📱</p>
          <p className="mt-3 text-lg font-semibold text-slate-700">Seleziona un socio per visualizzare i dati</p>
          <p className="text-sm text-slate-400 mt-1">Passi, sonno, HRV, VO₂ Max e trend delle ultime settimane.</p>
        </div>
      )}

      {selectedMember && (
        <>
          {/* Identity bar */}
          {summary && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3">
              <Avatar name={selectedMember.fullName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{selectedMember.fullName}</p>
                <div className="flex gap-3 flex-wrap mt-0.5">
                  <span className="text-xs text-slate-400">{summary.daysCovered} giorni di dati</span>
                  <span className="text-xs text-slate-400">🏋️ {summary.totalWorkouts} allenamenti</span>
                  {memberSources.map(s => (
                    <span key={s} className={`rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLOR[s] ?? 'bg-slate-100 text-slate-600'}`}>
                      {SOURCE_ICON[s]} {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
            {([
              ['sommario',  '📊 Sommario'],
              ['tendenze',  '📈 Tendenze'],
              ['log',       '📋 Log'],
              ['sorgenti',  '📡 Sorgenti'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB SOMMARIO ── */}
          {tab === 'sommario' && (
            <>
              {(isLoading && !isDemoMember) && <p className="text-sm text-slate-400 py-4">Caricamento…</p>}
              {summary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard icon="👣" label="Passi/giorno" value={summary.avgStepsPerDay > 0 ? Math.round(summary.avgStepsPerDay).toLocaleString('it-IT') : '—'} sub={`obiettivo ${stepsGoal.toLocaleString('it-IT')}`} />
                    <StatCard icon="😴" label="Sonno medio"  value={summary.avgSleepHours > 0 ? `${summary.avgSleepHours.toFixed(1)}h` : '—'} sub="target ≥ 7.5h" />
                    <StatCard icon="💓" label="FC a riposo"  value={summary.avgRestingHr > 0 ? `${Math.round(summary.avgRestingHr)} bpm` : '—'} sub="target ≤ 65 bpm" />
                    <StatCard icon="⚡" label="HRV medio"    value={summary.avgHrvMs > 0 ? `${summary.avgHrvMs.toFixed(0)} ms` : '—'} sub="target ≥ 50 ms" />
                    <StatCard icon="🔥" label="Calorie attive" value={summary.avgActiveCalories > 0 ? `${Math.round(summary.avgActiveCalories)} kcal` : '—'} sub="media/giorno" />
                    <StatCard icon="🏋️" label="Allenamenti"  value={String(summary.totalWorkouts)} sub={`in ${days} giorni`} />
                    <StatCard icon="🫁" label="VO₂ Max"      value={summary.avgVo2Max > 0 ? `${summary.avgVo2Max.toFixed(1)}` : '—'} sub="ml/kg/min" />
                    <StatCard icon="📅" label="Giorni con dati" value={String(summary.daysCovered)} sub={`su ${days} richiesti`} />
                  </div>

                  {/* Snapshot bar chart — last 7 days steps */}
                  {trendData.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <p className="mb-1 text-sm font-semibold text-slate-700">Passi giornalieri — ultimi {Math.min(days, 14)} giorni</p>
                      <p className="mb-4 text-xs text-slate-400">Linea tratteggiata = obiettivo ({stepsGoal.toLocaleString('it-IT')} passi).</p>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={trendData.slice(-Math.min(days, 14))} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: number) => [v.toLocaleString('it-IT'), 'Passi']} />
                          <Bar dataKey="passi" fill="#7c3aed" radius={[3, 3, 0, 0]}
                            label={false}
                            // highlight bars below goal
                            // @ts-ignore — recharts accepts this
                            isAnimationActive />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (!isLoading && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-5xl">📱</p>
                  <p className="mt-3 text-lg font-semibold text-slate-700">Nessun dato sincronizzato</p>
                  <p className="text-sm text-slate-400 mt-1">Il socio deve abilitare la sincronizzazione nell'app mobile.</p>
                </div>
              ))}
            </>
          )}

          {/* ── TAB TENDENZE ── */}
          {tab === 'tendenze' && (
            <div className="space-y-4">
              {trendData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                  Nessun dato disponibile.
                </div>
              ) : (
                <>
                  {/* Sonno */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-1 text-sm font-semibold text-slate-700">Ore di sonno — {trendData.length} giorni</p>
                    <p className="mb-4 text-xs text-slate-400">Sonno totale giornaliero (ore).</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis domain={[4, 10]} tick={{ fontSize: 10 }} unit="h" />
                        <Tooltip formatter={(v: number) => [`${v}h`, 'Sonno']} />
                        <Area type="monotone" dataKey="sonno" stroke="#3b82f6" strokeWidth={2}
                          fill="url(#gSleep)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* HRV + FC */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-4 text-sm font-semibold text-slate-700">HRV (ms) e FC a riposo (bpm) — {trendData.length} giorni</p>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="hrv"  name="HRV (ms)"       stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="fc"   name="FC riposo (bpm)" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Calorie */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-4 text-sm font-semibold text-slate-700">Calorie attive (kcal) — {trendData.length} giorni</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gKcal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit=" kcal" />
                        <Tooltip formatter={(v: number) => [`${v} kcal`, 'Calorie attive']} />
                        <Area type="monotone" dataKey="kcal" stroke="#f59e0b" strokeWidth={2}
                          fill="url(#gKcal)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB LOG ── */}
          {tab === 'log' && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-800">Log dettagliato — ultimi {days} giorni</h2>
              </div>
              {history.length === 0 ? (
                <p className="p-6 text-sm text-slate-400">Nessun dato sincronizzato.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-400 uppercase tracking-wide">
                        <th className="px-6 py-3">Data</th>
                        <th className="px-4 py-3">Fonte</th>
                        <th className="px-4 py-3 text-right">Passi</th>
                        <th className="px-4 py-3 text-right">Sonno</th>
                        <th className="px-4 py-3 text-right">HRV</th>
                        <th className="px-4 py-3 text-right">FC</th>
                        <th className="px-4 py-3 text-right">Kcal</th>
                        <th className="px-4 py-3 text-right">VO₂</th>
                        <th className="px-4 py-3 text-right">All.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {history.slice(0, days).map(l => (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                            {new Date(l.dataDate).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLOR[l.source] ?? 'bg-slate-100 text-slate-600'}`}>
                              {SOURCE_ICON[l.source]} {l.source}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600">
                            <span className={l.steps != null && l.steps >= stepsGoal ? 'text-emerald-600 font-semibold' : ''}>
                              {l.steps?.toLocaleString('it-IT') ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{l.sleepHours != null ? `${l.sleepHours}h` : '—'}</td>
                          <td className="px-4 py-2.5 text-right text-violet-700 font-medium">{l.hrvRmssdMs != null ? `${l.hrvRmssdMs} ms` : '—'}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{l.restingHeartRateBpm != null ? `${l.restingHeartRateBpm}` : '—'}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{l.activeCaloriesKcal ?? '—'}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{l.vo2MaxMlKgMin ?? '—'}</td>
                          <td className="px-4 py-2.5 text-right">
                            {l.workoutCount ? <span className="text-brand-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB SORGENTI ── */}
          {tab === 'sorgenti' && (
            <div className="space-y-4">
              {/* Connected for this member */}
              {memberSources.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Sorgenti attive per {selectedMember?.fullName}</p>
                  <div className="flex flex-wrap gap-3">
                    {memberSources.map(s => (
                      <div key={s} className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${SOURCE_DETAILS[s]?.color ?? 'border-slate-200 bg-slate-50'}`}>
                        <span className="text-xl">{SOURCE_ICON[s]}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{s}</p>
                          <p className="text-xs text-slate-500">{SOURCE_DETAILS[s]?.note}</p>
                        </div>
                        <span className="ml-2 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">● Attivo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(SOURCE_DETAILS).map(([src, info]) => (
                  <div key={src} className={`rounded-xl border p-5 ${info.color}`}>
                    <p className="text-3xl">{info.icon}</p>
                    <p className="mt-2 font-bold text-slate-800">{src}</p>
                    <p className="text-xs text-slate-500 mt-1">{info.note}</p>
                    <p className="text-xs text-slate-400 mt-1">Auth: {info.auth}</p>
                    <div className="mt-3 flex gap-2">
                      {memberSources.includes(src) && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">● Connesso</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
