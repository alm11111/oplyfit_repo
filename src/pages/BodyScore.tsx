import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MemberDto { id: string; fullName: string; email: string; status: string }
interface BodyScoreComponent { name: string; score: number; maxScore: number; detail: string }
interface BodyScoreDto {
  memberId: string; totalScore: number; grade: string
  components: BodyScoreComponent[]; computedAtUtc: string
}
interface BodyMeasurementDto {
  id: string; measuredAtUtc: string; weightKg: number | null; heightCm: number | null
  bodyFatPct: number | null; muscleMassKg: number | null; waterPct: number | null
  bmiComputed: number | null; visceralFatIndex: number | null; source: string; notes: string | null
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MEMBERS: MemberDto[] = [
  { id: 'dm1', fullName: 'Giulia Ferretti',  email: 'giulia.ferretti@email.it',  status: 'Active' },
  { id: 'dm2', fullName: 'Marco Bianchi',    email: 'marco.bianchi@email.it',    status: 'Active' },
  { id: 'dm3', fullName: 'Alessia Romano',   email: 'alessia.romano@email.it',   status: 'Active' },
  { id: 'dm4', fullName: 'Roberto Martini',  email: 'roberto.martini@email.it',  status: 'Active' },
]

const DEMO_SCORES: Record<string, BodyScoreDto> = {
  dm1: { memberId: 'dm1', totalScore: 82, grade: 'A', computedAtUtc: '2026-06-24T08:00:00Z',
    components: [
      { name: 'Composizione', score: 23, maxScore: 30, detail: 'BF 18% ✓ · Viscerale 3 ✓ · BMI 22.8 normopeso' },
      { name: 'Forza',        score: 18, maxScore: 25, detail: 'Carichi +8% ciclo 3 · Leg press 80 kg' },
      { name: 'Resistenza',   score: 22, maxScore: 25, detail: 'VO₂ Max 38 ml/kg/min · Cardio 3×/sett.' },
      { name: 'Costanza',     score: 19, maxScore: 20, detail: 'Frequenza 94% ultimi 60 giorni' },
    ]},
  dm2: { memberId: 'dm2', totalScore: 91, grade: 'S', computedAtUtc: '2026-06-24T08:00:00Z',
    components: [
      { name: 'Composizione', score: 26, maxScore: 30, detail: 'BF 12% ✓ · Viscerale 4 ✓ · BMI 24.1 normopeso' },
      { name: 'Forza',        score: 23, maxScore: 25, detail: 'Squat 100 kg · Stacco 120 kg · PR continui' },
      { name: 'Resistenza',   score: 22, maxScore: 25, detail: 'VO₂ Max 47 ml/kg/min · ottimo' },
      { name: 'Costanza',     score: 20, maxScore: 20, detail: 'Frequenza 100% ultimi 60 giorni — perfetto' },
    ]},
  dm3: { memberId: 'dm3', totalScore: 78, grade: 'B', computedAtUtc: '2026-06-24T08:00:00Z',
    components: [
      { name: 'Composizione', score: 22, maxScore: 30, detail: 'BF 21% nella norma · BMI 21.5 normopeso' },
      { name: 'Forza',        score: 17, maxScore: 25, detail: 'Carichi in crescita +5% · Leg press 60 kg' },
      { name: 'Resistenza',   score: 21, maxScore: 25, detail: 'VO₂ Max 41 ml/kg/min · eccellente' },
      { name: 'Costanza',     score: 18, maxScore: 20, detail: 'Frequenza 88% ultimi 60 giorni' },
    ]},
  dm4: { memberId: 'dm4', totalScore: 52, grade: 'D', computedAtUtc: '2026-06-24T08:00:00Z',
    components: [
      { name: 'Composizione', score: 14, maxScore: 30, detail: 'BF 28% alto · Viscerale 9 ⚠ · BMI 28.4 sovrappeso' },
      { name: 'Forza',        score: 12, maxScore: 25, detail: 'Carichi bassi · in fase onboarding' },
      { name: 'Resistenza',   score: 15, maxScore: 25, detail: 'VO₂ Max 29 ml/kg/min · da migliorare' },
      { name: 'Costanza',     score: 11, maxScore: 20, detail: 'Frequenza 55% ultimi 60 giorni — discontinuo' },
    ]},
}

function makeM(id: string, daysAgo: number, w: number, bf: number, mus: number, src: string): BodyMeasurementDto {
  const d = new Date('2026-06-24'); d.setDate(d.getDate() - daysAgo)
  const h = id === 'dm1' ? 165 : id === 'dm2' ? 180 : id === 'dm3' ? 162 : 175
  const bmi = parseFloat((w / (h / 100) ** 2).toFixed(1))
  return { id: `${id}-${daysAgo}`, measuredAtUtc: d.toISOString(),
    weightKg: w, heightCm: h, bodyFatPct: bf, muscleMassKg: mus,
    waterPct: Math.round(60 - bf * 0.3), bmiComputed: bmi,
    visceralFatIndex: Math.round(bf / 4), source: src, notes: null }
}

const DEMO_MEASUREMENTS: Record<string, BodyMeasurementDto[]> = {
  dm1: [
    makeM('dm1',  0,  62.0, 18.0, 46.2, 'InBody'),
    makeM('dm1', 30,  62.8, 18.8, 45.8, 'InBody'),
    makeM('dm1', 60,  63.5, 19.5, 45.4, 'Manual'),
    makeM('dm1', 90,  64.2, 20.2, 45.0, 'InBody'),
    makeM('dm1',120,  65.0, 21.0, 44.5, 'InBody'),
    makeM('dm1',150,  66.0, 22.0, 44.0, 'Manual'),
  ],
  dm2: [
    makeM('dm2',  0,  86.0, 12.0, 70.5, 'InBody'),
    makeM('dm2', 30,  85.2, 12.5, 69.8, 'InBody'),
    makeM('dm2', 60,  84.5, 13.0, 69.2, 'Fit3D'),
    makeM('dm2', 90,  83.8, 13.8, 68.5, 'InBody'),
    makeM('dm2',120,  82.5, 14.5, 67.8, 'InBody'),
    makeM('dm2',150,  81.0, 15.2, 67.0, 'Manual'),
  ],
  dm3: [
    makeM('dm3',  0,  56.5, 21.0, 41.2, 'InBody'),
    makeM('dm3', 30,  57.0, 21.5, 41.0, 'Manual'),
    makeM('dm3', 60,  57.5, 22.0, 40.8, 'InBody'),
    makeM('dm3', 90,  58.0, 22.5, 40.5, 'InBody'),
    makeM('dm3',120,  58.5, 23.0, 40.2, 'Manual'),
    makeM('dm3',150,  59.0, 23.5, 40.0, 'InBody'),
  ],
  dm4: [
    makeM('dm4',  0,  92.0, 28.0, 55.0, 'Manual'),
    makeM('dm4', 30,  92.8, 28.5, 54.5, 'Manual'),
    makeM('dm4', 60,  93.5, 29.0, 54.0, 'Manual'),
    makeM('dm4', 90,  94.0, 29.5, 53.5, 'Manual'),
    makeM('dm4',120,  94.8, 30.0, 53.0, 'InBody'),
    makeM('dm4',150,  95.5, 30.5, 52.5, 'InBody'),
  ],
}

const DEMO_SCORE_TREND: Record<string, { mese: string; score: number; bf: number; peso: number }[]> = {
  dm1: [
    { mese: 'Gen', score: 68, bf: 22.0, peso: 66.0 },
    { mese: 'Feb', score: 71, bf: 21.0, peso: 65.0 },
    { mese: 'Mar', score: 74, bf: 20.2, peso: 64.2 },
    { mese: 'Apr', score: 77, bf: 19.5, peso: 63.5 },
    { mese: 'Mag', score: 80, bf: 18.8, peso: 62.8 },
    { mese: 'Giu', score: 82, bf: 18.0, peso: 62.0 },
  ],
  dm2: [
    { mese: 'Gen', score: 82, bf: 15.2, peso: 81.0 },
    { mese: 'Feb', score: 84, bf: 14.5, peso: 82.5 },
    { mese: 'Mar', score: 86, bf: 13.8, peso: 83.8 },
    { mese: 'Apr', score: 88, bf: 13.0, peso: 84.5 },
    { mese: 'Mag', score: 90, bf: 12.5, peso: 85.2 },
    { mese: 'Giu', score: 91, bf: 12.0, peso: 86.0 },
  ],
  dm3: [
    { mese: 'Gen', score: 62, bf: 23.5, peso: 59.0 },
    { mese: 'Feb', score: 65, bf: 23.0, peso: 58.5 },
    { mese: 'Mar', score: 68, bf: 22.5, peso: 58.0 },
    { mese: 'Apr', score: 71, bf: 22.0, peso: 57.5 },
    { mese: 'Mag', score: 74, bf: 21.5, peso: 57.0 },
    { mese: 'Giu', score: 78, bf: 21.0, peso: 56.5 },
  ],
  dm4: [
    { mese: 'Gen', score: 44, bf: 30.5, peso: 95.5 },
    { mese: 'Feb', score: 46, bf: 30.0, peso: 94.8 },
    { mese: 'Mar', score: 47, bf: 29.5, peso: 94.0 },
    { mese: 'Apr', score: 49, bf: 29.0, peso: 93.5 },
    { mese: 'Mag', score: 50, bf: 28.5, peso: 92.8 },
    { mese: 'Giu', score: 52, bf: 28.0, peso: 92.0 },
  ],
}

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADE_COLOR: Record<string, string> = {
  S: 'text-violet-700', A: 'text-emerald-600', B: 'text-blue-600',
  C: 'text-amber-600',  D: 'text-orange-600',  E: 'text-red-600',
}
const GRADE_BG: Record<string, string> = {
  S: 'bg-violet-100', A: 'bg-emerald-100', B: 'bg-blue-100',
  C: 'bg-amber-100',  D: 'bg-orange-100',  E: 'bg-red-100',
}
const GRADE_DESC: Record<string, string> = {
  S: 'Eccellenza assoluta', A: 'Ottimo', B: 'Buono',
  C: 'Nella norma', D: 'Da migliorare', E: 'Priorità intervento',
}
const COMPONENT_COLOR: Record<string, string> = {
  Composizione: 'bg-violet-500', Forza: 'bg-blue-500',
  Resistenza: 'bg-emerald-500', Costanza: 'bg-orange-500',
}
const COMPONENT_RING: Record<string, string> = {
  Composizione: '#7c3aed', Forza: '#3b82f6',
  Resistenza: '#10b981', Costanza: '#f97316',
}

function scoreRingColor(s: number) {
  return s >= 90 ? '#7c3aed' : s >= 80 ? '#059669' : s >= 70 ? '#2563eb' : s >= 60 ? '#d97706' : '#dc2626'
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

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const r = 60, cx = 80, cy = 80
  const C = 2 * Math.PI * r, ARC = (270 / 360) * C
  const color = scoreRingColor(score)
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="168" height="168" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="13"
          strokeLinecap="round" strokeDasharray={`${ARC} ${C}`} transform={`rotate(135 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="13"
          strokeLinecap="round" strokeDasharray={`${(score / 100) * ARC} ${C}`}
          transform={`rotate(135 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-black text-slate-900">{score}</div>
        <div className="text-xs text-slate-400">/100</div>
        <div className={`mt-1 text-xs font-black px-2 py-0.5 rounded-full ${GRADE_BG[grade]} ${GRADE_COLOR[grade]}`}>{grade}</div>
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function BodyScore() {
  const qc = useQueryClient()
  const [searchText, setSearchText]   = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchText, 300)

  const [tab, setTab] = useState<'score' | 'trend' | 'misurazioni' | 'scanner'>('score')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    weightKg: '', heightCm: '', bodyFatPct: '', muscleMassKg: '',
    waterPct: '', visceralFatIndex: '', source: 'Manual', notes: '',
  })
  const [inbodyExtId, setInbodyExtId] = useState('')
  const [fit3dExtId, setFit3dExtId]   = useState('')

  const { data: membersData } = useQuery({
    queryKey: ['members-search-bs', debouncedSearch],
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

  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ['bodyscore', 'score', lookupId],
    queryFn:  () => api.get<BodyScoreDto>(`/api/v1/bodyscore/members/${lookupId}/score`),
    enabled:  !!lookupId, retry: false,
  })
  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ['bodyscore', 'measurements', lookupId],
    queryFn:  () => api.get<BodyMeasurementDto[]>(`/api/v1/bodyscore/members/${lookupId}/measurements`),
    enabled:  !!lookupId, retry: false,
  })

  const score        = scoreData?.data    ?? (isDemoMember && selectedMember ? DEMO_SCORES[selectedMember.id]      : null)
  const measurements = histData?.data     ?? (isDemoMember && selectedMember ? DEMO_MEASUREMENTS[selectedMember.id] : [])
  const scoreTrend   = isDemoMember && selectedMember ? DEMO_SCORE_TREND[selectedMember.id] : []

  const latest = measurements[0]

  const addMutation = useMutation({
    mutationFn: (body: object) => api.post(`/api/v1/bodyscore/members/${selectedMember!.id}/measurements`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bodyscore'] }); setShowForm(false)
      setForm({ weightKg:'',heightCm:'',bodyFatPct:'',muscleMassKg:'',waterPct:'',visceralFatIndex:'',source:'Manual',notes:'' })
    },
  })
  const importInBodyMutation = useMutation({
    mutationFn: (externalId: string) => api.post(`/api/v1/bodyscan/members/${selectedMember!.id}/import/inbody`, { externalId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bodyscore'] }); setInbodyExtId('') },
  })
  const importFit3DMutation = useMutation({
    mutationFn: (externalId: string) => api.post(`/api/v1/bodyscan/members/${selectedMember!.id}/import/fit3d`, { externalId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bodyscore'] }); setFit3dExtId('') },
  })

  function selectMember(m: MemberDto) {
    setSelectedMember(m); setSearchText(m.fullName); setShowDropdown(false); setTab('score')
  }

  function handleAdd() {
    addMutation.mutate({
      weightKg:       form.weightKg       ? parseFloat(form.weightKg)       : null,
      heightCm:       form.heightCm       ? parseFloat(form.heightCm)       : null,
      bodyFatPct:     form.bodyFatPct     ? parseFloat(form.bodyFatPct)     : null,
      muscleMassKg:   form.muscleMassKg   ? parseFloat(form.muscleMassKg)   : null,
      waterPct:       form.waterPct       ? parseFloat(form.waterPct)       : null,
      visceralFatIndex: form.visceralFatIndex ? parseInt(form.visceralFatIndex) : null,
      source: form.source, notes: form.notes || null,
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Body Score</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Composizione, forza, resistenza e costanza — punteggio unificato da 0 a 100, gradi S/A/B/C/D/E.
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
          {selectedMember && <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-medium">✓ selezionato</span>}
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
                  {DEMO_SCORES[m.id] && (
                    <span className={`text-sm font-black px-2 py-0.5 rounded-full ${GRADE_BG[DEMO_SCORES[m.id].grade]} ${GRADE_COLOR[DEMO_SCORES[m.id].grade]}`}>
                      {DEMO_SCORES[m.id].grade}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {!selectedMember && <p className="mt-2 text-xs text-slate-400">Prova: "Giulia", "Marco", "Alessia", "Roberto"</p>}
      </div>

      {!selectedMember && (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-5xl">🏆</p>
          <p className="mt-3 text-lg font-semibold text-slate-700">Seleziona un socio per iniziare</p>
          <p className="text-sm text-slate-400">Vedi score, componenti, trend e storico misurazioni.</p>
        </div>
      )}

      {selectedMember && (
        <>
          {/* KPI strip */}
          {score && latest && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Body Score',    value: score.totalScore, unit: '/100', color: scoreRingColor(score.totalScore), sub: GRADE_DESC[score.grade] },
                { label: 'Peso attuale',  value: latest.weightKg ?? '—', unit: latest.weightKg ? ' kg' : '', color: '#334155', sub: `BMI ${latest.bmiComputed?.toFixed(1) ?? '—'}` },
                { label: 'Grasso corp.', value: latest.bodyFatPct ?? '—', unit: latest.bodyFatPct ? '%' : '', color: '#d97706', sub: `Muscolo ${latest.muscleMassKg ?? '—'} kg` },
                { label: 'Costanza',      value: score.components.find(c => c.name === 'Costanza')?.score ?? '—', unit: '/20', color: '#f97316', sub: 'frequenza ultime 60gg' },
              ].map(k => (
                <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}<span className="text-sm font-normal text-slate-400">{k.unit}</span></p>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
                  <p className="text-xs text-slate-400">{k.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
            {([
              ['score',       '🏆 Body Score'],
              ['trend',       '📈 Trend 6 mesi'],
              ['misurazioni', '📏 Misurazioni'],
              ['scanner',     '🔬 Scanner'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB SCORE ── */}
          {tab === 'score' && (
            <>
              {(scoreLoading && !isDemoMember) && <p className="text-sm text-slate-400 py-4">Calcolo in corso…</p>}
              {score ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                      {/* Gauge */}
                      <div className="flex flex-col items-center gap-3 flex-shrink-0">
                        <ScoreGauge score={score.totalScore} grade={score.grade} />
                        <div className="text-center">
                          <p className={`text-sm font-bold ${GRADE_COLOR[score.grade]}`}>{GRADE_DESC[score.grade]}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(score.computedAtUtc).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Components */}
                      <div className="flex-1 space-y-5">
                        {score.components.map(c => (
                          <div key={c.name}>
                            <div className="mb-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full`}
                                  style={{ background: COMPONENT_RING[c.name] ?? '#94a3b8' }} />
                                <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                              </div>
                              <span className="text-xs font-bold text-slate-500">{c.score} / {c.maxScore} pt</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${COMPONENT_COLOR[c.name] ?? 'bg-brand-500'} transition-all duration-500`}
                                style={{ width: `${(c.score / c.maxScore) * 100}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{c.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body composition visual */}
                  {latest && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <p className="mb-4 text-sm font-semibold text-slate-700">Composizione corporea — ultima misurazione</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { label: 'Peso',           value: latest.weightKg != null ? `${latest.weightKg} kg` : '—', icon: '⚖️' },
                          { label: 'Grasso corporeo', value: latest.bodyFatPct != null ? `${latest.bodyFatPct}%` : '—', icon: '🟡' },
                          { label: 'Massa muscolare', value: latest.muscleMassKg != null ? `${latest.muscleMassKg} kg` : '—', icon: '💪' },
                          { label: 'Acqua corporea',  value: latest.waterPct != null ? `${latest.waterPct}%` : '—', icon: '💧' },
                          { label: 'BMI',             value: latest.bmiComputed != null ? latest.bmiComputed.toFixed(1) : '—', icon: '📊' },
                          { label: 'Grasso viscerale', value: latest.visceralFatIndex != null ? `Lv. ${latest.visceralFatIndex}` : '—', icon: '🔴' },
                        ].map(m => (
                          <div key={m.label} className="rounded-lg bg-slate-50 px-4 py-3">
                            <p className="text-lg">{m.icon}</p>
                            <p className="text-lg font-black text-slate-800 mt-0.5">{m.value}</p>
                            <p className="text-xs text-slate-400">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Body comp bar */}
                      {latest.bodyFatPct != null && latest.muscleMassKg != null && latest.weightKg != null && (
                        <div className="mt-4">
                          <p className="text-xs text-slate-400 mb-2">Distribuzione peso corporeo</p>
                          <div className="flex h-5 w-full rounded-full overflow-hidden">
                            <div className="bg-amber-400 transition-all" style={{ width: `${latest.bodyFatPct}%` }} title={`Grasso ${latest.bodyFatPct}%`} />
                            <div className="bg-violet-500 transition-all" style={{ width: `${(latest.muscleMassKg / latest.weightKg) * 100}%` }} title={`Muscolo`} />
                            <div className="bg-blue-400 flex-1" title="Altro (acqua, ossa)" />
                          </div>
                          <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>Grasso {latest.bodyFatPct}%</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block"/>Muscolo {((latest.muscleMassKg/latest.weightKg)*100).toFixed(0)}%</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"/>Acqua+Ossa</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (!scoreLoading && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-5xl">📏</p>
                  <p className="mt-3 text-lg font-semibold text-slate-700">Nessun punteggio disponibile</p>
                  <p className="text-sm text-slate-400 mt-1">Registra almeno una misurazione per calcolare il Body Score.</p>
                </div>
              ))}
            </>
          )}

          {/* ── TAB TREND ── */}
          {tab === 'trend' && (
            <div className="space-y-4">
              {scoreTrend.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                  Dati di trend non disponibili per questo membro.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-1 text-sm font-semibold text-slate-700">Body Score — trend 6 mesi</p>
                    <p className="mb-4 text-xs text-slate-400">Evoluzione del punteggio complessivo.</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={scoreTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gBs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
                        <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v}`, 'Score']} />
                        <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5}
                          fill="url(#gBs)" dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <p className="mb-3 text-sm font-semibold text-slate-700">Grasso corporeo % — 6 mesi</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={scoreTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="mese" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} unit="%" />
                          <Tooltip formatter={(v: number) => [`${v}%`, 'Grasso']} />
                          <Line type="monotone" dataKey="bf" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <p className="mb-3 text-sm font-semibold text-slate-700">Peso corporeo — 6 mesi</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={scoreTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="mese" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} unit=" kg" domain={['auto', 'auto']} />
                          <Tooltip formatter={(v: number) => [`${v} kg`, 'Peso']} />
                          <Bar dataKey="peso" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Delta cards */}
                  {scoreTrend.length >= 2 && (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Δ Body Score', first: scoreTrend[0].score, last: scoreTrend[scoreTrend.length - 1].score, unit: 'pt', up: true },
                        { label: 'Δ Grasso',     first: scoreTrend[0].bf,    last: scoreTrend[scoreTrend.length - 1].bf,    unit: '%',  up: false },
                        { label: 'Δ Peso',       first: scoreTrend[0].peso,  last: scoreTrend[scoreTrend.length - 1].peso,  unit: 'kg', up: false },
                      ].map(d => {
                        const delta = parseFloat((d.last - d.first).toFixed(1))
                        const isGood = d.up ? delta > 0 : delta < 0
                        return (
                          <div key={d.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                            <p className={`text-xl font-black ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
                              {delta > 0 ? '+' : ''}{delta} {d.unit}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{d.label} (6 mesi)</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB MISURAZIONI ── */}
          {tab === 'misurazioni' && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-800">Storico misurazioni</h2>
                <button onClick={() => setShowForm(v => !v)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
                  {showForm ? '✕ Chiudi' : '+ Aggiungi'}
                </button>
              </div>

              {showForm && (
                <div className="border-b border-slate-100 bg-slate-50/40 p-6">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Nuova misurazione manuale</p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {([
                      ['Peso (kg)',             'weightKg'],
                      ['Altezza (cm)',          'heightCm'],
                      ['Grasso corporeo (%)',   'bodyFatPct'],
                      ['Massa muscolare (kg)',  'muscleMassKg'],
                      ['Acqua (%)',             'waterPct'],
                      ['Grasso viscerale (lv)', 'visceralFatIndex'],
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
                        {['Manual','InBody','Fit3D','AppleHealth','Garmin'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs text-slate-500">Note</label>
                      <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={handleAdd} disabled={addMutation.isPending}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                      {addMutation.isPending ? '⚙ Salvataggio…' : '💾 Salva'}
                    </button>
                    <button onClick={() => setShowForm(false)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                      Annulla
                    </button>
                  </div>
                </div>
              )}

              {(histLoading && !isDemoMember) ? (
                <p className="p-6 text-sm text-slate-400">Caricamento…</p>
              ) : measurements.length === 0 ? (
                <p className="p-6 text-sm text-slate-400">Nessuna misurazione registrata.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-400 uppercase tracking-wide">
                        <th className="px-6 py-3">Data</th>
                        <th className="px-4 py-3">Peso</th>
                        <th className="px-4 py-3">BMI</th>
                        <th className="px-4 py-3">Grasso %</th>
                        <th className="px-4 py-3">Muscolo</th>
                        <th className="px-4 py-3">Acqua %</th>
                        <th className="px-4 py-3">Viscerale</th>
                        <th className="px-4 py-3">Fonte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {measurements.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-3 font-medium text-slate-800 whitespace-nowrap">
                            {new Date(m.measuredAtUtc).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">{m.weightKg != null ? `${m.weightKg} kg` : '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{m.bmiComputed != null ? m.bmiComputed.toFixed(1) : '—'}</td>
                          <td className="px-4 py-3 text-amber-700 font-medium">{m.bodyFatPct != null ? `${m.bodyFatPct}%` : '—'}</td>
                          <td className="px-4 py-3 text-violet-700 font-medium">{m.muscleMassKg != null ? `${m.muscleMassKg} kg` : '—'}</td>
                          <td className="px-4 py-3 text-blue-700">{m.waterPct != null ? `${m.waterPct}%` : '—'}</td>
                          <td className="px-4 py-3 text-slate-600">{m.visceralFatIndex != null ? `Lv. ${m.visceralFatIndex}` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{m.source}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB SCANNER ── */}
          {tab === 'scanner' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: '📡 InBody', id: inbodyExtId, setId: setInbodyExtId, mutation: importInBodyMutation, placeholder: 'ID utente InBody', desc: 'Importa analisi BIA dalla bilancia InBody 570/770.' },
                  { label: '🔵 Fit3D', id: fit3dExtId, setId: setFit3dExtId, mutation: importFit3DMutation, placeholder: 'ID utente Fit3D', desc: 'Importa scansione corporea 3D (volumetria + postura).' },
                ].map(w => (
                  <div key={w.label} className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="mb-1 font-semibold text-slate-800">{w.label}</p>
                    <p className="mb-3 text-xs text-slate-400">{w.desc}</p>
                    <div className="flex gap-3">
                      <input value={w.id} onChange={e => w.setId(e.target.value)} placeholder={w.placeholder}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                      <button onClick={() => w.mutation.mutate(w.id)} disabled={!w.id || w.mutation.isPending}
                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 transition">
                        {w.mutation.isPending ? '…' : 'Importa'}
                      </button>
                    </div>
                    {w.mutation.isSuccess && <p className="mt-2 text-xs text-emerald-600 font-medium">✓ Importato con successo</p>}
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
