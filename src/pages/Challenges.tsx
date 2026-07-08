import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChallengeSummaryDto {
  id: string; title: string; description: string | null; category: string
  startDateUtc: string; endDateUtc: string; isPaid: boolean; entryFeeEur: number | null
  maxParticipants: number | null; isPublished: boolean; prizeDescription: string | null
  loyaltyPointsReward: number; metricLabel: string | null; targetValue: number | null
  participantCount: number; createdAtUtc: string
}
interface ParticipationDto {
  id: string; challengeId: string; challengeTitle: string; memberId: string; memberName?: string
  joinedAtUtc: string; currentValue: number; isCompleted: boolean; completedAtUtc: string | null
  paymentStatus: string; loyaltyPointsAwarded: number
}
interface LoyaltyTierDto {
  id: string; tierName: string; badgeEmoji: string; minPoints: number; maxPoints: number | null
  perks: string | null; discountPercent: number | null; sortOrder: number
}
interface MemberLoyaltyDto {
  memberId: string; memberName?: string; totalPoints: number; currentTierName: string | null
  currentBadgeEmoji: string | null; currentTierPerks: string | null
  discountPercent: number | null; nextTierMinPoints: number | null; nextTierName: string | null; updatedAtUtc: string
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const d = (s: string) => new Date(s).toISOString()
const DEMO_CHALLENGES: ChallengeSummaryDto[] = [
  { id: 'c1', title: '30 giorni di squat', description: 'Esegui almeno 50 squat ogni giorno per 30 giorni consecutivi.', category: 'Strength', startDateUtc: d('2026-06-01'), endDateUtc: d('2026-06-30'), isPaid: false, entryFeeEur: null, maxParticipants: null, isPublished: true, prizeDescription: 'Maglia Oplyfit + 200 punti', loyaltyPointsReward: 200, metricLabel: 'giorni', targetValue: 30, participantCount: 18, createdAtUtc: d('2026-05-20') },
  { id: 'c2', title: 'Corri 50 km in luglio', description: 'Accumula 50 km di corsa nel mese di luglio.', category: 'Cardio', startDateUtc: d('2026-07-01'), endDateUtc: d('2026-07-31'), isPaid: true, entryFeeEur: 15, maxParticipants: 30, isPublished: true, prizeDescription: 'Buono Amazon €50 + 300 punti', loyaltyPointsReward: 300, metricLabel: 'km', targetValue: 50, participantCount: 12, createdAtUtc: d('2026-06-15') },
  { id: 'c3', title: 'Detox Alimentare 14gg', description: 'Segui il piano nutrizionale detox per 14 giorni.', category: 'Nutrition', startDateUtc: d('2026-06-10'), endDateUtc: d('2026-06-24'), isPaid: false, entryFeeEur: null, maxParticipants: null, isPublished: true, prizeDescription: '150 punti fedeltà', loyaltyPointsReward: 150, metricLabel: 'giorni', targetValue: 14, participantCount: 8, createdAtUtc: d('2026-06-01') },
  { id: 'c4', title: '100 sessioni in palestra', description: 'Raggiungi 100 check-in entro fine anno.', category: 'Custom', startDateUtc: d('2026-01-01'), endDateUtc: d('2026-12-31'), isPaid: false, entryFeeEur: null, maxParticipants: null, isPublished: true, prizeDescription: 'Un anno gratis + trofeo', loyaltyPointsReward: 500, metricLabel: 'sessioni', targetValue: 100, participantCount: 22, createdAtUtc: d('2025-12-28') },
  { id: 'c5', title: 'Flessibilità 21gg', description: 'Stretching quotidiano per 21 giorni.', category: 'Flexibility', startDateUtc: d('2026-07-07'), endDateUtc: d('2026-07-28'), isPaid: false, entryFeeEur: null, maxParticipants: 20, isPublished: false, prizeDescription: null, loyaltyPointsReward: 100, metricLabel: 'giorni', targetValue: 21, participantCount: 0, createdAtUtc: d('2026-06-20') },
]
const DEMO_PARTICIPANTS: Record<string, ParticipationDto[]> = {
  c1: [
    { id: 'p1', challengeId: 'c1', challengeTitle: '30 giorni di squat', memberId: 'dm2', memberName: 'Marco Bianchi',   joinedAtUtc: d('2026-06-01'), currentValue: 28, isCompleted: false, completedAtUtc: null, paymentStatus: 'Free', loyaltyPointsAwarded: 0 },
    { id: 'p2', challengeId: 'c1', challengeTitle: '30 giorni di squat', memberId: 'dm1', memberName: 'Giulia Ferretti', joinedAtUtc: d('2026-06-01'), currentValue: 30, isCompleted: true,  completedAtUtc: d('2026-06-30'), paymentStatus: 'Free', loyaltyPointsAwarded: 200 },
    { id: 'p3', challengeId: 'c1', challengeTitle: '30 giorni di squat', memberId: 'dm3', memberName: 'Alessia Romano',  joinedAtUtc: d('2026-06-02'), currentValue: 25, isCompleted: false, completedAtUtc: null, paymentStatus: 'Free', loyaltyPointsAwarded: 0 },
    { id: 'p4', challengeId: 'c1', challengeTitle: '30 giorni di squat', memberId: 'dm4', memberName: 'Roberto Martini', joinedAtUtc: d('2026-06-03'), currentValue: 12, isCompleted: false, completedAtUtc: null, paymentStatus: 'Free', loyaltyPointsAwarded: 0 },
  ],
  c2: [
    { id: 'p5', challengeId: 'c2', challengeTitle: 'Corri 50 km',        memberId: 'dm2', memberName: 'Marco Bianchi',   joinedAtUtc: d('2026-07-01'), currentValue: 0, isCompleted: false, completedAtUtc: null, paymentStatus: 'Paid', loyaltyPointsAwarded: 0 },
    { id: 'p6', challengeId: 'c2', challengeTitle: 'Corri 50 km',        memberId: 'dm3', memberName: 'Alessia Romano',  joinedAtUtc: d('2026-07-01'), currentValue: 0, isCompleted: false, completedAtUtc: null, paymentStatus: 'Paid', loyaltyPointsAwarded: 0 },
  ],
  c4: [
    { id: 'p7', challengeId: 'c4', challengeTitle: '100 sessioni',       memberId: 'dm2', memberName: 'Marco Bianchi',   joinedAtUtc: d('2026-01-01'), currentValue: 87, isCompleted: false, completedAtUtc: null, paymentStatus: 'Free', loyaltyPointsAwarded: 0 },
    { id: 'p8', challengeId: 'c4', challengeTitle: '100 sessioni',       memberId: 'dm3', memberName: 'Alessia Romano',  joinedAtUtc: d('2026-01-01'), currentValue: 72, isCompleted: false, completedAtUtc: null, paymentStatus: 'Free', loyaltyPointsAwarded: 0 },
    { id: 'p9', challengeId: 'c4', challengeTitle: '100 sessioni',       memberId: 'dm1', memberName: 'Giulia Ferretti', joinedAtUtc: d('2026-01-01'), currentValue: 55, isCompleted: false, completedAtUtc: null, paymentStatus: 'Free', loyaltyPointsAwarded: 0 },
  ],
}
const DEMO_TIERS: LoyaltyTierDto[] = [
  { id: 't1', tierName: 'Bronzo',  badgeEmoji: '🥉', minPoints: 0,    maxPoints: 499,  perks: 'Accesso sala pesi nelle ore di punta', discountPercent: 5,  sortOrder: 0 },
  { id: 't2', tierName: 'Argento', badgeEmoji: '🥈', minPoints: 500,  maxPoints: 1499, perks: '10% sconto su tutti i servizi extra',  discountPercent: 10, sortOrder: 1 },
  { id: 't3', tierName: 'Oro',     badgeEmoji: '🥇', minPoints: 1500, maxPoints: 2999, perks: '15% sconto + accesso area VIP',         discountPercent: 15, sortOrder: 2 },
  { id: 't4', tierName: 'Platino', badgeEmoji: '💎', minPoints: 3000, maxPoints: null, perks: '20% sconto + PT session gratis/mese',  discountPercent: 20, sortOrder: 3 },
]
const DEMO_LOYALTY_LB: MemberLoyaltyDto[] = [
  { memberId: 'dm2', memberName: 'Marco Bianchi',   totalPoints: 4850, currentTierName: 'Platino', currentBadgeEmoji: '💎', currentTierPerks: '20% sconto + PT session gratis/mese', discountPercent: 20, nextTierMinPoints: null, nextTierName: null, updatedAtUtc: new Date().toISOString() },
  { memberId: 'dm1', memberName: 'Giulia Ferretti', totalPoints: 4210, currentTierName: 'Platino', currentBadgeEmoji: '💎', currentTierPerks: '20% sconto + PT session gratis/mese', discountPercent: 20, nextTierMinPoints: null, nextTierName: null, updatedAtUtc: new Date().toISOString() },
  { memberId: 'dm3', memberName: 'Alessia Romano',  totalPoints: 3980, currentTierName: 'Platino', currentBadgeEmoji: '💎', currentTierPerks: '20% sconto + PT session gratis/mese', discountPercent: 20, nextTierMinPoints: null, nextTierName: null, updatedAtUtc: new Date().toISOString() },
  { memberId: 'x01', memberName: 'Luca Colombo',    totalPoints: 2640, currentTierName: 'Oro',     currentBadgeEmoji: '🥇', currentTierPerks: '15% sconto + accesso area VIP',       discountPercent: 15, nextTierMinPoints: 3000, nextTierName: 'Platino', updatedAtUtc: new Date().toISOString() },
  { memberId: 'x02', memberName: 'Sara Ricci',      totalPoints: 1820, currentTierName: 'Oro',     currentBadgeEmoji: '🥇', currentTierPerks: '15% sconto + accesso area VIP',       discountPercent: 15, nextTierMinPoints: 3000, nextTierName: 'Platino', updatedAtUtc: new Date().toISOString() },
  { memberId: 'x03', memberName: 'Paolo Esposito',  totalPoints: 1350, currentTierName: 'Argento', currentBadgeEmoji: '🥈', currentTierPerks: '10% sconto su tutti i servizi extra',  discountPercent: 10, nextTierMinPoints: 1500, nextTierName: 'Oro',     updatedAtUtc: new Date().toISOString() },
  { memberId: 'x04', memberName: 'Laura Moretti',   totalPoints: 980,  currentTierName: 'Argento', currentBadgeEmoji: '🥈', currentTierPerks: '10% sconto su tutti i servizi extra',  discountPercent: 10, nextTierMinPoints: 1500, nextTierName: 'Oro',     updatedAtUtc: new Date().toISOString() },
  { memberId: 'x05', memberName: 'Andrea Costa',    totalPoints: 620,  currentTierName: 'Argento', currentBadgeEmoji: '🥈', currentTierPerks: '10% sconto su tutti i servizi extra',  discountPercent: 10, nextTierMinPoints: 1500, nextTierName: 'Oro',     updatedAtUtc: new Date().toISOString() },
  { memberId: 'x06', memberName: 'Francesca Bruno', totalPoints: 310,  currentTierName: 'Bronzo',  currentBadgeEmoji: '🥉', currentTierPerks: 'Accesso sala pesi nelle ore di punta', discountPercent: 5,  nextTierMinPoints: 500,  nextTierName: 'Argento', updatedAtUtc: new Date().toISOString() },
  { memberId: 'dm4', memberName: 'Roberto Martini', totalPoints: 180,  currentTierName: 'Bronzo',  currentBadgeEmoji: '🥉', currentTierPerks: 'Accesso sala pesi nelle ore di punta', discountPercent: 5,  nextTierMinPoints: 500,  nextTierName: 'Argento', updatedAtUtc: new Date().toISOString() },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const CAT_ICON: Record<string, string> = { Strength: '💪', Cardio: '🏃', WeightLoss: '⚖️', Endurance: '🏅', Nutrition: '🥗', Flexibility: '🤸', Custom: '⭐' }
const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500']
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) }

