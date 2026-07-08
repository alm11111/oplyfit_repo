import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge } from '../components/ui'

// ── Types ──────────────────────────────────────────────────────────────────────
interface GymClassDto {
  id: string; name: string; discipline: string
  defaultDurationMinutes: number; defaultCapacity: number
  instructorName?: string | null; room?: string | null; colorKey?: string
}
interface ClassSessionDto {
  id: string; gymClassId: string; startUtc: string; endUtc: string
  capacity: number; bookedCount: number; room: string | null
  instructorName: string | null; status: string; streamingChannelName: string | null
}
interface BookingDto { id: string; memberName: string; bookedAt: string; status: string }

// ── Demo data ─────────────────────────────────────────────────────────────────
const CLASS_COLORS: Record<string, { bg: string; light: string; dot: string }> = {
  violet:  { bg: 'bg-violet-500',  light: 'bg-violet-50 border-violet-200 text-violet-700',  dot: 'bg-violet-500' },
  blue:    { bg: 'bg-blue-500',    light: 'bg-blue-50 border-blue-200 text-blue-700',         dot: 'bg-blue-500'   },
  orange:  { bg: 'bg-orange-500',  light: 'bg-orange-50 border-orange-200 text-orange-700',   dot: 'bg-orange-500' },
  red:     { bg: 'bg-red-500',     light: 'bg-red-50 border-red-200 text-red-700',            dot: 'bg-red-500'    },
  pink:    { bg: 'bg-pink-500',    light: 'bg-pink-50 border-pink-200 text-pink-700',         dot: 'bg-pink-500'   },
  amber:   { bg: 'bg-amber-500',   light: 'bg-amber-50 border-amber-200 text-amber-700',      dot: 'bg-amber-500'  },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700',dot: 'bg-emerald-500'},
  teal:    { bg: 'bg-teal-500',    light: 'bg-teal-50 border-teal-200 text-teal-700',         dot: 'bg-teal-500'   },
}
const DEMO_CLASSES: GymClassDto[] = [
  { id: 'c1', name: 'Yoga Flow',      discipline: 'Yoga',                defaultDurationMinutes: 60, defaultCapacity: 12, instructorName: 'Laura Bianchi',  room: 'Sala A',        colorKey: 'violet'  },
  { id: 'c2', name: 'CrossFit WOD',   discipline: 'CrossFit',            defaultDurationMinutes: 60, defaultCapacity: 10, instructorName: 'Marco Verdi',    room: 'Box CrossFit',  colorKey: 'orange'  },
  { id: 'c3', name: 'Spinning',       discipline: 'Ciclismo indoor',     defaultDurationMinutes: 45, defaultCapacity: 20, instructorName: 'Sara Esposito',  room: 'Sala Spinning', colorKey: 'blue'    },
  { id: 'c4', name: 'HIIT Power',     discipline: 'HIIT',                defaultDurationMinutes: 45, defaultCapacity: 15, instructorName: 'Fabio De Luca',  room: 'Sala B',        colorKey: 'red'     },
  { id: 'c5', name: 'Pilates',        discipline: 'Pilates',             defaultDurationMinutes: 60, defaultCapacity: 8,  instructorName: 'Chiara Lombardi',room: 'Sala A',        colorKey: 'pink'    },
  { id: 'c6', name: 'Boxe Fit',       discipline: 'Boxe',                defaultDurationMinutes: 60, defaultCapacity: 12, instructorName: 'Marco Verdi',    room: 'Ring',          colorKey: 'amber'   },
  { id: 'c7', name: 'Zumba',          discipline: 'Danza fitness',       defaultDurationMinutes: 60, defaultCapacity: 25, instructorName: 'Laura Bianchi',  room: 'Sala Grande',   colorKey: 'emerald' },
  { id: 'c8', name: 'Functional TRX', discipline: 'Functional Training', defaultDurationMinutes: 45, defaultCapacity: 10, instructorName: 'Fabio De Luca',  room: 'Sala B',        colorKey: 'teal'    },
]
// Sessions for current week (Mon=0 … Sun=6 offset from Monday)
const now = new Date()
const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0,0,0,0)
function sessionDate(dayOffset: number, hour: number, minute = 0) {
  const d = new Date(monday); d.setDate(monday.getDate() + dayOffset); d.setHours(hour, minute, 0, 0); return d.toISOString()
}
const DEMO_SESSIONS: ClassSessionDto[] = [
  // Lunedì
  { id: 's1',  gymClassId: 'c1', startUtc: sessionDate(0,9),  endUtc: sessionDate(0,10), capacity:12, bookedCount:11, room:'Sala A',        instructorName:'Laura Bianchi',  status:'Scheduled', streamingChannelName:null },
  { id: 's2',  gymClassId: 'c3', startUtc: sessionDate(0,10), endUtc: sessionDate(0,11), capacity:20, bookedCount:17, room:'Sala Spinning',  instructorName:'Sara Esposito',  status:'Scheduled', streamingChannelName:null },
  { id: 's3',  gymClassId: 'c4', startUtc: sessionDate(0,18), endUtc: sessionDate(0,19), capacity:15, bookedCount:12, room:'Sala B',         instructorName:'Fabio De Luca',  status:'Scheduled', streamingChannelName:null },
  { id: 's4',  gymClassId: 'c7', startUtc: sessionDate(0,20), endUtc: sessionDate(0,21), capacity:25, bookedCount:22, room:'Sala Grande',    instructorName:'Laura Bianchi',  status:'Scheduled', streamingChannelName:null },
  // Martedì
  { id: 's5',  gymClassId: 'c2', startUtc: sessionDate(1,7),  endUtc: sessionDate(1,8),  capacity:10, bookedCount:10, room:'Box CrossFit',   instructorName:'Marco Verdi',    status:'Scheduled', streamingChannelName:null },
  { id: 's6',  gymClassId: 'c5', startUtc: sessionDate(1,10), endUtc: sessionDate(1,11), capacity:8,  bookedCount:6,  room:'Sala A',         instructorName:'Chiara Lombardi',status:'Scheduled', streamingChannelName:null },
  { id: 's7',  gymClassId: 'c8', startUtc: sessionDate(1,18), endUtc: sessionDate(1,19), capacity:10, bookedCount:8,  room:'Sala B',         instructorName:'Fabio De Luca',  status:'Scheduled', streamingChannelName:null },
  // Mercoledì
  { id: 's8',  gymClassId: 'c1', startUtc: sessionDate(2,9),  endUtc: sessionDate(2,10), capacity:12, bookedCount:9,  room:'Sala A',         instructorName:'Laura Bianchi',  status:'Live',      streamingChannelName:'yoga-live-ch' },
  { id: 's9',  gymClassId: 'c3', startUtc: sessionDate(2,11), endUtc: sessionDate(2,12), capacity:20, bookedCount:20, room:'Sala Spinning',  instructorName:'Sara Esposito',  status:'Scheduled', streamingChannelName:null },
  { id: 's10', gymClassId: 'c6', startUtc: sessionDate(2,17), endUtc: sessionDate(2,18), capacity:12, bookedCount:9,  room:'Ring',           instructorName:'Marco Verdi',    status:'Scheduled', streamingChannelName:null },
  { id: 's11', gymClassId: 'c4', startUtc: sessionDate(2,19), endUtc: sessionDate(2,20), capacity:15, bookedCount:15, room:'Sala B',         instructorName:'Fabio De Luca',  status:'Scheduled', streamingChannelName:null },
  // Giovedì
  { id: 's12', gymClassId: 'c5', startUtc: sessionDate(3,9),  endUtc: sessionDate(3,10), capacity:8,  bookedCount:7,  room:'Sala A',         instructorName:'Chiara Lombardi',status:'Scheduled', streamingChannelName:null },
  { id: 's13', gymClassId: 'c2', startUtc: sessionDate(3,10), endUtc: sessionDate(3,11), capacity:10, bookedCount:8,  room:'Box CrossFit',   instructorName:'Marco Verdi',    status:'Scheduled', streamingChannelName:null },
  { id: 's14', gymClassId: 'c7', startUtc: sessionDate(3,18), endUtc: sessionDate(3,19), capacity:25, bookedCount:18, room:'Sala Grande',    instructorName:'Laura Bianchi',  status:'Scheduled', streamingChannelName:null },
  // Venerdì
  { id: 's15', gymClassId: 'c8', startUtc: sessionDate(4,7),  endUtc: sessionDate(4,8),  capacity:10, bookedCount:6,  room:'Sala B',         instructorName:'Fabio De Luca',  status:'Scheduled', streamingChannelName:null },
  { id: 's16', gymClassId: 'c1', startUtc: sessionDate(4,10), endUtc: sessionDate(4,11), capacity:12, bookedCount:10, room:'Sala A',         instructorName:'Laura Bianchi',  status:'Scheduled', streamingChannelName:null },
  { id: 's17', gymClassId: 'c4', startUtc: sessionDate(4,17), endUtc: sessionDate(4,18), capacity:15, bookedCount:13, room:'Sala B',         instructorName:'Fabio De Luca',  status:'Scheduled', streamingChannelName:null },
  { id: 's18', gymClassId: 'c6', startUtc: sessionDate(4,19), endUtc: sessionDate(4,20), capacity:12, bookedCount:11, room:'Ring',           instructorName:'Marco Verdi',    status:'Scheduled', streamingChannelName:null },
  // Sabato
  { id: 's19', gymClassId: 'c2', startUtc: sessionDate(5,9),  endUtc: sessionDate(5,10), capacity:10, bookedCount:10, room:'Box CrossFit',   instructorName:'Marco Verdi',    status:'Scheduled', streamingChannelName:null },
  { id: 's20', gymClassId: 'c3', startUtc: sessionDate(5,10), endUtc: sessionDate(5,11), capacity:20, bookedCount:14, room:'Sala Spinning',  instructorName:'Sara Esposito',  status:'Scheduled', streamingChannelName:null },
  { id: 's21', gymClassId: 'c7', startUtc: sessionDate(5,11), endUtc: sessionDate(5,12), capacity:25, bookedCount:21, room:'Sala Grande',    instructorName:'Laura Bianchi',  status:'Scheduled', streamingChannelName:null },
]

