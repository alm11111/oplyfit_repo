import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button, Input } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
interface LeaderboardEntry { rank: number; memberId: string; memberName?: string; totalPoints: number }
interface MemberPoints { memberId: string; balance: number; recentHistory: PointTx[] }
interface PointTx { id: string; points: number; eventType: string; description: string; occurredAtUtc: string }
interface MemberStreak { memberId: string; currentStreak: number; longestStreak: number; lastActivityDate?: string }
interface MemberBadge { id: string; badgeCode: string; badgeName: string; badgeIcon: string; badgeDescription: string; earnedAtUtc: string }
interface MemberDto { id: string; firstName: string; lastName: string; email: string }

interface RewardDto {
  id: string; name: string; description: string | null; pointsCost: number
  category: string; stock: number | null; isActive: boolean; imageUrl: string | null
  validFrom: string | null; validTo: string | null; createdAtUtc: string
}
interface RedemptionDto {
  id: string; rewardId: string; rewardName: string; memberId: string
  pointsSpent: number; status: string; notes: string | null; redeemedAtUtc: string
}

// ── Demo rewards ──────────────────────────────────────────────────────────────
const DEMO_REWARDS: RewardDto[] = [
  { id: 'r1', name: 'Sconto 10% abbonamento', description: '10% di sconto sul prossimo rinnovo mensile', pointsCost: 500, category: 'Discount', stock: null, isActive: true, imageUrl: null, validFrom: null, validTo: null, createdAtUtc: '2026-01-01T00:00:00Z' },
  { id: 'r2', name: 'Sessione PT gratuita', description: 'Una sessione di personal training da 60 minuti con un trainer', pointsCost: 1200, category: 'Service', stock: 10, isActive: true, imageUrl: null, validFrom: null, validTo: null, createdAtUtc: '2026-01-01T00:00:00Z' },
  { id: 'r3', name: 'Borraccia Oplyfit', description: 'Borraccia termica brandizzata Oplyfit 750ml', pointsCost: 800, category: 'Product', stock: 25, isActive: true, imageUrl: null, validFrom: null, validTo: null, createdAtUtc: '2026-01-01T00:00:00Z' },
  { id: 'r4', name: 'T-shirt palestra', description: 'T-shirt tecnica con logo Oplyfit', pointsCost: 1500, category: 'Product', stock: 15, isActive: true, imageUrl: null, validFrom: null, validTo: null, createdAtUtc: '2026-01-01T00:00:00Z' },
  { id: 'r5', name: 'Accesso sauna 3 ingressi', description: 'Tre ingressi alla sauna inclusi nel pacchetto', pointsCost: 600, category: 'Experience', stock: null, isActive: true, imageUrl: null, validFrom: null, validTo: null, createdAtUtc: '2026-01-01T00:00:00Z' },
  { id: 'r6', name: 'Analisi composizione corporea', description: 'Analisi InBody gratuita con consulenza nutrizionista', pointsCost: 900, category: 'Service', stock: 5, isActive: false, imageUrl: null, validFrom: null, validTo: null, createdAtUtc: '2026-01-01T00:00:00Z' },
]
const DEMO_REDEMPTIONS: RedemptionDto[] = [
  { id: 'rd1', rewardId: 'r1', rewardName: 'Sconto 10% abbonamento', memberId: 'dm1', pointsSpent: 500, status: 'Fulfilled', notes: null, redeemedAtUtc: '2026-06-10T10:00:00Z' },
  { id: 'rd2', rewardId: 'r2', rewardName: 'Sessione PT gratuita', memberId: 'dm2', pointsSpent: 1200, status: 'Pending', notes: 'Da prenotare con Sara', redeemedAtUtc: '2026-06-20T14:30:00Z' },
  { id: 'rd3', rewardId: 'r3', rewardName: 'Borraccia Oplyfit', memberId: 'dm3', pointsSpent: 800, status: 'Fulfilled', notes: null, redeemedAtUtc: '2026-06-15T09:00:00Z' },
  { id: 'rd4', rewardId: 'r5', rewardName: 'Accesso sauna 3 ingressi', memberId: 'dm2', pointsSpent: 600, status: 'Cancelled', notes: 'Sauna in manutenzione', redeemedAtUtc: '2026-06-18T11:00:00Z' },
]

