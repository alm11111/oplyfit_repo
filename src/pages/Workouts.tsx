import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MemberRef { id: string; fullName: string; email: string }

interface ExerciseDraft {
  name: string
  category: string
  sets: string
  reps: string
  weightKg: string
  durationMin: string
  rest: string
  notes: string
}

interface DayDraft {
  id: string
  label: string
  sessionType: string
  muscleGroup: string
  estimatedMin: string
  exercises: ExerciseDraft[]
}

interface SchedaDraft {
  id: string
  name: string
  description: string
  goal: string
  level: string
  weeklyFrequency: string
  assignedMemberId: string
  days: DayDraft[]
  createdAt: string
}

interface SessionLog {
  id: string
  schedaId: string
  schedaName: string
  memberId: string
  memberName: string
  dayLabel: string
  date: string
  durationMin: number
  notes: string
  completed: boolean
  exercises: { name: string; sets: number; reps: number; weightKg: number | null; done: boolean }[]
}

interface ExerciseLibraryItem {
  id: string
  name: string
  description: string
  category: string
  muscleGroup: string
  equipment: string
  difficulty: string
  defaultSets: number | null
  defaultReps: number | null
  defaultDurationSeconds: number | null
  defaultRestSeconds: number | null
  instructions: string
  videoUrl: string
  tags: string
  isPublished: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES  = ['Petto','Schiena','Spalle','Bicipiti','Tricipiti','Quadricipiti','Femorali','Glutei','Polpacci','Core','Cardio','Funzionale','Flessibilità','Altro']
const SESSION_TYPES = ['Strength','Cardio','Functional','Hypertrophy','Mobility','Mixed']
const MUSCLE_GROUPS = ['UpperBody','LowerBody','FullBody','Core','Cardio']
const GOALS   = ['Dimagrimento','Tonificazione','Ipertrofia','Forza','Resistenza','Benessere']
const LEVELS  = ['Principiante','Intermedio','Avanzato']
const EQUIPMENT = ['CorpoLibero','Manubri','Bilanciere','Macchina','Cavi','BandaElastica','Kettlebell','Altro']
const EQUIPMENT_ICON: Record<string,string> = { CorpoLibero:'🤸', Manubri:'💪', Bilanciere:'🏋', Macchina:'⚙️', Cavi:'🔗', BandaElastica:'🪢', Kettlebell:'🔔', Altro:'🏃' }

const DEMO_MEMBERS: MemberRef[] = [
  { id: 'dm1', fullName: 'Giulia Ferretti',  email: 'giulia.ferretti@email.it'  },
  { id: 'dm2', fullName: 'Marco Bianchi',    email: 'marco.bianchi@email.it'    },
  { id: 'dm3', fullName: 'Alessia Romano',   email: 'alessia.romano@email.it'   },
  { id: 'dm4', fullName: 'Roberto Martini',  email: 'roberto.martini@email.it'  },
  { id: 'dm5', fullName: 'Luca Esposito',    email: 'luca.esposito@email.it'    },
]

const DEMO_SCHEDE: SchedaDraft[] = [
  {
    id: 's1', name: 'Definizione Total Body 4gg', description: 'Scheda upper/lower split per definizione muscolare con cardio integrato.',
    goal: 'Tonificazione', level: 'Intermedio', weeklyFrequency: '4', assignedMemberId: 'dm1', createdAt: '2026-06-15',
    days: [
      { id: 'd1', label: 'Upper Body A', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedMin: '55', exercises: [
        { name: 'Lat machine', category: 'Schiena', sets: '4', reps: '10', weightKg: '35', durationMin: '', rest: '90', notes: 'Presa larga' },
        { name: 'Chest press', category: 'Petto',   sets: '3', reps: '12', weightKg: '25', durationMin: '', rest: '75', notes: '' },
        { name: 'Shoulder press', category: 'Spalle', sets: '3', reps: '12', weightKg: '14', durationMin: '', rest: '75', notes: '' },
        { name: 'Curl manubri', category: 'Bicipiti', sets: '3', reps: '15', weightKg: '8', durationMin: '', rest: '60', notes: 'Superset' },
      ]},
      { id: 'd2', label: 'Lower Body A', sessionType: 'Strength', muscleGroup: 'LowerBody', estimatedMin: '60', exercises: [
        { name: 'Leg press', category: 'Quadricipiti', sets: '4', reps: '12', weightKg: '80', durationMin: '', rest: '90', notes: '' },
        { name: 'Leg curl', category: 'Femorali', sets: '3', reps: '12', weightKg: '30', durationMin: '', rest: '75', notes: '' },
        { name: 'Hip thrust', category: 'Glutei', sets: '3', reps: '15', weightKg: '40', durationMin: '', rest: '75', notes: '' },
        { name: 'Calf machine', category: 'Polpacci', sets: '4', reps: '20', weightKg: '40', durationMin: '', rest: '45', notes: '' },
      ]},
      { id: 'd3', label: 'Cardio + Core', sessionType: 'Cardio', muscleGroup: 'Core', estimatedMin: '40', exercises: [
        { name: 'Tapis roulant', category: 'Cardio', sets: '', reps: '', weightKg: '', durationMin: '20', rest: '', notes: '7 km/h costante' },
        { name: 'Plank', category: 'Core', sets: '4', reps: '', weightKg: '', durationMin: '1', rest: '45', notes: '' },
        { name: 'Russian twist', category: 'Core', sets: '3', reps: '20', weightKg: '5', durationMin: '', rest: '45', notes: '' },
      ]},
      { id: 'd4', label: 'Upper Body B', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedMin: '50', exercises: [
        { name: 'Cavi crossover', category: 'Petto', sets: '4', reps: '12', weightKg: '12', durationMin: '', rest: '75', notes: '' },
        { name: 'Rematore cavi', category: 'Schiena', sets: '3', reps: '12', weightKg: '40', durationMin: '', rest: '75', notes: '' },
        { name: 'Alzate laterali', category: 'Spalle', sets: '3', reps: '15', weightKg: '6', durationMin: '', rest: '60', notes: '' },
        { name: 'Tricipiti cavi', category: 'Tricipiti', sets: '3', reps: '15', weightKg: '10', durationMin: '', rest: '60', notes: '' },
      ]},
    ],
  },
  {
    id: 's2', name: 'Bulk 5 giorni PPL+', description: 'Push/Pull/Legs per ipertrofia massima con frequenza 2x.',
    goal: 'Ipertrofia', level: 'Avanzato', weeklyFrequency: '5', assignedMemberId: 'dm2', createdAt: '2026-06-08',
    days: [
      { id: 'd5', label: 'Push (Petto + Spalle + Tricipiti)', sessionType: 'Hypertrophy', muscleGroup: 'UpperBody', estimatedMin: '70', exercises: [
        { name: 'Panca piana', category: 'Petto', sets: '5', reps: '8', weightKg: '85', durationMin: '', rest: '120', notes: 'Piramidale' },
        { name: 'Panca inclinata', category: 'Petto', sets: '4', reps: '10', weightKg: '32', durationMin: '', rest: '90', notes: '' },
        { name: 'Shoulder press', category: 'Spalle', sets: '4', reps: '10', weightKg: '30', durationMin: '', rest: '90', notes: '' },
        { name: 'Dip', category: 'Tricipiti', sets: '4', reps: '12', weightKg: '', durationMin: '', rest: '75', notes: '' },
      ]},
      { id: 'd6', label: 'Pull (Schiena + Bicipiti)', sessionType: 'Hypertrophy', muscleGroup: 'UpperBody', estimatedMin: '65', exercises: [
        { name: 'Stacco da terra', category: 'Schiena', sets: '4', reps: '6', weightKg: '120', durationMin: '', rest: '180', notes: '⚠ Tecnica priorità' },
        { name: 'Rematore bilanciere', category: 'Schiena', sets: '4', reps: '8', weightKg: '70', durationMin: '', rest: '90', notes: '' },
        { name: 'Curl bilanciere', category: 'Bicipiti', sets: '4', reps: '10', weightKg: '40', durationMin: '', rest: '75', notes: '' },
      ]},
      { id: 'd7', label: 'Legs', sessionType: 'Hypertrophy', muscleGroup: 'LowerBody', estimatedMin: '75', exercises: [
        { name: 'Squat', category: 'Quadricipiti', sets: '5', reps: '8', weightKg: '100', durationMin: '', rest: '180', notes: 'Profondità completa' },
        { name: 'Leg press', category: 'Quadricipiti', sets: '4', reps: '10', weightKg: '130', durationMin: '', rest: '120', notes: '' },
        { name: 'Leg curl', category: 'Femorali', sets: '4', reps: '10', weightKg: '40', durationMin: '', rest: '90', notes: '' },
        { name: 'Hip thrust', category: 'Glutei', sets: '4', reps: '12', weightKg: '80', durationMin: '', rest: '90', notes: '' },
      ]},
    ],
  },
]

const DEMO_SESSIONS: SessionLog[] = [
  { id: 'sl1', schedaId: 's1', schedaName: 'Definizione Total Body 4gg', memberId: 'dm1', memberName: 'Giulia Ferretti', dayLabel: 'Upper Body A', date: '2026-06-25', durationMin: 52, notes: 'Ottima sessione, +2kg su lat machine', completed: true, exercises: [
    { name: 'Lat machine', sets: 4, reps: 10, weightKg: 37, done: true },
    { name: 'Chest press', sets: 3, reps: 12, weightKg: 25, done: true },
    { name: 'Shoulder press', sets: 3, reps: 12, weightKg: 14, done: true },
    { name: 'Curl manubri', sets: 3, reps: 15, weightKg: 8, done: false },
  ]},
  { id: 'sl2', schedaId: 's1', schedaName: 'Definizione Total Body 4gg', memberId: 'dm1', memberName: 'Giulia Ferretti', dayLabel: 'Lower Body A', date: '2026-06-23', durationMin: 58, notes: '', completed: true, exercises: [
    { name: 'Leg press', sets: 4, reps: 12, weightKg: 82, done: true },
    { name: 'Leg curl', sets: 3, reps: 12, weightKg: 30, done: true },
    { name: 'Hip thrust', sets: 3, reps: 15, weightKg: 42, done: true },
    { name: 'Calf machine', sets: 4, reps: 20, weightKg: 40, done: true },
  ]},
  { id: 'sl3', schedaId: 's2', schedaName: 'Bulk 5 giorni PPL+', memberId: 'dm2', memberName: 'Marco Bianchi', dayLabel: 'Push', date: '2026-06-24', durationMin: 68, notes: 'PR panca 87.5kg!', completed: true, exercises: [
    { name: 'Panca piana', sets: 5, reps: 8, weightKg: 87.5, done: true },
    { name: 'Panca inclinata', sets: 4, reps: 10, weightKg: 34, done: true },
    { name: 'Shoulder press', sets: 4, reps: 10, weightKg: 32, done: true },
    { name: 'Dip', sets: 4, reps: 12, weightKg: null, done: true },
  ]},
]

const DEMO_EXERCISES: ExerciseLibraryItem[] = [
  { id:'e1', name:'Lat machine presa larga', description:'Tirata alla lat machine con presa prona più larga delle spalle.', category:'Schiena', muscleGroup:'UpperBody', equipment:'Macchina', difficulty:'Principiante', defaultSets:4, defaultReps:10, defaultDurationSeconds:null, defaultRestSeconds:90, instructions:'Siediti sulla panca, afferra la barra con presa larga. Tira verso il petto espirando, ritorna lentamente.', videoUrl:'', tags:'schiena,lat,dorsali', isPublished:true },
  { id:'e2', name:'Chest press orizzontale', description:'Spinte orizzontali alla macchina per il petto.', category:'Petto', muscleGroup:'UpperBody', equipment:'Macchina', difficulty:'Principiante', defaultSets:3, defaultReps:12, defaultDurationSeconds:null, defaultRestSeconds:75, instructions:'Regola il sedile al livello dei pettorali. Spingi avanti espirando, ritorna controllato.', videoUrl:'', tags:'petto,spinta', isPublished:true },
  { id:'e3', name:'Squat con bilanciere', description:'Re degli esercizi per le gambe. Bilanciere sulle spalle.', category:'Quadricipiti', muscleGroup:'LowerBody', equipment:'Bilanciere', difficulty:'Avanzato', defaultSets:5, defaultReps:8, defaultDurationSeconds:null, defaultRestSeconds:180, instructions:'Piedi larghezza spalle, punta piedi 15-30° verso esterno. Scendi fino a cosce parallele al pavimento, schiena neutra.', videoUrl:'', tags:'gambe,squat,quadricipiti', isPublished:true },
  { id:'e4', name:'Leg press 45°', description:'Pressa per le gambe a 45 gradi.', category:'Quadricipiti', muscleGroup:'LowerBody', equipment:'Macchina', difficulty:'Principiante', defaultSets:4, defaultReps:12, defaultDurationSeconds:null, defaultRestSeconds:90, instructions:'Posiziona i piedi a larghezza spalle sulla piattaforma. Spingi senza bloccare le ginocchia.', videoUrl:'', tags:'gambe,leg press', isPublished:true },
  { id:'e5', name:'Tapis roulant interval', description:'Cardio intervallato sul tapis roulant.', category:'Cardio', muscleGroup:'Cardio', equipment:'Macchina', difficulty:'Intermedio', defaultSets:null, defaultReps:null, defaultDurationSeconds:1200, defaultRestSeconds:null, instructions:'Alterna 1min corsa veloce (9-10 km/h) con 1min cammino (5-6 km/h). Ripeti per 20 minuti.', videoUrl:'', tags:'cardio,corsa,interval', isPublished:true },
  { id:'e6', name:'Plank', description:'Isometria per il core.', category:'Core', muscleGroup:'Core', equipment:'CorpoLibero', difficulty:'Principiante', defaultSets:4, defaultReps:null, defaultDurationSeconds:60, defaultRestSeconds:45, instructions:'Posizione push-up su avambracci. Corpo dritto, addome contratto, respira normalmente.', videoUrl:'', tags:'core,plank,isometria', isPublished:true },
  { id:'e7', name:'Curl bilanciere', description:'Flessione bicipite con bilanciere EZ o dritto.', category:'Bicipiti', muscleGroup:'UpperBody', equipment:'Bilanciere', difficulty:'Principiante', defaultSets:4, defaultReps:10, defaultDurationSeconds:null, defaultRestSeconds:75, instructions:'Presa supina, gomiti fermi ai fianchi. Solleva il bilanciere fino alle spalle, abbassa lentamente.', videoUrl:'', tags:'bicipiti,curl', isPublished:true },
  { id:'e8', name:'Hip thrust', description:'Spinte dell\'anca per glutei con bilanciere.', category:'Glutei', muscleGroup:'LowerBody', equipment:'Bilanciere', difficulty:'Intermedio', defaultSets:4, defaultReps:12, defaultDurationSeconds:null, defaultRestSeconds:90, instructions:'Schiena appoggiata alla panca, bilanciere sui fianchi. Spingi i fianchi verso l\'alto contraendo i glutei al massimo.', videoUrl:'', tags:'glutei,hip thrust', isPublished:true },
  { id:'e9', name:'Alzate laterali manubri', description:'Isolamento spalle laterale.', category:'Spalle', muscleGroup:'UpperBody', equipment:'Manubri', difficulty:'Principiante', defaultSets:3, defaultReps:15, defaultDurationSeconds:null, defaultRestSeconds:60, instructions:'In piedi o seduto, solleva le braccia lateralmente fino all\'altezza delle spalle con gomiti leggermente flessi.', videoUrl:'', tags:'spalle,deltoide,alzate', isPublished:true },
  { id:'e10', name:'Stacco da terra', description:'Esercizio fondamentale per schiena posteriore e gambe.', category:'Schiena', muscleGroup:'FullBody', equipment:'Bilanciere', difficulty:'Avanzato', defaultSets:4, defaultReps:6, defaultDurationSeconds:null, defaultRestSeconds:180, instructions:'Piedi larghezza fianchi, barra sopra i metatarsi. Schiena neutra, tirare verso l\'alto mantenendo la barra vicina al corpo.', videoUrl:'', tags:'schiena,stacco,compound', isPublished:true },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9) }
