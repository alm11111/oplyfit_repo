import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge, Card } from '../components/ui'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface PlanDto {
  id: string
  name: string
  priceAmount: number
  priceCurrency: string
  billingInterval: string
  trialDays: number
  isActive: boolean
  description: string | null
  features: string[]
  memberCount?: number
  mrr?: number
}

interface SubscriptionDto {
  id: string
  memberId: string
  memberName: string
  memberEmail: string
  planId: string
  planName: string
  status: string
  startDate: string
  endDate: string | null
  nextBillingDate: string | null
  amount: number
  currency: string
  autoRenew: boolean
}

// ── Stubs ─────────────────────────────────────────────────────────────────────
const DEMO_PLANS: PlanDto[] = [
  { id: 'p1', name: 'Base Mensile',     priceAmount: 39.90,  priceCurrency: 'EUR', billingInterval: 'Monthly',   trialDays: 7,  isActive: true,  description: 'Accesso sala pesi e cardio', features: ['Sala pesi', 'Cardio', 'Docce'], memberCount: 28, mrr: 1117 },
  { id: 'p2', name: 'Premium Mensile',  priceAmount: 59.90,  priceCurrency: 'EUR', billingInterval: 'Monthly',   trialDays: 7,  isActive: true,  description: 'Accesso completo + corsi',   features: ['Tutto Base', 'Corsi inclusi', 'App AI Coach', 'Nutrizione'], memberCount: 41, mrr: 2456 },
  { id: 'p3', name: 'Annuale Top',      priceAmount: 499.00, priceCurrency: 'EUR', billingInterval: 'Yearly',    trialDays: 0,  isActive: true,  description: 'Il massimo al minor costo',  features: ['Tutto Premium', 'Personal trainer 2×/mese', 'Body Score', 'Priorità prenotazioni'], memberCount: 29, mrr: 1206 },
  { id: 'p4', name: 'Trimestrale',      priceAmount: 129.00, priceCurrency: 'EUR', billingInterval: 'Quarterly', trialDays: 0,  isActive: true,  description: 'Flessibilità trimestrale',   features: ['Sala pesi', 'Cardio', 'Corsi Base'], memberCount: 14, mrr: 602 },
  { id: 'p5', name: 'Student',          priceAmount: 29.90,  priceCurrency: 'EUR', billingInterval: 'Monthly',   trialDays: 14, isActive: true,  description: 'Tariffa agevolata studenti', features: ['Sala pesi', 'Cardio'], memberCount: 12, mrr: 359 },
  { id: 'p6', name: 'Corporate',        priceAmount: 44.90,  priceCurrency: 'EUR', billingInterval: 'Monthly',   trialDays: 0,  isActive: false, description: 'Convenzioni aziendali',       features: ['Tutto Premium', 'Fatturazione aziendale', 'Report HR'], memberCount: 0,  mrr: 0 },
]

