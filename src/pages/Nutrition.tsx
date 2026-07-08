import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge, Button, Input } from '../components/ui'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface FoodItem {
  id: string; name: string; category: string
  caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number
  fatPer100g: number; fiberPer100g: number; isCustom: boolean
}
interface BodyComposition {
  measuredAt: string; weightKg: number; bodyFatPct: number
  leanMassKg: number; muscleMassKg: number; boneMassKg: number; waterPct: number
}
interface NutritionMember {
  id: string; name: string; email: string; age: number; sex: 'M' | 'F'
  heightCm: number; goal: 'Dimagrimento' | 'Definizione' | 'Massa' | 'Mantenimento'
  activityLevel: 'Sedentario' | 'Leggero' | 'Moderato' | 'Attivo' | 'Molto attivo'
  nutritionist?: string
  latest: BodyComposition; target: { weightKg: number; bodyFatPct: number }
  plan: { kcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; notes: string }
  meals: { name: string; kcalPct: number; time: string; example: string; foods?: MealFoodItem[] }[]
  weeklyMeals?: { day: number; meals: { name: string; kcalPct: number; time: string; example: string; foods?: MealFoodItem[] }[] }[]
  history: BodyComposition[]
  diary: { date: string; kcal: number; proteinG: number; carbsG: number; fatG: number; adherence: number }[]
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['Cereali','Carne','Pesce','Latticini','Legumi','Verdura','Frutta','Grassi','Dolci','Bevande','Altro']

const DEMO_FOODS: FoodItem[] = [
  { id: 'f1',  name: 'Petto di pollo (cotto)',   category: 'Carne',     caloriesPer100g: 165, proteinPer100g: 31.0, carbsPer100g: 0.0, fatPer100g: 3.6,  fiberPer100g: 0.0, isCustom: false },
  { id: 'f2',  name: 'Salmone al forno',         category: 'Pesce',     caloriesPer100g: 206, proteinPer100g: 20.4, carbsPer100g: 0.0, fatPer100g: 13.4, fiberPer100g: 0.0, isCustom: false },
  { id: 'f3',  name: 'Riso integrale (cotto)',   category: 'Cereali',   caloriesPer100g: 123, proteinPer100g: 2.7,  carbsPer100g: 25.6, fatPer100g: 1.0, fiberPer100g: 1.8, isCustom: false },
  { id: 'f4',  name: 'Avena (fiocchi)',           category: 'Cereali',   caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9, fiberPer100g: 10.6, isCustom: false },
  { id: 'f5',  name: 'Uova intere',              category: 'Latticini', caloriesPer100g: 155, proteinPer100g: 12.6, carbsPer100g: 1.1,  fatPer100g: 10.6, fiberPer100g: 0.0, isCustom: false },
  { id: 'f6',  name: 'Ricotta vaccina',          category: 'Latticini', caloriesPer100g: 136, proteinPer100g: 9.5,  carbsPer100g: 3.0,  fatPer100g: 9.5,  fiberPer100g: 0.0, isCustom: false },
  { id: 'f7',  name: 'Lenticchie (cotte)',       category: 'Legumi',    caloriesPer100g: 116, proteinPer100g: 9.0,  carbsPer100g: 20.1, fatPer100g: 0.4,  fiberPer100g: 7.9, isCustom: false },
  { id: 'f8',  name: 'Broccoli (cotti)',         category: 'Verdura',   caloriesPer100g: 34,  proteinPer100g: 2.8,  carbsPer100g: 6.6,  fatPer100g: 0.4,  fiberPer100g: 3.3, isCustom: false },
  { id: 'f9',  name: 'Banana',                  category: 'Frutta',    caloriesPer100g: 89,  proteinPer100g: 1.1,  carbsPer100g: 22.8, fatPer100g: 0.3,  fiberPer100g: 2.6, isCustom: false },
  { id: 'f10', name: 'Mandorle',                category: 'Grassi',    caloriesPer100g: 579, proteinPer100g: 21.2, carbsPer100g: 21.7, fatPer100g: 49.9, fiberPer100g: 12.5, isCustom: false },
  { id: 'f11', name: 'Olio extravergine oliva', category: 'Grassi',    caloriesPer100g: 884, proteinPer100g: 0.0,  carbsPer100g: 0.0,  fatPer100g: 100.0, fiberPer100g: 0.0, isCustom: false },
  { id: 'f12', name: 'Whey protein (neutro)',   category: 'Altro',     caloriesPer100g: 381, proteinPer100g: 75.0, carbsPer100g: 10.0, fatPer100g: 5.0,  fiberPer100g: 1.0, isCustom: true  },
  { id: 'f13', name: 'Pasta integrale (cotta)', category: 'Cereali',   caloriesPer100g: 140, proteinPer100g: 5.6,  carbsPer100g: 27.2, fatPer100g: 0.9,  fiberPer100g: 3.8, isCustom: false },
  { id: 'f14', name: 'Tonno al naturale',       category: 'Pesce',     caloriesPer100g: 116, proteinPer100g: 25.5, carbsPer100g: 0.0,  fatPer100g: 1.0,  fiberPer100g: 0.0, isCustom: false },
  { id: 'f15', name: 'Mozzarella di bufala',    category: 'Latticini', caloriesPer100g: 254, proteinPer100g: 15.9, carbsPer100g: 3.0,  fatPer100g: 20.0, fiberPer100g: 0.0, isCustom: false },
  { id: 'f16', name: 'Ceci (cotti)',            category: 'Legumi',    caloriesPer100g: 164, proteinPer100g: 8.9,  carbsPer100g: 27.4, fatPer100g: 2.6,  fiberPer100g: 7.6, isCustom: false },
  { id: 'f17', name: 'Spinaci (crudi)',         category: 'Verdura',   caloriesPer100g: 23,  proteinPer100g: 2.9,  carbsPer100g: 3.6,  fatPer100g: 0.4,  fiberPer100g: 2.2, isCustom: false },
  { id: 'f18', name: 'Fragole',                category: 'Frutta',    caloriesPer100g: 32,  proteinPer100g: 0.7,  carbsPer100g: 7.7,  fatPer100g: 0.3,  fiberPer100g: 2.0, isCustom: false },
]

const DEMO_MEMBERS: NutritionMember[] = [
  {
    id: 'm1', name: 'Giulia Ferretti', email: 'giulia.ferretti@email.it',
    age: 28, sex: 'F', heightCm: 166, goal: 'Definizione', activityLevel: 'Moderato', nutritionist: 'Dr.ssa Marta Ricci',
    latest: { measuredAt: '2026-06-10', weightKg: 62.4, bodyFatPct: 24.1, leanMassKg: 47.4, muscleMassKg: 24.8, boneMassKg: 2.3, waterPct: 55.2 },
    target:  { weightKg: 59.0, bodyFatPct: 20.0 },
    plan:    { kcal: 1750, proteinG: 140, carbsG: 160, fatG: 55, fiberG: 30, notes: 'Evitare zuccheri semplici dopo le 18:00. Pasto post-workout entro 45 min dalla sessione.' },
    meals: [
      { name: 'Colazione',   kcalPct: 20, time: '07:30', example: 'Avena 60g + frutta + yogurt greco' },
      { name: 'Spuntino',    kcalPct: 10, time: '10:30', example: 'Frutta + 10 mandorle' },
      { name: 'Pranzo',      kcalPct: 35, time: '13:00', example: 'Riso integrale + pollo + verdure' },
      { name: 'Spuntino 2',  kcalPct: 10, time: '16:30', example: 'Shake proteico + banana' },
      { name: 'Cena',        kcalPct: 25, time: '20:00', example: 'Pesce + verdure + olio EVO' },
    ],
    history: [
      { measuredAt: '2026-01-15', weightKg: 66.2, bodyFatPct: 28.4, leanMassKg: 47.4, muscleMassKg: 23.2, boneMassKg: 2.3, waterPct: 52.1 },
      { measuredAt: '2026-02-12', weightKg: 65.1, bodyFatPct: 27.2, leanMassKg: 47.4, muscleMassKg: 23.6, boneMassKg: 2.3, waterPct: 52.8 },
      { measuredAt: '2026-03-10', weightKg: 64.0, bodyFatPct: 26.1, leanMassKg: 47.3, muscleMassKg: 24.0, boneMassKg: 2.3, waterPct: 53.5 },
      { measuredAt: '2026-04-08', weightKg: 63.5, bodyFatPct: 25.5, leanMassKg: 47.3, muscleMassKg: 24.3, boneMassKg: 2.3, waterPct: 54.1 },
      { measuredAt: '2026-05-06', weightKg: 63.0, bodyFatPct: 24.9, leanMassKg: 47.3, muscleMassKg: 24.6, boneMassKg: 2.3, waterPct: 54.8 },
      { measuredAt: '2026-06-10', weightKg: 62.4, bodyFatPct: 24.1, leanMassKg: 47.4, muscleMassKg: 24.8, boneMassKg: 2.3, waterPct: 55.2 },
    ],
    diary: [
      { date: '2026-06-18', kcal: 1780, proteinG: 138, carbsG: 165, fatG: 57,  adherence: 92 },
      { date: '2026-06-19', kcal: 1650, proteinG: 125, carbsG: 155, fatG: 52,  adherence: 86 },
      { date: '2026-06-20', kcal: 1800, proteinG: 145, carbsG: 163, fatG: 58,  adherence: 96 },
      { date: '2026-06-21', kcal: 1720, proteinG: 136, carbsG: 160, fatG: 54,  adherence: 89 },
      { date: '2026-06-22', kcal: 1760, proteinG: 142, carbsG: 159, fatG: 56,  adherence: 94 },
      { date: '2026-06-23', kcal: 1700, proteinG: 130, carbsG: 158, fatG: 53,  adherence: 88 },
      { date: '2026-06-24', kcal: 1750, proteinG: 140, carbsG: 162, fatG: 55,  adherence: 99 },
    ],
  },
  {
    id: 'm2', name: 'Marco Bianchi', email: 'marco.bianchi@email.it',
    age: 34, sex: 'M', heightCm: 180, goal: 'Massa', activityLevel: 'Attivo', nutritionist: 'Dr. Luca Fontana',
    latest: { measuredAt: '2026-06-05', weightKg: 82.0, bodyFatPct: 14.2, leanMassKg: 70.3, muscleMassKg: 38.6, boneMassKg: 3.5, waterPct: 60.1 },
    target:  { weightKg: 87.0, bodyFatPct: 13.0 },
    plan:    { kcal: 3100, proteinG: 210, carbsG: 380, fatG: 85, fiberG: 35, notes: 'Carico di carboidrati nei giorni di allenamento pesante. Creatina 5g/die.' },
    meals: [
      { name: 'Colazione',      kcalPct: 22, time: '07:00', example: 'Avena 100g + 4 uova + frutta' },
      { name: 'Spuntino pre',   kcalPct: 12, time: '10:30', example: 'Banana + whey + pane integrale' },
      { name: 'Pranzo',         kcalPct: 30, time: '13:00', example: 'Pasta 120g + manzo 200g + verdure' },
      { name: 'Post-workout',   kcalPct: 16, time: '18:00', example: 'Shake proteico + riso basmati 80g' },
      { name: 'Cena',           kcalPct: 20, time: '20:30', example: 'Salmone + patate dolci + verdure' },
    ],
    history: [
      { measuredAt: '2026-01-10', weightKg: 79.0, bodyFatPct: 16.1, leanMassKg: 66.3, muscleMassKg: 36.0, boneMassKg: 3.5, waterPct: 57.2 },
      { measuredAt: '2026-02-08', weightKg: 79.8, bodyFatPct: 15.8, leanMassKg: 67.2, muscleMassKg: 36.5, boneMassKg: 3.5, waterPct: 57.8 },
      { measuredAt: '2026-03-08', weightKg: 80.5, bodyFatPct: 15.4, leanMassKg: 68.1, muscleMassKg: 37.1, boneMassKg: 3.5, waterPct: 58.4 },
      { measuredAt: '2026-04-05', weightKg: 81.0, bodyFatPct: 15.0, leanMassKg: 68.9, muscleMassKg: 37.6, boneMassKg: 3.5, waterPct: 59.0 },
      { measuredAt: '2026-05-03', weightKg: 81.6, bodyFatPct: 14.6, leanMassKg: 69.7, muscleMassKg: 38.2, boneMassKg: 3.5, waterPct: 59.6 },
      { measuredAt: '2026-06-05', weightKg: 82.0, bodyFatPct: 14.2, leanMassKg: 70.3, muscleMassKg: 38.6, boneMassKg: 3.5, waterPct: 60.1 },
    ],
    diary: [
      { date: '2026-06-18', kcal: 3080, proteinG: 208, carbsG: 375, fatG: 84, adherence: 95 },
      { date: '2026-06-19', kcal: 2900, proteinG: 195, carbsG: 360, fatG: 80, adherence: 88 },
      { date: '2026-06-20', kcal: 3150, proteinG: 215, carbsG: 385, fatG: 87, adherence: 98 },
      { date: '2026-06-21', kcal: 3000, proteinG: 200, carbsG: 370, fatG: 82, adherence: 91 },
      { date: '2026-06-22', kcal: 3100, proteinG: 210, carbsG: 380, fatG: 85, adherence: 99 },
      { date: '2026-06-23', kcal: 2850, proteinG: 190, carbsG: 355, fatG: 78, adherence: 85 },
      { date: '2026-06-24', kcal: 3120, proteinG: 212, carbsG: 382, fatG: 86, adherence: 97 },
    ],
  },
  {
    id: 'm3', name: 'Alessia Romano', email: 'alessia.romano@email.it',
    age: 42, sex: 'F', heightCm: 162, goal: 'Dimagrimento', activityLevel: 'Leggero', nutritionist: 'Dr.ssa Marta Ricci',
    latest: { measuredAt: '2026-06-08', weightKg: 74.2, bodyFatPct: 34.8, leanMassKg: 48.3, muscleMassKg: 22.1, boneMassKg: 2.1, waterPct: 49.6 },
    target:  { weightKg: 65.0, bodyFatPct: 28.0 },
    plan:    { kcal: 1480, proteinG: 110, carbsG: 150, fatG: 45, fiberG: 28, notes: 'Deficit calorico moderato. Pasto serale leggero. Camminate 30 min/die.' },
    meals: [
      { name: 'Colazione',  kcalPct: 20, time: '08:00', example: 'Yogurt greco + frutti di bosco + 1 fetta pane integrale' },
      { name: 'Spuntino',   kcalPct: 10, time: '11:00', example: 'Mela + 5 noci' },
      { name: 'Pranzo',     kcalPct: 35, time: '13:00', example: 'Insalata di legumi + tonno + verdure' },
      { name: 'Cena',       kcalPct: 35, time: '19:30', example: 'Pollo ai ferri + verdure cotte + 1 cucchiaio olio' },
    ],
    history: [
      { measuredAt: '2026-01-20', weightKg: 79.5, bodyFatPct: 38.2, leanMassKg: 49.1, muscleMassKg: 21.0, boneMassKg: 2.1, waterPct: 46.8 },
      { measuredAt: '2026-02-18', weightKg: 78.2, bodyFatPct: 37.5, leanMassKg: 48.9, muscleMassKg: 21.2, boneMassKg: 2.1, waterPct: 47.3 },
      { measuredAt: '2026-03-18', weightKg: 77.0, bodyFatPct: 36.8, leanMassKg: 48.7, muscleMassKg: 21.5, boneMassKg: 2.1, waterPct: 47.9 },
      { measuredAt: '2026-04-15', weightKg: 76.1, bodyFatPct: 36.1, leanMassKg: 48.5, muscleMassKg: 21.7, boneMassKg: 2.1, waterPct: 48.4 },
      { measuredAt: '2026-05-13', weightKg: 75.0, bodyFatPct: 35.4, leanMassKg: 48.4, muscleMassKg: 21.9, boneMassKg: 2.1, waterPct: 48.9 },
      { measuredAt: '2026-06-08', weightKg: 74.2, bodyFatPct: 34.8, leanMassKg: 48.3, muscleMassKg: 22.1, boneMassKg: 2.1, waterPct: 49.6 },
    ],
    diary: [
      { date: '2026-06-18', kcal: 1510, proteinG: 112, carbsG: 153, fatG: 46, adherence: 90 },
      { date: '2026-06-19', kcal: 1420, proteinG: 105, carbsG: 142, fatG: 43, adherence: 83 },
      { date: '2026-06-20', kcal: 1490, proteinG: 110, carbsG: 151, fatG: 45, adherence: 95 },
      { date: '2026-06-21', kcal: 1550, proteinG: 115, carbsG: 158, fatG: 47, adherence: 87 },
      { date: '2026-06-22', kcal: 1480, proteinG: 111, carbsG: 150, fatG: 45, adherence: 99 },
      { date: '2026-06-23', kcal: 1400, proteinG: 102, carbsG: 143, fatG: 42, adherence: 79 },
      { date: '2026-06-24', kcal: 1470, proteinG: 109, carbsG: 149, fatG: 44, adherence: 94 },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const GOAL_UI: Record<string, { tone: 'green' | 'blue' | 'violet' | 'amber'; icon: string }> = {
  Dimagrimento: { tone: 'amber',  icon: '⬇' },
  Definizione:  { tone: 'blue',   icon: '✂' },
  Massa:        { tone: 'violet', icon: '💪' },
  Mantenimento: { tone: 'green',  icon: '⚖' },
}
const ACTIVITY_FACTORS: Record<string, number> = {
  Sedentario: 1.2, Leggero: 1.375, Moderato: 1.55, Attivo: 1.725, 'Molto attivo': 1.9,
}

function bmi(weight: number, height: number) {
  return weight / Math.pow(height / 100, 2)
}
function bmiLabel(b: number): { label: string; color: string } {
  if (b < 18.5) return { label: 'Sottopeso',    color: 'text-blue-500'  }
  if (b < 25.0) return { label: 'Normopeso',    color: 'text-emerald-600' }
  if (b < 30.0) return { label: 'Sovrappeso',   color: 'text-amber-500' }
  return              { label: 'Obesità',        color: 'text-red-500'   }
}
function bmr(m: NutritionMember) {
  const w = m.latest.weightKg, h = m.heightCm, a = m.age
  return m.sex === 'M'
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161
}
function tdee(m: NutritionMember) { return Math.round(bmr(m) * ACTIVITY_FACTORS[m.activityLevel]) }

function round1(n: number) { return Math.round(n * 10) / 10 }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }) }
// Returns meals for a specific date, respecting weeklyMeals if set (0=Lun … 6=Dom)
function getMealsForDate(m: NutritionMember, date: string) {
  if (!m.weeklyMeals?.length) return m.meals
  const dow = (new Date(date).getDay() + 6) % 7 // JS getDay(): 0=Sun → convert to 0=Mon
  return m.weeklyMeals.find(w => w.day === dow)?.meals ?? m.meals
}

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const pct = Math.min(100, Math.round(value / target * 100))
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-500">{value}{unit} / {target}{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700']
  const cls = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  return <div className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${cls} ${colors[name.charCodeAt(0) % colors.length]}`}>{initials}</div>
}

// ── Registered members (gym Members module — used to pick who gets a plan) ────
interface GymMemberRef { id: string; fullName: string; email: string; age?: number; sex?: 'M' | 'F'; heightCm?: number }

const REGISTERED_MEMBERS: GymMemberRef[] = [
  { id: 'gm1', fullName: 'Luca Martini',    email: 'luca.martini@email.it',    age: 31, sex: 'M', heightCm: 178 },
  { id: 'gm2', fullName: 'Federica Russo',  email: 'federica.russo@email.it',  age: 26, sex: 'F', heightCm: 164 },
  { id: 'gm3', fullName: 'Davide Costa',    email: 'davide.costa@email.it',    age: 38, sex: 'M', heightCm: 182 },
  { id: 'gm4', fullName: 'Chiara Moretti',  email: 'chiara.moretti@email.it',  age: 24, sex: 'F', heightCm: 168 },
  { id: 'gm5', fullName: 'Andrea Esposito', email: 'andrea.esposito@email.it', age: 45, sex: 'M', heightCm: 175 },
  { id: 'gm6', fullName: 'Valeria Greco',   email: 'valeria.greco@email.it',   age: 33, sex: 'F', heightCm: 161 },
  { id: 'gm7', fullName: 'Simone Ferrara',  email: 'simone.ferrara@email.it',  age: 29, sex: 'M', heightCm: 180 },
  { id: 'gm8', fullName: 'Beatrice Conti',  email: 'beatrice.conti@email.it',  age: 22, sex: 'F', heightCm: 170 },
]

// ── Edit / Create profile modal ───────────────────────────────────────────────
const GOALS     = ['Dimagrimento', 'Definizione', 'Massa', 'Mantenimento'] as const
const ACTIVITIES = ['Sedentario', 'Leggero', 'Moderato', 'Attivo', 'Molto attivo'] as const
const NUTRITIONISTS = ['Dr.ssa Marta Ricci', 'Dr. Luca Fontana', 'Dr.ssa Anna Conti', 'Non assegnato']

interface ProfileFormData {
  name: string; email: string; age: string; sex: 'M' | 'F'; heightCm: string
  goal: typeof GOALS[number]; activityLevel: typeof ACTIVITIES[number]
  nutritionist: string; targetWeightKg: string; targetBodyFatPct: string
  planKcal: string; planProteinG: string; planCarbsG: string; planFatG: string; planFiberG: string; planNotes: string
}

function profileToForm(m: NutritionMember): ProfileFormData {
  return {
    name: m.name, email: m.email, age: String(m.age), sex: m.sex,
    heightCm: String(m.heightCm), goal: m.goal, activityLevel: m.activityLevel,
    nutritionist: m.nutritionist ?? 'Non assegnato',
    targetWeightKg: String(m.target.weightKg), targetBodyFatPct: String(m.target.bodyFatPct),
    planKcal: String(m.plan.kcal), planProteinG: String(m.plan.proteinG),
    planCarbsG: String(m.plan.carbsG), planFatG: String(m.plan.fatG),
    planFiberG: String(m.plan.fiberG), planNotes: m.plan.notes,
  }
}

function emptyProfileForm(): ProfileFormData {
  return {
    name: '', email: '', age: '', sex: 'M', heightCm: '',
    goal: 'Mantenimento', activityLevel: 'Moderato',
    nutritionist: 'Non assegnato', targetWeightKg: '', targetBodyFatPct: '',
    planKcal: '', planProteinG: '', planCarbsG: '', planFatG: '', planFiberG: '', planNotes: '',
  }
}

function formToMember(form: ProfileFormData, base: NutritionMember): NutritionMember {
  return {
    ...base,
    name: form.name, email: form.email, age: parseInt(form.age) || base.age,
    sex: form.sex, heightCm: parseFloat(form.heightCm) || base.heightCm,
    goal: form.goal, activityLevel: form.activityLevel,
    nutritionist: form.nutritionist === 'Non assegnato' ? undefined : form.nutritionist,
    target: { weightKg: parseFloat(form.targetWeightKg) || base.target.weightKg, bodyFatPct: parseFloat(form.targetBodyFatPct) || base.target.bodyFatPct },
    plan: {
      ...base.plan,
      kcal: parseInt(form.planKcal) || base.plan.kcal, proteinG: parseInt(form.planProteinG) || base.plan.proteinG,
      carbsG: parseInt(form.planCarbsG) || base.plan.carbsG, fatG: parseInt(form.planFatG) || base.plan.fatG,
      fiberG: parseInt(form.planFiberG) || base.plan.fiberG, notes: form.planNotes,
    },
  }
}

// ── Shared plan fields form ────────────────────────────────────────────────────
function PlanFields({ form, onChange }: { form: ProfileFormData; onChange: (k: keyof ProfileFormData, v: string) => void }) {
  const cls = 'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
  return (
    <div className="space-y-5">
      {/* Obiettivi */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Obiettivi</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Obiettivo principale</label>
            <select className={cls} value={form.goal} onChange={e => onChange('goal', e.target.value)}>
              {GOALS.map(g => <option key={g} value={g}>{GOAL_UI[g]?.icon} {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Livello attività</label>
            <select className={cls} value={form.activityLevel} onChange={e => onChange('activityLevel', e.target.value)}>
              {ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Peso target (kg)</label>
            <input type="number" step="0.5" className={cls} value={form.targetWeightKg} onChange={e => onChange('targetWeightKg', e.target.value)} placeholder="70.0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">% massa grassa target</label>
            <input type="number" step="0.5" min="5" max="50" className={cls} value={form.targetBodyFatPct} onChange={e => onChange('targetBodyFatPct', e.target.value)} placeholder="18.0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nutrizionista</label>
            <select className={cls} value={form.nutritionist} onChange={e => onChange('nutritionist', e.target.value)}>
              {NUTRITIONISTS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>
      {/* Piano macro */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Piano nutrizionale (target giornaliero)</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Calorie (kcal/die)</label>
            <input type="number" step="50" className={cls} value={form.planKcal} onChange={e => onChange('planKcal', e.target.value)} placeholder="2000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Proteine (g)</label>
            <input type="number" step="5" className={cls} value={form.planProteinG} onChange={e => onChange('planProteinG', e.target.value)} placeholder="150" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Carboidrati (g)</label>
            <input type="number" step="5" className={cls} value={form.planCarbsG} onChange={e => onChange('planCarbsG', e.target.value)} placeholder="200" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Grassi (g)</label>
            <input type="number" step="5" className={cls} value={form.planFatG} onChange={e => onChange('planFatG', e.target.value)} placeholder="65" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fibre (g)</label>
            <input type="number" step="1" className={cls} value={form.planFiberG} onChange={e => onChange('planFiberG', e.target.value)} placeholder="25" />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Note per il cliente</label>
            <textarea className={cls + ' resize-none'} rows={2} value={form.planNotes} onChange={e => onChange('planNotes', e.target.value)} placeholder="Indicazioni specifiche, integratori, timing dei pasti…" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Meal food item ────────────────────────────────────────────────────────────
interface MealFoodItem {
  foodId?: string   // set when picked from DB
  name: string
  grams: number
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

function calcFood(food: FoodItem, grams: number): MealFoodItem {
  const r = (x: number) => Math.round(x * grams / 100 * 10) / 10
  return {
    foodId: food.id, name: food.name, grams,
    kcal: Math.round(food.caloriesPer100g * grams / 100),
    proteinG: r(food.proteinPer100g), carbsG: r(food.carbsPer100g),
    fatG: r(food.fatPer100g), fiberG: r(food.fiberPer100g),
  }
}

function mealFoodsTotal(foods: MealFoodItem[]) {
  return foods.reduce(
    (acc, f) => ({ kcal: acc.kcal + f.kcal, proteinG: acc.proteinG + f.proteinG, carbsG: acc.carbsG + f.carbsG, fatG: acc.fatG + f.fatG }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  )
}

// ── Food picker — search DB first, manual fallback ────────────────────────────
function FoodPicker({ foods, dbFoods, onAdd }: {
  foods: MealFoodItem[]
  dbFoods: FoodItem[]
  onAdd: (item: MealFoodItem) => void
}) {
  const [query, setQuery]   = useState('')
  const [grams, setGrams]   = useState(100)
  const [picked, setPicked] = useState<FoodItem | null>(null)
  const [manual, setManual] = useState(false)
  const [manualForm, setManualForm] = useState({ name: '', kcal: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' })
  const [open, setOpen]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.length > 0
    ? dbFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  const preview = picked ? calcFood(picked, grams) : null

  function handleAdd() {
    if (picked && preview) {
      onAdd(preview)
      setPicked(null); setQuery(''); setGrams(100); setOpen(false)
    }
  }

  function handleManualAdd() {
    const item: MealFoodItem = {
      name: manualForm.name || 'Alimento',
      grams,
      kcal: Math.round(parseFloat(manualForm.kcal) * grams / 100) || 0,
      proteinG: Math.round(parseFloat(manualForm.proteinG) * grams / 100 * 10) / 10 || 0,
      carbsG: Math.round(parseFloat(manualForm.carbsG) * grams / 100 * 10) / 10 || 0,
      fatG: Math.round(parseFloat(manualForm.fatG) * grams / 100 * 10) / 10 || 0,
      fiberG: Math.round(parseFloat(manualForm.fiberG) * grams / 100 * 10) / 10 || 0,
    }
    onAdd(item)
    setManualForm({ name: '', kcal: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' })
    setGrams(100); setManual(false); setOpen(false)
  }

  const cls = 'rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100 bg-white w-full'

  if (!open) {
    return (
      <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors w-full justify-center">
        + Aggiungi alimento
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3 space-y-2">
      {!manual ? (
        <>
          <div className="relative">
            <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setPicked(null) }}
              placeholder="🔍 Cerca alimento nel database (es. pollo, avena…)"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100" />
            {results.length > 0 && !picked && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {results.map(f => (
                  <button key={f.id} onClick={() => { setPicked(f); setQuery(f.name) }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-brand-50 transition-colors border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{f.category}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 shrink-0 ml-2">
                      <p className="font-medium">{f.caloriesPer100g} kcal/100g</p>
                      <p>P:{f.proteinPer100g}g · C:{f.carbsPer100g}g · G:{f.fatPer100g}g</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {query.length > 1 && results.length === 0 && !picked && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg px-3 py-3 text-center">
                <p className="text-xs text-slate-500">Nessun risultato per "{query}"</p>
                <button onClick={() => { setManual(true); setManualForm(f => ({ ...f, name: query })) }}
                  className="mt-1 text-xs text-brand-600 font-medium hover:underline">
                  Inserisci manualmente →
                </button>
              </div>
            )}
          </div>

          {picked && (
            <div className="rounded-lg bg-white border border-slate-200 p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">{picked.name}</p>
                <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{picked.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-slate-500 shrink-0">Grammi:</label>
                <input type="number" min={1} className={cls + ' !w-20'} value={grams}
                  onChange={e => setGrams(parseFloat(e.target.value) || 0)} />
                {preview && (
                  <div className="flex gap-2 flex-wrap text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700">{preview.kcal} kcal</span>
                    <span>P:{preview.proteinG}g</span>
                    <span>C:{preview.carbsG}g</span>
                    <span>G:{preview.fatG}g</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors">
                  Aggiungi
                </button>
                <button onClick={() => { setPicked(null); setQuery('') }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
                  Cambia
                </button>
                <button onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 ml-auto">
                  Annulla
                </button>
              </div>
            </div>
          )}

          {!picked && (
            <div className="flex justify-between items-center">
              <button onClick={() => setManual(true)}
                className="text-[10px] text-slate-400 hover:text-brand-600 transition-colors">
                Non trovi l'alimento? Inseriscilo manualmente
              </button>
              <button onClick={() => setOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-600">Annulla</button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-700">Inserimento manuale</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-500 mb-0.5">Nome alimento</label>
              <input className={cls} value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} placeholder="es. Latte intero" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Grammi</label>
              <input type="number" className={cls} value={grams} onChange={e => setGrams(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Kcal / 100g</label>
              <input type="number" className={cls} value={manualForm.kcal} onChange={e => setManualForm(f => ({ ...f, kcal: e.target.value }))} placeholder="60" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Proteine / 100g</label>
              <input type="number" className={cls} value={manualForm.proteinG} onChange={e => setManualForm(f => ({ ...f, proteinG: e.target.value }))} placeholder="3.2" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Carboidrati / 100g</label>
              <input type="number" className={cls} value={manualForm.carbsG} onChange={e => setManualForm(f => ({ ...f, carbsG: e.target.value }))} placeholder="4.8" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Grassi / 100g</label>
              <input type="number" className={cls} value={manualForm.fatG} onChange={e => setManualForm(f => ({ ...f, fatG: e.target.value }))} placeholder="3.6" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Fibre / 100g</label>
              <input type="number" className={cls} value={manualForm.fiberG} onChange={e => setManualForm(f => ({ ...f, fiberG: e.target.value }))} placeholder="0" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleManualAdd} disabled={!manualForm.name}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-40">
              Aggiungi
            </button>
            <button onClick={() => setManual(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
              ← Cerca nel DB
            </button>
            <button onClick={() => { setManual(false); setOpen(false) }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 ml-auto">
              Annulla
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── New nutrition profile — 2-step (search member → plan) ────────────────────
interface MealDraft { name: string; time: string; kcalPct: number; example: string; foods: MealFoodItem[] }
const DEFAULT_MEALS: MealDraft[] = [
  { name: 'Colazione',    time: '08:00', kcalPct: 20, example: '', foods: [] },
  { name: 'Pranzo',       time: '13:00', kcalPct: 40, example: '', foods: [] },
  { name: 'Cena',         time: '20:00', kcalPct: 30, example: '', foods: [] },
  { name: 'Spuntino sera',time: '22:00', kcalPct: 10, example: '', foods: [] },
]
const DAY_LABELS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']

function makeDayMeals(): MealDraft[] { return DEFAULT_MEALS.map(m => ({ ...m, foods: [] })) }

function MealsEditor({ meals, onChange, kcal, dbFoods }: {
  meals: MealDraft[]
  onChange: (meals: MealDraft[]) => void
  kcal: number | null
  dbFoods: FoodItem[]
}) {
  const totalPct  = meals.reduce((s, m) => s + m.kcalPct, 0)
  const pctOk     = totalPct === 100
  const inputCls  = 'rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100 bg-white'

  const updateMeal = (i: number, key: keyof MealDraft, val: string | number) =>
    onChange(meals.map((m, idx) => idx === i ? { ...m, [key]: val } : m))
  const updateFoods = (i: number, foods: MealFoodItem[]) =>
    onChange(meals.map((m, idx) => idx === i ? { ...m, foods } : m))
  const removeMeal = (i: number) => onChange(meals.filter((_, idx) => idx !== i))
  const addMeal    = () => onChange([...meals, { name: 'Nuovo pasto', time: '10:00', kcalPct: 0, example: '', foods: [] }])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${pctOk ? 'text-emerald-600' : 'text-red-500'}`}>
          {pctOk ? '✓ Totale: 100%' : `⚠ Totale: ${totalPct}% (deve essere 100%)`}
        </span>
        <button onClick={addMeal}
          className="rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
          + Aggiungi pasto
        </button>
      </div>

      {meals.map((meal, i) => {
        const plannedKcal = kcal ? Math.round(kcal * meal.kcalPct / 100) : null
        const foods       = meal.foods ?? []
        const foodTotals  = mealFoodsTotal(foods)
        const hasFoods    = foods.length > 0

        return (
          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2.5">
            {/* Header row: nome / orario / % / remove */}
            <div className="grid grid-cols-[1fr_80px_64px_auto] gap-2 items-end">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">Nome pasto</label>
                <input className={inputCls + ' w-full'} value={meal.name}
                  onChange={e => updateMeal(i, 'name', e.target.value)} placeholder="es. Colazione" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">Orario</label>
                <input type="time" className={inputCls + ' w-full'} value={meal.time}
                  onChange={e => updateMeal(i, 'time', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">% kcal</label>
                <input type="number" min={0} max={100} className={inputCls + ' w-full'} value={meal.kcalPct}
                  onChange={e => updateMeal(i, 'kcalPct', parseInt(e.target.value) || 0)} />
              </div>
              <button onClick={() => removeMeal(i)} disabled={meals.length <= 1}
                className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30">
                ✕
              </button>
            </div>

            {/* Planned kcal hint */}
            {plannedKcal !== null && (
              <p className="text-[10px] text-slate-400">
                Piano: {plannedKcal} kcal ({meal.kcalPct}% del totale)
                {hasFoods && foodTotals.kcal !== plannedKcal && (
                  <span className={`ml-2 font-semibold ${Math.abs(foodTotals.kcal - plannedKcal) > 100 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    · Alimenti: {foodTotals.kcal} kcal
                  </span>
                )}
              </p>
            )}

            {/* Food list */}
            {hasFoods && (
              <div className="space-y-1">
                {foods.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-2.5 py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{f.grams}g · {f.kcal} kcal · P:{f.proteinG}g · C:{f.carbsG}g · G:{f.fatG}g</p>
                    </div>
                    <button onClick={() => updateFoods(i, foods.filter((_, j) => j !== fi))}
                      className="shrink-0 text-slate-300 hover:text-red-400 transition-colors text-sm leading-none">✕</button>
                  </div>
                ))}
                {/* Foods totals row */}
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold text-slate-600 flex-1">Totale pasto</p>
                  <p className="text-[10px] font-bold text-slate-700">{foodTotals.kcal} kcal</p>
                  <p className="text-[10px] text-slate-500">P:{Math.round(foodTotals.proteinG)}g · C:{Math.round(foodTotals.carbsG)}g · G:{Math.round(foodTotals.fatG)}g</p>
                </div>
              </div>
            )}

            {/* Food picker */}
            <FoodPicker
              foods={foods}
              dbFoods={dbFoods}
              onAdd={item => updateFoods(i, [...foods, item])}
            />
          </div>
        )
      })}
    </div>
  )
}

function NewNutritionProfileModal({ existingIds, onClose, onSave }: {
  existingIds: string[]; onClose: () => void; onSave: (m: NutritionMember) => void
}) {
  const [step, setStep]   = useState<1 | 2>(1)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<GymMemberRef | null>(null)
  const [form, setForm]   = useState<ProfileFormData>(emptyProfileForm())

  // Meal plan mode
  const [planMode, setPlanMode] = useState<'daily' | 'weekly'>('daily')
  const [dailyMeals, setDailyMeals] = useState<MealDraft[]>(makeDayMeals())
  const [weeklyMeals, setWeeklyMeals] = useState<MealDraft[][]>(
    Array.from({ length: 7 }, () => makeDayMeals())
  )
  const [activeDay, setActiveDay] = useState(0) // 0=Lun … 6=Dom

  const kcalNum = parseInt(form.planKcal) || null

  // Validity check: all active meal sets must sum to 100
  const allValid = planMode === 'daily'
    ? dailyMeals.reduce((s, m) => s + m.kcalPct, 0) === 100
    : weeklyMeals.every(day => day.reduce((s, m) => s + m.kcalPct, 0) === 100)

  const copyToAll = () => setWeeklyMeals(Array.from({ length: 7 }, () => weeklyMeals[activeDay].map(m => ({ ...m }))))

  // fetch real members from API, fall back to demo list
  const { data: apiMembers } = useQuery({
    queryKey: ['members-for-nutrition'],
    queryFn: () => api.get<{ id: string; fullName: string; email: string }[]>('/api/v1/members?pageSize=200'),
    retry: false,
  })
  const gymMembers: GymMemberRef[] = (apiMembers?.data as any)?.length > 0
    ? (apiMembers!.data as any).map((x: any) => ({ id: x.id, fullName: x.fullName, email: x.email }))
    : REGISTERED_MEMBERS

  const available = gymMembers.filter(gm =>
    !existingIds.includes(gm.id) &&
    (!query || gm.fullName.toLowerCase().includes(query.toLowerCase()) || gm.email.toLowerCase().includes(query.toLowerCase()))
  )

  const selectMember = (gm: GymMemberRef) => {
    setPicked(gm)
    setForm(f => ({
      ...f,
      name: gm.fullName, email: gm.email,
      age: gm.age ? String(gm.age) : '',
      sex: gm.sex ?? 'M',
      heightCm: gm.heightCm ? String(gm.heightCm) : '',
    }))
    setStep(2)
  }

  const handleSave = () => {
    if (!picked) return
    const kcal = parseInt(form.planKcal) || 2000
    const toMeal = (d: MealDraft) => ({
      name: d.name, kcalPct: d.kcalPct, time: d.time,
      example: d.foods.length > 0 ? d.foods.map(f => f.name).join(' · ') : d.example,
      foods: d.foods.length > 0 ? d.foods : undefined,
    })
    const base: NutritionMember = {
      id: picked.id, name: picked.fullName, email: picked.email,
      age: parseInt(form.age) || picked.age || 30,
      sex: form.sex, heightCm: parseFloat(form.heightCm) || picked.heightCm || 170,
      goal: form.goal, activityLevel: form.activityLevel,
      nutritionist: form.nutritionist === 'Non assegnato' ? undefined : form.nutritionist,
      latest: { measuredAt: new Date().toISOString().slice(0,10), weightKg: parseFloat(form.targetWeightKg) || 70, bodyFatPct: parseFloat(form.targetBodyFatPct) || 20, leanMassKg: 0, muscleMassKg: 0, boneMassKg: 0, waterPct: 0 },
      target: { weightKg: parseFloat(form.targetWeightKg) || 70, bodyFatPct: parseFloat(form.targetBodyFatPct) || 20 },
      plan: { kcal, proteinG: parseInt(form.planProteinG) || 150, carbsG: parseInt(form.planCarbsG) || 200, fatG: parseInt(form.planFatG) || 65, fiberG: parseInt(form.planFiberG) || 25, notes: form.planNotes },
      meals: planMode === 'daily' ? dailyMeals.map(toMeal) : weeklyMeals[0].map(toMeal),
      weeklyMeals: planMode === 'weekly'
        ? weeklyMeals.map((day, i) => ({ day: i, meals: day.map(toMeal) }))
        : undefined,
      history: [], diary: [],
    }
    onSave(base)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 text-sm">← Indietro</button>
            )}
            <h2 className="font-semibold text-slate-800">
              {step === 1 ? 'Nuovo profilo nutrizionale — Cerca membro' : `Piano per ${picked?.fullName}`}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-1 shrink-0">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</div>
              <span className={`text-xs ${step >= s ? 'text-brand-700 font-medium' : 'text-slate-400'}`}>{s === 1 ? 'Seleziona membro' : 'Definisci piano'}</span>
              {s === 1 && <span className="text-slate-200 mx-1">›</span>}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-6">
          {/* ── STEP 1: cerca membro ── */}
          {step === 1 && (
            <div className="space-y-3 pt-4">
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="🔍 Cerca per nome o email…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              {available.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-2xl">🔍</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {query ? 'Nessun membro trovato.' : 'Tutti i membri hanno già un profilo nutrizionale.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {available.map(gm => (
                    <button key={gm.id} onClick={() => selectMember(gm)}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left group">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold
                        ${['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700'][gm.fullName.charCodeAt(0) % 4]}`}>
                        {gm.fullName.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{gm.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{gm.email}{gm.age ? ` · ${gm.age} anni` : ''}{gm.sex ? ` · ${gm.sex === 'M' ? '♂' : '♀'}` : ''}</p>
                      </div>
                      <span className="text-xs text-brand-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Seleziona →</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 text-center">
                Vengono mostrati solo i membri senza piano nutrizionale attivo ({available.length} disponibili)
              </p>
            </div>
          )}

          {/* ── STEP 2: definisci piano ── */}
          {step === 2 && picked && (
            <div className="pt-4 space-y-5">
              {/* Riepilogo membro selezionato */}
              <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold
                  ${['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-amber-100 text-amber-700'][picked.fullName.charCodeAt(0) % 4]}`}>
                  {picked.fullName.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{picked.fullName}</p>
                  <p className="text-xs text-slate-500">{picked.email}{picked.age ? ` · ${picked.age} anni` : ''}{picked.heightCm ? ` · ${picked.heightCm} cm` : ''}</p>
                </div>
                <span className="ml-auto text-xs text-brand-600 font-medium">✓ Selezionato</span>
              </div>

              <PlanFields form={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} />

              {/* ── Distribuzione pasti ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Distribuzione pasti</p>

                {/* Mode toggle */}
                <div className="flex gap-2 mb-4">
                  {(['daily','weekly'] as const).map(mode => (
                    <button key={mode} onClick={() => setPlanMode(mode)}
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        planMode === mode
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {mode === 'daily' ? '📋 Uguale ogni giorno' : '📆 Personalizzato per giorno'}
                    </button>
                  ))}
                </div>

                {planMode === 'daily' && (
                  <MealsEditor meals={dailyMeals} onChange={setDailyMeals} kcal={kcalNum} dbFoods={DEMO_FOODS} />
                )}

                {planMode === 'weekly' && (
                  <div className="space-y-3">
                    <div className="flex gap-1 flex-wrap">
                      {DAY_LABELS.map((label, i) => {
                        const dayPct = weeklyMeals[i].reduce((s, m) => s + m.kcalPct, 0)
                        const ok = dayPct === 100
                        return (
                          <button key={i} onClick={() => setActiveDay(i)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                              activeDay === i
                                ? 'bg-brand-600 text-white border-brand-600'
                                : ok
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}>
                            {label.slice(0, 3)}
                            {activeDay !== i && (
                              <span className="ml-1 text-[10px] opacity-70">{ok ? '✓' : `${dayPct}%`}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-slate-700">{DAY_LABELS[activeDay]}</p>
                        <button onClick={copyToAll}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                          Copia a tutti i giorni
                        </button>
                      </div>
                      <MealsEditor
                        meals={weeklyMeals[activeDay]}
                        onChange={updated => setWeeklyMeals(prev => prev.map((d, i) => i === activeDay ? updated : d))}
                        kcal={kcalNum}
                        dbFoods={DEMO_FOODS}
                      />
                    </div>
                    {!allValid && (
                      <p className="text-xs text-amber-600">⚠ Alcuni giorni non hanno ancora le percentuali al 100%. Controlla i tab arancioni.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
          {step === 2 && (
            <button onClick={handleSave} disabled={!allValid}
              title={!allValid ? 'Tutte le percentuali dei pasti devono sommare 100%' : undefined}
              className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Crea piano nutrizionale
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Edit existing profile modal ───────────────────────────────────────────────
function EditProfileModal({ member, onClose, onSave }: {
  member: NutritionMember; onClose: () => void; onSave: (m: NutritionMember) => void
}) {
  const [form, setForm] = useState<ProfileFormData>(profileToForm(member))
  const cls = 'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
  const change = (k: keyof ProfileFormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="font-semibold text-slate-800">Modifica profilo — {member.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Anagrafica */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Anagrafica</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo</label>
                <input className={cls} value={form.name} onChange={e => change('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" className={cls} value={form.email} onChange={e => change('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Età</label>
                <input type="number" className={cls} value={form.age} onChange={e => change('age', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sesso</label>
                <select className={cls} value={form.sex} onChange={e => change('sex', e.target.value)}>
                  <option value="M">Uomo</option><option value="F">Donna</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Altezza (cm)</label>
                <input type="number" className={cls} value={form.heightCm} onChange={e => change('heightCm', e.target.value)} />
              </div>
            </div>
          </div>
          <PlanFields form={form} onChange={change} />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
          <button onClick={() => onSave(formToMember(form, member))}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
            Salva modifiche
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Member search bar ──────────────────────────────────────────────────────────
function MemberSearchBar({ members, selected, onSelect }: {
  members: NutritionMember[]; selected: NutritionMember; onSelect: (m: NutritionMember) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const filtered = members.filter(m =>
    !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase())
  )
  const goal = GOAL_UI[selected.goal] ?? { tone: 'slate' as const, icon: '?' }

  return (
    <div ref={ref} className="relative w-72">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 cursor-pointer shadow-sm hover:border-brand-300 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <Avatar name={selected.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{selected.name}</p>
          <p className="text-xs text-slate-400 truncate">{selected.email}</p>
        </div>
        <Badge tone={goal.tone}>{goal.icon} {selected.goal}</Badge>
        <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="p-2 border-b border-slate-100">
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="🔍 Cerca per nome o email…"
              className="w-full rounded-lg bg-slate-50 px-3 py-1.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-200" />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0
              ? <p className="px-4 py-3 text-sm text-slate-400">Nessun risultato.</p>
              : filtered.map(m => {
                  const g = GOAL_UI[m.goal] ?? { tone: 'slate' as const, icon: '?' }
                  return (
                    <button key={m.id} onClick={() => { onSelect(m); setQuery(''); setOpen(false) }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${selected.id === m.id ? 'bg-brand-50' : ''}`}>
                      <Avatar name={m.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                        <p className="text-xs text-slate-400 truncate">{m.email}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Badge tone={g.tone}>{g.icon} {m.goal}</Badge>
                        <span className="text-[10px] text-slate-400">{m.plan.kcal} kcal</span>
                      </div>
                    </button>
                  )
                })}
          </div>
          <div className="border-t border-slate-100 p-2">
            <p className="text-xs text-slate-400 text-center">{filtered.length} di {members.length} membri con piano nutrizionale</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Nutrition() {
  const qc = useQueryClient()
  const [tab, setTab]             = useState<'foods' | 'plans' | 'body'>('plans')
  const [foodSearch, setFoodSearch] = useState('')
  const [foodCategory, setFoodCategory] = useState('')
  const [showAddFood, setShowAddFood]   = useState(false)
  const [localMembers, setLocalMembers] = useState<NutritionMember[]>(DEMO_MEMBERS)
  const [selectedId, setSelectedId]     = useState(DEMO_MEMBERS[0].id)
  const selectedMember = localMembers.find(x => x.id === selectedId) ?? localMembers[0]
  const setSelectedMember = (m: NutritionMember) => setSelectedId(m.id)

  const [editingProfile, setEditingProfile]   = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)

  const handleSaveProfile = (updated: NutritionMember) => {
    setLocalMembers(prev => {
      const exists = prev.find(x => x.id === updated.id)
      return exists ? prev.map(x => x.id === updated.id ? updated : x) : [...prev, updated]
    })
    setSelectedId(updated.id)
    setEditingProfile(false)
    setCreatingProfile(false)
  }

  const [planTab, setPlanTab]       = useState<'profilo' | 'piano' | 'diario'>('profilo')
  const [mealDistView, setMealDistView] = useState<'giornaliero' | 'settimanale' | 'mensile'>('giornaliero')
  const [selectedDay, setSelectedDay]   = useState(() => new Date().toISOString().slice(0, 10))
  const [weekOffset, setWeekOffset]     = useState(0)
  const [monthOffset, setMonthOffset]   = useState(0)
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)
  const [showAddMeasurement, setShowAddMeasurement] = useState(false)
  const [measureForm, setMeasureForm] = useState({ weightKg: 0, bodyFatPct: 0, muscleMassKg: 0, waterPct: 0, boneMassKg: 0 })
  const [foodForm, setFoodForm]   = useState({
    name: '', category: 'Altro', caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, fiberPer100g: 0,
  })

  // ── API queries ──
  const { data: foodsData } = useQuery({
    queryKey: ['nutrition-foods', foodSearch],
    queryFn: () => api.get<{ data: { items: FoodItem[] } }>(`/api/v1/nutrition/foods?term=${foodSearch}&pageSize=50`),
    enabled: tab === 'foods', retry: false,
  })
  const addFood = useMutation({
    mutationFn: () => api.post('/api/v1/nutrition/foods', foodForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nutrition-foods'] }); setShowAddFood(false) },
  })
  const syncFoods = useMutation({
    mutationFn: () => api.post<{ imported: number; skipped: number; total: number }>('/api/v1/nutrition/foods/sync', {}),
    onSuccess: (res) => { setSyncResult(res); qc.invalidateQueries({ queryKey: ['nutrition-foods'] }) },
  })

  const foodItems: FoodItem[] = useMemo(() => {
    const base: FoodItem[] = (foodsData?.data as any)?.data?.items ?? (foodsData?.data as any)?.data ?? DEMO_FOODS
    return base.filter(f =>
      (!foodSearch    || f.name.toLowerCase().includes(foodSearch.toLowerCase())) &&
      (!foodCategory  || f.category === foodCategory)
    )
  }, [foodsData, foodSearch, foodCategory])

  const m = selectedMember
  const b   = round1(bmi(m.latest.weightKg, m.heightCm))
  const bmiInfo = bmiLabel(b)
  const bmrVal  = Math.round(bmr(m))
  const tdeeVal = tdee(m)
  const goal    = GOAL_UI[m.goal] ?? { tone: 'slate' as const, icon: '?' }

  // Distribuzione macro in kcal%
  const kcalTotal = m.plan.proteinG * 4 + m.plan.carbsG * 4 + m.plan.fatG * 9
  const protPct   = Math.round(m.plan.proteinG * 4 / kcalTotal * 100)
  const carbPct   = Math.round(m.plan.carbsG   * 4 / kcalTotal * 100)
  const fatPct_   = Math.round(m.plan.fatG     * 9 / kcalTotal * 100)

  const avgAdherence = Math.round(m.diary.reduce((a, d) => a + d.adherence, 0) / m.diary.length)

  return (
    <div className="space-y-6">
      {/* Modals */}
      {editingProfile && (
        <EditProfileModal member={selectedMember} onClose={() => setEditingProfile(false)} onSave={handleSaveProfile} />
      )}
      {creatingProfile && (
        <NewNutritionProfileModal
          existingIds={localMembers.map(x => x.id)}
          onClose={() => setCreatingProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nutrizione</h1>
          <p className="mt-0.5 text-sm text-slate-500">Database alimenti · Piani nutrizionali · Composizione corporea</p>
        </div>
        <button onClick={() => setCreatingProfile(true)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          + Nuovo profilo nutrizionale
        </button>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          ['plans', '📋 Piani nutrizionali'],
          ['body',  '📏 Composizione corporea'],
          ['foods', '🍎 Database alimenti'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === key
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: PIANI NUTRIZIONALI
          ══════════════════════════════════════════════════ */}
      {tab === 'plans' && (
        <div className="space-y-5">
          {/* Member selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-500">Membro:</span>
            <MemberSearchBar members={localMembers} selected={selectedMember} onSelect={m => { setSelectedMember(m); setPlanTab('profilo') }} />
          </div>

          {/* Plan sub-tabs */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
            {([['profilo','👤 Profilo & Obiettivi'],['piano','🥗 Piano alimentare'],['diario','📅 Diario settimanale']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setPlanTab(k)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${planTab === k ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* ── PROFILO ── */}
          {planTab === 'profilo' && (
            <div className="space-y-4">
              {/* Identity bar */}
              <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5">
                <Avatar name={m.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900">{m.name}</h2>
                    <Badge tone={goal.tone}>{goal.icon} {m.goal}</Badge>
                  </div>
                  <p className="text-sm text-slate-400">{m.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {m.age} anni · {m.sex === 'M' ? 'Uomo' : 'Donna'} · {m.heightCm} cm · Attività: {m.activityLevel}
                    {m.nutritionist && <> · Nutrizionista: <span className="font-medium text-slate-600">{m.nutritionist}</span></>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button onClick={() => setEditingProfile(true)}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors">
                    ✏ Modifica profilo
                  </button>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Ultima misurazione</p>
                    <p className="text-sm font-medium text-slate-700">{fmtDate(m.latest.measuredAt)}</p>
                  </div>
                </div>
              </div>

              {/* Body composition grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {[
                  { label: 'Peso attuale',  value: `${m.latest.weightKg} kg`, sub: `Target: ${m.target.weightKg} kg`, color: 'text-slate-800',   accent: 'bg-slate-400' },
                  { label: 'Massa grassa',  value: `${m.latest.bodyFatPct}%`, sub: `${round1(m.latest.weightKg * m.latest.bodyFatPct / 100)} kg · target ${m.target.bodyFatPct}%`, color: m.latest.bodyFatPct > 30 ? 'text-amber-600' : 'text-slate-800', accent: m.latest.bodyFatPct > 30 ? 'bg-amber-400' : 'bg-blue-400' },
                  { label: 'Massa magra',   value: `${round1(m.latest.leanMassKg)} kg`, sub: 'Peso − grasso', color: 'text-emerald-700', accent: 'bg-emerald-400' },
                  { label: 'Massa musc.',   value: `${round1(m.latest.muscleMassKg)} kg`, sub: 'Muscolo scheletrico', color: 'text-violet-700', accent: 'bg-violet-400' },
                  { label: 'Acqua corp.',   value: `${m.latest.waterPct}%`,   sub: `${round1(m.latest.weightKg * m.latest.waterPct / 100)} kg`, color: 'text-blue-600', accent: 'bg-blue-300' },
                  { label: 'Massa ossea',   value: `${round1(m.latest.boneMassKg)} kg`, sub: '—', color: 'text-slate-600', accent: 'bg-slate-300' },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className={`mb-2 h-1 w-8 rounded-full ${k.accent}`} />
                    <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
                    <p className="text-xs text-slate-400">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Metabolic row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'BMI',  value: b.toFixed(1), sub: bmiInfo.label, color: bmiInfo.color },
                  { label: 'BMR',  value: `${bmrVal} kcal`, sub: 'Metabolismo basale (Mifflin-St Jeor)', color: 'text-slate-800' },
                  { label: 'TDEE', value: `${tdeeVal} kcal`, sub: `Fabbisogno reale (${m.activityLevel})`, color: 'text-slate-800' },
                ].map(k => (
                  <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">{k.label}</p>
                    <p className="text-xs text-slate-400">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Composition visual */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">Composizione corporea visiva</p>
                <div className="space-y-3">
                  {[
                    { label: 'Massa grassa',    pct: m.latest.bodyFatPct,                              color: 'bg-amber-400',   max: 50 },
                    { label: 'Massa muscolare', pct: m.latest.muscleMassKg / m.latest.weightKg * 100, color: 'bg-violet-500',  max: 60 },
                    { label: 'Acqua corporea',  pct: m.latest.waterPct,                                color: 'bg-blue-400',    max: 75 },
                    { label: 'Massa magra tot.', pct: m.latest.leanMassKg / m.latest.weightKg * 100,  color: 'bg-emerald-500', max: 100 },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="w-32 text-xs text-slate-500">{r.label}</span>
                      <div className="flex-1 h-3 rounded-full bg-slate-100">
                        <div className={`h-3 rounded-full ${r.color} transition-all`}
                          style={{ width: `${Math.min(100, r.pct / r.max * 100).toFixed(1)}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs font-mono font-semibold text-slate-600">
                        {r.pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PIANO ALIMENTARE ── */}
          {planTab === 'piano' && (
            <div className="space-y-4">
              {/* Macro targets */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Target macronutrienti</p>
                    <span className="text-lg font-bold text-brand-600">{m.plan.kcal} kcal/die</span>
                  </div>
                  <div className="space-y-3">
                    <MacroBar label="Proteine"    value={m.plan.proteinG} target={m.plan.proteinG} unit="g" color="bg-violet-500" />
                    <MacroBar label="Carboidrati" value={m.plan.carbsG}   target={m.plan.carbsG}   unit="g" color="bg-amber-400" />
                    <MacroBar label="Grassi"      value={m.plan.fatG}     target={m.plan.fatG}     unit="g" color="bg-rose-400" />
                    <MacroBar label="Fibre"       value={m.plan.fiberG}   target={m.plan.fiberG}   unit="g" color="bg-emerald-400" />
                  </div>
                  {/* Ripartizione kcal */}
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1.5">Ripartizione calorica</p>
                    <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                      <div className="bg-violet-500" style={{ width: `${protPct}%` }} title={`Proteine ${protPct}%`} />
                      <div className="bg-amber-400"  style={{ width: `${carbPct}%` }} title={`Carboidrati ${carbPct}%`} />
                      <div className="bg-rose-400"   style={{ width: `${fatPct_}%` }} title={`Grassi ${fatPct_}%`} />
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-slate-500">
                      <span><span className="inline-block h-2 w-2 rounded-full bg-violet-500 mr-1" />Prot {protPct}%</span>
                      <span><span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1" />Carb {carbPct}%</span>
                      <span><span className="inline-block h-2 w-2 rounded-full bg-rose-400 mr-1" />Grass {fatPct_}%</span>
                    </div>
                  </div>
                </div>
                {/* Confronto TDEE */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Bilancio calorico</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">TDEE</span>
                      <span className="font-mono font-semibold text-slate-700">{tdeeVal} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Piano</span>
                      <span className="font-mono font-semibold text-brand-600">{m.plan.kcal} kcal</span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex justify-between">
                      <span className="font-medium text-slate-600">Delta</span>
                      <span className={`font-mono font-bold ${m.plan.kcal < tdeeVal ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {m.plan.kcal < tdeeVal ? '−' : '+'}{Math.abs(m.plan.kcal - tdeeVal)} kcal
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex justify-between">
                      <span className="text-slate-400 text-xs">Perdita/settimana est.</span>
                      <span className="text-xs font-mono text-slate-500">
                        {m.plan.kcal < tdeeVal
                          ? `−${round1((tdeeVal - m.plan.kcal) * 7 / 7700)} kg/sett.`
                          : `+${round1((m.plan.kcal - tdeeVal) * 7 / 7700)} kg/sett.`}
                      </span>
                    </div>
                  </div>
                  {m.plan.notes && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                      📝 {m.plan.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Distribuzione pasti — 3 viste */}
              <div className="rounded-xl border border-slate-200 bg-white">
                {/* Sub-tab switcher */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <p className="text-sm font-semibold text-slate-700">Distribuzione pasti</p>
                  <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    {(['giornaliero','settimanale','mensile'] as const).map(v => (
                      <button key={v} onClick={() => setMealDistView(v)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-all capitalize ${mealDistView === v ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                        {v === 'giornaliero' ? '📅 Giornaliero' : v === 'settimanale' ? '📆 Settimanale' : '🗓 Mensile'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  {/* ══ VISTA GIORNALIERA ══ */}
                  {mealDistView === 'giornaliero' && (() => {
                    const diaryEntry = m.diary.find(d => d.date === selectedDay)
                    const dayKcal    = diaryEntry?.kcal    ?? m.plan.kcal
                    const dayProt    = diaryEntry?.proteinG ?? m.plan.proteinG
                    const dayCarbs   = diaryEntry?.carbsG   ?? m.plan.carbsG
                    const dayFat     = diaryEntry?.fatG     ?? m.plan.fatG
                    const adherence  = diaryEntry?.adherence ?? null
                    const MEAL_COLORS = ['bg-amber-400','bg-brand-500','bg-violet-500','bg-emerald-400','bg-rose-400','bg-teal-400']
                    const MEAL_BG    = ['bg-amber-50 border-amber-100','bg-brand-50 border-brand-100','bg-violet-50 border-violet-100','bg-emerald-50 border-emerald-100','bg-rose-50 border-rose-100','bg-teal-50 border-teal-100']
                    return (
                      <div className="space-y-4">
                        {/* Day navigator */}
                        <div className="flex items-center gap-3">
                          <button onClick={() => {
                            const d = new Date(selectedDay); d.setDate(d.getDate() - 1)
                            setSelectedDay(d.toISOString().slice(0,10))
                          }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">‹</button>
                          <div className="flex-1 text-center">
                            <p className="text-sm font-semibold text-slate-800">
                              {new Date(selectedDay).toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
                            </p>
                            {adherence !== null && (
                              <span className={`text-xs font-medium ${adherence >= 90 ? 'text-emerald-600' : adherence >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
                                Aderenza: {adherence}%
                              </span>
                            )}
                          </div>
                          <button onClick={() => {
                            const d = new Date(selectedDay); d.setDate(d.getDate() + 1)
                            setSelectedDay(d.toISOString().slice(0,10))
                          }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">›</button>
                          <button onClick={() => setSelectedDay(new Date().toISOString().slice(0,10))}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50">Oggi</button>
                        </div>

                        {/* Meal cards */}
                        <div className="space-y-3">
                          {m.meals.map((meal, i) => {
                            const mealKcal = Math.round(dayKcal * meal.kcalPct / 100)
                            const mealProt = Math.round(dayProt * meal.kcalPct / 100)
                            const mealCarb = Math.round(dayCarbs * meal.kcalPct / 100)
                            const mealFat  = Math.round(dayFat * meal.kcalPct / 100)
                            const color    = MEAL_COLORS[i % MEAL_COLORS.length]
                            const bg       = MEAL_BG[i % MEAL_BG.length]
                            return (
                              <div key={i} className={`rounded-xl border p-4 ${bg}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold ${color}`}>
                                      {meal.time.slice(0,5)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">{meal.name}</p>
                                      {!meal.foods?.length && meal.example && (
                                        <p className="text-xs text-slate-500 italic">{meal.example}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-slate-800">{mealKcal} kcal</p>
                                    <p className="text-xs text-slate-400">{meal.kcalPct}% del totale</p>
                                  </div>
                                </div>
                                {/* Food detail list */}
                                {meal.foods && meal.foods.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {meal.foods.map((f, fi) => (
                                      <div key={fi} className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-[10px] text-slate-400 shrink-0">{f.grams}g</span>
                                          <p className="text-xs font-medium text-slate-700 truncate">{f.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2 text-[10px] text-slate-500">
                                          <span className="font-semibold text-slate-700">{f.kcal} kcal</span>
                                          <span>P:{f.proteinG}g</span>
                                          <span>C:{f.carbsG}g</span>
                                          <span>G:{f.fatG}g</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Macro mini-bar */}
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                  {[
                                    { label: 'Proteine', val: mealProt, unit: 'g', color: 'bg-violet-400' },
                                    { label: 'Carb.',    val: mealCarb, unit: 'g', color: 'bg-amber-400'  },
                                    { label: 'Grassi',   val: mealFat,  unit: 'g', color: 'bg-rose-400'   },
                                  ].map(macro => (
                                    <div key={macro.label} className="rounded-lg bg-white/60 px-2 py-1.5 text-center">
                                      <p className="text-xs font-bold text-slate-700">{macro.val}{macro.unit}</p>
                                      <p className="text-[10px] text-slate-400">{macro.label}</p>
                                    </div>
                                  ))}
                                </div>
                                {/* Kcal proportion bar */}
                                <div className="mt-2.5 h-1.5 rounded-full bg-white/60 overflow-hidden">
                                  <div className={`h-1.5 rounded-full ${color} opacity-70`} style={{ width: `${meal.kcalPct * 2}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Day totals */}
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Totale giornata</p>
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { label: 'Calorie', val: `${dayKcal}`, target: m.plan.kcal, unit: 'kcal', color: 'text-brand-600' },
                              { label: 'Proteine', val: `${dayProt}`, target: m.plan.proteinG, unit: 'g', color: 'text-violet-600' },
                              { label: 'Carb.', val: `${dayCarbs}`, target: m.plan.carbsG, unit: 'g', color: 'text-amber-600' },
                              { label: 'Grassi', val: `${dayFat}`, target: m.plan.fatG, unit: 'g', color: 'text-rose-500' },
                            ].map(k => (
                              <div key={k.label} className="text-center">
                                <p className={`text-base font-black ${k.color}`}>{k.val}<span className="text-xs font-normal text-slate-400 ml-0.5">{k.unit}</span></p>
                                <p className="text-[10px] text-slate-400">{k.label}</p>
                                <p className="text-[10px] text-slate-300">target {k.target}{k.unit}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* ══ VISTA SETTIMANALE ══ */}
                  {mealDistView === 'settimanale' && (() => {
                    const today_ = new Date()
                    const mon = new Date(today_)
                    mon.setDate(today_.getDate() - ((today_.getDay() + 6) % 7) + weekOffset * 7)
                    const weekDays = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(mon); d.setDate(mon.getDate() + i)
                      return d.toISOString().slice(0, 10)
                    })
                    const DAYS_SHORT = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
                    const MEAL_DOTS = ['bg-amber-400','bg-brand-500','bg-violet-500','bg-emerald-400','bg-rose-400','bg-teal-400']
                    return (
                      <div className="space-y-3">
                        {/* Week navigator */}
                        <div className="flex items-center justify-between">
                          <button onClick={() => setWeekOffset(w => w - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">‹</button>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-700">
                              {new Date(weekDays[0]).toLocaleDateString('it-IT',{day:'2-digit',month:'short'})} – {new Date(weekDays[6]).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}
                            </p>
                            {weekOffset === 0 && <span className="text-xs text-brand-500">Settimana corrente</span>}
                          </div>
                          <button onClick={() => setWeekOffset(w => w + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">›</button>
                        </div>

                        {/* Grid */}
                        <div className="overflow-x-auto">
                          <div className="min-w-[600px] grid grid-cols-7 gap-2">
                            {weekDays.map((date, di) => {
                              const diary = m.diary.find(d => d.date === date)
                              const isToday = date === new Date().toISOString().slice(0,10)
                              const isFuture = date > new Date().toISOString().slice(0,10)
                              const dayKcal = diary?.kcal ?? (isFuture ? null : m.plan.kcal)
                              const adh = diary?.adherence ?? null
                              return (
                                <div key={date}
                                  onClick={() => { setSelectedDay(date); setMealDistView('giornaliero') }}
                                  className={`rounded-xl border p-2.5 cursor-pointer transition-all hover:shadow-md ${isToday ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                  <div className="text-center mb-2">
                                    <p className={`text-xs font-bold ${isToday ? 'text-brand-600' : 'text-slate-500'}`}>{DAYS_SHORT[di]}</p>
                                    <p className={`text-sm font-black ${isToday ? 'text-brand-700' : 'text-slate-700'}`}>{new Date(date).getDate()}</p>
                                  </div>
                                  <div className="space-y-1">
                                    {m.meals.map((meal, mi) => (
                                      <div key={mi} className="flex items-center gap-1.5">
                                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isFuture ? 'bg-slate-200' : MEAL_DOTS[mi % MEAL_DOTS.length]}`} />
                                        <span className="text-[10px] text-slate-500 truncate">{meal.name}</span>
                                        <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                                          {isFuture ? '—' : `${Math.round((dayKcal ?? m.plan.kcal) * meal.kcalPct / 100)}`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    {isFuture ? (
                                      <p className="text-[10px] text-center text-slate-300">Piano: {m.plan.kcal} kcal</p>
                                    ) : (
                                      <div>
                                        <p className="text-xs font-bold text-center text-slate-700">{dayKcal} kcal</p>
                                        {adh !== null && (
                                          <div className={`mt-1 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold
                                            ${adh >= 90 ? 'bg-emerald-100 text-emerald-700' : adh >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                            {adh}%
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Weekly summary */}
                        {(() => {
                          const tracked = weekDays.filter(d => m.diary.find(x => x.date === d))
                          const avgKcal = tracked.length > 0 ? Math.round(tracked.reduce((s, d) => s + (m.diary.find(x => x.date === d)?.kcal ?? 0), 0) / tracked.length) : null
                          const avgAdh  = tracked.length > 0 ? Math.round(tracked.reduce((s, d) => s + (m.diary.find(x => x.date === d)?.adherence ?? 0), 0) / tracked.length) : null
                          return tracked.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                              <div className="text-center"><p className="text-sm font-bold text-slate-700">{tracked.length}/7</p><p className="text-[10px] text-slate-400">Giorni tracciati</p></div>
                              <div className="text-center"><p className="text-sm font-bold text-brand-600">{avgKcal} kcal</p><p className="text-[10px] text-slate-400">Media giornaliera</p></div>
                              <div className="text-center"><p className={`text-sm font-bold ${(avgAdh ?? 0) >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{avgAdh}%</p><p className="text-[10px] text-slate-400">Aderenza media</p></div>
                            </div>
                          ) : (
                            <p className="text-xs text-center text-slate-400 py-2">Nessun dato tracciato per questa settimana.</p>
                          )
                        })()}
                      </div>
                    )
                  })()}

                  {/* ══ VISTA MENSILE ══ */}
                  {mealDistView === 'mensile' && (() => {
                    const ref = new Date()
                    ref.setMonth(ref.getMonth() + monthOffset)
                    const year = ref.getFullYear(), month = ref.getMonth()
                    const firstDay = new Date(year, month, 1)
                    const lastDay  = new Date(year, month + 1, 0)
                    const startOffset = (firstDay.getDay() + 6) % 7
                    const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7
                    const cells = Array.from({ length: totalCells }, (_, i) => {
                      const dayNum = i - startOffset + 1
                      if (dayNum < 1 || dayNum > lastDay.getDate()) return null
                      const d = new Date(year, month, dayNum)
                      return d.toISOString().slice(0, 10)
                    })
                    const today_ = new Date().toISOString().slice(0, 10)
                    const tracked = m.diary.filter(d => d.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
                    const avgAdh = tracked.length > 0 ? Math.round(tracked.reduce((s,d) => s + d.adherence, 0) / tracked.length) : null
                    const HEADER = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
                    return (
                      <div className="space-y-4">
                        {/* Month navigator */}
                        <div className="flex items-center justify-between">
                          <button onClick={() => setMonthOffset(o => o - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">‹</button>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-700 capitalize">
                              {firstDay.toLocaleDateString('it-IT',{month:'long',year:'numeric'})}
                            </p>
                            {tracked.length > 0 && <span className="text-xs text-slate-400">{tracked.length} giorni tracciati · aderenza media {avgAdh}%</span>}
                          </div>
                          <button onClick={() => setMonthOffset(o => o + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">›</button>
                        </div>

                        {/* Calendar grid */}
                        <div>
                          <div className="grid grid-cols-7 mb-1">
                            {HEADER.map(h => <div key={h} className="text-center text-[10px] font-semibold text-slate-400 py-1">{h}</div>)}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {cells.map((date, ci) => {
                              if (!date) return <div key={ci} />
                              const diary = m.diary.find(d => d.date === date)
                              const isToday   = date === today_
                              const isFuture  = date > today_
                              const adh = diary?.adherence ?? null
                              const adhColor = adh === null
                                ? (isFuture ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-400')
                                : adh >= 90 ? 'bg-emerald-100 text-emerald-700'
                                : adh >= 75 ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-600'
                              return (
                                <button key={date}
                                  onClick={() => { setSelectedDay(date); setMealDistView('giornaliero') }}
                                  className={`rounded-lg p-1.5 text-center transition-all hover:ring-2 hover:ring-brand-300 ${adhColor} ${isToday ? 'ring-2 ring-brand-500' : ''}`}>
                                  <p className={`text-xs font-bold ${isToday ? 'text-brand-700' : ''}`}>{new Date(date).getDate()}</p>
                                  {adh !== null && <p className="text-[9px] font-semibold mt-0.5">{adh}%</p>}
                                  {adh === null && !isFuture && <p className="text-[9px] mt-0.5 opacity-50">—</p>}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Legend + monthly summary */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-emerald-100 inline-block" />≥90% (ottimo)</span>
                          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-amber-100 inline-block" />75–89% (buono)</span>
                          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-100 inline-block" />&lt;75% (da migliorare)</span>
                          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-slate-100 inline-block" />Non tracciato</span>
                        </div>

                        {tracked.length > 0 && (() => {
                          const best  = tracked.reduce((a, b) => b.adherence > a.adherence ? b : a)
                          const worst = tracked.reduce((a, b) => b.adherence < a.adherence ? b : a)
                          const streak = (() => {
                            let s = 0, cur = new Date(today_)
                            while (m.diary.find(d => d.date === cur.toISOString().slice(0,10) && d.adherence >= 75)) { s++; cur.setDate(cur.getDate()-1) }
                            return s
                          })()
                          return (
                            <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                              <div className="text-center"><p className="text-sm font-bold text-slate-700">{tracked.length}</p><p className="text-[10px] text-slate-400">Giorni tracciati</p></div>
                              <div className="text-center"><p className={`text-sm font-bold ${(avgAdh ?? 0) >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{avgAdh}%</p><p className="text-[10px] text-slate-400">Aderenza media</p></div>
                              <div className="text-center"><p className="text-sm font-bold text-emerald-600">{best.adherence}%</p><p className="text-[10px] text-slate-400">{fmtDate(best.date)}</p></div>
                              <div className="text-center"><p className="text-sm font-bold text-orange-500">{streak}gg</p><p className="text-[10px] text-slate-400">Streak attuale</p></div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── DIARIO SETTIMANALE ── */}
          {planTab === 'diario' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-brand-600">{avgAdherence}%</p>
                  <p className="text-xs text-slate-400">Aderenza media</p>
                </div>
                <div className="flex-1 text-sm text-slate-500">
                  Ultimi 7 giorni · obiettivo {m.plan.kcal} kcal · {m.plan.proteinG}g prot.
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Calorie vs. target (7 giorni)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={m.diary.map(d => ({ ...d, date: fmtDate(d.date), target: m.plan.kcal }))}
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, Math.round(m.plan.kcal * 1.3)]} />
                    <Tooltip formatter={(v: number, n: string) => [v, n === 'kcal' ? 'Calorie' : 'Target']} />
                    <ReferenceLine y={m.plan.kcal} stroke="#7c3aed" strokeDasharray="4 2" strokeWidth={1.5} />
                    <Bar dataKey="kcal" name="Calorie" fill="#7c3aed" radius={[3,3,0,0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-right">Kcal</th>
                      <th className="px-4 py-3 text-right">Prot.</th>
                      <th className="px-4 py-3 text-right">Carb.</th>
                      <th className="px-4 py-3 text-right">Grassi</th>
                      <th className="px-4 py-3">Aderenza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {m.diary.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-700">{fmtDate(d.date)}</td>
                        <td className={`px-4 py-3 text-right font-mono ${Math.abs(d.kcal - m.plan.kcal) > 200 ? 'text-amber-600 font-semibold' : 'text-slate-600'}`}>{d.kcal}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{d.proteinG}g</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{d.carbsG}g</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{d.fatG}g</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-slate-100">
                              <div className={`h-2 rounded-full ${d.adherence >= 90 ? 'bg-emerald-400' : d.adherence >= 75 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${d.adherence}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${d.adherence >= 90 ? 'text-emerald-600' : d.adherence >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
                              {d.adherence}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: COMPOSIZIONE CORPOREA
          ══════════════════════════════════════════════════ */}
      {tab === 'body' && (
        <div className="space-y-5">
          {/* Member selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-500">Membro:</span>
            <MemberSearchBar members={localMembers} selected={selectedMember} onSelect={setSelectedMember} />
          </div>

          {/* Chart: peso + BF% trend */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Trend peso corporeo (kg)</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={m.history.map(h => ({ ...h, measuredAt: fmtDate(h.measuredAt) }))}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="measuredAt" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip formatter={(v: number) => [`${v} kg`, 'Peso']} />
                  <ReferenceLine y={m.target.weightKg} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: `Target ${m.target.weightKg}kg`, position: 'right', fontSize: 10, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="weightKg" name="Peso" stroke="#7c3aed" fill="url(#weightFill)" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Trend massa grassa (%)</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={m.history.map(h => ({ ...h, measuredAt: fmtDate(h.measuredAt) }))}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bfFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="measuredAt" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" domain={['auto', 'auto']} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Massa grassa']} />
                  <ReferenceLine y={m.target.bodyFatPct} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: `Target ${m.target.bodyFatPct}%`, position: 'right', fontSize: 10, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="bodyFatPct" name="BF%" stroke="#f59e0b" fill="url(#bfFill)" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Muscle + lean mass chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Massa muscolare vs. massa magra (kg)</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={m.history.map(h => ({ ...h, measuredAt: fmtDate(h.measuredAt) }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="measuredAt" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip formatter={(v: number, n: string) => [`${v} kg`, n === 'muscleMassKg' ? 'Massa muscolare' : 'Massa magra']} />
                <Line type="monotone" dataKey="leanMassKg"   name="Massa magra"    stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="muscleMassKg" name="Massa muscolare" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* History table + Add measurement */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Storico misurazioni</p>
            <button onClick={() => setShowAddMeasurement(s => !s)}
              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 transition-colors">
              + Nuova misurazione
            </button>
          </div>

          {showAddMeasurement && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 max-w-lg">
              <h3 className="font-semibold text-slate-800">Nuova misurazione — {m.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[['weightKg','Peso (kg)',0.1],['bodyFatPct','Massa grassa (%)',0.1],['muscleMassKg','Massa musc. (kg)',0.1],['waterPct','Acqua corp. (%)',0.1],['boneMassKg','Massa ossea (kg)',0.01]].map(([k,l,s]) => (
                  <div key={k as string}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{l as string}</label>
                    <input type="number" step={s as number}
                      value={(measureForm as any)[k as string] || ''}
                      onChange={e => setMeasureForm(p => ({ ...p, [k as string]: +e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                  onClick={() => setShowAddMeasurement(false)}>
                  Salva misurazione
                </button>
                <button onClick={() => setShowAddMeasurement(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  Annulla
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {['Data','Peso','BF%','Massa grassa','Massa magra','Massa musc.','Massa ossea','Acqua%','BMI'].map(h => (
                    <th key={h} className="px-4 py-3 text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...m.history].reverse().map((h, i) => {
                  const b_ = round1(bmi(h.weightKg, m.heightCm))
                  const fatKg = round1(h.weightKg * h.bodyFatPct / 100)
                  return (
                    <tr key={i} className={`hover:bg-slate-50/60 transition-colors ${i === 0 ? 'font-semibold' : ''}`}>
                      <td className="px-4 py-3 text-slate-700">{fmtDate(h.measuredAt)}{i === 0 && <span className="ml-2 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs text-brand-600">ultima</span>}</td>
                      <td className="px-4 py-3 text-right font-mono">{h.weightKg} kg</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-600">{h.bodyFatPct}%</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{fatKg} kg</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{round1(h.leanMassKg)} kg</td>
                      <td className="px-4 py-3 text-right font-mono text-violet-600">{round1(h.muscleMassKg)} kg</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">{round1(h.boneMassKg)} kg</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-500">{h.waterPct}%</td>
                      <td className={`px-4 py-3 text-right font-mono ${bmiLabel(b_).color}`}>{b_}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: DATABASE ALIMENTI
          ══════════════════════════════════════════════════ */}
      {tab === 'foods' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
              <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)}
                placeholder="Cerca alimento…"
                className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <button onClick={() => setShowAddFood(true)}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
              + Aggiungi alimento
            </button>
            <button onClick={() => { setSyncResult(null); syncFoods.mutate() }} disabled={syncFoods.isPending}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              {syncFoods.isPending ? '⏳ Aggiornamento…' : '🔄 Aggiorna database'}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-1 flex-wrap">
            {['', ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFoodCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${foodCategory === c
                  ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {c === '' ? 'Tutte' : c}
              </button>
            ))}
          </div>

          {syncResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between">
              <span>✅ {syncResult.imported} importati · {syncResult.skipped} saltati su {syncResult.total} totali.</span>
              <button onClick={() => setSyncResult(null)} className="ml-4 text-emerald-600">✕</button>
            </div>
          )}

          {showAddFood && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 max-w-lg">
              <h3 className="font-semibold">Nuovo alimento personalizzato</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
                  <Input value={foodForm.name} onChange={e => setFoodForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                  <select value={foodForm.category} onChange={e => setFoodForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Calorie / 100g</label>
                  <Input type="number" value={foodForm.caloriesPer100g} onChange={e => setFoodForm(p => ({ ...p, caloriesPer100g: +e.target.value }))} />
                </div>
                {[['proteinPer100g','Proteine (g)'],['carbsPer100g','Carboidrati (g)'],['fatPer100g','Grassi (g)'],['fiberPer100g','Fibre (g)']].map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                    <Input type="number" step="0.1" value={(foodForm as any)[k]} onChange={e => setFoodForm(p => ({ ...p, [k]: +e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => addFood.mutate()} disabled={addFood.isPending}>Salva</Button>
                <Button variant="ghost" onClick={() => setShowAddFood(false)}>Annulla</Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 text-left">Alimento</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-right">Kcal/100g</th>
                  <th className="px-4 py-3 text-right">Prot.</th>
                  <th className="px-4 py-3 text-right">Carb.</th>
                  <th className="px-4 py-3 text-right">Grassi</th>
                  <th className="px-4 py-3 text-right">Fibre</th>
                  <th className="px-4 py-3">Profilo</th>
                  <th className="px-4 py-3 text-center">Custom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {foodItems.map(f => {
                  const maxMacro = Math.max(f.proteinPer100g, f.carbsPer100g, f.fatPer100g)
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{f.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{f.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">{f.caloriesPer100g}</td>
                      <td className="px-4 py-3 text-right font-mono text-violet-600">{f.proteinPer100g}g</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-600">{f.carbsPer100g}g</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-500">{f.fatPer100g}g</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{f.fiberPer100g}g</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5 h-3 w-20 rounded-sm overflow-hidden">
                          <div className="bg-violet-400" style={{ width: `${maxMacro > 0 ? f.proteinPer100g / maxMacro * 100 : 0}%` }} />
                          <div className="bg-amber-400"  style={{ width: `${maxMacro > 0 ? f.carbsPer100g   / maxMacro * 100 : 0}%` }} />
                          <div className="bg-rose-400"   style={{ width: `${maxMacro > 0 ? f.fatPer100g     / maxMacro * 100 : 0}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.isCustom && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-600 font-medium">✓</span>}
                      </td>
                    </tr>
                  )
                })}
                {foodItems.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Nessun alimento trovato.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