const DEMO_BOOKINGS: Record<string, BookingDto[]> = {
  s1: [
    { id: 'b1',  memberName: 'Giulia Ferretti',  bookedAt: '2026-06-22T10:00:00Z', status: 'Confirmed' },
    { id: 'b2',  memberName: 'Marco Bianchi',    bookedAt: '2026-06-22T10:05:00Z', status: 'Confirmed' },
    { id: 'b3',  memberName: 'Alessia Romano',   bookedAt: '2026-06-22T10:10:00Z', status: 'Confirmed' },
    { id: 'b4',  memberName: 'Sara Esposito',    bookedAt: '2026-06-22T10:15:00Z', status: 'Waitlist'  },
  ],
}

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const ICONS: Record<string, string> = {
  Yoga: '🧘', CrossFit: '🏋️', 'Ciclismo indoor': '🚴', HIIT: '⚡', Pilates: '🌸',
  Boxe: '🥊', 'Danza fitness': '💃', 'Functional Training': '🎯',
}

function fillColor(booked: number, capacity: number) {
  const pct = booked / capacity
  if (pct >= 1) return 'text-red-600 font-bold'
  if (pct >= 0.8) return 'text-amber-600 font-semibold'
  return 'text-emerald-600'
}

const EMPTY_CLASS = { name: '', discipline: 'Yoga', duration: '60', capacity: '12', room: '', instructorName: '' }
const EMPTY_SESSION = { classId: '', date: '', time: '', capacity: '' }