// ── Component ─────────────────────────────────────────────────────────────────
type Tab = 'challenges' | 'loyalty' | 'leaderboard' | 'add'
export default function Challenges() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('challenges')
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [editTier, setEditTier] = useState<LoyaltyTierDto | null>(null)
  const [challengeForm, setChallengeForm] = useState({ title: '', description: '', category: 'Strength', startDateUtc: '', endDateUtc: '', isPaid: false, entryFeeEur: '', maxParticipants: '', prizeDescription: '', loyaltyPointsReward: '100', metricLabel: '', targetValue: '' })
  const [tierForm, setTierForm] = useState({ tierName: '', badgeEmoji: '⭐', minPoints: '', maxPoints: '', perks: '', discountPercent: '', sortOrder: '0' })

  const { data: challengesData } = useQuery({ queryKey: ['challenges', 'admin'],                 queryFn: () => api.get<ChallengeSummaryDto[]>('/api/v1/challenges'),                                                retry: false })
  const { data: participantsData } = useQuery({ queryKey: ['challenges', 'participants', selectedChallenge], queryFn: () => api.get<ParticipationDto[]>(`/api/v1/challenges/${selectedChallenge}/participants`), enabled: !!selectedChallenge, retry: false })
  const { data: tiersData }      = useQuery({ queryKey: ['loyalty', 'tiers'],                    queryFn: () => api.get<LoyaltyTierDto[]>('/api/v1/loyalty/tiers'),                                               retry: false })
  const { data: leaderboardData } = useQuery({ queryKey: ['loyalty', 'leaderboard'],             queryFn: () => api.get<MemberLoyaltyDto[]>('/api/v1/loyalty/leaderboard?take=50'),                               enabled: tab === 'leaderboard', retry: false })

  const rawChallenges    = (challengesData?.data  as any)?.data  ?? challengesData?.data  ?? []
  const rawParticipants  = (participantsData?.data as any)?.data ?? participantsData?.data ?? []
  const rawTiers         = (tiersData?.data as any)?.data        ?? tiersData?.data        ?? []
  const rawLeaderboard   = (leaderboardData?.data as any)?.data  ?? leaderboardData?.data  ?? []

  const challenges   = (Array.isArray(rawChallenges)  && rawChallenges.length  > 0 ? rawChallenges  : DEMO_CHALLENGES)  as ChallengeSummaryDto[]
  const participants = (Array.isArray(rawParticipants) && rawParticipants.length > 0 ? rawParticipants : (selectedChallenge ? (DEMO_PARTICIPANTS[selectedChallenge] ?? []) : [])) as ParticipationDto[]
  const tiers        = (Array.isArray(rawTiers)        && rawTiers.length        > 0 ? rawTiers        : DEMO_TIERS)      as LoyaltyTierDto[]
  const leaderboard  = (Array.isArray(rawLeaderboard)  && rawLeaderboard.length  > 0 ? rawLeaderboard  : DEMO_LOYALTY_LB) as MemberLoyaltyDto[]

  const publishMutation = useMutation({ mutationFn: ({ id, publish }: { id: string; publish: boolean }) => api.put(`/api/v1/challenges/${id}/publish`, { publish }), onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }) })
  const completeMutation = useMutation({ mutationFn: ({ challengeId, partId }: { challengeId: string; partId: string }) => api.put(`/api/v1/challenges/${challengeId}/participants/${partId}/complete`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges', 'participants', selectedChallenge] }) })
  const createChallengeMutation = useMutation({ mutationFn: (body: object) => api.post('/api/v1/challenges', body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); setTab('challenges') } })
  const seedTiersMutation = useMutation({ mutationFn: () => api.post('/api/v1/loyalty/tiers/seed', {}), onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty'] }) })
  const upsertTierMutation = useMutation({ mutationFn: ({ id, body }: { id: string | null; body: object }) => id ? api.put(`/api/v1/loyalty/tiers/${id}`, body) : api.post('/api/v1/loyalty/tiers', body), onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty'] }); setEditTier(null); setTierForm({ tierName: '', badgeEmoji: '⭐', minPoints: '', maxPoints: '', perks: '', discountPercent: '', sortOrder: '0' }) } })
  const deleteTierMutation = useMutation({ mutationFn: (id: string) => api.delete(`/api/v1/loyalty/tiers/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty'] }) })

  const publishedCount = challenges.filter(c => c.isPublished).length
  const totalParticipants = challenges.reduce((s, c) => s + c.participantCount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sfide & Tier Loyalty</h1>
          <p className="mt-0.5 text-sm text-slate-500">Sfide a pagamento, tracking progressi e sistema tier fedeltà.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">⚠️ Stripe stub</span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: '🏆', label: 'Sfide totali',    value: challenges.length,    sub: `${publishedCount} pubblicate`, color: 'text-slate-800' },
          { icon: '👥', label: 'Partecipazioni',  value: totalParticipants,    sub: 'iscrizioni attive',           color: 'text-brand-600' },
          { icon: '🎖️', label: 'Tier definiti',   value: tiers.length,         sub: 'livelli fedeltà',             color: 'text-amber-600' },
          { icon: '💎', label: 'Soci Platino',    value: leaderboard.filter(m => m.currentTierName === 'Platino').length, sub: '≥ 3000 punti', color: 'text-violet-600' },
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
          ['challenges',  `🏆 Sfide (${challenges.length})`],
          ['loyalty',     `🎖️ Tier (${tiers.length})`],
          ['leaderboard', '📊 Classifica'],
          ['add',         '+ Sfida'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Sfide ── */}
      {tab === 'challenges' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {challenges.map(c => {
              const isSelected = selectedChallenge === c.id
              const progress = c.targetValue ? Math.min(100, Math.round((Math.max(...(DEMO_PARTICIPANTS[c.id] ?? []).map(p => p.currentValue), 0) / c.targetValue) * 100)) : null
              return (
                <div key={c.id} onClick={() => setSelectedChallenge(isSelected ? null : c.id)}
                  className={`cursor-pointer rounded-xl border bg-white p-4 transition hover:border-brand-300 ${isSelected ? 'border-brand-500 ring-1 ring-brand-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{CAT_ICON[c.category] ?? '🏆'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 leading-tight">{c.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(c.startDateUtc)} → {fmtDate(c.endDateUtc)} · {c.participantCount} partecipanti</p>
                        {c.loyaltyPointsReward > 0 && <p className="text-xs text-amber-600 font-medium mt-0.5">+{c.loyaltyPointsReward} pts loyalty</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {c.isPaid && <span className="text-sm font-bold text-slate-700">€{c.entryFeeEur}</span>}
                      <button onClick={e => { e.stopPropagation(); publishMutation.mutate({ id: c.id, publish: !c.isPublished }) }}
                        className={`rounded-full px-3 py-0.5 text-xs font-medium ${c.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.isPublished ? '✅ Pubblica' : 'Bozza'}
                      </button>
                    </div>
                  </div>
                  {progress !== null && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progresso top</span><span>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Partecipanti */}
          {selectedChallenge && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-semibold text-slate-800">Partecipanti — {challenges.find(c => c.id === selectedChallenge)?.title}</h2>
              {participants.length === 0 && <p className="text-sm text-slate-400">Nessun partecipante.</p>}
              {[...participants].sort((a, b) => b.currentValue - a.currentValue).map((p, i) => {
                const ch = challenges.find(c => c.id === selectedChallenge)
                const pct = ch?.targetValue ? Math.min(100, Math.round((p.currentValue / ch.targetValue) * 100)) : null
                return (
                  <div key={p.id} className="py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{p.memberName ?? p.memberId.slice(0, 8) + '…'}</p>
                        <p className="text-xs text-slate-400">{p.currentValue} {ch?.metricLabel ?? ''}{p.isCompleted ? ' ✓ Completata' : ''}</p>
                      </div>
                      {!p.isCompleted && (
                        <button onClick={() => completeMutation.mutate({ challengeId: selectedChallenge, partId: p.id })}
                          className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 flex-shrink-0">
                          Completa
                        </button>
                      )}
                      {p.loyaltyPointsAwarded > 0 && <span className="text-xs font-semibold text-amber-600 flex-shrink-0">+{p.loyaltyPointsAwarded} pts</span>}
                    </div>
                    {pct !== null && (
                      <div className="mt-2 ml-10">
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-brand-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tier Loyalty ── */}
      {tab === 'loyalty' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Tier fedeltà</h2>
              {tiers.length === 0 && (
                <button onClick={() => seedTiersMutation.mutate()} disabled={seedTiersMutation.isPending}
                  className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                  {seedTiersMutation.isPending ? 'Creazione…' : '✨ Crea tier predefiniti'}
                </button>
              )}
            </div>
            {tiers.map(t => (
              <div key={t.id} className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.badgeEmoji}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{t.tierName}</p>
                      <p className="text-xs text-slate-400">
                        {t.minPoints.toLocaleString()}{t.maxPoints != null ? ` – ${t.maxPoints.toLocaleString()}` : '+'} pts
                        {t.discountPercent != null && ` · ${t.discountPercent}% sconto`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditTier(t); setTierForm({ tierName: t.tierName, badgeEmoji: t.badgeEmoji, minPoints: String(t.minPoints), maxPoints: t.maxPoints != null ? String(t.maxPoints) : '', perks: t.perks ?? '', discountPercent: t.discountPercent != null ? String(t.discountPercent) : '', sortOrder: String(t.sortOrder) }) }}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50">Modifica</button>
                    <button onClick={() => { if (confirm('Eliminare?')) deleteTierMutation.mutate(t.id) }}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50">Elimina</button>
                  </div>
                </div>
                {t.perks && <p className="mt-2 text-xs text-slate-500 ml-11">{t.perks}</p>}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-800">{editTier ? `Modifica: ${editTier.tierName}` : 'Nuovo tier'}</h2>
            <form onSubmit={e => { e.preventDefault(); upsertTierMutation.mutate({ id: editTier?.id ?? null, body: { tierName: tierForm.tierName, badgeEmoji: tierForm.badgeEmoji, minPoints: Number(tierForm.minPoints), maxPoints: tierForm.maxPoints ? Number(tierForm.maxPoints) : null, perks: tierForm.perks || null, discountPercent: tierForm.discountPercent ? Number(tierForm.discountPercent) : null, sortOrder: Number(tierForm.sortOrder) } }) }} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Nome tier *</label>
                  <input required value={tierForm.tierName} onChange={e => setTierForm(s => ({ ...s, tierName: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Emoji</label>
                  <input value={tierForm.badgeEmoji} onChange={e => setTierForm(s => ({ ...s, badgeEmoji: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-center focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Punti minimi *</label><input required type="number" min="0" value={tierForm.minPoints} onChange={e => setTierForm(s => ({ ...s, minPoints: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Punti massimi</label><input type="number" placeholder="Illimitati" value={tierForm.maxPoints} onChange={e => setTierForm(s => ({ ...s, maxPoints: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" /></div>
              </div>
              <div><label className="mb-1 block text-xs font-medium text-slate-500">Benefit</label><input value={tierForm.perks} onChange={e => setTierForm(s => ({ ...s, perks: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Sconto (%)</label><input type="number" min="0" max="100" value={tierForm.discountPercent} onChange={e => setTierForm(s => ({ ...s, discountPercent: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Ordine</label><input type="number" min="0" value={tierForm.sortOrder} onChange={e => setTierForm(s => ({ ...s, sortOrder: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none" /></div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={upsertTierMutation.isPending} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">{upsertTierMutation.isPending ? 'Salvataggio…' : editTier ? 'Aggiorna' : 'Crea tier'}</button>
                {editTier && <button type="button" onClick={() => { setEditTier(null); setTierForm({ tierName: '', badgeEmoji: '⭐', minPoints: '', maxPoints: '', perks: '', discountPercent: '', sortOrder: '0' }) }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Classifica ── */}
      {tab === 'leaderboard' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
            <h2 className="font-semibold text-slate-800">Classifica fedeltà</h2>
            <p className="text-xs text-slate-400 mt-0.5">Top soci per punti loyalty accumulati</p>
          </div>
          <div className="divide-y divide-slate-50">
            {leaderboard.map((m, i) => {
              const ptsToNext = m.nextTierMinPoints ? m.nextTierMinPoints - m.totalPoints : null
              const tierMax   = tiers.find(t => t.tierName === m.currentTierName)?.maxPoints
              const tierMin   = tiers.find(t => t.tierName === m.currentTierName)?.minPoints ?? 0
              const pct       = tierMax ? Math.round(((m.totalPoints - tierMin) / (tierMax - tierMin)) * 100) : 100
              return (
                <div key={m.memberId} className="flex items-center gap-4 px-6 py-3">
                  <span className={`w-8 text-center font-bold text-sm flex-shrink-0 ${i < 3 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <span className="text-2xl flex-shrink-0">{m.currentBadgeEmoji ?? '⭐'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{m.memberName ?? m.memberId.slice(0, 8) + '…'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{m.currentTierName ?? 'Nessun tier'}</span>
                      {ptsToNext && <span className="text-xs text-slate-300">· {ptsToNext.toLocaleString()} pts → {m.nextTierName}</span>}
                    </div>
                    {tierMax && (
                      <div className="mt-1 h-1 rounded-full bg-slate-100 w-32 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-brand-600">{m.totalPoints.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">punti</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Aggiungi sfida ── */}
      {tab === 'add' && (
        <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">Nuova sfida</h2>
          {challengeForm.isPaid && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              ⚠️ Pagamento stub — configurare <code>Stripe:Enabled=true</code> per i pagamenti reali.
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); createChallengeMutation.mutate({ ...challengeForm, entryFeeEur: challengeForm.isPaid && challengeForm.entryFeeEur ? Number(challengeForm.entryFeeEur) : null, maxParticipants: challengeForm.maxParticipants ? Number(challengeForm.maxParticipants) : null, loyaltyPointsReward: Number(challengeForm.loyaltyPointsReward), targetValue: challengeForm.targetValue ? Number(challengeForm.targetValue) : null, description: challengeForm.description || null, prizeDescription: challengeForm.prizeDescription || null, metricLabel: challengeForm.metricLabel || null }) }} className="space-y-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Titolo *</label><input required value={challengeForm.title} onChange={e => setChallengeForm(s => ({ ...s, title: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Categoria</label><select value={challengeForm.category} onChange={e => setChallengeForm(s => ({ ...s, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">{['Strength','Cardio','WeightLoss','Endurance','Nutrition','Flexibility','Custom'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Punti loyalty</label><input type="number" min="0" value={challengeForm.loyaltyPointsReward} onChange={e => setChallengeForm(s => ({ ...s, loyaltyPointsReward: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Inizio *</label><input required type="date" value={challengeForm.startDateUtc} onChange={e => setChallengeForm(s => ({ ...s, startDateUtc: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Fine *</label><input required type="date" value={challengeForm.endDateUtc} onChange={e => setChallengeForm(s => ({ ...s, endDateUtc: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Metrica</label><input value={challengeForm.metricLabel} onChange={e => setChallengeForm(s => ({ ...s, metricLabel: e.target.value }))} placeholder="es. km" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Obiettivo</label><input type="number" step="any" placeholder="opzionale" value={challengeForm.targetValue} onChange={e => setChallengeForm(s => ({ ...s, targetValue: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={challengeForm.isPaid} onChange={e => setChallengeForm(s => ({ ...s, isPaid: e.target.checked }))} /> Sfida a pagamento</label>
            {challengeForm.isPaid && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-slate-600">Quota (€)</label><input type="number" min="0" step="0.01" value={challengeForm.entryFeeEur} onChange={e => setChallengeForm(s => ({ ...s, entryFeeEur: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
                <div><label className="mb-1 block text-sm font-medium text-slate-600">Max partecipanti</label><input type="number" min="1" value={challengeForm.maxParticipants} onChange={e => setChallengeForm(s => ({ ...s, maxParticipants: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={createChallengeMutation.isPending} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">{createChallengeMutation.isPending ? 'Salvataggio…' : 'Crea sfida'}</button>
              <button type="button" onClick={() => setTab('challenges')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