function emptyEx(): ExerciseDraft { return { name: '', category: 'Altro', sets: '3', reps: '10', weightKg: '', durationMin: '', rest: '60', notes: '' } }
function emptyDay(): DayDraft { return { id: uid(), label: 'Giorno 1', sessionType: 'Strength', muscleGroup: 'FullBody', estimatedMin: '50', exercises: [emptyEx()] } }

function Avatar({ name }: { name: string }) {
  const colors = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700']
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colors[name.charCodeAt(0) % colors.length]}`}>
      {name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
    </div>
  )
}

// ── Exercise picker (used inside SchedaModal) ──────────────────────────────────
function ExercisePickerModal({ exercises, onPick, onClose }: {
  exercises: ExerciseLibraryItem[]
  onPick: (ex: ExerciseLibraryItem) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const filtered = exercises.filter(e => e.isPublished &&
    (!catFilter || e.category === catFilter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()) || e.tags.toLowerCase().includes(search.toLowerCase()))
  )
  const cats = [...new Set(exercises.filter(e => e.isPublished).map(e => e.category))].sort()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="flex h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
          <h3 className="font-bold text-slate-800">📚 Scegli esercizio dalla libreria</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="flex gap-2 px-4 pt-3 shrink-0">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca esercizio o tag…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-brand-400 bg-white">
            <option value="">Tutte le categorie</option>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">Nessun esercizio trovato</div>
          )}
          {filtered.map(ex => (
            <button key={ex.id} onClick={() => onPick(ex)}
              className="w-full text-left rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-brand-300 hover:bg-brand-50 transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{ex.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ex.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{ex.category}</span>
                  <span className="text-[10px] text-slate-400">{EQUIPMENT_ICON[ex.equipment] ?? '🏋'} {ex.equipment}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                {ex.defaultSets && <span className="bg-white rounded px-1.5 py-0.5 border border-slate-200">{ex.defaultSets} serie</span>}
                {ex.defaultReps && <span className="bg-white rounded px-1.5 py-0.5 border border-slate-200">{ex.defaultReps} rip.</span>}
                {ex.defaultDurationSeconds && <span className="bg-white rounded px-1.5 py-0.5 border border-slate-200">{Math.round(ex.defaultDurationSeconds/60)} min</span>}
                {ex.defaultRestSeconds && <span className="bg-white rounded px-1.5 py-0.5 border border-slate-200">{ex.defaultRestSeconds}s rec.</span>}
                <span className={`rounded-full px-1.5 py-0.5 font-semibold ${ex.difficulty==='Principiante'?'bg-emerald-100 text-emerald-700':ex.difficulty==='Intermedio'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{ex.difficulty}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Exercise library modal (create / edit) ─────────────────────────────────────
function ExerciseLibraryModal({ exercise, onClose, onSave }: {
  exercise: ExerciseLibraryItem | null
  onClose: () => void
  onSave: (e: ExerciseLibraryItem) => void
}) {
  const isNew = !exercise
  const [form, setForm] = useState<ExerciseLibraryItem>(exercise ?? {
    id: uid(), name: '', description: '', category: 'Altro', muscleGroup: 'FullBody',
    equipment: 'CorpoLibero', difficulty: 'Principiante',
    defaultSets: 3, defaultReps: 10, defaultDurationSeconds: null, defaultRestSeconds: 60,
    instructions: '', videoUrl: '', tags: '', isPublished: true,
  })
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100'
  const sm  = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 bg-white'

  const set = useCallback(<K extends keyof ExerciseLibraryItem>(k: K, v: ExerciseLibraryItem[K]) =>
    setForm(f => ({ ...f, [k]: v })), [])

  const isValid = form.name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="text-base font-bold text-slate-800">{isNew ? '+ Nuovo esercizio' : `Modifica — ${exercise!.name}`}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name + published */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome esercizio *</label>
              <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="es. Lat machine presa larga" />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input type="checkbox" id="ispub" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} className="h-4 w-4 accent-brand-600" />
              <label htmlFor="ispub" className="text-xs font-semibold text-slate-600">Pubblicato</label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Descrizione breve</label>
            <input className={inp} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descrizione in poche parole…" />
          </div>

          {/* Category + MuscleGroup + Equipment + Difficulty */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ['Categoria', 'category', CATEGORIES],
              ['Gruppo muscolare', 'muscleGroup', MUSCLE_GROUPS],
              ['Attrezzatura', 'equipment', EQUIPMENT],
              ['Difficoltà', 'difficulty', LEVELS],
            ] as const).map(([label, key, opts]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
                <select className={inp} value={form[key] as string} onChange={e => set(key as any, e.target.value)}>
                  {(opts as readonly string[]).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Defaults */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Valori predefiniti (usati nelle schede)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ['Serie', 'defaultSets'],
                ['Ripetizioni', 'defaultReps'],
                ['Durata (sec)', 'defaultDurationSeconds'],
                ['Recupero (sec)', 'defaultRestSeconds'],
              ] as const).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-[10px] text-slate-500 mb-1">{label}</label>
                  <input type="number" min={0} className={sm}
                    value={form[key] ?? ''} placeholder="—"
                    onChange={e => set(key as any, e.target.value === '' ? null : Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Istruzioni di esecuzione</label>
            <textarea className={inp + ' resize-none'} rows={4} value={form.instructions}
              onChange={e => set('instructions', e.target.value)}
              placeholder="Descrivi la tecnica corretta di esecuzione…" />
          </div>

          {/* Tags + VideoUrl */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tag (separati da virgola)</label>
              <input className={inp} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="es. schiena,dorsali,tirata" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">URL video (opz.)</label>
              <input className={inp} value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://…" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
          <button onClick={() => { if (isValid) onSave(form) }} disabled={!isValid}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed">
            {isNew ? 'Crea esercizio' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Scheda form modal ──────────────────────────────────────────────────────────
function SchedaModal({ scheda, members, exercises, onClose, onSave }: {
  scheda: SchedaDraft | null
  members: MemberRef[]
  exercises: ExerciseLibraryItem[]
  onClose: () => void
  onSave: (s: SchedaDraft) => void
}) {
  const isNew = !scheda
  const [form, setForm] = useState<SchedaDraft>(scheda ?? {
    id: uid(), name: '', description: '', goal: 'Tonificazione', level: 'Intermedio',
    weeklyFrequency: '3', assignedMemberId: '', days: [emptyDay()], createdAt: new Date().toISOString().slice(0,10),
  })
  const [activeDay, setActiveDay] = useState(0)
  const [memberSearch, setMemberSearch] = useState(scheda ? members.find(m => m.id === scheda.assignedMemberId)?.fullName ?? '' : '')
  const [showMemberDrop, setShowMemberDrop] = useState(false)
  const [pickerForRow, setPickerForRow] = useState<number | null>(null)

  const inp = 'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100'
  const sm  = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 bg-white'

  const filteredMembers = members.filter(m => m.fullName.toLowerCase().includes(memberSearch.toLowerCase()))

  const setDay = (i: number, key: keyof DayDraft, val: string) =>
    setForm(f => ({ ...f, days: f.days.map((d, idx) => idx === i ? { ...d, [key]: val } : d) }))

  const setEx = (di: number, ei: number, key: keyof ExerciseDraft, val: string) =>
    setForm(f => ({ ...f, days: f.days.map((d, i) => i !== di ? d : {
      ...d, exercises: d.exercises.map((e, j) => j !== ei ? e : { ...e, [key]: val })
    })}))

  const addDay = () => {
    const n = form.days.length + 1
    setForm(f => ({ ...f, days: [...f.days, { ...emptyDay(), id: uid(), label: `Giorno ${n}` }] }))
    setActiveDay(form.days.length)
  }
  const removeDay = (i: number) => {
    setForm(f => ({ ...f, days: f.days.filter((_, idx) => idx !== i) }))
    setActiveDay(Math.max(0, i - 1))
  }
  const addEx  = (di: number) => setForm(f => ({ ...f, days: f.days.map((d, i) => i !== di ? d : { ...d, exercises: [...d.exercises, emptyEx()] }) }))
  const removeEx = (di: number, ei: number) => setForm(f => ({ ...f, days: f.days.map((d, i) => i !== di ? d : { ...d, exercises: d.exercises.filter((_, j) => j !== ei) }) }))

  const day = form.days[activeDay]

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="flex h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="text-base font-bold text-slate-800">{isNew ? '+ Nuova scheda allenamento' : `Modifica — ${scheda!.name}`}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left panel — scheda settings */}
          <div className="w-72 shrink-0 border-r border-slate-100 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome scheda *</label>
              <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="es. Definizione 4 giorni" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Descrizione</label>
              <textarea className={inp + ' resize-none'} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Obiettivi, note generali…" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Obiettivo</label>
                <select className={inp} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
                  {GOALS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Livello</label>
                <select className={inp} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sessioni/settimana</label>
              <input type="number" min={1} max={7} className={inp} value={form.weeklyFrequency} onChange={e => setForm(f => ({ ...f, weeklyFrequency: e.target.value }))} />
            </div>
            {/* Member assignment */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assegna a membro (opz.)</label>
              <input className={inp} value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setShowMemberDrop(true) }}
                onFocus={() => setShowMemberDrop(true)}
                onBlur={() => setTimeout(() => setShowMemberDrop(false), 150)}
                placeholder="Cerca membro…" />
              {showMemberDrop && filteredMembers.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                  {filteredMembers.map(m => (
                    <button key={m.id} onMouseDown={() => { setForm(f => ({ ...f, assignedMemberId: m.id })); setMemberSearch(m.fullName); setShowMemberDrop(false) }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-brand-50 text-left">
                      <Avatar name={m.fullName} />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{m.fullName}</p>
                        <p className="text-[10px] text-slate-400">{m.email}</p>
                      </div>
                    </button>
                  ))}
                  <button onMouseDown={() => { setForm(f => ({ ...f, assignedMemberId: '' })); setMemberSearch(''); setShowMemberDrop(false) }}
                    className="w-full px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 text-left border-t border-slate-100">
                    ✕ Rimuovi assegnazione
                  </button>
                </div>
              )}
              {form.assignedMemberId && (
                <p className="mt-1 text-[10px] text-emerald-600 font-medium">✓ Assegnata a {memberSearch}</p>
              )}
            </div>

            {/* Day list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500">Giorni ({form.days.length})</label>
                <button onClick={addDay} className="text-xs text-brand-600 font-medium hover:underline">+ Aggiungi</button>
              </div>
              <div className="space-y-1">
                {form.days.map((d, i) => (
                  <div key={d.id} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all ${activeDay === i ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50 border border-transparent'}`}
                    onClick={() => setActiveDay(i)}>
                    <div className={`h-6 w-6 shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${activeDay === i ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <p className="text-xs font-medium text-slate-700 flex-1 truncate">{d.label || `Giorno ${i + 1}`}</p>
                    <span className="text-[10px] text-slate-400">{d.exercises.length}ex</span>
                    {form.days.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); removeDay(i) }} className="text-slate-300 hover:text-red-400 text-xs">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel — day editor */}
          {day && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Day settings */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nome giorno</label>
                  <input className={inp} value={day.label} onChange={e => setDay(activeDay, 'label', e.target.value)} placeholder="es. Upper Body A" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo sessione</label>
                  <select className={inp} value={day.sessionType} onChange={e => setDay(activeDay, 'sessionType', e.target.value)}>
                    {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gruppo muscolare</label>
                  <select className={inp} value={day.muscleGroup} onChange={e => setDay(activeDay, 'muscleGroup', e.target.value)}>
                    {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Durata stimata (min)</label>
                  <input type="number" className={inp} value={day.estimatedMin} onChange={e => setDay(activeDay, 'estimatedMin', e.target.value)} />
                </div>
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Esercizi — {day.label}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPickerForRow(-1)}
                      className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-100 transition-colors font-medium">
                      📚 Da libreria
                    </button>
                    <button onClick={() => addEx(activeDay)}
                      className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                      + Manuale
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 mt-1">{ei + 1}</div>
                        <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <div className="col-span-2 sm:col-span-2">
                            <div className="flex items-center gap-1 mb-0.5">
                              <label className="block text-[10px] text-slate-500">Nome esercizio *</label>
                              <button onClick={() => setPickerForRow(ei)} className="text-[10px] text-brand-500 hover:underline">📚 libreria</button>
                            </div>
                            <input className={sm} value={ex.name} onChange={e => setEx(activeDay, ei, 'name', e.target.value)} placeholder="es. Lat machine" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Categoria</label>
                            <select className={sm} value={ex.category} onChange={e => setEx(activeDay, ei, 'category', e.target.value)}>
                              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <button onClick={() => removeEx(activeDay, ei)} disabled={day.exercises.length <= 1}
                          className="shrink-0 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-30 mt-1">✕</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 ml-8">
                        {[
                          { label: 'Serie', key: 'sets', placeholder: '3' },
                          { label: 'Rip.', key: 'reps', placeholder: '10' },
                          { label: 'Kg', key: 'weightKg', placeholder: '—' },
                          { label: 'Durata (min)', key: 'durationMin', placeholder: '—' },
                          { label: 'Rec. (s)', key: 'rest', placeholder: '60' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-[10px] text-slate-500 mb-0.5">{f.label}</label>
                            <input type="number" className={sm} value={(ex as any)[f.key]} placeholder={f.placeholder}
                              onChange={e => setEx(activeDay, ei, f.key as keyof ExerciseDraft, e.target.value)} />
                          </div>
                        ))}
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Note</label>
                          <input className={sm} value={ex.notes} onChange={e => setEx(activeDay, ei, 'notes', e.target.value)} placeholder="opz." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 shrink-0">
          <p className="text-xs text-slate-400">{form.days.length} giorn{form.days.length === 1 ? 'o' : 'i'} · {form.days.reduce((s, d) => s + d.exercises.length, 0)} esercizi totali</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            <button onClick={() => { if (form.name.trim()) onSave(form) }}
              disabled={!form.name.trim()}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {isNew ? 'Crea scheda' : 'Salva modifiche'}
            </button>
          </div>
        </div>
      </div>
    </div>
    {pickerForRow !== null && (
      <ExercisePickerModal exercises={exercises} onPick={handlePickExercise} onClose={() => setPickerForRow(null)} />
    )}
    </>
  )

  function handlePickExercise(lib: ExerciseLibraryItem) {
    const durMin = lib.defaultDurationSeconds ? String(Math.round(lib.defaultDurationSeconds / 60)) : ''
    const patch: Partial<ExerciseDraft> = {
      name: lib.name,
      category: lib.category,
      sets: lib.defaultSets ? String(lib.defaultSets) : '',
      reps: lib.defaultReps ? String(lib.defaultReps) : '',
      durationMin: durMin,
      rest: lib.defaultRestSeconds ? String(lib.defaultRestSeconds) : '',
    }
    if (pickerForRow === -1) {
      setForm(f => ({ ...f, days: f.days.map((d, i) => i !== activeDay ? d : {
        ...d, exercises: [...d.exercises, { ...emptyEx(), ...patch }]
      })}))
    } else if (pickerForRow !== null) {
      setForm(f => ({ ...f, days: f.days.map((d, i) => i !== activeDay ? d : {
        ...d, exercises: d.exercises.map((e, j) => j !== pickerForRow ? e : { ...e, ...patch })
      })}))
    }
    setPickerForRow(null)
  }
}

// ── Session log modal ──────────────────────────────────────────────────────────
function SessionModal({ schede, members, onClose, onSave }: {
  schede: SchedaDraft[]
  members: MemberRef[]
  onClose: () => void
  onSave: (s: SessionLog) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedScheda, setSelectedScheda] = useState<SchedaDraft | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayDraft | null>(null)
  const [memberId, setMemberId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [sessionNotes, setSessionNotes] = useState('')
  const [exRows, setExRows] = useState<{ name: string; sets: number; reps: number; weightKg: string; done: boolean }[]>([])

  const inp = 'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100'

  function pickDay(scheda: SchedaDraft, day: DayDraft) {
    setSelectedScheda(scheda); setSelectedDay(day)
    setExRows(day.exercises.map(e => ({
      name: e.name, sets: parseInt(e.sets) || 3, reps: parseInt(e.reps) || 10,
      weightKg: e.weightKg, done: false,
    })))
    setStep(2)
  }

  function handleSave() {
    if (!selectedScheda || !selectedDay) return
    const member = members.find(m => m.id === memberId)
    const session: SessionLog = {
      id: uid(), schedaId: selectedScheda.id, schedaName: selectedScheda.name,
      memberId, memberName: member?.fullName ?? 'Sconosciuto',
      dayLabel: selectedDay.label, date, durationMin: parseInt(selectedDay.estimatedMin) || 45,
      notes: sessionNotes, completed: exRows.every(e => e.done),
      exercises: exRows.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, weightKg: parseFloat(e.weightKg) || null, done: e.done })),
    }
    onSave(session)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-slate-600">← Indietro</button>}
            <h2 className="font-bold text-slate-800">{step === 1 ? 'Registra sessione — Scegli scheda e giorno' : `Sessione: ${selectedDay?.label}`}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {step === 1 && (
            <>
              {schede.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-3xl">📋</p>
                  <p className="mt-2 text-sm text-slate-500">Nessuna scheda disponibile. Crea prima una scheda.</p>
                </div>
              ) : schede.map(scheda => (
                <div key={scheda.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{scheda.name}</p>
                      <p className="text-xs text-slate-400">{scheda.goal} · {scheda.level} · {scheda.weeklyFrequency}×/sett.</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {scheda.days.map(day => (
                      <button key={day.id} onClick={() => pickDay(scheda, day)}
                        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                          G{scheda.days.indexOf(day) + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-brand-700">{day.label}</p>
                          <p className="text-xs text-slate-400">{day.exercises.length} esercizi · ~{day.estimatedMin} min · {day.sessionType}</p>
                        </div>
                        <span className="text-xs text-brand-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Seleziona →</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {step === 2 && selectedScheda && selectedDay && (
            <div className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Membro</label>
                  <select className={inp} value={memberId} onChange={e => setMemberId(e.target.value)}>
                    <option value="">— Seleziona membro —</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
                  <input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>

              {/* Exercise log */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Esercizi eseguiti</p>
                <div className="space-y-2">
                  {exRows.map((ex, i) => (
                    <div key={i} className={`rounded-xl border p-3 transition-all ${ex.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={ex.done}
                          onChange={e => setExRows(prev => prev.map((r, j) => j === i ? { ...r, done: e.target.checked } : r))}
                          className="h-4 w-4 rounded accent-brand-600" />
                        <p className={`text-sm font-semibold flex-1 ${ex.done ? 'text-emerald-800' : 'text-slate-700'}`}>{ex.name}</p>
                      </div>
                      <div className="mt-2 ml-7 grid grid-cols-3 gap-2">
                        {[
                          { label: 'Serie', key: 'sets', type: 'number' },
                          { label: 'Rip.', key: 'reps', type: 'number' },
                          { label: 'Kg (eff.)', key: 'weightKg', type: 'number' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-[10px] text-slate-500 mb-0.5">{f.label}</label>
                            <input type={f.type}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500"
                              value={(ex as any)[f.key]}
                              onChange={e => setExRows(prev => prev.map((r, j) => j === i ? { ...r, [f.key]: f.key === 'weightKg' ? e.target.value : Number(e.target.value) } : r))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Note sessione</label>
                <textarea className={inp + ' resize-none'} rows={2} value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="PR raggiunti, sensazioni, aggiustamenti…" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
          {step === 2 && (
            <button onClick={handleSave} disabled={!memberId}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Salva sessione
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Workouts() {
  const [tab, setTab] = useState<'schede' | 'sessioni' | 'esercizi'>('schede')
  const [schede, setSchede]   = useState<SchedaDraft[]>(DEMO_SCHEDE)
  const [sessions, setSessions] = useState<SessionLog[]>(DEMO_SESSIONS)
  const [exercises, setExercises] = useState<ExerciseLibraryItem[]>(DEMO_EXERCISES)
  const [exSearch, setExSearch] = useState('')
  const [exCatFilter, setExCatFilter] = useState('')
  const [exDiffFilter, setExDiffFilter] = useState('')
  const [showExModal, setShowExModal] = useState(false)
  const [editingEx, setEditingEx] = useState<ExerciseLibraryItem | null>(null)

  const [showSchedaModal, setShowSchedaModal] = useState(false)
  const [editingScheda, setEditingScheda]     = useState<SchedaDraft | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [expandedScheda, setExpandedScheda]   = useState<string | null>('s1')
  const [schedaFilter, setSchedaFilter]       = useState('')
  const [sessionFilter, setSessionFilter]     = useState('')

  const { data: apiMembers } = useQuery({
    queryKey: ['members-workouts'],
    queryFn: () => api.get<MemberRef[]>('/api/v1/members?pageSize=200'),
    retry: false,
  })
  const members: MemberRef[] = (apiMembers?.data as any)?.length > 0 ? apiMembers!.data as any : DEMO_MEMBERS

  function saveScheda(s: SchedaDraft) {
    setSchede(prev => { const exists = prev.find(x => x.id === s.id); return exists ? prev.map(x => x.id === s.id ? s : x) : [...prev, s] })
    setShowSchedaModal(false); setEditingScheda(null)
  }
  function deleteScheda(id: string) { if (confirm('Eliminare la scheda?')) setSchede(prev => prev.filter(s => s.id !== id)) }
  function saveSession(s: SessionLog) { setSessions(prev => [s, ...prev]); setShowSessionModal(false) }
  function saveExercise(e: ExerciseLibraryItem) {
    setExercises(prev => { const exists = prev.find(x => x.id === e.id); return exists ? prev.map(x => x.id === e.id ? e : x) : [...prev, e] })
    setShowExModal(false); setEditingEx(null)
  }
  function deleteExercise(id: string) { if (confirm('Eliminare esercizio dalla libreria?')) setExercises(prev => prev.filter(e => e.id !== id)) }

  const filteredSchede   = schede.filter(s => !schedaFilter || s.name.toLowerCase().includes(schedaFilter.toLowerCase()) || s.goal.toLowerCase().includes(schedaFilter.toLowerCase()))
  const filteredSessions = sessions.filter(s => !sessionFilter || s.memberName.toLowerCase().includes(sessionFilter.toLowerCase()) || s.schedaName.toLowerCase().includes(sessionFilter.toLowerCase()))

  const LEVEL_COLOR: Record<string, string> = { Principiante: 'bg-emerald-100 text-emerald-700', Intermedio: 'bg-amber-100 text-amber-700', Avanzato: 'bg-red-100 text-red-700' }
  const GOAL_ICON: Record<string, string> = { Dimagrimento: '🔥', Tonificazione: '💪', Ipertrofia: '🏗', Forza: '⚡', Resistenza: '🏃', Benessere: '🌿' }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schede, Sessioni & Esercizi</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestisci la libreria esercizi, crea schede e registra le sessioni dei soci.</p>
        </div>
        <div className="flex gap-2">
          {tab === 'esercizi' && (
            <button onClick={() => { setEditingEx(null); setShowExModal(true) }}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
              + Nuovo esercizio
            </button>
          )}
          {tab !== 'esercizi' && <>
            <button onClick={() => { setShowSessionModal(true) }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              📝 Registra sessione
            </button>
            <button onClick={() => { setEditingScheda(null); setShowSchedaModal(true) }}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
              + Nuova scheda
            </button>
          </>}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Esercizi in libreria', value: exercises.length,                       color: 'text-indigo-600' },
          { label: 'Schede attive',        value: schede.length,                          color: 'text-brand-600' },
          { label: 'Sessioni registrate',  value: sessions.length,                        color: 'text-violet-600' },
          { label: 'Sessioni complete',    value: sessions.filter(s => s.completed).length, color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([['esercizi','📚 Esercizi'],['schede','📋 Schede'],['sessioni','⏱ Sessioni']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB ESERCIZI ── */}
      {tab === 'esercizi' && (() => {
        const DIFF_COLOR: Record<string,string> = { Principiante:'bg-emerald-100 text-emerald-700', Intermedio:'bg-amber-100 text-amber-700', Avanzato:'bg-red-100 text-red-700' }
        const filteredEx = exercises.filter(e =>
          (!exCatFilter || e.category === exCatFilter) &&
          (!exDiffFilter || e.difficulty === exDiffFilter) &&
          (!exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase()) || e.tags.toLowerCase().includes(exSearch.toLowerCase()))
        )
        const cats = [...new Set(exercises.map(e => e.category))].sort()
        return (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <input value={exSearch} onChange={e => setExSearch(e.target.value)} placeholder="🔍 Cerca esercizio o tag…"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              <select value={exCatFilter} onChange={e => setExCatFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400">
                <option value="">Tutte le categorie</option>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={exDiffFilter} onChange={e => setExDiffFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400">
                <option value="">Tutte le difficoltà</option>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <span className="flex items-center text-xs text-slate-400">{filteredEx.length} esercizi</span>
            </div>

            {filteredEx.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                <p className="text-4xl">🏋️</p>
                <p className="mt-3 text-base font-semibold text-slate-700">Nessun esercizio trovato</p>
                <button onClick={() => { setEditingEx(null); setShowExModal(true) }}
                  className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  + Crea primo esercizio
                </button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEx.map(ex => (
                <div key={ex.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800 truncate">{ex.name}</p>
                        {!ex.isPublished && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">Bozza</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{ex.description}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-brand-100 text-brand-700 px-2 py-0.5 text-[10px] font-semibold">{ex.category}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFF_COLOR[ex.difficulty] ?? 'bg-slate-100 text-slate-500'}`}>{ex.difficulty}</span>
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px]">{EQUIPMENT_ICON[ex.equipment] ?? '🏋'} {ex.equipment}</span>
                  </div>

                  {/* Defaults */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {ex.defaultSets && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">{ex.defaultSets}</span> serie</span>}
                    {ex.defaultReps && <span className="flex items-center gap-1">×<span className="font-semibold text-slate-700">{ex.defaultReps}</span> rip.</span>}
                    {ex.defaultDurationSeconds && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">{Math.round(ex.defaultDurationSeconds/60)}</span> min</span>}
                    {ex.defaultRestSeconds && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">{ex.defaultRestSeconds}s</span> rec.</span>}
                  </div>

                  {/* Instructions preview */}
                  {ex.instructions && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 border-t border-slate-50 pt-2">{ex.instructions}</p>
                  )}

                  {/* Tags */}
                  {ex.tags && (
                    <div className="flex flex-wrap gap-1">
                      {ex.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-slate-50">
                    <button onClick={() => { setEditingEx(ex); setShowExModal(true) }}
                      className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors">✏ Modifica</button>
                    <button onClick={() => deleteExercise(ex.id)}
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-400 hover:bg-red-50 transition-colors">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── TAB SCHEDE ── */}
      {tab === 'schede' && (
        <div className="space-y-3">
          <input value={schedaFilter} onChange={e => setSchedaFilter(e.target.value)}
            placeholder="🔍 Filtra per nome o obiettivo…"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />

          {filteredSchede.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
              <p className="text-4xl">📋</p>
              <p className="mt-3 text-base font-semibold text-slate-700">Nessuna scheda</p>
              <p className="mt-1 text-sm text-slate-400">Crea la prima scheda di allenamento.</p>
              <button onClick={() => { setEditingScheda(null); setShowSchedaModal(true) }}
                className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                + Crea scheda
              </button>
            </div>
          )}

          {filteredSchede.map(scheda => {
            const isOpen    = expandedScheda === scheda.id
            const assignee  = members.find(m => m.id === scheda.assignedMemberId)
            const totalEx   = scheda.days.reduce((s, d) => s + d.exercises.length, 0)
            const totalMin  = scheda.days.reduce((s, d) => s + (parseInt(d.estimatedMin) || 0), 0)

            return (
              <div key={scheda.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <button onClick={() => setExpandedScheda(isOpen ? null : scheda.id)} className="flex-1 flex items-center gap-4 text-left min-w-0">
                    <div>
                      <p className="font-bold text-slate-800">{scheda.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{GOAL_ICON[scheda.goal]} {scheda.goal}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LEVEL_COLOR[scheda.level] ?? 'bg-slate-100 text-slate-500'}`}>{scheda.level}</span>
                        <span className="text-xs text-slate-400">{scheda.days.length} giorni · {totalEx} esercizi · ~{totalMin} min/sett.</span>
                        {assignee && (
                          <span className="flex items-center gap-1 text-xs text-brand-600"><Avatar name={assignee.fullName} />{assignee.fullName}</span>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setEditingScheda(scheda); setShowSchedaModal(true) }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors">✏ Modifica</button>
                    <button onClick={() => deleteScheda(scheda.id)}
                      className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors">🗑</button>
                    <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded day detail */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {scheda.description && (
                      <p className="px-5 py-3 text-sm text-slate-500 bg-slate-50 border-b border-slate-100">{scheda.description}</p>
                    )}
                    <div className="divide-y divide-slate-50">
                      {scheda.days.map((day, di) => (
                        <details key={day.id} className="group">
                          <summary className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors list-none">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">G{di + 1}</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-700">{day.label}</p>
                              <p className="text-xs text-slate-400">{day.exercises.length} esercizi · {day.sessionType} · ~{day.estimatedMin} min</p>
                            </div>
                            <span className="text-xs text-slate-400 group-open:rotate-90 transition-transform inline-block">›</span>
                          </summary>
                          <div className="px-5 pb-3 overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  <th className="pb-1.5">#</th><th className="pb-1.5 pl-2">Esercizio</th><th className="pb-1.5 pl-2">Cat.</th>
                                  <th className="pb-1.5 pl-2 text-center">Ser.</th><th className="pb-1.5 pl-2 text-center">Rip.</th>
                                  <th className="pb-1.5 pl-2 text-center">Kg</th><th className="pb-1.5 pl-2 text-center">Rec.</th><th className="pb-1.5 pl-2">Note</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {day.exercises.map((ex, ei) => (
                                  <tr key={ei} className="hover:bg-slate-50/60">
                                    <td className="py-1.5 text-slate-400">{ei + 1}</td>
                                    <td className="py-1.5 pl-2 font-medium text-slate-700">{ex.name}</td>
                                    <td className="py-1.5 pl-2"><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">{ex.category}</span></td>
                                    <td className="py-1.5 pl-2 text-center text-slate-600">{ex.sets || '—'}</td>
                                    <td className="py-1.5 pl-2 text-center text-slate-600">{ex.reps || '—'}</td>
                                    <td className="py-1.5 pl-2 text-center font-bold text-brand-700">{ex.weightKg ? `${ex.weightKg} kg` : ex.durationMin ? `${ex.durationMin}'` : '—'}</td>
                                    <td className="py-1.5 pl-2 text-center text-slate-400">{ex.rest ? `${ex.rest}s` : '—'}</td>
                                    <td className="py-1.5 pl-2 text-slate-400 max-w-[150px] truncate">{ex.notes || ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB SESSIONI ── */}
      {tab === 'sessioni' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input value={sessionFilter} onChange={e => setSessionFilter(e.target.value)}
              placeholder="🔍 Filtra per membro o scheda…"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            <span className="text-xs text-slate-400">{filteredSessions.length} sessioni trovate</span>
          </div>

          {filteredSessions.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
              <p className="text-4xl">⏱</p>
              <p className="mt-3 text-base font-semibold text-slate-700">Nessuna sessione registrata</p>
              <button onClick={() => setShowSessionModal(true)}
                className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                📝 Registra prima sessione
              </button>
            </div>
          )}

          {filteredSessions.map(s => {
            const doneCount = s.exercises.filter(e => e.done).length
            const pct = Math.round(doneCount / s.exercises.length * 100)
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.memberName} />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{s.memberName}</p>
                      <p className="text-xs text-slate-400">{s.schedaName} · {s.dayLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.completed ? '✓ Completata' : `${pct}% completata`}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(s.date).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}</span>
                    <span className="text-xs text-slate-400">⏱ {s.durationMin} min</span>
                  </div>
                </div>

                {/* Exercise summary */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.exercises.map((ex, i) => (
                    <span key={i} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${ex.done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                      {ex.done ? '✓' : '○'} {ex.name} {ex.weightKg ? `${ex.weightKg}kg` : ''} {ex.sets}×{ex.reps}
                    </span>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>

                {s.notes && <p className="mt-2 text-xs text-slate-500 italic">💬 {s.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {showSchedaModal && (
        <SchedaModal scheda={editingScheda} members={members} exercises={exercises} onClose={() => { setShowSchedaModal(false); setEditingScheda(null) }} onSave={saveScheda} />
      )}
      {showSessionModal && (
        <SessionModal schede={schede} members={members} onClose={() => setShowSessionModal(false)} onSave={saveSession} />
      )}
      {showExModal && (
        <ExerciseLibraryModal exercise={editingEx} onClose={() => { setShowExModal(false); setEditingEx(null) }} onSave={saveExercise} />
      )}
    </div>
  )
}