// ── Component ──────────────────────────────────────────────────────────────────
export default function Classes() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'calendario' | 'catalogo' | 'sessioni' | 'prenotazioni'>('calendario')
  const [showClassForm, setShowClassForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [classForm, setClassForm] = useState({ ...EMPTY_CLASS })
  const [sessionForm, setSessionForm] = useState({ ...EMPTY_SESSION })
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [streamTokens, setStreamTokens] = useState<Record<string, string>>({})

  const { data: classesData, isError: classesErr } = useQuery({
    queryKey: ['classes'], queryFn: () => api.get<GymClassDto[]>('/api/v1/classes'), retry: false,
  })
  const { data: sessionsData, isError: sessionsErr } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => { const from = new Date().toISOString(); const to = new Date(Date.now() + 14 * 864e5).toISOString(); return api.get<ClassSessionDto[]>(`/api/v1/sessions?fromUtc=${from}&toUtc=${to}`) },
    retry: false, enabled: tab !== 'catalogo',
  })

  const classes: GymClassDto[]      = classesData?.data ?? DEMO_CLASSES
  const sessions: ClassSessionDto[] = sessionsData?.data ?? DEMO_SESSIONS
  const classMap = Object.fromEntries(classes.map(c => [c.id, c]))

  const createClass = useMutation({
    mutationFn: () => api.post('/api/v1/classes', {
      name: classForm.name, discipline: classForm.discipline,
      defaultDurationMinutes: Number(classForm.duration), defaultCapacity: Number(classForm.capacity),
    }),
    onSuccess: () => { setShowClassForm(false); setClassForm({ ...EMPTY_CLASS }); qc.invalidateQueries({ queryKey: ['classes'] }) },
  })

  const createSession = useMutation({
    mutationFn: () => api.post('/api/v1/sessions', {
      gymClassId: sessionForm.classId, startUtc: new Date(`${sessionForm.date}T${sessionForm.time}`).toISOString(),
      capacity: sessionForm.capacity ? Number(sessionForm.capacity) : null,
    }),
    onSuccess: () => { setShowSessionForm(false); setSessionForm({ ...EMPTY_SESSION }); qc.invalidateQueries({ queryKey: ['sessions'] }) },
  })

  const startStream = useMutation({
    mutationFn: (sessionId: string) => api.post<{ token: string; channel: string }>(`/api/v1/sessions/${sessionId}/stream/start`, {}),
    onSuccess: (res, sessionId) => { if (res.data) setStreamTokens(t => ({ ...t, [sessionId]: res.data!.channel })) },
  })

  // ── KPIs ──
  const weekSessions   = sessions.filter(s => { const d = new Date(s.startUtc); return d >= monday && d < new Date(monday.getTime() + 7*864e5) })
  const totalBooked    = sessions.reduce((a, s) => a + s.bookedCount, 0)
  const totalCapacity  = sessions.reduce((a, s) => a + s.capacity, 0)
  const fillRate       = totalCapacity > 0 ? Math.round(totalBooked / totalCapacity * 100) : 0
  const liveSessions   = sessions.filter(s => s.status === 'Live').length
  const fullSessions   = sessions.filter(s => s.bookedCount >= s.capacity).length

  // ── Calendario helpers ──
  const sessionsByDay: ClassSessionDto[][] = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(monday); dayStart.setDate(monday.getDate() + i)
    const dayEnd   = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1)
    return sessions
      .filter(s => { const d = new Date(s.startUtc); return d >= dayStart && d < dayEnd })
      .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classi & Prenotazioni</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestisci il palinsesto, le prenotazioni e il live streaming</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowClassForm(v => !v)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            + Tipo classe
          </button>
          <button onClick={() => setShowSessionForm(v => !v)}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
            + Sessione
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Sessioni settimana', value: weekSessions.length.toString(), color: 'text-slate-800' },
          { label: 'Fill rate medio',    value: `${fillRate}%`,                 color: fillRate >= 80 ? 'text-emerald-600' : 'text-brand-600' },
          { label: 'Prenotazioni',       value: totalBooked.toString(),          color: 'text-slate-800' },
          { label: 'Classi full',        value: fullSessions.toString(),         color: fullSessions > 0 ? 'text-red-600' : 'text-slate-400' },
          { label: 'Live ora',           value: liveSessions.toString(),         color: liveSessions > 0 ? 'text-red-600' : 'text-slate-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
            {k.label === 'Live ora' && liveSessions > 0 && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-red-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />streaming attivo
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Form nuova classe */}
      {showClassForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Nuovo tipo di classe</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Nome *', key: 'name', placeholder: 'Yoga Flow' },
              { label: 'Disciplina *', key: 'discipline', placeholder: 'Yoga' },
              { label: 'Durata (min)', key: 'duration', placeholder: '60', type: 'number' },
              { label: 'Capienza posti', key: 'capacity', placeholder: '12', type: 'number' },
              { label: 'Sala default', key: 'room', placeholder: 'Sala A' },
              { label: 'Istruttore default', key: 'instructorName', placeholder: 'Nome istruttore' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                <input type={f.type ?? 'text'} placeholder={f.placeholder}
                  value={(classForm as Record<string, string>)[f.key]}
                  onChange={e => setClassForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowClassForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            <button disabled={!classForm.name || createClass.isPending} onClick={() => createClass.mutate()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
              {createClass.isPending ? 'Salvataggio…' : 'Crea classe'}
            </button>
          </div>
        </div>
      )}

      {/* Form nuova sessione */}
      {showSessionForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Programma sessione</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo di classe *</label>
              <select value={sessionForm.classId} onChange={e => setSessionForm(f => ({ ...f, classId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                <option value="">Scegli…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} · {c.discipline}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data *</label>
              <input type="date" value={sessionForm.date} onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Orario *</label>
              <input type="time" value={sessionForm.time} onChange={e => setSessionForm(f => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowSessionForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            <button disabled={!sessionForm.classId || !sessionForm.date || !sessionForm.time || createSession.isPending}
              onClick={() => createSession.mutate()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
              {createSession.isPending ? 'Salvataggio…' : 'Aggiungi sessione'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['calendario', 'catalogo', 'sessioni', 'prenotazioni'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize ${tab === t
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'calendario' ? '📅 Calendario'
              : t === 'catalogo' ? `📚 Catalogo (${classes.length})`
              : t === 'sessioni' ? `🗓 Sessioni (${sessions.length})`
              : '🎟 Prenotazioni'}
          </button>
        ))}
      </div>

      {/* ── CALENDARIO SETTIMANALE ── */}
      {tab === 'calendario' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Settimana del {monday.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })} –{' '}
            {new Date(monday.getTime() + 6 * 864e5).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
          </p>
          <div className="grid grid-cols-7 gap-2">
            {GIORNI.map((g, dayIdx) => {
              const dayDate = new Date(monday); dayDate.setDate(monday.getDate() + dayIdx)
              const isToday = dayDate.toDateString() === new Date().toDateString()
              const daySessions = sessionsByDay[dayIdx]
              return (
                <div key={g} className={`rounded-xl border ${isToday ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 bg-white'} min-h-[200px]`}>
                  <div className={`rounded-t-xl px-3 py-2 text-center text-xs font-semibold ${isToday ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                    <div>{g}</div>
                    <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>
                      {dayDate.getDate()}
                    </div>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {daySessions.length === 0
                      ? <p className="py-3 text-center text-xs text-slate-300">—</p>
                      : daySessions.map(s => {
                          const cls = classMap[s.gymClassId]
                          const color = CLASS_COLORS[cls?.colorKey ?? 'violet'] ?? CLASS_COLORS.violet
                          const startH = new Date(s.startUtc).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                          const pct = Math.round(s.bookedCount / s.capacity * 100)
                          return (
                            <div key={s.id} onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                              className={`cursor-pointer rounded-lg border p-1.5 text-xs ${color.light} transition-all`}>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold truncate">{cls?.name ?? '—'}</span>
                                {s.status === 'Live' && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500 animate-pulse" />}
                              </div>
                              <div className="mt-0.5 text-slate-500">{startH}</div>
                              <div className="mt-1 flex items-center gap-1">
                                <div className="h-1 flex-1 rounded-full bg-slate-200 overflow-hidden">
                                  <div className={`h-1 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="flex-shrink-0 text-slate-400">{s.bookedCount}/{s.capacity}</span>
                              </div>
                            </div>
                          )
                        })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CATALOGO CLASSI ── */}
      {tab === 'catalogo' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map(c => {
            const color = CLASS_COLORS[c.colorKey ?? 'violet'] ?? CLASS_COLORS.violet
            const icon = ICONS[c.discipline] ?? '💪'
            const classSessions = sessions.filter(s => s.gymClassId === c.id)
            const avgFill = classSessions.length > 0
              ? Math.round(classSessions.reduce((a, s) => a + s.bookedCount / s.capacity, 0) / classSessions.length * 100)
              : 0
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className={`${color.bg} p-4 text-white`}>
                  <div className="text-3xl mb-1">{icon}</div>
                  <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
                  <p className="text-sm text-white/75">{c.discipline}</p>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>⏱ Durata</span><span className="font-medium text-slate-700">{c.defaultDurationMinutes} min</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>👥 Capienza</span><span className="font-medium text-slate-700">{c.defaultCapacity} posti</span>
                  </div>
                  {c.room && <div className="flex justify-between text-slate-500">
                    <span>📍 Sala</span><span className="font-medium text-slate-700">{c.room}</span>
                  </div>}
                  {c.instructorName && <div className="flex justify-between text-slate-500">
                    <span>👤 Istruttore</span><span className="font-medium text-slate-700 text-right">{c.instructorName}</span>
                  </div>}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-slate-500 mb-1">
                      <span>Fill rate</span><span className={`font-semibold ${avgFill >= 80 ? 'text-emerald-600' : 'text-slate-600'}`}>{avgFill}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className={`h-1.5 rounded-full ${color.bg}`} style={{ width: `${avgFill}%` }} />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{classSessions.length} sessioni questa settimana</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SESSIONI ── */}
      {tab === 'sessioni' && (
        <div className="space-y-2">
          {sessions.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Nessuna sessione programmata.</p>}
          {sessions.map(s => {
            const cls = classMap[s.gymClassId]
            const color = CLASS_COLORS[cls?.colorKey ?? 'violet'] ?? CLASS_COLORS.violet
            const icon  = ICONS[cls?.discipline ?? ''] ?? '💪'
            const pct   = Math.round(s.bookedCount / s.capacity * 100)
            const start = new Date(s.startUtc)
            const isExpanded = expandedSession === s.id
            return (
              <Fragment key={s.id}>
                <div onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl flex-shrink-0 ${color.bg} text-white`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{cls?.name ?? '—'}</span>
                        {s.status === 'Live' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />🔴 Live
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${color.light}`}>{cls?.discipline}</span>
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500 flex gap-3 flex-wrap">
                        <span>📅 {start.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                        <span>🕐 {start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                        {s.room && <span>📍 {s.room}</span>}
                        {s.instructorName && <span>👤 {s.instructorName}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-bold ${fillColor(s.bookedCount, s.capacity)}`}>{s.bookedCount}/{s.capacity}</p>
                      <div className="mt-1 w-24 h-1.5 rounded-full bg-slate-100">
                        <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{pct}% piena</p>
                    </div>
                    <div className="flex-shrink-0 flex gap-2" onClick={e => e.stopPropagation()}>
                      {s.status !== 'Live'
                        ? <button onClick={() => startStream.mutate(s.id)}
                            className="rounded-lg border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors">
                            🔴 Avvia live
                          </button>
                        : <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700">● Live</span>
                      }
                    </div>
                  </div>
                </div>
                {/* Pannello prenotazioni espanso */}
                {isExpanded && (
                  <div className="rounded-b-xl border border-t-0 border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Iscritti a questa sessione</p>
                    {(DEMO_BOOKINGS[s.id] ?? []).length === 0
                      ? <p className="text-sm text-slate-400">Nessuna prenotazione registrata nel demo.</p>
                      : <div className="space-y-1">
                          {(DEMO_BOOKINGS[s.id] ?? []).map(b => (
                            <div key={b.id} className="flex items-center justify-between">
                              <span className="text-sm text-slate-700">{b.memberName}</span>
                              <Badge tone={b.status === 'Confirmed' ? 'green' : 'amber'}>{b.status === 'Confirmed' ? 'Confermato' : 'Lista attesa'}</Badge>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      )}

      {/* ── PRENOTAZIONI ── */}
      {tab === 'prenotazioni' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Sessione</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Sala</th>
                <th className="px-4 py-3">Istruttore</th>
                <th className="px-4 py-3">Fill</th>
                <th className="px-4 py-3">Lista attesa</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sessions.map(s => {
                const cls   = classMap[s.gymClassId]
                const color = CLASS_COLORS[cls?.colorKey ?? 'violet'] ?? CLASS_COLORS.violet
                const pct   = Math.round(s.bookedCount / s.capacity * 100)
                const waitlist = Math.max(0, s.bookedCount - s.capacity)
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs ${color.bg} text-white`}>
                          {ICONS[cls?.discipline ?? ''] ?? '💪'}
                        </div>
                        <span className="font-medium text-slate-800">{cls?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(s.startUtc).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}{' '}
                      {new Date(s.startUtc).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.room ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{s.instructorName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100">
                          <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${fillColor(s.bookedCount, s.capacity)}`}>{s.bookedCount}/{s.capacity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{waitlist > 0 ? `+${waitlist} in attesa` : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.status === 'Live' ? 'red' : s.bookedCount >= s.capacity ? 'amber' : 'green'}>
                        {s.status === 'Live' ? '🔴 Live' : s.bookedCount >= s.capacity ? 'Completa' : 'Disponibile'}
                      </Badge>
                    </td>
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
