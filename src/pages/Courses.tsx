import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CourseSummaryDto {
  id: string; title: string; description: string | null; category: string
  level: string; instructorName: string | null; coverImageUrl: string | null
  isFree: boolean; priceEur: number | null; isPublished: boolean; lessonCount: number
}
interface CourseLessonDto {
  id: string; courseId: string; title: string; description: string | null
  videoUrl: string | null; durationMinutes: number; sortOrder: number; isPublished: boolean
}
interface CourseDetailDto {
  course: CourseSummaryDto; lessons: CourseLessonDto[]
  completedLessonIds: string[] | null; isEnrolled: boolean
}
interface LiveSessionDto {
  id: string; title: string; description: string | null; instructorName: string | null
  category: string; scheduledAtUtc: string; durationMinutes: number
  maxParticipants: number | null; isPublished: boolean; roomUrl: string | null
}

// ── Demo data ─────────────────────────────────────────────────────────────────
function daysAgo(n: number, h = 10) { const d = new Date('2026-06-24T10:00:00Z'); d.setDate(d.getDate() - n); d.setHours(h); return d.toISOString() }
function daysAhead(n: number, h = 18) { const d = new Date('2026-06-24T10:00:00Z'); d.setDate(d.getDate() + n); d.setHours(h); return d.toISOString() }