const CAT_ICON: Record<string, string> = { Discount: '🏷️', Product: '📦', Service: '🤝', Experience: '✨' }
const CAT_COLOR: Record<string, string> = {
  Discount: 'bg-green-100 text-green-700',
  Product: 'bg-blue-100 text-blue-700',
  Service: 'bg-purple-100 text-purple-700',
  Experience: 'bg-amber-100 text-amber-700',
}
const STATUS_COLOR: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Fulfilled: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}
const REWARD_CATEGORIES = ['Discount', 'Product', 'Service', 'Experience']

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MEMBERS: MemberDto[] = [
  { id: 'dm1', firstName: 'Giulia',  lastName: 'Ferretti', email: 'giulia@demo.it' },
  { id: 'dm2', firstName: 'Marco',   lastName: 'Bianchi',  email: 'marco@demo.it' },
  { id: 'dm3', firstName: 'Alessia', lastName: 'Romano',   email: 'alessia@demo.it' },
  { id: 'dm4', firstName: 'Roberto', lastName: 'Martini',  email: 'roberto@demo.it' },
]
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1,  memberId: 'dm2', memberName: 'Marco Bianchi',        totalPoints: 4850 },
  { rank: 2,  memberId: 'dm1', memberName: 'Giulia Ferretti',      totalPoints: 4210 },
  { rank: 3,  memberId: 'dm3', memberName: 'Alessia Romano',       totalPoints: 3980 },
  { rank: 4,  memberId: 'x01', memberName: 'Luca Colombo',         totalPoints: 3650 },
  { rank: 5,  memberId: 'x02', memberName: 'Sara Ricci',           totalPoints: 3420 },
  { rank: 6,  memberId: 'x03', memberName: 'Paolo Esposito',       totalPoints: 3180 },
  { rank: 7,  memberId: 'x04', memberName: 'Laura Moretti',        totalPoints: 2950 },
  { rank: 8,  memberId: 'x05', memberName: 'Andrea Costa',         totalPoints: 2740 },
  { rank: 9,  memberId: 'x06', memberName: 'Francesca Bruno',      totalPoints: 2590 },
  { rank: 10, memberId: 'x07', memberName: 'Matteo Conti',         totalPoints: 2380 },
  { rank: 11, memberId: 'x08', memberName: 'Valentina Russo',      totalPoints: 2200 },
  { rank: 12, memberId: 'x09', memberName: 'Simone Ferrari',       totalPoints: 2050 },
  { rank: 13, memberId: 'x10', memberName: 'Elena Greco',          totalPoints: 1890 },
  { rank: 14, memberId: 'x11', memberName: 'Davide Mancini',       totalPoints: 1720 },
  { rank: 15, memberId: 'x12', memberName: 'Chiara De Luca',       totalPoints: 1560 },
  { rank: 16, memberId: 'x13', memberName: 'Lorenzo Galli',        totalPoints: 1410 },
  { rank: 17, memberId: 'x14', memberName: 'Martina Pellegrini',   totalPoints: 1280 },
  { rank: 18, memberId: 'x15', memberName: 'Federico Barbieri',    totalPoints: 1140 },
  { rank: 19, memberId: 'x16', memberName: 'Silvia Caruso',        totalPoints: 1010 },
  { rank: 20, memberId: 'dm4', memberName: 'Roberto Martini',      totalPoints: 890  },
]
const ago = (n: number) => { const d = new Date('2026-06-24'); d.setDate(d.getDate() - n); return d.toISOString() }
const DEMO_POINTS: Record<string, MemberPoints> = {
  dm1: { memberId: 'dm1', balance: 4210, recentHistory: [
    { id: 'tx1', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',              occurredAtUtc: ago(0) },
    { id: 'tx2', points: 250, eventType: 'ClassCompleted', description: 'Corso Yoga completato',          occurredAtUtc: ago(2) },
    { id: 'tx3', points: 50,  eventType: 'StreakBonus',    description: 'Bonus streak 7 giorni',          occurredAtUtc: ago(7) },
    { id: 'tx4', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',              occurredAtUtc: ago(8) },
    { id: 'tx5', points: 500, eventType: 'BadgeEarned',   description: 'Badge "50 sessioni" sbloccato',  occurredAtUtc: ago(10) },
    { id: 'tx6', points: -200, eventType: 'ManualDeduct', description: 'Riscatto sconto abbonamento',    occurredAtUtc: ago(15) },
    { id: 'tx7', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',              occurredAtUtc: ago(16) },
    { id: 'tx8', points: 300, eventType: 'ManualAward',   description: 'Premio sfida mensile',           occurredAtUtc: ago(20) },
  ]},
  dm2: { memberId: 'dm2', balance: 4850, recentHistory: [
    { id: 'tx9',  points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',             occurredAtUtc: ago(0) },
    { id: 'tx10', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',             occurredAtUtc: ago(1) },
    { id: 'tx11', points: 250, eventType: 'ClassCompleted', description: 'HIIT Total Body completato',   occurredAtUtc: ago(3) },
    { id: 'tx12', points: 100, eventType: 'StreakBonus',   description: 'Bonus streak 14 giorni',        occurredAtUtc: ago(7) },
    { id: 'tx13', points: 500, eventType: 'BadgeEarned',   description: 'Badge "Power Lifter" sbloccato', occurredAtUtc: ago(12) },
    { id: 'tx14', points: 200, eventType: 'ManualAward',   description: 'Premio sfida "30 squat"',       occurredAtUtc: ago(18) },
    { id: 'tx15', points: -150, eventType: 'ManualDeduct', description: 'Riscatto sessione PT',          occurredAtUtc: ago(22) },
    { id: 'tx16', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',             occurredAtUtc: ago(25) },
  ]},
  dm3: { memberId: 'dm3', balance: 3980, recentHistory: [
    { id: 'tx17', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',             occurredAtUtc: ago(0) },
    { id: 'tx18', points: 250, eventType: 'ClassCompleted', description: 'Pilates Core completato',      occurredAtUtc: ago(4) },
    { id: 'tx19', points: 50,  eventType: 'StreakBonus',   description: 'Bonus streak 21 giorni',        occurredAtUtc: ago(7) },
    { id: 'tx20', points: 500, eventType: 'BadgeEarned',   description: 'Badge "100 sessioni" sbloccato', occurredAtUtc: ago(30) },
  ]},
  dm4: { memberId: 'dm4', balance: 890, recentHistory: [
    { id: 'tx21', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',             occurredAtUtc: ago(5) },
    { id: 'tx22', points: -50, eventType: 'ManualDeduct',  description: 'Penalità no-show classe',       occurredAtUtc: ago(8) },
    { id: 'tx23', points: 100, eventType: 'CheckIn',       description: 'Check-in palestra',             occurredAtUtc: ago(12) },
  ]},
}
const DEMO_STREAKS: Record<string, MemberStreak> = {
  dm1: { memberId: 'dm1', currentStreak: 18, longestStreak: 31, lastActivityDate: ago(0) },
  dm2: { memberId: 'dm2', currentStreak: 22, longestStreak: 22, lastActivityDate: ago(0) },
  dm3: { memberId: 'dm3', currentStreak: 25, longestStreak: 45, lastActivityDate: ago(0) },
  dm4: { memberId: 'dm4', currentStreak: 3,  longestStreak: 14, lastActivityDate: ago(5) },
}
const DEMO_BADGES: Record<string, MemberBadge[]> = {
  dm1: [
    { id: 'b1', badgeCode: 'FIRST_CHECKIN',  badgeName: 'Primo check-in',       badgeIcon: '🌟', badgeDescription: 'Primo accesso in palestra',            earnedAtUtc: ago(180) },
    { id: 'b2', badgeCode: 'STREAK_7',       badgeName: 'Streak 7 giorni',      badgeIcon: '🔥', badgeDescription: '7 giorni consecutivi in palestra',     earnedAtUtc: ago(90)  },
    { id: 'b3', badgeCode: 'SESSIONS_50',    badgeName: '50 Sessioni',           badgeIcon: '🏅', badgeDescription: '50 sessioni completate',               earnedAtUtc: ago(10)  },
    { id: 'b4', badgeCode: 'YOGA_ADEPT',     badgeName: 'Yoga Adept',           badgeIcon: '🧘', badgeDescription: '10 classi yoga completate',            earnedAtUtc: ago(30)  },
  ],
  dm2: [
    { id: 'b5', badgeCode: 'FIRST_CHECKIN',  badgeName: 'Primo check-in',       badgeIcon: '🌟', badgeDescription: 'Primo accesso in palestra',            earnedAtUtc: ago(365) },
    { id: 'b6', badgeCode: 'STREAK_7',       badgeName: 'Streak 7 giorni',      badgeIcon: '🔥', badgeDescription: '7 giorni consecutivi',                 earnedAtUtc: ago(120) },
    { id: 'b7', badgeCode: 'STREAK_14',      badgeName: 'Streak 14 giorni',     badgeIcon: '💥', badgeDescription: '14 giorni consecutivi',                earnedAtUtc: ago(60)  },
    { id: 'b8', badgeCode: 'POWER_LIFTER',   badgeName: 'Power Lifter',         badgeIcon: '💪', badgeDescription: '100 kg squat superati',                earnedAtUtc: ago(12)  },
    { id: 'b9', badgeCode: 'SESSIONS_100',   badgeName: '100 Sessioni',         badgeIcon: '🏆', badgeDescription: '100 sessioni completate',              earnedAtUtc: ago(45)  },
  ],
  dm3: [
    { id: 'b10', badgeCode: 'FIRST_CHECKIN', badgeName: 'Primo check-in',       badgeIcon: '🌟', badgeDescription: 'Primo accesso',                        earnedAtUtc: ago(300) },
    { id: 'b11', badgeCode: 'STREAK_21',     badgeName: 'Streak 21 giorni',     badgeIcon: '🌊', badgeDescription: '21 giorni consecutivi',                earnedAtUtc: ago(7)   },
    { id: 'b12', badgeCode: 'SESSIONS_100',  badgeName: '100 Sessioni',         badgeIcon: '🏆', badgeDescription: '100 sessioni completate',              earnedAtUtc: ago(30)  },
  ],
  dm4: [
    { id: 'b13', badgeCode: 'FIRST_CHECKIN', badgeName: 'Primo check-in',       badgeIcon: '🌟', badgeDescription: 'Primo accesso',                        earnedAtUtc: ago(90)  },
  ],
}
const DEMO_WEEKLY_PTS = [
  { week: 'W17', points: 2840 }, { week: 'W18', points: 3120 }, { week: 'W19', points: 2650 },
  { week: 'W20', points: 3480 }, { week: 'W21', points: 4100 }, { week: 'W22', points: 3720 },
  { week: 'W23', points: 4380 }, { week: 'W24', points: 5210 },
]
const EVENT_TYPES = ['ManualAward','ManualDeduct','CheckIn','ClassCompleted','BadgeEarned','StreakBonus']
const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-indigo-500']

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

// ── Reward modal ──────────────────────────────────────────────────────────────
interface RewardForm { name: string; description: string; pointsCost: number; category: string; stock: string; isActive: boolean; validFrom: string; validTo: string }
function emptyRewardForm(): RewardForm { return { name: '', description: '', pointsCost: 500, category: 'Discount', stock: '', isActive: true, validFrom: '', validTo: '' } }
function rewardToForm(r: RewardDto): RewardForm {
  return { name: r.name, description: r.description ?? '', pointsCost: r.pointsCost, category: r.category, stock: r.stock != null ? String(r.stock) : '', isActive: r.isActive, validFrom: r.validFrom ? r.validFrom.slice(0, 10) : '', validTo: r.validTo ? r.validTo.slice(0, 10) : '' }
}

function RewardModal({ editing, onClose, onSave }: { editing: RewardDto | null; onClose: () => void; onSave: (f: RewardForm) => void }) {
  const [form, setForm] = useState<RewardForm>(() => editing ? rewardToForm(editing) : emptyRewardForm())
  const set = (k: keyof RewardForm, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{editing ? 'Modifica premio' : 'Nuovo premio'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome premio *</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Es. Sessione PT gratuita" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descrizione</label>
            <textarea rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descrivi il premio..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">FitPoints richiesti *</label>
              <input type="number" min={1} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.pointsCost} onChange={e => set('pointsCost', +e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.category} onChange={e => set('category', e.target.value)}>
                {REWARD_CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Disponibilità (vuoto = illimitata)</label>
              <input type="number" min={1} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="Es. 10" />
            </div>
            <div className="flex flex-col gap-1 justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => set('isActive', !form.isActive)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-slate-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">{form.isActive ? 'Attivo' : 'Disattivato'}</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Valido dal</label>
              <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Valido fino al</label>
              <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.validTo} onChange={e => set('validTo', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Annulla</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim() || form.pointsCost <= 0}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition">
            {editing ? 'Salva' : 'Crea premio'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Gamification() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'leaderboard' | 'member' | 'stats' | 'rewards'>('leaderboard')
  const [query, setQuery] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null)
  const [awardForm, setAwardForm] = useState({ points: 50, eventType: 'ManualAward', description: '' })
  const [rewardModal, setRewardModal] = useState<RewardDto | null | 'new'>(null)
  const [rewardFilter, setRewardFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [redeemModal, setRedeemModal] = useState<RewardDto | null>(null)
  const [redeemMemberId, setRedeemMemberId] = useState('')
  const [redeemNotes, setRedeemNotes] = useState('')
  const [confirmDeleteReward, setConfirmDeleteReward] = useState<RewardDto | null>(null)
  const debQ = useDebounce(query, 300)
  const isDemoMember = selectedMember?.id.startsWith('dm') ?? false

  const { data: searchData } = useQuery({
    queryKey: ['members-search-gami', debQ],
    queryFn: () => api.get<any>(`/api/v1/members/search?q=${encodeURIComponent(debQ)}&limit=8`),
    enabled: debQ.length >= 2 && !isDemoMember,
    retry: false,
  })
  const remoteM: MemberDto[] = (searchData?.data as any)?.data ?? []
  const demoFiltered = DEMO_MEMBERS.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(debQ.toLowerCase()))
  const displayMembers = remoteM.length > 0 ? remoteM : demoFiltered

  const { data: lbData }     = useQuery({ queryKey: ['leaderboard'],                    queryFn: () => api.get<any>('/api/v1/gamification/leaderboard?top=20'),                                   enabled: tab === 'leaderboard', retry: false, refetchInterval: 30_000 })
  const { data: pointsData } = useQuery({ queryKey: ['member-points',  selectedMember?.id], queryFn: () => api.get<any>(`/api/v1/gamification/members/${selectedMember!.id}/points`),              enabled: tab === 'member' && !!selectedMember && !isDemoMember, retry: false })
  const { data: streakData } = useQuery({ queryKey: ['member-streak',  selectedMember?.id], queryFn: () => api.get<any>(`/api/v1/gamification/members/${selectedMember!.id}/streak`),              enabled: tab === 'member' && !!selectedMember && !isDemoMember, retry: false })
  const { data: badgesData } = useQuery({ queryKey: ['member-badges',  selectedMember?.id], queryFn: () => api.get<any>(`/api/v1/gamification/members/${selectedMember!.id}/badges`),              enabled: tab === 'member' && !!selectedMember && !isDemoMember, retry: false })

  const rawLb = (lbData?.data as any)?.data ?? []
  const leaderboard: LeaderboardEntry[] = rawLb.length > 0 ? rawLb : DEMO_LEADERBOARD
  const points: MemberPoints | null   = isDemoMember ? (DEMO_POINTS[selectedMember!.id] ?? null)  : ((pointsData?.data as any)?.data ?? null)
  const streak: MemberStreak | null   = isDemoMember ? (DEMO_STREAKS[selectedMember!.id] ?? null) : ((streakData?.data as any)?.data ?? null)
  const badges: MemberBadge[]         = isDemoMember ? (DEMO_BADGES[selectedMember!.id] ?? [])    : ((badgesData?.data as any)?.data ?? [])

  const totalPts = DEMO_LEADERBOARD.reduce((s, e) => s + e.totalPoints, 0)

  const awardPoints = useMutation({
    mutationFn: () => api.post(`/api/v1/gamification/members/${selectedMember!.id}/points`, awardForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['member-points', selectedMember?.id] }); qc.invalidateQueries({ queryKey: ['leaderboard'] }) },
  })

  // Rewards queries & mutations
  const { data: rewardsData } = useQuery({
    queryKey: ['rewards', rewardFilter],
    queryFn: () => api.get<RewardDto[]>(`/api/v1/rewards?${rewardFilter !== 'all' ? `activeOnly=${rewardFilter === 'active'}` : ''}`),
    placeholderData: { data: DEMO_REWARDS, meta: undefined },
    enabled: tab === 'rewards',
  })
  const rewards = rewardsData?.data ?? DEMO_REWARDS

  const { data: redemptionsData } = useQuery({
    queryKey: ['redemptions'],
    queryFn: () => api.get<RedemptionDto[]>('/api/v1/rewards/redemptions'),
    placeholderData: { data: DEMO_REDEMPTIONS, meta: undefined },
    enabled: tab === 'rewards',
  })
  const redemptions = redemptionsData?.data ?? DEMO_REDEMPTIONS

  const createRewardMut = useMutation({
    mutationFn: (f: RewardForm) => api.post('/api/v1/rewards', {
      name: f.name, description: f.description || null, pointsCost: f.pointsCost,
      category: f.category, stock: f.stock ? +f.stock : null,
      imageUrl: null, validFrom: f.validFrom || null, validTo: f.validTo || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rewards'] }); setRewardModal(null) },
  })
  const updateRewardMut = useMutation({
    mutationFn: ({ id, f }: { id: string; f: RewardForm }) => api.put(`/api/v1/rewards/${id}`, {
      name: f.name, description: f.description || null, pointsCost: f.pointsCost,
      category: f.category, stock: f.stock ? +f.stock : null,
      imageUrl: null, validFrom: f.validFrom || null, validTo: f.validTo || null, isActive: f.isActive,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rewards'] }); setRewardModal(null) },
  })
  const deleteRewardMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/rewards/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rewards'] }); setConfirmDeleteReward(null) },
  })
  const redeemMut = useMutation({
    mutationFn: ({ rewardId, memberId, notes }: { rewardId: string; memberId: string; notes: string }) =>
      api.post(`/api/v1/rewards/${rewardId}/redeem`, { memberId, notes: notes || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['redemptions'] }); qc.invalidateQueries({ queryKey: ['leaderboard'] }); setRedeemModal(null); setRedeemMemberId(''); setRedeemNotes('') },
  })
  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/v1/rewards/redemptions/${id}/status`, { status, notes: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['redemptions'] }),
  })

  function handleSaveReward(f: RewardForm) {
    if (rewardModal === 'new') createRewardMut.mutate(f)
    else if (rewardModal) updateRewardMut.mutate({ id: rewardModal.id, f })
  }

  function selectMember(m: MemberDto) { setSelectedMember(m); setQuery(`${m.firstName} ${m.lastName}`); setShowDrop(false) }

  return (
    <>
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gamification — FitPoints</h1>
        <p className="mt-0.5 text-sm text-slate-500">Punti, badge, streak e classifica soci.</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Punti distribuiti', value: totalPts.toLocaleString('it-IT'), sub: 'totale cumulato', color: 'text-brand-600' },
          { label: 'Soci in classifica', value: leaderboard.length, sub: 'top 20 attivi', color: 'text-slate-800' },
          { label: 'Streak max attuale', value: '25 gg', sub: 'Alessia Romano', color: 'text-orange-500' },
          { label: 'Badge emessi', value: Object.values(DEMO_BADGES).flat().length, sub: 'demo soci', color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit flex-wrap">
        {([
          ['leaderboard', '🏆 Classifica'],
          ['member',      '👤 Dettaglio socio'],
          ['rewards',     '🎁 Premi'],
          ['stats',       '📈 Statistiche'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Top 20 FitPoints</h2>
            <span className="text-xs text-slate-400">Aggiornamento ogni 30s</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Pos.</th>
                <th className="px-4 py-3 text-left font-medium">Socio</th>
                <th className="px-4 py-3 text-right font-medium">FitPoints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaderboard.map(e => (
                <tr key={e.memberId} className={`hover:bg-slate-50 transition ${e.rank <= 3 ? 'font-medium' : ''}`}>
                  <td className="px-4 py-3 text-lg">
                    {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : <span className="text-sm text-slate-400">#{e.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[(e.memberName ?? '?').charCodeAt(0) % AVATAR_COLORS.length]}`}>
                        {(e.memberName ?? '?')[0]}
                      </div>
                      <span className="text-slate-700">{e.memberName ?? e.memberId.slice(0, 8) + '…'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-brand-600">{e.totalPoints.toLocaleString('it-IT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB MEMBER ── */}
      {tab === 'member' && (
        <div className="space-y-4">
          {/* Name selector */}
          <div className="relative max-w-sm">
            <label className="mb-1 block text-xs text-slate-500">Cerca socio per nome</label>
            <input value={query} onChange={e => { setQuery(e.target.value); setShowDrop(true); if (!e.target.value) setSelectedMember(null) }}
              onFocus={() => setShowDrop(true)} onBlur={() => setTimeout(() => setShowDrop(false), 180)}
              placeholder="Es. Marco Bianchi…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            {showDrop && query.length >= 1 && displayMembers.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                {displayMembers.map(m => (
                  <button key={m.id} onMouseDown={() => selectMember(m)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[m.firstName.charCodeAt(0) % AVATAR_COLORS.length]}`}>
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                    {DEMO_POINTS[m.id] && (
                      <span className="ml-auto text-xs font-bold text-brand-600">{DEMO_POINTS[m.id].balance.toLocaleString()} pts</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedMember && points && (
            <>
              {/* Identity bar */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${AVATAR_COLORS[selectedMember.firstName.charCodeAt(0) % AVATAR_COLORS.length]}`}>
                  {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{selectedMember.firstName} {selectedMember.lastName}</p>
                  <p className="text-xs text-slate-400">{selectedMember.email}</p>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Saldo FitPoints</p>
                  <p className="text-3xl font-black text-brand-600 mt-1">{points.balance.toLocaleString('it-IT')}</p>
                </div>
                {streak && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">Streak corrente</p>
                    <p className="text-3xl font-black text-orange-500 mt-1">🔥 {streak.currentStreak} giorni</p>
                    <p className="text-xs text-slate-400 mt-1">Record: {streak.longestStreak} giorni</p>
                  </div>
                )}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">Badge sbloccati</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{badges.length}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {badges.map(b => <span key={b.id} title={b.badgeName} className="text-xl">{b.badgeIcon}</span>)}
                  </div>
                </div>
              </div>

              {/* Award form */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 max-w-md">
                <h3 className="font-semibold text-slate-800">Assegna / deduci punti</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Punti (neg. = deduzione)</label>
                    <Input type="number" value={awardForm.points} onChange={e => setAwardForm(p => ({ ...p, points: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Tipo evento</label>
                    <select value={awardForm.eventType} onChange={e => setAwardForm(p => ({ ...p, eventType: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                      {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs text-slate-500">Descrizione *</label>
                    <Input value={awardForm.description} onChange={e => setAwardForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
                <Button variant="primary" onClick={() => awardPoints.mutate()} disabled={awardPoints.isPending || !awardForm.description}>
                  {awardPoints.isPending ? 'Elaborazione…' : 'Conferma'}
                </Button>
              </div>

              {/* History */}
              {points.recentHistory.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Ultime transazioni</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                      <tr>
                        {['Data', 'Evento', 'Descrizione', 'Punti'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {points.recentHistory.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(t.occurredAtUtc).toLocaleDateString('it-IT')}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t.eventType}</span></td>
                          <td className="px-4 py-3 text-slate-600">{t.description}</td>
                          <td className={`px-4 py-3 text-right font-bold ${t.points >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.points >= 0 ? '+' : ''}{t.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {selectedMember && !points && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-400">
              Nessun dato punti disponibile per questo socio.
            </div>
          )}
        </div>
      )}

      {/* ── TAB REWARDS ── */}
      {tab === 'rewards' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Catalogo premi riscattabili</h2>
              <p className="text-sm text-slate-500">I soci possono riscattare i loro FitPoints con questi premi</p>
            </div>
            <button onClick={() => setRewardModal('new')}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition">
              + Nuovo premio
            </button>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Premi totali', value: rewards.length, icon: '🎁' },
              { label: 'Attivi', value: rewards.filter(r => r.isActive).length, icon: '✅' },
              { label: 'Riscatti totali', value: redemptions.length, icon: '🔄' },
              { label: 'In attesa', value: redemptions.filter(r => r.status === 'Pending').length, icon: '⏳' },
            ].map(k => (
              <div key={k.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="text-2xl mb-1">{k.icon}</div>
                <div className="text-xl font-bold text-slate-800">{k.value}</div>
                <div className="text-xs text-slate-500">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setRewardFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${rewardFilter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f === 'all' ? 'Tutti' : f === 'active' ? 'Attivi' : 'Inattivi'}
              </button>
            ))}
          </div>

          {/* Rewards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.filter(r => rewardFilter === 'all' || (rewardFilter === 'active' ? r.isActive : !r.isActive)).map(r => (
              <div key={r.id} className={`rounded-2xl border bg-white p-5 flex flex-col gap-3 shadow-sm transition ${r.isActive ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CAT_ICON[r.category] ?? '🎁'}</span>
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">{r.name}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5 ${CAT_COLOR[r.category]}`}>
                        {r.category}
                      </span>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.isActive ? '● Attivo' : '○ Inattivo'}
                  </span>
                </div>
                {r.description && <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-brand-600">{r.pointsCost.toLocaleString('it-IT')}</span>
                    <span className="text-xs text-slate-400 font-medium">FitPoints</span>
                  </div>
                  {r.stock != null && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.stock > 5 ? 'bg-slate-100 text-slate-600' : r.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                      {r.stock > 0 ? `${r.stock} disponibili` : 'Esaurito'}
                    </span>
                  )}
                  {r.stock == null && <span className="text-xs text-slate-400">Illimitato</span>}
                </div>
                <div className="flex gap-2 pt-1 border-t border-slate-50">
                  <button onClick={() => { setRedeemModal(r); setRedeemMemberId(''); setRedeemNotes('') }}
                    disabled={!r.isActive || (r.stock != null && r.stock <= 0)}
                    className="flex-1 rounded-lg py-1.5 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-40 transition">
                    🎁 Riscatta
                  </button>
                  <button onClick={() => setRewardModal(r)}
                    className="px-3 rounded-lg py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition">
                    Modifica
                  </button>
                  <button onClick={() => setConfirmDeleteReward(r)}
                    className="px-3 rounded-lg py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition">
                    🗑
                  </button>
                </div>
              </div>
            ))}
            {rewards.filter(r => rewardFilter === 'all' || (rewardFilter === 'active' ? r.isActive : !r.isActive)).length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">🎁</p>
                <p className="font-medium">Nessun premio. Creane uno!</p>
              </div>
            )}
          </div>

          {/* Redemptions table */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3">Riscatti recenti</h3>
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Premio</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Socio ID</th>
                    <th className="px-4 py-3 text-right">Punti</th>
                    <th className="px-4 py-3 text-center">Stato</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {redemptions.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nessun riscatto</td></tr>
                  )}
                  {redemptions.map(rd => (
                    <tr key={rd.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(rd.redeemedAtUtc).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{rd.rewardName}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell font-mono">{rd.memberId.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-right font-bold text-red-500">−{rd.pointsSpent.toLocaleString('it-IT')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[rd.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {rd.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {rd.status === 'Pending' && (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => updateStatusMut.mutate({ id: rd.id, status: 'Fulfilled' })}
                              className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition">
                              ✓ Evadi
                            </button>
                            <button onClick={() => updateStatusMut.mutate({ id: rd.id, status: 'Cancelled' })}
                              className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition">
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB STATS ── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-1 text-sm font-semibold text-slate-700">Punti distribuiti — ultime 8 settimane</p>
            <p className="text-xs text-slate-400 mb-4">Totale FitPoints assegnati per settimana</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DEMO_WEEKLY_PTS} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v.toLocaleString('it-IT'), 'Punti']} />
                <Bar dataKey="points" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">Distribuzione badge per socio</p>
              {DEMO_MEMBERS.map(m => {
                const bs = DEMO_BADGES[m.id] ?? []
                return (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[m.firstName.charCodeAt(0) % AVATAR_COLORS.length]}`}>
                      {m.firstName[0]}
                    </div>
                    <span className="text-sm text-slate-700 flex-1">{m.firstName} {m.lastName}</span>
                    <div className="flex gap-0.5">{bs.map(b => <span key={b.id} className="text-sm">{b.badgeIcon}</span>)}</div>
                    <span className="text-xs font-bold text-slate-400">{bs.length}</span>
                  </div>
                )
              })}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">Streak attuali</p>
              {DEMO_MEMBERS.map(m => {
                const s = DEMO_STREAKS[m.id]
                return (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-700 flex-1">{m.firstName} {m.lastName}</span>
                    <span className="text-sm font-bold text-orange-500">🔥 {s?.currentStreak ?? 0}gg</span>
                    <span className="text-xs text-slate-400">max {s?.longestStreak ?? 0}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Reward create/edit modal */}
    {rewardModal !== null && (
      <RewardModal
        editing={rewardModal === 'new' ? null : rewardModal}
        onClose={() => setRewardModal(null)}
        onSave={handleSaveReward}
      />
    )}

    {/* Redeem modal */}
    {redeemModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Riscatta premio</h2>
            <button onClick={() => setRedeemModal(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3">
              <span className="text-2xl">{CAT_ICON[redeemModal.category]}</span>
              <div>
                <p className="font-semibold text-slate-800">{redeemModal.name}</p>
                <p className="text-sm font-bold text-brand-600">{redeemModal.pointsCost.toLocaleString('it-IT')} FitPoints</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">ID Socio *</label>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                value={redeemMemberId} onChange={e => setRedeemMemberId(e.target.value)} placeholder="UUID del socio" />
              <p className="text-xs text-slate-400 mt-1">Trovi l'ID nel dettaglio anagrafica del socio</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Note (opzionale)</label>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={redeemNotes} onChange={e => setRedeemNotes(e.target.value)} placeholder="Es. da consegnare martedì" />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setRedeemModal(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Annulla</button>
            <button
              onClick={() => redeemMut.mutate({ rewardId: redeemModal.id, memberId: redeemMemberId, notes: redeemNotes })}
              disabled={!redeemMemberId.trim() || redeemMut.isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition">
              {redeemMut.isPending ? 'Riscatto…' : 'Conferma riscatto'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete reward confirm */}
    {confirmDeleteReward && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Elimina premio</h3>
          <p className="text-sm text-slate-600 mb-5">Eliminare <strong>{confirmDeleteReward.name}</strong>? I riscatti già registrati rimarranno nella cronologia.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setConfirmDeleteReward(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Annulla</button>
            <button onClick={() => deleteRewardMut.mutate(confirmDeleteReward.id)} disabled={deleteRewardMut.isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition">
              {deleteRewardMut.isPending ? 'Eliminando…' : 'Elimina'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