const DEMO_SUBS: SubscriptionDto[] = [
  { id: 's1',  memberId: 'm1',  memberName: 'Giulia Ferretti',   memberEmail: 'giulia@email.it',    planId: 'p3', planName: 'Annuale Top',     status: 'Active',    startDate: '2026-01-15', endDate: '2027-01-15', nextBillingDate: '2027-01-15', amount: 499,   currency: 'EUR', autoRenew: true  },
  { id: 's2',  memberId: 'm2',  memberName: 'Marco Bianchi',     memberEmail: 'marco@email.it',     planId: 'p2', planName: 'Premium Mensile', status: 'Active',    startDate: '2026-03-01', endDate: null,         nextBillingDate: '2026-07-24', amount: 59.90, currency: 'EUR', autoRenew: true  },
  { id: 's3',  memberId: 'm3',  memberName: 'Alessia Romano',   memberEmail: 'alessia@email.it',   planId: 'p1', planName: 'Base Mensile',    status: 'Active',    startDate: '2026-04-10', endDate: null,         nextBillingDate: '2026-07-10', amount: 39.90, currency: 'EUR', autoRenew: true  },
  { id: 's4',  memberId: 'm4',  memberName: 'Luca Conti',        memberEmail: 'luca@email.it',      planId: 'p2', planName: 'Premium Mensile', status: 'Trial',     startDate: '2026-06-17', endDate: null,         nextBillingDate: '2026-07-01', amount: 59.90, currency: 'EUR', autoRenew: false },
  { id: 's5',  memberId: 'm5',  memberName: 'Sara Esposito',     memberEmail: 'sara@email.it',      planId: 'p4', planName: 'Trimestrale',     status: 'Active',    startDate: '2026-04-01', endDate: '2026-07-01', nextBillingDate: '2026-07-01', amount: 129,   currency: 'EUR', autoRenew: true  },
  { id: 's6',  memberId: 'm6',  memberName: 'Fabio De Luca',    memberEmail: 'fabio@email.it',     planId: 'p5', planName: 'Student',         status: 'Active',    startDate: '2026-02-01', endDate: null,         nextBillingDate: '2026-07-24', amount: 29.90, currency: 'EUR', autoRenew: true  },
  { id: 's7',  memberId: 'm7',  memberName: 'Chiara Lombardi',  memberEmail: 'chiara@email.it',    planId: 'p3', planName: 'Annuale Top',     status: 'Paused',    startDate: '2025-08-01', endDate: '2026-08-01', nextBillingDate: null,         amount: 499,   currency: 'EUR', autoRenew: false },
  { id: 's8',  memberId: 'm8',  memberName: 'Antonio Ricci',    memberEmail: 'antonio@email.it',   planId: 'p1', planName: 'Base Mensile',    status: 'Cancelled', startDate: '2025-12-01', endDate: '2026-06-01', nextBillingDate: null,         amount: 39.90, currency: 'EUR', autoRenew: false },
  { id: 's9',  memberId: 'm9',  memberName: 'Valentina Greco',  memberEmail: 'vale@email.it',      planId: 'p2', planName: 'Premium Mensile', status: 'Active',    startDate: '2026-05-01', endDate: null,         nextBillingDate: '2026-07-28', amount: 59.90, currency: 'EUR', autoRenew: true  },
  { id: 's10', memberId: 'm10', memberName: 'Roberto Martini',  memberEmail: 'roberto@email.it',   planId: 'p3', planName: 'Annuale Top',     status: 'Active',    startDate: '2026-01-20', endDate: '2027-01-20', nextBillingDate: '2027-01-20', amount: 499,   currency: 'EUR', autoRenew: true  },
]

const MRR_TREND = [
  { mese: 'Gen', mrr: 6120 }, { mese: 'Feb', mrr: 6480 }, { mese: 'Mar', mrr: 6900 },
  { mese: 'Apr', mrr: 7200 }, { mese: 'Mag', mrr: 7560 }, { mese: 'Giu', mrr: 7740 },
]
const CHURN_TREND = [
  { mese: 'Gen', nuovi: 8, disdette: 3 }, { mese: 'Feb', nuovi: 11, disdette: 2 },
  { mese: 'Mar', nuovi: 9,  disdette: 4 }, { mese: 'Apr', nuovi: 14, disdette: 1 },
  { mese: 'Mag', nuovi: 12, disdette: 3 }, { mese: 'Giu', nuovi: 7,  disdette: 2 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const INTERVAL_LABEL: Record<string, string> = {
  Monthly: 'Mensile', Quarterly: 'Trimestrale', Yearly: 'Annuale',
}
const SUB_STATUS: Record<string, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'slate' }> = {
  Active:    { label: 'Attivo',     tone: 'green' },
  Trial:     { label: 'In prova',   tone: 'blue'  },
  Paused:    { label: 'Sospeso',    tone: 'amber' },
  Cancelled: { label: 'Disdetto',   tone: 'red'   },
  Expired:   { label: 'Scaduto',    tone: 'slate' },
}
const PLAN_COLORS = ['from-violet-500 to-purple-600', 'from-brand-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-orange-400 to-amber-500', 'from-pink-500 to-rose-500', 'from-slate-400 to-slate-500']

const EMPTY_PLAN = { name: '', priceAmount: '49.90', billingInterval: 'Monthly', trialDays: '0', description: '', features: '' }

function fmt(n: number) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) }
function daysUntil(d: string) { return Math.floor((new Date(d).getTime() - Date.now()) / 86_400_000) }

