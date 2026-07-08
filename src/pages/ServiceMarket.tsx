import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface ServiceListingDto {
  id: string; name: string; description: string | null; category: string
  priceEur: number; durationMinutes: number; maxCapacity: number | null
  imageUrl: string | null; isActive: boolean
}
interface ServiceBookingDto {
  id: string; memberId: string; serviceListingId: string; serviceName: string
  serviceCategory: string; status: string; scheduledAtUtc: string | null
  amountEur: number; memberNotes: string | null; createdAtUtc: string
}

// ── Demo data ─────────────────────────────────────────────────────────────────
function dAgo(n: number, h = 10) { const d = new Date('2026-06-25'); d.setDate(d.getDate() - n); d.setHours(h); return d.toISOString() }
function dFwd(n: number, h = 10) { const d = new Date('2026-06-25'); d.setDate(d.getDate() + n); d.setHours(h); return d.toISOString() }

const DEMO_SERVICES: ServiceListingDto[] = [
  { id: 's1', name: 'Personal Training 1:1',          description: 'Sessione personalizzata 60 min con istruttore certificato CONI. Programma su misura.',         category: 'PersonalTraining', priceEur: 55,  durationMinutes: 60,  maxCapacity: 1,  imageUrl: null, isActive: true  },
  { id: 's2', name: 'PT Riabilitativo',                description: 'Allenamento guidato per il recupero post-infortunio. Collaborazione con fisioterapista.',       category: 'PersonalTraining', priceEur: 65,  durationMinutes: 60,  maxCapacity: 1,  imageUrl: null, isActive: true  },
  { id: 's3', name: 'Consulenza Nutrizionale',         description: 'Prima visita con nutrizionista sportivo: anamnesi, BIA e piano alimentare personalizzato.',     category: 'Nutrition',        priceEur: 80,  durationMinutes: 60,  maxCapacity: 1,  imageUrl: null, isActive: true  },
  { id: 's4', name: 'Piano Alimentare + Follow-up',    description: 'Piano nutrizionale mensile con 2 visite di controllo e aggiornamento del piano.',               category: 'Nutrition',        priceEur: 150, durationMinutes: 90,  maxCapacity: 1,  imageUrl: null, isActive: true  },
  { id: 's5', name: 'Massaggio Sportivo',              description: 'Massaggio decontratturante e sportivo per recupero muscolare. Durata 50 min.',                 category: 'Massage',          priceEur: 60,  durationMinutes: 50,  maxCapacity: 1,  imageUrl: null, isActive: true  },
  { id: 's6', name: 'Massaggio Rilassante Full Body',  description: 'Massaggio rilassante su tutto il corpo, ideale dopo sessioni intense.',                        category: 'Massage',          priceEur: 55,  durationMinutes: 60,  maxCapacity: 1,  imageUrl: null, isActive: true  },
  { id: 's7', name: 'Fisioterapia Sessione',           description: 'Valutazione e trattamento fisioterapico. Patologie muscolo-scheletriche e posturali.',         category: 'PhysioRehab',      priceEur: 70,  durationMinutes: 45,  maxCapacity: 1,  imageUrl: null, isActive: true  },
  { id: 's8', name: 'Boot Camp di Gruppo',             description: 'Sessione ad alta intensità in piccolo gruppo (max 6). Cardio + forza funzionale.',             category: 'GroupSession',     priceEur: 20,  durationMinutes: 45,  maxCapacity: 6,  imageUrl: null, isActive: false },
]
const DEMO_BOOKINGS: ServiceBookingDto[] = [
  { id: 'b1', memberId: 'dm2', serviceListingId: 's1', serviceName: 'Personal Training 1:1',       serviceCategory: 'PersonalTraining', status: 'Completed',      scheduledAtUtc: dAgo(14, 9),  amountEur: 55,  memberNotes: null,              createdAtUtc: dAgo(16) },
  { id: 'b2', memberId: 'dm1', serviceListingId: 's3', serviceName: 'Consulenza Nutrizionale',     serviceCategory: 'Nutrition',        status: 'Completed',      scheduledAtUtc: dAgo(10, 11), amountEur: 80,  memberNotes: null,              createdAtUtc: dAgo(12) },
  { id: 'b3', memberId: 'dm3', serviceListingId: 's5', serviceName: 'Massaggio Sportivo',          serviceCategory: 'Massage',          status: 'Confirmed',      scheduledAtUtc: dFwd(2, 15),  amountEur: 60,  memberNotes: 'zona lombare',    createdAtUtc: dAgo(5)  },
  { id: 'b4', memberId: 'dm2', serviceListingId: 's1', serviceName: 'Personal Training 1:1',       serviceCategory: 'PersonalTraining', status: 'Confirmed',      scheduledAtUtc: dFwd(1, 10),  amountEur: 55,  memberNotes: null,              createdAtUtc: dAgo(3)  },
  { id: 'b5', memberId: 'dm4', serviceListingId: 's7', serviceName: 'Fisioterapia Sessione',       serviceCategory: 'PhysioRehab',      status: 'PendingPayment', scheduledAtUtc: dFwd(3, 14),  amountEur: 70,  memberNotes: 'dolore al ginocchio', createdAtUtc: dAgo(1) },
  { id: 'b6', memberId: 'dm1', serviceListingId: 's4', serviceName: 'Piano Alimentare + Follow-up',serviceCategory: 'Nutrition',        status: 'Confirmed',      scheduledAtUtc: dFwd(5, 11),  amountEur: 150, memberNotes: null,              createdAtUtc: dAgo(2)  },
  { id: 'b7', memberId: 'dm3', serviceListingId: 's2', serviceName: 'PT Riabilitativo',             serviceCategory: 'PersonalTraining', status: 'PendingPayment', scheduledAtUtc: dFwd(4, 9),   amountEur: 65,  memberNotes: null,              createdAtUtc: dAgo(0)  },
  { id: 'b8', memberId: 'dm2', serviceListingId: 's6', serviceName: 'Massaggio Rilassante Full Body',serviceCategory: 'Massage',        status: 'Cancelled',      scheduledAtUtc: null,          amountEur: 55,  memberNotes: null,              createdAtUtc: dAgo(8)  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  PersonalTraining: 'Personal Training', Nutrition: 'Nutrizione',
  Massage: 'Massaggio', PhysioRehab: 'Fisio & Riabilitazione',
  GroupSession: 'Sessione di gruppo', Other: 'Altro',
}
const CATEGORY_ICON: Record<string, string> = {
  PersonalTraining: '🏋️', Nutrition: '🥗', Massage: '💆',
  PhysioRehab: '🦴', GroupSession: '👥', Other: '⭐',
}
const STATUS_CHIP: Record<string, string> = {
  PendingPayment: 'bg-amber-100 text-amber-700',
  Confirmed:      'bg-emerald-100 text-emerald-700',
  Completed:      'bg-slate-100 text-slate-500',
  Cancelled:      'bg-red-100 text-red-600',
  Refunded:       'bg-violet-100 text-violet-700',
}
const STATUS_IT: Record<string, string> = {
  PendingPayment: 'In attesa', Confirmed: 'Confermata',
  Completed: 'Completata', Cancelled: 'Cancellata', Refunded: 'Rimborsata',
}
const MEMBER_NAMES: Record<string, string> = {
  dm1: 'Giulia Ferretti', dm2: 'Marco Bianchi', dm3: 'Alessia Romano', dm4: 'Roberto Martini',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ServiceMarket() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'catalog' | 'bookings' | 'add'>('catalog')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ name: '', description: '', category: 'PersonalTraining', priceEur: '', durationMinutes: '60', maxCapacity: '' })

  const { data: servicesData } = useQuery({ queryKey: ['svc', 'listings'], queryFn: () => api.get<ServiceListingDto[]>('/api/v1/services'), retry: false })
  const { data: bookingsData } = useQuery({ queryKey: ['svc', 'bookings'], queryFn: () => api.get<ServiceBookingDto[]>('/api/v1/services/bookings'), retry: false })

  const rawServices = (servicesData?.data as any)?.data ?? servicesData?.data ?? []
  const rawBookings = (bookingsData?.data as any)?.data ?? bookingsData?.data ?? []
  const services = (Array.isArray(rawServices) && rawServices.length > 0 ? rawServices : DEMO_SERVICES) as ServiceListingDto[]
  const allBookings = (Array.isArray(rawBookings) && rawBookings.length > 0 ? rawBookings : DEMO_BOOKINGS) as ServiceBookingDto[]
  const bookings = statusFilter ? allBookings.filter(b => b.status === statusFilter) : allBookings

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/api/v1/services', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['svc', 'listings'] }); setForm({ name: '', description: '', category: 'PersonalTraining', priceEur: '', durationMinutes: '60', maxCapacity: '' }); setTab('catalog') },
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: ServiceListingDto }) => api.put(`/api/v1/services/${id}`, { ...s, isActive: !s.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['svc', 'listings'] }),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.put(`/api/v1/services/bookings/${id}/${action}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['svc', 'bookings'] }),
  })

  const incasso = allBookings.filter(b => ['Confirmed','Completed'].includes(b.status)).reduce((s, b) => s + b.amountEur, 0)
  const byCategory = services.reduce<Record<string, ServiceListingDto[]>>((acc, s) => { acc[s.category] = [...(acc[s.category] ?? []), s]; return acc }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servizi Premium</h1>
          <p className="mt-0.5 text-sm text-slate-500">Catalogo servizi a pagamento — PT, nutrizione, massaggi. Pagamenti via Stripe (stub).</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">⚠️ Stripe stub</span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: '📦', label: 'Servizi attivi',    value: services.filter(s => s.isActive).length, sub: `su ${services.length} totali`,                                       color: 'text-slate-800' },
          { icon: '📅', label: 'Prenotazioni tot.', value: allBookings.length,                        sub: `${allBookings.filter(b=>b.status==='Confirmed').length} confermate`, color: 'text-brand-600' },
          { icon: '⏳', label: 'In attesa pag.',    value: allBookings.filter(b=>b.status==='PendingPayment').length, sub: 'da confermare',                                     color: 'text-amber-600' },
          { icon: '💶', label: 'Incasso confermato',value: `€${incasso.toFixed(0)}`,                 sub: 'confermato + completato',                                            color: 'text-emerald-600'},
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xl">{k.icon}</p>
            <p className={`text-xl font-black mt-0.5 ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {(['catalog', 'bookings', 'add'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'catalog' ? `📋 Catalogo (${services.length})` : t === 'bookings' ? `📅 Prenotazioni (${allBookings.length})` : '+ Servizio'}
          </button>
        ))}
      </div>

      {/* ── Catalogo ── */}
      {tab === 'catalog' && (
        <div className="space-y-6">
          {Object.keys(CATEGORY_LABELS).map(cat => {
            const items = byCategory[cat]
            if (!items?.length) return null
            return (
              <div key={cat}>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>{CATEGORY_ICON[cat]}</span> {CATEGORY_LABELS[cat]}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(s => (
                    <div key={s.id} className={`rounded-xl border bg-white p-5 transition ${!s.isActive ? 'opacity-50' : 'border-slate-200 hover:border-brand-200'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 leading-tight">{s.name}</p>
                          {s.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-lg font-black text-brand-600">€{s.priceEur}</p>
                          <p className="text-xs text-slate-400">{s.durationMinutes} min</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {s.maxCapacity && <span className="text-xs text-slate-400">Max {s.maxCapacity} {s.maxCapacity === 1 ? 'posto' : 'posti'}</span>}
                        <button onClick={() => toggleMutation.mutate({ id: s.id, s })}
                          className={`ml-auto text-xs font-medium px-2 py-1 rounded-lg ${s.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                          {s.isActive ? 'Disattiva' : 'Attiva'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {services.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-4xl">📦</p>
              <p className="mt-2 font-semibold text-slate-700">Nessun servizio nel catalogo</p>
              <p className="text-sm text-slate-400">Aggiungi il primo servizio con il tab +.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Prenotazioni ── */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['', 'PendingPayment', 'Confirmed', 'Completed', 'Cancelled'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s === '' ? 'Tutti' : STATUS_IT[s] ?? s}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {bookings.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">Nessuna prenotazione.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    <th className="px-5 py-3">Data</th>
                    <th className="px-4 py-3">Membro</th>
                    <th className="px-4 py-3">Servizio</th>
                    <th className="px-4 py-3">Importo</th>
                    <th className="px-4 py-3">Stato</th>
                    <th className="px-4 py-3">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="text-xs text-slate-500">{new Date(b.createdAtUtc).toLocaleDateString('it-IT')}</p>
                        {b.scheduledAtUtc && (
                          <p className="text-xs font-medium text-brand-600">
                            📅 {new Date(b.scheduledAtUtc).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{MEMBER_NAMES[b.memberId] ?? b.memberId.slice(0,8)+'…'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{b.serviceName}</p>
                        <p className="text-xs text-slate-400">{CATEGORY_ICON[b.serviceCategory]} {CATEGORY_LABELS[b.serviceCategory] ?? b.serviceCategory}</p>
                        {b.memberNotes && <p className="text-xs text-amber-600 mt-0.5">Note: {b.memberNotes}</p>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">€{b.amountEur.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[b.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {STATUS_IT[b.status] ?? b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {b.status === 'PendingPayment' && (
                            <button onClick={() => statusMutation.mutate({ id: b.id, action: 'confirm' })}
                              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">Conferma</button>
                          )}
                          {b.status === 'Confirmed' && (
                            <button onClick={() => statusMutation.mutate({ id: b.id, action: 'complete' })}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">Completa</button>
                          )}
                          {!['Cancelled','Completed','Refunded'].includes(b.status) && (
                            <button onClick={() => statusMutation.mutate({ id: b.id, action: 'cancel' })}
                              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100">Annulla</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Aggiungi servizio ── */}
      {tab === 'add' && (
        <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">Nuovo servizio</h2>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ name: form.name, description: form.description || null, category: form.category, priceEur: Number(form.priceEur), durationMinutes: Number(form.durationMinutes), maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null, imageUrl: null }) }} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Nome *</label>
              <input required value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Categoria *</label>
              <select value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Descrizione</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Prezzo (€) *</label><input required type="number" min="0" step="0.01" value={form.priceEur} onChange={e => setForm(s => ({ ...s, priceEur: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Durata (min)</label><input type="number" min="15" value={form.durationMinutes} onChange={e => setForm(s => ({ ...s, durationMinutes: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-600">Max posti</label><input type="number" min="1" value={form.maxCapacity} onChange={e => setForm(s => ({ ...s, maxCapacity: e.target.value }))} placeholder="∞" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">{createMutation.isPending ? 'Salvataggio…' : 'Salva'}</button>
              <button type="button" onClick={() => setTab('catalog')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
