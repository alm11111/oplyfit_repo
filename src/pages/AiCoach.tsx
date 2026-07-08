import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MemberDto { id: string; fullName: string; email: string; status: string }
interface PlannedExerciseDto {
  machineName: string; category: string; sets: number | null; reps: number | null
  targetWeightKg: number | null; durationMinutes: number | null; notes: string | null
}
interface PlannedDayDto {
  dayNumber: number; label: string; sessionType: string; muscleGroup: string
  estimatedDurationMinutes: number; exercises: PlannedExerciseDto[]
}
interface WorkoutPlanDto {
  id: string; memberId: string; generatedAtUtc: string; status: string
  weeklyFrequency: number; focusSummary: string; analysisSummary: string; days: PlannedDayDto[]
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MEMBERS: MemberDto[] = [
  { id: 'dm1', fullName: 'Giulia Ferretti',  email: 'giulia.ferretti@email.it',  status: 'Active' },
  { id: 'dm2', fullName: 'Marco Bianchi',    email: 'marco.bianchi@email.it',    status: 'Active' },
  { id: 'dm3', fullName: 'Alessia Romano',   email: 'alessia.romano@email.it',   status: 'Active' },
  { id: 'dm4', fullName: 'Roberto Martini',  email: 'roberto.martini@email.it',  status: 'Active' },
]

const DEMO_PLANS: Record<string, WorkoutPlanDto> = {
  dm1: {
    id: 'p1', memberId: 'dm1', generatedAtUtc: '2026-06-10T09:00:00Z', status: 'Active',
    weeklyFrequency: 4,
    focusSummary: 'Definizione muscolare + Cardio metabolico — Ciclo 3/12',
    analysisSummary: 'Basato su 47 sessioni negli ultimi 60 giorni. Predominanza Yoga Flow e HIIT. Carichi aumentati del 8% rispetto al ciclo precedente. Recupero medio: 72%. Punto di forza: core e flessibilità. Area di miglioramento: forza degli arti superiori.',
    days: [
      { dayNumber: 1, label: 'Upper Body Strength', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedDurationMinutes: 55, exercises: [
        { machineName: 'Cavi crossover', category: 'Petto', sets: 4, reps: 12, targetWeightKg: 12, durationMinutes: null, notes: '+5% rispetto ultimo ciclo' },
        { machineName: 'Lat machine', category: 'Schiena', sets: 3, reps: 10, targetWeightKg: 35, durationMinutes: null, notes: 'Presa larga, controllo eccentrica' },
        { machineName: 'Shoulder press', category: 'Spalle', sets: 3, reps: 12, targetWeightKg: 14, durationMinutes: null, notes: null },
        { machineName: 'Curl manubri', category: 'Bicipiti', sets: 3, reps: 15, targetWeightKg: 8, durationMinutes: null, notes: 'Superset con tricipiti' },
        { machineName: 'Tricipiti cavi', category: 'Tricipiti', sets: 3, reps: 15, targetWeightKg: 10, durationMinutes: null, notes: 'Superset con curl' },
      ]},
      { dayNumber: 2, label: 'HIIT Cardio + Core', sessionType: 'Cardio', muscleGroup: 'Core', estimatedDurationMinutes: 45, exercises: [
        { machineName: 'Tapis roulant', category: 'Cardio', sets: null, reps: null, targetWeightKg: null, durationMinutes: 20, notes: 'Intervalli 1:1 — 30s sprint / 30s recupero' },
        { machineName: 'Plank varianti', category: 'Core', sets: 4, reps: null, targetWeightKg: null, durationMinutes: 1, notes: 'Frontale + laterale' },
        { machineName: 'Russian twist', category: 'Core', sets: 3, reps: 20, targetWeightKg: 5, durationMinutes: null, notes: null },
        { machineName: 'Crunch cable', category: 'Core', sets: 3, reps: 15, targetWeightKg: 8, durationMinutes: null, notes: null },
      ]},
      { dayNumber: 3, label: 'Lower Body', sessionType: 'Strength', muscleGroup: 'LowerBody', estimatedDurationMinutes: 60, exercises: [
        { machineName: 'Leg press', category: 'Quadricipiti', sets: 4, reps: 12, targetWeightKg: 80, durationMinutes: null, notes: 'Piedi alla larghezza spalle' },
        { machineName: 'Leg curl', category: 'Femorali', sets: 3, reps: 12, targetWeightKg: 30, durationMinutes: null, notes: null },
        { machineName: 'Calf machine', category: 'Polpacci', sets: 4, reps: 20, targetWeightKg: 40, durationMinutes: null, notes: 'Pausa in contrazione' },
        { machineName: 'Abductor machine', category: 'Glutei', sets: 3, reps: 15, targetWeightKg: 50, durationMinutes: null, notes: null },
        { machineName: 'Hip thrust', category: 'Glutei', sets: 3, reps: 15, targetWeightKg: 40, durationMinutes: null, notes: '+10% rispetto ciclo 2' },
      ]},
      { dayNumber: 4, label: 'Functional + Recovery', sessionType: 'Functional', muscleGroup: 'FullBody', estimatedDurationMinutes: 40, exercises: [
        { machineName: 'TRX row', category: 'Funzionale', sets: 3, reps: 12, targetWeightKg: null, durationMinutes: null, notes: 'Inclinazione 45°' },
        { machineName: 'Kettlebell swing', category: 'Funzionale', sets: 4, reps: 15, targetWeightKg: 12, durationMinutes: null, notes: null },
        { machineName: 'Yoga stretching', category: 'Flessibilità', sets: null, reps: null, targetWeightKg: null, durationMinutes: 15, notes: 'Focus catena posteriore' },
      ]},
    ],
  },
  dm2: {
    id: 'p2', memberId: 'dm2', generatedAtUtc: '2026-06-08T10:00:00Z', status: 'Active',
    weeklyFrequency: 5,
    focusSummary: 'Ipertrofia — Bulk Phase Ciclo 2/8',
    analysisSummary: 'Analisi su 68 sessioni. Forza in crescita costante (+12% in 8 settimane). Frequenza ottimale. Aree da sviluppare: spalle e trapezi. Volume totale aumentato a 18 serie per sessione.',
    days: [
      { dayNumber: 1, label: 'Petto + Tricipiti', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedDurationMinutes: 70, exercises: [
        { machineName: 'Panca piana', category: 'Petto', sets: 5, reps: 8, targetWeightKg: 85, durationMinutes: null, notes: 'Progressione piramidale' },
        { machineName: 'Panca inclinata manubri', category: 'Petto', sets: 4, reps: 10, targetWeightKg: 32, durationMinutes: null, notes: null },
        { machineName: 'Dip alle parallele', category: 'Tricipiti', sets: 4, reps: 12, targetWeightKg: null, durationMinutes: null, notes: 'Peso corporeo + 10kg' },
        { machineName: 'Pushdown cavi', category: 'Tricipiti', sets: 3, reps: 15, targetWeightKg: 20, durationMinutes: null, notes: null },
      ]},
      { dayNumber: 2, label: 'Schiena + Bicipiti', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedDurationMinutes: 65, exercises: [
        { machineName: 'Stacco da terra', category: 'Schiena', sets: 4, reps: 6, targetWeightKg: 120, durationMinutes: null, notes: '⚠ Tecnica priorità' },
        { machineName: 'Rematore bilanciere', category: 'Schiena', sets: 4, reps: 8, targetWeightKg: 70, durationMinutes: null, notes: null },
        { machineName: 'Curl bilanciere', category: 'Bicipiti', sets: 4, reps: 10, targetWeightKg: 40, durationMinutes: null, notes: null },
      ]},
      { dayNumber: 3, label: 'Gambe', sessionType: 'Strength', muscleGroup: 'LowerBody', estimatedDurationMinutes: 75, exercises: [
        { machineName: 'Squat libero', category: 'Quadricipiti', sets: 5, reps: 6, targetWeightKg: 100, durationMinutes: null, notes: 'PR target: 105kg' },
        { machineName: 'Leg press', category: 'Quadricipiti', sets: 4, reps: 10, targetWeightKg: 180, durationMinutes: null, notes: null },
        { machineName: 'Romanian deadlift', category: 'Femorali', sets: 3, reps: 10, targetWeightKg: 70, durationMinutes: null, notes: null },
      ]},
      { dayNumber: 4, label: 'Spalle + Trapezi', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedDurationMinutes: 60, exercises: [
        { machineName: 'Military press', category: 'Spalle', sets: 4, reps: 8, targetWeightKg: 55, durationMinutes: null, notes: null },
        { machineName: 'Alzate laterali', category: 'Spalle', sets: 4, reps: 15, targetWeightKg: 10, durationMinutes: null, notes: null },
        { machineName: 'Scrollate bilanciere', category: 'Trapezi', sets: 4, reps: 12, targetWeightKg: 80, durationMinutes: null, notes: null },
      ]},
      { dayNumber: 5, label: 'Cardio + Core', sessionType: 'Cardio', muscleGroup: 'Core', estimatedDurationMinutes: 35, exercises: [
        { machineName: 'Bike', category: 'Cardio', sets: null, reps: null, targetWeightKg: null, durationMinutes: 20, notes: 'Steady state 65% FC max' },
        { machineName: 'Plank', category: 'Core', sets: 3, reps: null, targetWeightKg: null, durationMinutes: 1, notes: null },
      ]},
    ],
  },
}

const DEMO_HISTORY: WorkoutPlanDto[] = [
  { id: 'ph1', memberId: 'dm1', generatedAtUtc: '2026-05-12T09:00:00Z', status: 'Archived',
    weeklyFrequency: 3, focusSummary: 'Forza base + Mobilità — Ciclo 2/12',
    analysisSummary: 'Ciclo completato con successo. Carichi aumentati del 6% in 4 settimane.', days: [] },
  { id: 'ph2', memberId: 'dm1', generatedAtUtc: '2026-04-01T09:00:00Z', status: 'Archived',
    weeklyFrequency: 3, focusSummary: 'Introduzione corpo libero — Ciclo 1/12',
    analysisSummary: 'Prima scheda adattiva. Analisi su 12 sessioni di onboarding.', days: [] },
]

const PROGRESS_DATA = [
  { week: 'W1', 'Lat machine': 28, 'Leg press': 60, 'Hip thrust': 32, 'Cavi crossover': 10 },
  { week: 'W2', 'Lat machine': 30, 'Leg press': 65, 'Hip thrust': 32, 'Cavi crossover': 10 },
  { week: 'W3', 'Lat machine': 30, 'Leg press': 70, 'Hip thrust': 35, 'Cavi crossover': 11 },
  { week: 'W4', 'Lat machine': 32, 'Leg press': 70, 'Hip thrust': 37, 'Cavi crossover': 11 },
  { week: 'W5', 'Lat machine': 32, 'Leg press': 75, 'Hip thrust': 37, 'Cavi crossover': 12 },
  { week: 'W6', 'Lat machine': 33, 'Leg press': 75, 'Hip thrust': 40, 'Cavi crossover': 12 },
  { week: 'W7', 'Lat machine': 35, 'Leg press': 78, 'Hip thrust': 40, 'Cavi crossover': 12 },
  { week: 'W8', 'Lat machine': 35, 'Leg press': 80, 'Hip thrust': 40, 'Cavi crossover': 12 },
]

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_COLOR: Record<string, string> = {
  Strength: 'bg-blue-100 text-blue-700', Cardio: 'bg-green-100 text-green-700',
  Functional: 'bg-violet-100 text-violet-700', Recovery: 'bg-slate-100 text-slate-600',
}
const SESSION_ICON: Record<string, string> = {
  Strength: '💪', Cardio: '🏃', Functional: '⚡', Recovery: '🧘',
}
const MUSCLE_COLOR: Record<string, string> = {
  UpperBody: 'text-blue-600', LowerBody: 'text-orange-600',
  Cardio: 'text-green-600', FullBody: 'text-violet-600', Core: 'text-amber-600',
}
const CHART_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#3b82f6']
const GEN_STEPS = [
  { icon: '📊', label: 'Analisi sessioni storiche…' },
  { icon: '🧠', label: 'Calcolo scheda adattiva…'  },
  { icon: '💾', label: 'Salvataggio piano…'         },
]

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

// ── Rule-based demo plan generator ────────────────────────────────────────────
function generateDemoPlan(member: MemberDto, lookbackDays: number): WorkoutPlanDto {
  const freq = lookbackDays >= 60 ? 4 : 3
  const profiles: Record<string, { focus: string; analysis: string; days: PlannedDayDto[] }> = {
    dm3: {
      focus: 'Tonificazione Total Body — Ciclo 1/8',
      analysis: `Analisi ${lookbackDays}gg per ${member.fullName}. 28 sessioni rilevate, prevalenza cardio e funzionale. Obiettivo: migliorare tonicità muscolare mantenendo cardiorespiratorio. Carichi inizializzati su valori moderati con progressione +5% ogni 2 settimane.`,
      days: [
        { dayNumber: 1, label: 'Total Body A', sessionType: 'Strength', muscleGroup: 'FullBody', estimatedDurationMinutes: 50, exercises: [
          { machineName: 'Leg press', category: 'Quadricipiti', sets: 3, reps: 15, targetWeightKg: 60, durationMinutes: null, notes: 'Piedi paralleli, controllo discesa' },
          { machineName: 'Chest press', category: 'Petto', sets: 3, reps: 12, targetWeightKg: 20, durationMinutes: null, notes: null },
          { machineName: 'Lat machine', category: 'Schiena', sets: 3, reps: 12, targetWeightKg: 28, durationMinutes: null, notes: 'Presa media' },
          { machineName: 'Shoulder press', category: 'Spalle', sets: 3, reps: 12, targetWeightKg: 10, durationMinutes: null, notes: null },
          { machineName: 'Plank', category: 'Core', sets: 3, reps: null, targetWeightKg: null, durationMinutes: 1, notes: '60 sec frontale' },
        ]},
        { dayNumber: 2, label: 'Cardio + Core', sessionType: 'Cardio', muscleGroup: 'Core', estimatedDurationMinutes: 40, exercises: [
          { machineName: 'Tapis roulant', category: 'Cardio', sets: null, reps: null, targetWeightKg: null, durationMinutes: 25, notes: 'Passo sostenuto 7km/h' },
          { machineName: 'Crunch machine', category: 'Core', sets: 3, reps: 20, targetWeightKg: 10, durationMinutes: null, notes: null },
          { machineName: 'Leg raise', category: 'Core', sets: 3, reps: 15, targetWeightKg: null, durationMinutes: null, notes: null },
        ]},
        { dayNumber: 3, label: 'Total Body B', sessionType: 'Strength', muscleGroup: 'FullBody', estimatedDurationMinutes: 50, exercises: [
          { machineName: 'Leg curl', category: 'Femorali', sets: 3, reps: 15, targetWeightKg: 25, durationMinutes: null, notes: null },
          { machineName: 'Cavi crossover', category: 'Petto', sets: 3, reps: 15, targetWeightKg: 8, durationMinutes: null, notes: null },
          { machineName: 'Curl manubri', category: 'Bicipiti', sets: 3, reps: 12, targetWeightKg: 6, durationMinutes: null, notes: null },
          { machineName: 'Tricipiti cavi', category: 'Tricipiti', sets: 3, reps: 12, targetWeightKg: 8, durationMinutes: null, notes: null },
          { machineName: 'Abductor machine', category: 'Glutei', sets: 3, reps: 20, targetWeightKg: 40, durationMinutes: null, notes: null },
        ]},
      ],
    },
    dm4: {
      focus: 'Ipertrofia Intermedia — Ciclo 1/12',
      analysis: `Analisi ${lookbackDays}gg per ${member.fullName}. 52 sessioni rilevate, alta frequenza strength. Buona base di forza. Piano ipertrofia con split Upper/Lower per massimizzare volume muscolare. Volume aumentato del 15% rispetto ciclo precedente.`,
      days: [
        { dayNumber: 1, label: 'Upper Push', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedDurationMinutes: 65, exercises: [
          { machineName: 'Panca piana', category: 'Petto', sets: 4, reps: 10, targetWeightKg: 70, durationMinutes: null, notes: 'Progressione piramidale' },
          { machineName: 'Shoulder press macchina', category: 'Spalle', sets: 4, reps: 10, targetWeightKg: 30, durationMinutes: null, notes: null },
          { machineName: 'Alzate laterali', category: 'Spalle', sets: 3, reps: 15, targetWeightKg: 8, durationMinutes: null, notes: 'Controllo eccentrica' },
          { machineName: 'Pushdown cavi', category: 'Tricipiti', sets: 4, reps: 12, targetWeightKg: 18, durationMinutes: null, notes: null },
        ]},
        { dayNumber: 2, label: 'Lower Body', sessionType: 'Strength', muscleGroup: 'LowerBody', estimatedDurationMinutes: 70, exercises: [
          { machineName: 'Leg press', category: 'Quadricipiti', sets: 4, reps: 10, targetWeightKg: 100, durationMinutes: null, notes: '+5% vs ciclo precedente' },
          { machineName: 'Leg curl', category: 'Femorali', sets: 4, reps: 10, targetWeightKg: 40, durationMinutes: null, notes: null },
          { machineName: 'Hip thrust', category: 'Glutei', sets: 4, reps: 12, targetWeightKg: 60, durationMinutes: null, notes: null },
          { machineName: 'Calf machine', category: 'Polpacci', sets: 4, reps: 20, targetWeightKg: 50, durationMinutes: null, notes: null },
        ]},
        { dayNumber: 3, label: 'Upper Pull', sessionType: 'Strength', muscleGroup: 'UpperBody', estimatedDurationMinutes: 60, exercises: [
          { machineName: 'Lat machine', category: 'Schiena', sets: 4, reps: 10, targetWeightKg: 55, durationMinutes: null, notes: 'Presa larga' },
          { machineName: 'Rematore cavi', category: 'Schiena', sets: 4, reps: 10, targetWeightKg: 45, durationMinutes: null, notes: null },
          { machineName: 'Curl bilanciere', category: 'Bicipiti', sets: 4, reps: 10, targetWeightKg: 35, durationMinutes: null, notes: null },
          { machineName: 'Face pull', category: 'Spalle', sets: 3, reps: 15, targetWeightKg: 12, durationMinutes: null, notes: 'Salute rotatori' },
        ]},
        { dayNumber: 4, label: 'Lower Body + HIIT', sessionType: 'Mixed', muscleGroup: 'LowerBody', estimatedDurationMinutes: 55, exercises: [
          { machineName: 'Squat guidato', category: 'Quadricipiti', sets: 4, reps: 8, targetWeightKg: 80, durationMinutes: null, notes: 'Profondità completa' },
          { machineName: 'Bike', category: 'Cardio', sets: null, reps: null, targetWeightKg: null, durationMinutes: 15, notes: 'Intervalli 20s/40s' },
          { machineName: 'Plank laterale', category: 'Core', sets: 3, reps: null, targetWeightKg: null, durationMinutes: 1, notes: null },
        ]},
      ],
    },
  }
  const profile = profiles[member.id] ?? {
    focus: `Piano personalizzato — ${member.fullName}`,
    analysis: `Analisi ${lookbackDays}gg completata. Piano generato su base dati disponibili con progressione standard +5%.`,
    days: [
      { dayNumber: 1, label: 'Full Body A', sessionType: 'Strength', muscleGroup: 'FullBody', estimatedDurationMinutes: 50, exercises: [
        { machineName: 'Leg press', category: 'Quadricipiti', sets: 3, reps: 12, targetWeightKg: 70, durationMinutes: null, notes: null },
        { machineName: 'Chest press', category: 'Petto', sets: 3, reps: 12, targetWeightKg: 30, durationMinutes: null, notes: null },
        { machineName: 'Lat machine', category: 'Schiena', sets: 3, reps: 12, targetWeightKg: 35, durationMinutes: null, notes: null },
      ]},
    ],
  }
  return {
    id: `gen-${member.id}-${Date.now()}`,
    memberId: member.id,
    generatedAtUtc: new Date().toISOString(),
    status: 'Active',
    weeklyFrequency: freq,
    focusSummary: profile.focus,
    analysisSummary: profile.analysis,
    days: profile.days,
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function AiCoach() {
  const qc = useQueryClient()
  const [searchText, setSearchText]     = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(searchText, 300)

  const [expandedDay, setExpandedDay]   = useState<number | null>(null)
  const [activeTab, setActiveTab]       = useState<'scheda' | 'progressione' | 'storico'>('scheda')
  const [lookbackDays, setLookbackDays] = useState(60)
  const [genStep, setGenStep]           = useState<number | null>(null)

  const { data: membersData } = useQuery({
    queryKey: ['members-search', debouncedSearch],
    queryFn:  () => api.get<MemberDto[]>(`/api/v1/members?search=${encodeURIComponent(debouncedSearch)}&pageSize=8`),
    enabled:  debouncedSearch.length >= 2, staleTime: 10_000, retry: false,
  })

  const remoteMembers: MemberDto[] = membersData?.data ?? []
  const displayMembers = remoteMembers.length > 0
    ? remoteMembers
    : debouncedSearch.length >= 2
      ? DEMO_MEMBERS.filter(m => m.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) || m.email.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : []

  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ['aicoach', 'plan', selectedMember?.id],
    queryFn:  () => api.get<WorkoutPlanDto>(`/api/v1/aicoach/members/${selectedMember!.id}/plan`),
    enabled:  !!selectedMember, retry: false,
  })

  const { data: historyData } = useQuery({
    queryKey: ['aicoach', 'history', selectedMember?.id],
    queryFn:  () => api.get<WorkoutPlanDto[]>(`/api/v1/aicoach/members/${selectedMember!.id}/plans?limit=5`),
    enabled:  !!selectedMember && activeTab === 'storico', retry: false,
  })

  const [localPlan, setLocalPlan] = useState<WorkoutPlanDto | null>(null)

  const isDemoMember = selectedMember && selectedMember.id.startsWith('dm')
  const plan    = planData?.data ?? localPlan ?? (isDemoMember ? DEMO_PLANS[selectedMember!.id] ?? null : null)
  const history = historyData?.data ?? (isDemoMember ? DEMO_HISTORY : [])

  const generateMutation = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < GEN_STEPS.length; i++) {
        setGenStep(i); await new Promise(r => setTimeout(r, 900))
      }
      if (isDemoMember) {
        // Rule-based demo generation: build a plan locally without API
        const generated = generateDemoPlan(selectedMember!, lookbackDays)
        setLocalPlan(generated)
        setGenStep(null)
        return generated
      }
      return api.post<WorkoutPlanDto>(`/api/v1/aicoach/members/${selectedMember!.id}/plan/generate`, { lookbackDays })
    },
    onSuccess: () => { setGenStep(null); qc.invalidateQueries({ queryKey: ['aicoach'] }) },
    onError: () => setGenStep(null),
  })

  function selectMember(m: MemberDto) {
    setSelectedMember(m); setSearchText(m.fullName); setShowDropdown(false)
    setExpandedDay(null); setActiveTab('scheda'); setLocalPlan(null)
  }

  // Stats from plan
  const totalEx   = plan?.days.reduce((s, d) => s + d.exercises.length, 0) ?? 0
  const totalMin  = plan?.days.reduce((s, d) => s + d.estimatedDurationMinutes, 0) ?? 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Coach Engine</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Schede adattive generate da dati reali — frequenza, macchinari, carichi, progressione +5% ogni 2 settimane.
        </p>
      </div>

      {/* KPI global */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Piani attivi',         value: '4',    sub: '12 archiviati',        color: 'text-brand-600' },
          { label: 'Soci con scheda',       value: '47',   sub: '39% del totale attivi', color: 'text-violet-600' },
          { label: 'Sessioni/sett media',   value: '3.8',  sub: 'Media piani attivi',    color: 'text-blue-600' },
          { label: 'Progressione media',    value: '+8%',  sub: 'Carichi ciclo corrente', color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
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
          <p className="text-5xl">🤖</p>
          <p className="mt-3 text-lg font-semibold text-slate-700">Seleziona un socio per iniziare</p>
          <p className="text-sm text-slate-400 mt-1">Cerca per nome o email nel campo sopra.</p>
        </div>
      )}

      {selectedMember && (
        <>
          {/* Member identity bar */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <Avatar name={selectedMember.fullName} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{selectedMember.fullName}</h2>
              <p className="text-sm text-slate-400">{selectedMember.email}</p>
              {plan && (
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-slate-500">📅 {plan.weeklyFrequency}× / settimana</span>
                  <span className="text-xs text-slate-500">⏱ {totalMin} min/sett.</span>
                  <span className="text-xs text-slate-500">🏋️ {totalEx} esercizi totali</span>
                  <span className="text-xs text-slate-500">📅 Gen. {new Date(plan.generatedAtUtc).toLocaleDateString('it-IT')}</span>
                </div>
              )}
            </div>
            <button onClick={() => window.print()} className="text-xs text-slate-400 hover:text-slate-600 underline flex-shrink-0">
              🖨 Stampa
            </button>
          </div>

          {/* Generate panel */}
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-800">Genera nuova scheda adattiva</p>
                <p className="text-xs text-brand-600 mt-0.5">
                  Analisi ultimi <strong>{lookbackDays} giorni</strong> — frequenza, macchinari, carichi, recovery score. Progressione automatica +5%.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <label className="text-xs text-brand-700 font-medium">Lookback:</label>
                <select value={lookbackDays} onChange={e => setLookbackDays(+e.target.value)}
                  className="rounded-lg border border-brand-300 bg-white px-2 py-1.5 text-sm">
                  {[30,60,90].map(d => <option key={d} value={d}>{d} giorni</option>)}
                </select>
                <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition">
                  {generateMutation.isPending ? '⚙ Generazione…' : '✨ Genera scheda'}
                </button>
              </div>
            </div>
            {genStep !== null && (
              <div className="mt-4 flex items-center gap-6">
                {GEN_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm transition-all ${i < genStep ? 'text-brand-400 line-through' : i === genStep ? 'text-brand-700 font-semibold' : 'text-brand-300'}`}>
                    <span className={i === genStep ? 'animate-spin inline-block' : ''}>{i < genStep ? '✓' : step.icon}</span>
                    {step.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
            {([
              ['scheda',       '🏋️ Scheda attiva'],
              ['progressione', '📈 Progressione'],
              ['storico',      '🗂 Storico'],
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB SCHEDA ── */}
          {activeTab === 'scheda' && (
            <>
              {planLoading && <div className="flex items-center gap-3 py-8 text-sm text-slate-400"><span className="animate-spin">⚙</span> Caricamento…</div>}

              {plan && (
                <div className="space-y-4">
                  {/* Plan header */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{plan.focusSummary}</h2>
                        <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">{plan.analysisSummary}</p>
                      </div>
                      <span className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-black text-brand-700 flex-shrink-0">
                        {plan.weeklyFrequency}× / sett.
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                      {[
                        { label: 'giorni/settimana', value: plan.weeklyFrequency },
                        { label: 'min/settimana',    value: totalMin + "'" },
                        { label: 'esercizi totali',  value: totalEx },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                          <div className="text-2xl font-black text-slate-800">{s.value}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day accordion */}
                  <div className="space-y-2">
                    {plan.days.map(day => (
                      <div key={day.dayNumber} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <button onClick={() => setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber)}
                          className="flex w-full items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 transition">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-black text-brand-700 text-sm">
                            G{day.dayNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{day.label}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-400">{day.exercises.length} esercizi</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-400">~{day.estimatedDurationMinutes} min</span>
                              <span className="text-slate-300">·</span>
                              <span className={`text-xs font-medium ${MUSCLE_COLOR[day.muscleGroup] ?? 'text-slate-500'}`}>{day.muscleGroup}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SESSION_COLOR[day.sessionType] ?? 'bg-slate-100 text-slate-600'}`}>
                              {SESSION_ICON[day.sessionType]} {day.sessionType}
                            </span>
                            <span className="text-slate-400 text-xs">{expandedDay === day.dayNumber ? '▲' : '▼'}</span>
                          </div>
                        </button>

                        {expandedDay === day.dayNumber && (
                          <div className="border-t border-slate-100">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-left text-xs text-slate-400 uppercase tracking-wide">
                                  <th className="px-6 py-2.5">#</th>
                                  <th className="px-4 py-2.5">Esercizio</th>
                                  <th className="px-4 py-2.5">Categoria</th>
                                  <th className="px-4 py-2.5 text-center">Serie</th>
                                  <th className="px-4 py-2.5 text-center">Rip.</th>
                                  <th className="px-4 py-2.5 text-center">Carico</th>
                                  <th className="px-4 py-2.5">Note AI</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {day.exercises.map((ex, i) => (
                                  <tr key={i} className="hover:bg-slate-50/60 transition">
                                    <td className="px-6 py-3 text-slate-400 text-xs">{i + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{ex.machineName}</td>
                                    <td className="px-4 py-3">
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{ex.category}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-600">{ex.sets ?? '—'}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{ex.reps ?? '—'}</td>
                                    <td className="px-4 py-3 text-center">
                                      {ex.targetWeightKg != null
                                        ? <span className="font-bold text-brand-700">{ex.targetWeightKg} kg</span>
                                        : ex.durationMinutes != null
                                        ? <span className="font-bold text-emerald-700">{ex.durationMinutes}'</span>
                                        : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px]">{ex.notes ?? ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!planLoading && !plan && !generateMutation.isPending && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-5xl">🤖</p>
                  <p className="mt-3 text-lg font-semibold text-slate-700">Nessuna scheda attiva</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Premi "Genera scheda" per creare il piano adattivo per {selectedMember.fullName}.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── TAB PROGRESSIONE ── */}
          {activeTab === 'progressione' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-1 text-sm font-semibold text-slate-700">Progressione carichi — ultime 8 settimane (kg)</p>
                <p className="mb-4 text-xs text-slate-400">Basato su sessioni registrate ai macchinari. Linee tratteggiate = target AI proiettato.</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={PROGRESS_DATA} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit=" kg" />
                    <Tooltip formatter={(v: number, n: string) => [`${v} kg`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {['Lat machine','Leg press','Hip thrust','Cavi crossover'].map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i]}
                        strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* PR cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { machine: 'Leg press',      current: 80, prev: 70, unit: 'kg' },
                  { machine: 'Lat machine',     current: 35, prev: 28, unit: 'kg' },
                  { machine: 'Hip thrust',      current: 40, prev: 32, unit: 'kg' },
                  { machine: 'Cavi crossover',  current: 12, prev: 10, unit: 'kg' },
                ].map(pr => {
                  const delta = Math.round((pr.current - pr.prev) / pr.prev * 100)
                  return (
                    <div key={pr.machine} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-400 truncate">{pr.machine}</p>
                      <p className="text-2xl font-black text-slate-800 mt-0.5">{pr.current} <span className="text-sm font-normal">{pr.unit}</span></p>
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">+{delta}% vs. inizio ciclo</p>
                    </div>
                  )
                })}
              </div>

              {/* Next target */}
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                <p className="text-sm font-semibold text-brand-800 mb-2">🎯 Obiettivi prossimo ciclo (proiezione AI +5%)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                  {[
                    { machine: 'Leg press',     target: 84 }, { machine: 'Lat machine',    target: 37 },
                    { machine: 'Hip thrust',    target: 42 }, { machine: 'Cavi crossover', target: 13 },
                  ].map(t => (
                    <div key={t.machine} className="rounded-lg bg-white/70 px-3 py-2">
                      <p className="text-slate-500">{t.machine}</p>
                      <p className="font-bold text-brand-700">{t.target} kg</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB STORICO ── */}
          {activeTab === 'storico' && (
            <div className="space-y-3">
              {history.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  Nessuna scheda archiviata per questo membro.
                </div>
              )}
              {history.map((h) => (
                <div key={h.id} className={`rounded-xl border bg-white p-5 ${h.status === 'Active' ? 'border-brand-300' : 'border-slate-200 opacity-70'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{h.focusSummary}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(h.generatedAtUtc).toLocaleDateString('it-IT')} · {h.weeklyFrequency}× / sett.
                        {h.days.length > 0 && ` · ${h.days.length} giorni`}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0 ${h.status === 'Active' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                      {h.status === 'Active' ? '✓ Attiva' : 'Archiviata'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{h.analysisSummary}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