// ── Component ──────────────────────────────────────────────────────────────────
export default function Plans() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'piani' | 'sottoscrizioni' | 'scadenze'>('piani')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_PLAN })
  const [formError, setFormError] = useState<string | null>(null)
  const [subFilter, setSubFilter] = useState('')
  const [searchSub, setSearchSub] = useState('')

  const { data: plansData, isError: plansError } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<PlanDto[]>('/api/v1/plans'),
    retry: false,
  })
  const { data: subsData, isError: subsError } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get<SubscriptionDto[]>('/api/v1/subscriptions'),
    retry: false,
    enabled: tab === 'sottoscrizioni' || tab === 'scadenze',
  })

  const plans: PlanDto[] = plansData?.data ?? DEMO_PLANS
  const subs: SubscriptionDto[] = subsData?.data ?? DEMO_SUBS

  const createPlan = useMutation({
    mutationFn: () => api.post<PlanDto>('/api/v1/plans', {
      name: form.name,
      priceAmount: Number(form.priceAmount),
      billingInterval: form.billingInterval,
      trialDays: Number(form.trialDays),
      description: form.description || null,
      features: form.features ? form.features.split('\n').map(f => f.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      setForm({ ...EMPTY_PLAN })
      setFormError(null)
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['plans'] })
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Errore'),
  })

  // ── KPIs ──
  const activePlans = plans.filter(p => p.isActive)
  const totalMrr = plans.reduce((s, p) => s + (p.mrr ?? 0), 0)
  const totalSoci = plans.reduce((s, p) => s + (p.memberCount ?? 0), 0)
  const activeSubs = subs.filter(s => s.status === 'Active').length
  const trialSubs  = subs.filter(s => s.status === 'Trial').length
  const expiring30 = subs.filter(s => s.endDate && daysUntil(s.endDate) >= 0 && daysUntil(s.endDate) <= 30).length

  const filteredSubs = subs.filter(s => {
    const matchStatus = !subFilter || s.status === subFilter
    const matchSearch = !searchSub || s.memberName.toLowerCase().includes(searchSub.toLowerCase()) || s.memberEmail.toLowerCase().includes(searchSub.toLowerCase())
    return matchStatus && matchSearch
  })

  const expiringSubs = subs
    .filter(s => s.endDate && daysUntil(s.endDate) >= 0 && daysUntil(s.endDate) <= 60)
    .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Abbonamenti</h1>
          <p className="mt-0.5 text-sm text-slate-500">Piani, sottoscrizioni e rinnovi</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          {showForm ? '✕ Annulla' : '+ Nuovo piano'}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'MRR',           value: fmt(totalMrr),     sub: 'entrate mensili ricorrenti', color: 'text-brand-600' },
          { label: 'ARR stimato',   value: fmt(totalMrr * 12), sub: 'proiezione annua',           color: 'text-violet-600' },
          { label: 'Soci attivi',   value: activeSubs.toString(), sub: 'sottoscrizioni attive',  color: 'text-emerald-600' },
          { label: 'In prova',      value: trialSubs.toString(),  sub: 'free trial in corso',    color: 'text-blue-600' },
          { label: 'Scadono 30gg',  value: expiring30.toString(), sub: 'da contattare',          color: expiring30 > 0 ? 'text-amber-600' : 'text-slate-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Grafico MRR mini */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Andamento MRR (6 mesi)</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={MRR_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: number) => [`€${v.toLocaleString('it-IT')}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="#7c3aed" fill="url(#mrrGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Nuovi vs Disdette</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={CHURN_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="nuovi"    name="Nuovi"    fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="disdette" name="Disdette" fill="#f87171" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form nuovo piano */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">Crea nuovo piano</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome piano *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="es. Premium Mensile"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cadenza</label>
              <select value={form.billingInterval} onChange={e => setForm(f => ({ ...f, billingInterval: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                <option value="Monthly">Mensile</option>
                <option value="Quarterly">Trimestrale</option>
                <option value="Yearly">Annuale</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Prezzo (€) *</label>
              <input type="number" step="0.01" value={form.priceAmount} onChange={e => setForm(f => ({ ...f, priceAmount: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Giorni di prova gratuita</label>
              <input type="number" value={form.trialDays} onChange={e => setForm(f => ({ ...f, trialDays: e.target.value }))}
                placeholder="0 = nessuna prova"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Descrizione</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Breve descrizione del piano"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Funzionalità incluse (una per riga)</label>
              <textarea rows={3} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                placeholder="Sala pesi&#10;Corsi di gruppo&#10;App AI Coach"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
            </div>
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <div className="mt-4 flex justify-end">
            <button disabled={!form.name || createPlan.isPending} onClick={() => createPlan.mutate()}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
              {createPlan.isPending ? 'Creazione…' : 'Crea piano'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['piani', 'sottoscrizioni', 'scadenze'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'piani' ? `Catalogo piani (${activePlans.length})`
              : t === 'sottoscrizioni' ? `Sottoscrizioni soci (${totalSoci})`
              : `Scadenze imminenti (${expiringSubs.length})`}
          </button>
        ))}
      </div>

      {/* ── PIANI ── */}
      {tab === 'piani' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p, i) => (
            <div key={p.id} className={`relative overflow-hidden rounded-2xl text-white ${!p.isActive ? 'opacity-60 grayscale' : ''}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${PLAN_COLORS[i % PLAN_COLORS.length]}`} />
              <div className="relative p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
                    {p.description && <p className="mt-0.5 text-xs text-white/70">{p.description}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.isActive ? 'bg-white/20' : 'bg-black/20'}`}>
                    {p.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold">€{p.priceAmount.toFixed(2)}</span>
                  <span className="ml-1 text-sm text-white/70">/ {INTERVAL_LABEL[p.billingInterval]?.toLowerCase()}</span>
                </div>
                {p.trialDays > 0 && (
                  <div className="mt-1 text-xs text-white/80">{p.trialDays} giorni prova gratuita</div>
                )}
                <div className="mt-4 space-y-1">
                  {(p.features ?? []).map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-white/90">
                      <span>✓</span>{f}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
                  <div className="text-xs text-white/70">
                    <span className="font-semibold text-white">{p.memberCount ?? 0}</span> soci
                  </div>
                  <div className="text-xs text-white/70">
                    MRR: <span className="font-semibold text-white">{fmt(p.mrr ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SOTTOSCRIZIONI ── */}
      {tab === 'sottoscrizioni' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input value={searchSub} onChange={e => setSearchSub(e.target.value)}
              placeholder="🔍 Cerca socio o email…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="flex gap-1">
              {['', 'Active', 'Trial', 'Paused', 'Cancelled'].map(s => (
                <button key={s} onClick={() => setSubFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${subFilter === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {s === '' ? 'Tutti' : SUB_STATUS[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Socio</th>
                  <th className="px-4 py-3">Piano</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Inizio</th>
                  <th className="px-4 py-3">Scadenza</th>
                  <th className="px-4 py-3">Prossimo rinnovo</th>
                  <th className="px-4 py-3">Importo</th>
                  <th className="px-4 py-3">Rinnovo auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubs.map(s => {
                  const st = SUB_STATUS[s.status] ?? { label: s.status, tone: 'slate' as const }
                  const renewal = s.nextBillingDate ? daysUntil(s.nextBillingDate) : null
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800">{s.memberName}</div>
                        <div className="text-xs text-slate-400">{s.memberEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.planName}</td>
                      <td className="px-4 py-3">
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(s.startDate).toLocaleDateString('it-IT')}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{s.endDate ? new Date(s.endDate).toLocaleDateString('it-IT') : '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {renewal !== null
                          ? <span className={renewal <= 7 ? 'font-semibold text-amber-600' : 'text-slate-500'}>
                              {new Date(s.nextBillingDate!).toLocaleDateString('it-IT')}
                              {renewal <= 30 && <span className="ml-1 text-amber-500">({renewal}gg)</span>}
                            </span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">€{s.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${s.autoRenew ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {s.autoRenew ? '✓ Sì' : '— No'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SCADENZE ── */}
      {tab === 'scadenze' && (
        <div className="space-y-3">
          {expiringSubs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 font-semibold text-slate-700">Nessuna scadenza imminente</p>
              <p className="text-sm text-slate-400">Tutti gli abbonamenti sono in ordine per i prossimi 60 giorni.</p>
            </div>
          ) : expiringSubs.map(s => {
            const days = daysUntil(s.endDate!)
            const urgent = days <= 14
            return (
              <div key={s.id} className={`flex items-center justify-between rounded-xl border p-4 ${urgent ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {days}gg
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{s.memberName}</p>
                    <p className="text-xs text-slate-500">{s.planName} · scade il {new Date(s.endDate!).toLocaleDateString('it-IT')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={urgent ? 'amber' : 'slate'}>{urgent ? 'Urgente' : 'Prossima'}</Badge>
                  <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    ✉ Contatta
                  </button>
                  <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors">
                    Rinnova
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