const DEMO_COURSES: CourseSummaryDto[] = [
  { id: 'cs1', title: 'Forza Funzionale Base', description: 'Costruisci una base solida con i movimenti fondamentali: squat, deadlift, press. 6 settimane di progressione lineare.', category: 'Strength', level: 'Beginner', instructorName: 'Marco Bianchi', coverImageUrl: null, isFree: true, priceEur: null, isPublished: true, lessonCount: 5 },
  { id: 'cs2', title: 'HIIT Brucia Grassi',   description: 'Protocollo ad alta intensità per massimizzare il dispendio calorico. 20-30 minuti a sessione.', category: 'Cardio', level: 'Intermediate', instructorName: 'Giulia Ferretti', coverImageUrl: null, isFree: false, priceEur: 19.99, isPublished: true, lessonCount: 8 },
  { id: 'cs3', title: 'Yoga Mattutino',        description: 'Sequenze di yoga per iniziare la giornata con energia e flessibilità. Adatto a tutti i livelli.', category: 'Yoga', level: 'Beginner', instructorName: 'Alessia Romano', coverImageUrl: null, isFree: true, priceEur: null, isPublished: true, lessonCount: 6 },
  { id: 'cs4', title: 'Pilates Core Avanzato', description: 'Rinforzo profondo del core con metodo Pilates. Prerequisito: almeno 6 mesi di Pilates base.', category: 'Pilates', level: 'Advanced', instructorName: 'Federica Conti', coverImageUrl: null, isFree: false, priceEur: 29.99, isPublished: true, lessonCount: 7 },
  { id: 'cs5', title: 'Nutrizione Sportiva',   description: 'Principi di alimentazione per atleti: timing dei pasti, macros, integrazione e idratazione.', category: 'Nutrition', level: 'Intermediate', instructorName: 'Dr. Marco Venezia', coverImageUrl: null, isFree: false, priceEur: 24.99, isPublished: true, lessonCount: 4 },
  { id: 'cs6', title: 'Mindfulness e Sport',   description: 'Tecniche di mindfulness applicate alla performance sportiva. Meditazione, respirazione e focus mentale.', category: 'Mindfulness', level: 'Beginner', instructorName: 'Dr.ssa Anna Ferri', coverImageUrl: null, isFree: false, priceEur: 14.99, isPublished: false, lessonCount: 3 },
]
const DEMO_LESSONS: Record<string, CourseLessonDto[]> = {
  cs1: [
    { id: 'l11', courseId: 'cs1', title: 'Introduzione e valutazione mobilità',  description: null, videoUrl: null, durationMinutes: 15, sortOrder: 1, isPublished: true },
    { id: 'l12', courseId: 'cs1', title: 'Squat: tecnica base e varianti',        description: null, videoUrl: null, durationMinutes: 22, sortOrder: 2, isPublished: true },
    { id: 'l13', courseId: 'cs1', title: 'Deadlift: postura e progressione',      description: null, videoUrl: null, durationMinutes: 25, sortOrder: 3, isPublished: true },
    { id: 'l14', courseId: 'cs1', title: 'Press verticale e orizzontale',         description: null, videoUrl: null, durationMinutes: 20, sortOrder: 4, isPublished: true },
    { id: 'l15', courseId: 'cs1', title: 'Programma 6 settimane completo',        description: null, videoUrl: null, durationMinutes: 18, sortOrder: 5, isPublished: true },
  ],
  cs2: [
    { id: 'l21', courseId: 'cs2', title: 'Introduzione al HIIT',                 description: null, videoUrl: null, durationMinutes: 12, sortOrder: 1, isPublished: true },
    { id: 'l22', courseId: 'cs2', title: 'Protocollo Tabata base',               description: null, videoUrl: null, durationMinutes: 25, sortOrder: 2, isPublished: true },
    { id: 'l23', courseId: 'cs2', title: 'Circuit training corpo libero',         description: null, videoUrl: null, durationMinutes: 28, sortOrder: 3, isPublished: true },
    { id: 'l24', courseId: 'cs2', title: 'Sprint intervals su tapis roulant',    description: null, videoUrl: null, durationMinutes: 30, sortOrder: 4, isPublished: true },
  ],
  cs3: [
    { id: 'l31', courseId: 'cs3', title: 'Saluto al sole - sequenza base',       description: null, videoUrl: null, durationMinutes: 20, sortOrder: 1, isPublished: true },
    { id: 'l32', courseId: 'cs3', title: 'Posizioni di equilibrio',              description: null, videoUrl: null, durationMinutes: 18, sortOrder: 2, isPublished: true },
    { id: 'l33', courseId: 'cs3', title: 'Apertura delle anche e torsioni',      description: null, videoUrl: null, durationMinutes: 22, sortOrder: 3, isPublished: true },
  ],
}
const DEMO_LIVE: LiveSessionDto[] = [
  { id: 'lv1', title: 'HIIT Live — Lunedì',    description: 'Sessione HIIT in diretta, 30 min di lavoro intenso.', instructorName: 'Giulia Ferretti', category: 'Cardio',   scheduledAtUtc: daysAhead(3, 7),  durationMinutes: 30,  maxParticipants: 25, isPublished: true,  roomUrl: null },
  { id: 'lv2', title: 'Yoga Serale',            description: 'Rilassamento e flessibilità dopo il lavoro.',         instructorName: 'Alessia Romano',  category: 'Yoga',    scheduledAtUtc: daysAhead(1, 19), durationMinutes: 45,  maxParticipants: 20, isPublished: true,  roomUrl: null },
  { id: 'lv3', title: 'Forza & Condizionamento',description: 'Full body con bilanciere e kettlebell.',              instructorName: 'Marco Bianchi',   category: 'Strength',scheduledAtUtc: daysAhead(5, 9),  durationMinutes: 60,  maxParticipants: 15, isPublished: true,  roomUrl: null },
  { id: 'lv4', title: 'Mindfulness Mattutina',  description: 'Meditazione e respirazione per iniziare la giornata.', instructorName: 'Dr.ssa Anna Ferri', category: 'Mindfulness', scheduledAtUtc: daysAhead(7, 8), durationMinutes: 30, maxParticipants: null, isPublished: false, roomUrl: null },
]
const DEMO_DETAIL: Record<string, CourseDetailDto> = Object.fromEntries(
  DEMO_COURSES.map(c => [c.id, { course: c, lessons: DEMO_LESSONS[c.id] ?? [], completedLessonIds: null, isEnrolled: false }])
)

// ── Helpers ───────────────────────────────────────────────────────────────────
const CAT_ICON: Record<string, string> = { Strength: '💪', Cardio: '🏃', Yoga: '🧘', Pilates: '🤸', Nutrition: '🥗', Mindfulness: '🧠', Mobility: '🦵', Other: '⭐' }
const LEVEL_COLOR: Record<string, string> = { Beginner: 'bg-green-100 text-green-700', Intermediate: 'bg-amber-100 text-amber-700', Advanced: 'bg-red-100 text-red-700' }
function fmtDT(iso: string) { return new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }

// ── Component ─────────────────────────────────────────────────────────────────
export default function Courses() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'courses' | 'live' | 'add-course' | 'add-live'>('courses')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', durationMinutes: '10', sortOrder: '1' })
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'Strength', level: 'Beginner', instructorName: '', isFree: true, priceEur: '' })
  const [liveForm, setLiveForm] = useState({ title: '', description: '', instructorName: '', category: 'Strength', scheduledAtUtc: '', durationMinutes: '45', maxParticipants: '' })

  const { data: coursesData } = useQuery({ queryKey: ['courses', 'admin'],                 queryFn: () => api.get<CourseSummaryDto[]>('/api/v1/courses'),                                                retry: false })
  const { data: detailData }  = useQuery({ queryKey: ['courses', 'detail', selectedCourse], queryFn: () => api.get<CourseDetailDto>(`/api/v1/courses/${selectedCourse}`),  enabled: !!selectedCourse, retry: false })
  const { data: liveData }    = useQuery({ queryKey: ['courses', 'live'],                  queryFn: () => api.get<LiveSessionDto[]>('/api/v1/courses/live'),                enabled: tab === 'live',   retry: false })

  const rawCourses = (coursesData?.data as any)?.data ?? coursesData?.data ?? []
  const rawLive    = (liveData?.data    as any)?.data ?? liveData?.data    ?? []
  const rawDetail  = (detailData?.data  as any)?.data ?? detailData?.data  ?? null

  const courses     = (Array.isArray(rawCourses) && rawCourses.length > 0 ? rawCourses : DEMO_COURSES) as CourseSummaryDto[]
  const liveSessions= (Array.isArray(rawLive)    && rawLive.length    > 0 ? rawLive    : DEMO_LIVE)    as LiveSessionDto[]
  const detail: CourseDetailDto | null = rawDetail ?? (selectedCourse ? (DEMO_DETAIL[selectedCourse] ?? null) : null)

  const publishCourseMutation = useMutation({ mutationFn: ({ id, publish }: { id: string; publish: boolean }) => api.put(`/api/v1/courses/${id}/publish`, { publish }), onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }) })
  const publishLiveMutation   = useMutation({ mutationFn: ({ id, publish }: { id: string; publish: boolean }) => api.put(`/api/v1/courses/live/${id}/publish`, { publish }), onSuccess: () => qc.invalidateQueries({ queryKey: ['courses', 'live'] }) })
  const createCourseMutation  = useMutation({ mutationFn: (body: object) => api.post('/api/v1/courses', body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); setTab('courses') } })
  const addLessonMutation     = useMutation({ mutationFn: ({ courseId, body }: { courseId: string; body: object }) => api.post(`/api/v1/courses/${courseId}/lessons`, body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses', 'detail', selectedCourse] }); setLessonForm({ title: '', videoUrl: '', durationMinutes: '10', sortOrder: '1' }) } })
  const createLiveMutation    = useMutation({ mutationFn: (body: object) => api.post('/api/v1/courses/live', body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses', 'live'] }); setTab('live') } })

  const totalMinutes = DEMO_LESSONS ? Object.values(DEMO_LESSONS).flat().reduce((s, l) => s + l.durationMinutes, 0) : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Corsi & Live Streaming</h1>
          <p className="mt-0.5 text-sm text-slate-500">Corsi on-demand con lezioni video e sessioni live per i soci.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: '🎓', label: 'Corsi totali',    value: courses.length,                           sub: `${courses.filter(c => c.isPublished).length} pubblicati`, color: 'text-slate-800' },
          { icon: '📚', label: 'Lezioni totali',  value: courses.reduce((s, c) => s + c.lessonCount, 0), sub: `${totalMinutes} min di contenuto`,          color: 'text-brand-600' },
          { icon: '📹', label: 'Sessioni live',   value: liveSessions.length,                      sub: `${liveSessions.filter(s => s.isPublished).length} pubblicate`, color: 'text-violet-600' },
          { icon: '💰', label: 'Corsi a pagamento',value: courses.filter(c => !c.isFree).length,   sub: 'con prezzo configurato',                            color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl">{k.icon}</p>
            <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([
          ['courses',    `🎓 Corsi (${courses.length})`],
          ['live',       `📹 Live (${liveSessions.length})`],
          ['add-course', '+ Corso'],
          ['add-live',   '+ Live'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Corsi ── */}
      {tab === 'courses' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {courses.map(c => (
              <div key={c.id} onClick={() => setSelectedCourse(selectedCourse === c.id ? null : c.id)}
                className={`cursor-pointer rounded-xl border bg-white p-4 transition hover:border-brand-300 ${selectedCourse === c.id ? 'border-brand-500 ring-1 ring-brand-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{CAT_ICON[c.category] ?? '📚'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLOR[c.level] ?? 'bg-slate-100 text-slate-500'}`}>{c.level}</span>
                        <span className="text-xs text-slate-400">{c.lessonCount} lezioni</span>
                        {c.instructorName && <span className="text-xs text-slate-400">· {c.instructorName}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-slate-700">{c.isFree ? 'Gratuito' : `€${c.priceEur}`}</span>
                    <button onClick={e => { e.stopPropagation(); publishCourseMutation.mutate({ id: c.id, publish: !c.isPublished }) }}
                      className={`rounded-full px-3 py-0.5 text-xs font-medium ${c.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.isPublished ? '✅ Pubblicato' : 'Bozza'}
                    </button>
                  </div>
                </div>
                {c.description && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{c.description}</p>}
              </div>
            ))}
          </div>

          {selectedCourse && detail && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-semibold text-slate-800">{detail.course.title} — Lezioni</h2>
              {detail.lessons.length === 0 && <p className="text-sm text-slate-400 mb-4">Nessuna lezione ancora. Aggiungila qui sotto.</p>}
              {detail.lessons.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{l.title}</p>
                    <p className="text-xs text-slate-400">{l.durationMinutes} min{l.videoUrl ? ' · 🎬 video' : ''}</p>
                  </div>
                  {!l.isPublished && <span className="text-xs text-slate-400 flex-shrink-0">bozza</span>}
                </div>
              ))}
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">+ Aggiungi lezione</p>
                <div className="space-y-2">
                  <input placeholder="Titolo lezione" value={lessonForm.title} onChange={e => setLessonForm(s => ({ ...s, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  <input placeholder="URL video (opzionale)" value={lessonForm.videoUrl} onChange={e => setLessonForm(s => ({ ...s, videoUrl: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" />
                  <div className="flex gap-2">
                    <input type="number" placeholder="Durata (min)" value={lessonForm.durationMinutes} onChange={e => setLessonForm(s => ({ ...s, durationMinutes: e.target.value }))}
                      className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" />
                    <input type="number" placeholder="Ordine" value={lessonForm.sortOrder} onChange={e => setLessonForm(s => ({ ...s, sortOrder: e.target.value }))}
                      className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" />
                  </div>
                  <button onClick={() => addLessonMutation.mutate({ courseId: selectedCourse, body: { title: lessonForm.title, description: null, videoUrl: lessonForm.videoUrl || null, durationMinutes: Number(lessonForm.durationMinutes), sortOrder: Number(lessonForm.sortOrder) } })}
                    disabled={!lessonForm.title || addLessonMutation.isPending}
                    className="w-full rounded-lg bg-brand-600 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                    {addLessonMutation.isPending ? 'Salvataggio…' : 'Aggiungi lezione'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Live ── */}
      {tab === 'live' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveSessions.map(s => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xl">{CAT_ICON[s.category] ?? '📹'}</span>
                  <p className="mt-1 font-semibold text-slate-800">{s.title}</p>
                  {s.instructorName && <p className="text-xs text-slate-400">{s.instructorName}</p>}
                </div>
                <button onClick={() => publishLiveMutation.mutate({ id: s.id, publish: !s.isPublished })}
                  className={`rounded-full px-3 py-0.5 text-xs font-medium flex-shrink-0 ${s.isPublished ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {s.isPublished ? '🔴 Live' : 'Pubblica'}
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-600">{fmtDT(s.scheduledAtUtc)}</p>
              <div className="mt-1 flex gap-2 text-xs text-slate-400">
                <span>{s.durationMinutes} min</span>
                {s.maxParticipants && <span>· Max {s.maxParticipants}</span>}
              </div>
              {s.roomUrl && (
                <a href={s.roomUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
                  📹 Avvia videocall
                </a>
              )}
              {!s.roomUrl && s.isPublished && (
                <div className="mt-3 rounded-lg bg-slate-50 py-2 text-center text-xs text-slate-400">
                  Room URL generata al lancio
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Aggiungi corso ── */}
      {tab === 'add-course' && (
        <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">Nuovo corso</h2>
          <form onSubmit={e => { e.preventDefault(); createCourseMutation.mutate({ ...courseForm, priceEur: courseForm.isFree ? null : Number(courseForm.priceEur), description: courseForm.description || null, instructorName: courseForm.instructorName || null, coverImageUrl: null }) }} className="space-y-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Titolo *</label><input required value={courseForm.title} onChange={e => setCourseForm(s => ({ ...s, title: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Descrizione</label><textarea rows={2} value={courseForm.description} onChange={e => setCourseForm(s => ({ ...s, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none resize-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Categoria</label><select value={courseForm.category} onChange={e => setCourseForm(s => ({ ...s, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">{['Strength','Cardio','Yoga','Pilates','Nutrition','Mindfulness','Mobility','Other'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Livello</label><select value={courseForm.level} onChange={e => setCourseForm(s => ({ ...s, level: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">{['Beginner','Intermediate','Advanced'].map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            </div>
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Istruttore</label><input value={courseForm.instructorName} onChange={e => setCourseForm(s => ({ ...s, instructorName: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={courseForm.isFree} onChange={e => setCourseForm(s => ({ ...s, isFree: e.target.checked }))} /> Gratuito</label>
            {!courseForm.isFree && <div><label className="mb-1 block text-sm font-medium text-slate-600">Prezzo (€)</label><input type="number" min="0" step="0.01" value={courseForm.priceEur} onChange={e => setCourseForm(s => ({ ...s, priceEur: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>}
            <div className="flex gap-3">
              <button type="submit" disabled={createCourseMutation.isPending} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">{createCourseMutation.isPending ? 'Salvataggio…' : 'Salva'}</button>
              <button type="button" onClick={() => setTab('courses')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Aggiungi live ── */}
      {tab === 'add-live' && (
        <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">Nuova sessione live</h2>
          <form onSubmit={e => { e.preventDefault(); createLiveMutation.mutate({ ...liveForm, durationMinutes: Number(liveForm.durationMinutes), maxParticipants: liveForm.maxParticipants ? Number(liveForm.maxParticipants) : null, description: liveForm.description || null, instructorName: liveForm.instructorName || null }) }} className="space-y-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Titolo *</label><input required value={liveForm.title} onChange={e => setLiveForm(s => ({ ...s, title: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Categoria</label><select value={liveForm.category} onChange={e => setLiveForm(s => ({ ...s, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">{['Strength','Cardio','Yoga','Pilates','Nutrition','Mindfulness','Mobility','Other'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Istruttore</label><input value={liveForm.instructorName} onChange={e => setLiveForm(s => ({ ...s, instructorName: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className="mb-1 block text-sm font-medium text-slate-600">Data e ora *</label><input required type="datetime-local" value={liveForm.scheduledAtUtc} onChange={e => setLiveForm(s => ({ ...s, scheduledAtUtc: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Durata (min)</label><input type="number" value={liveForm.durationMinutes} onChange={e => setLiveForm(s => ({ ...s, durationMinutes: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            </div>
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Max partecipanti</label><input type="number" min="1" placeholder="Illimitati" value={liveForm.maxParticipants} onChange={e => setLiveForm(s => ({ ...s, maxParticipants: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            <div className="flex gap-3">
              <button type="submit" disabled={createLiveMutation.isPending} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">{createLiveMutation.isPending ? 'Creazione…' : 'Crea sessione'}</button>
              <button type="button" onClick={() => setTab('live')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
