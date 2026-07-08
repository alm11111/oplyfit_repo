import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface PractitionerDto {
  id: string; name: string; role: string; bio: string | null
  avatarUrl: string | null; acceptsTelehealth: boolean
  hourlyRateEur: number | null; isActive: boolean
}
interface AppointmentDto {
  id: string; memberId: string; memberName?: string; practitionerId: string
  practitionerName: string; practitionerRole: string; type: string; status: string
  scheduledAtUtc: string; durationMinutes: number
  memberNotes: string | null; practitionerNotes: string | null; roomUrl: string | null
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_PRACTITIONERS: PractitionerDto[] = [
  { id: 'p1', name: 'Dr.ssa Sara Lombardi', role: 'Physiotherapist', bio: 'Specializzata in riabilitazione sportiva e trattamento delle lesioni muscoloscheletriche.', avatarUrl: null, acceptsTelehealth: true, hourlyRateEur: 80, isActive: true },
  { id: 'p2', name: 'Dr. Marco Venezia', role: 'Nutritionist', bio: 'Biologo nutrizionista con focus su performance sportiva e diete personalizzate.', avatarUrl: null, acceptsTelehealth: true, hourlyRateEur: 65, isActive: true },
  { id: 'p3', name: 'Giulia Marini', role: 'PersonalTrainer', bio: 'PT certificata NASM, specializzata in allenamento funzionale e ricomposizione corporea.', avatarUrl: null, acceptsTelehealth: false, hourlyRateEur: 50, isActive: true },
  { id: 'p4', name: 'Dr.ssa Anna Ferri', role: 'MentalCoach', bio: 'Psicologa dello sport, aiuta gli atleti a gestire pressione e blocchi mentali.', avatarUrl: null, acceptsTelehealth: true, hourlyRateEur: 70, isActive: true },
  { id: 'p5', name: 'Dr. Paolo Rossi', role: 'Physiotherapist', bio: 'Fisioterapista con 15 anni di esperienza in riabilitazione post-operatoria.', avatarUrl: null, acceptsTelehealth: true, hourlyRateEur: 75, isActive: true },
  { id: 'p6', name: 'Federica Conti', role: 'PersonalTrainer', bio: 'Specializzata in powerlifting e allenamento per donne.', avatarUrl: null, acceptsTelehealth: false, hourlyRateEur: 45, isActive: false },
]
const D = (daysAgo: number, h: number, m: number) => {
  const d = new Date('2026-06-24T00:00:00Z'); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d.toISOString()
}
const DEMO_APPOINTMENTS: AppointmentDto[] = [
  { id: 'a1', memberId: 'dm1', memberName: 'Giulia Ferretti', practitionerId: 'p1', practitionerName: 'Dr.ssa Sara Lombardi', practitionerRole: 'Physiotherapist', type: 'Telehealth', status: 'Scheduled', scheduledAtUtc: D(0, 10, 0), durationMinutes: 45, memberNotes: 'Dolore al ginocchio sinistro', practitionerNotes: null, roomUrl: '#' },
  { id: 'a2', memberId: 'dm2', memberName: 'Marco Bianchi', practitionerId: 'p2', practitionerName: 'Dr. Marco Venezia', practitionerRole: 'Nutritionist', type: 'Telehealth', status: 'Confirmed', scheduledAtUtc: D(0, 14, 30), durationMinutes: 60, memberNotes: null, practitionerNotes: 'Revisione piano nutrizionale pre-gara', roomUrl: '#' },
  { id: 'a3', memberId: 'dm3', memberName: 'Alessia Romano', practitionerId: 'p4', practitionerName: 'Dr.ssa Anna Ferri', practitionerRole: 'MentalCoach', type: 'InPerson', status: 'Confirmed', scheduledAtUtc: D(0, 16, 0), durationMinutes: 50, memberNotes: null, practitionerNotes: null, roomUrl: null },
  { id: 'a4', memberId: 'dm4', memberName: 'Roberto Martini', practitionerId: 'p1', practitionerName: 'Dr.ssa Sara Lombardi', practitionerRole: 'Physiotherapist', type: 'InPerson', status: 'Completed', scheduledAtUtc: D(1, 9, 0), durationMinutes: 60, memberNotes: 'Spalla destra', practitionerNotes: 'Protocollo Cyriax eseguito, miglioramento del 40%', roomUrl: null },
  { id: 'a5', memberId: 'dm1', memberName: 'Giulia Ferretti', practitionerId: 'p2', practitionerName: 'Dr. Marco Venezia', practitionerRole: 'Nutritionist', type: 'Telehealth', status: 'Completed', scheduledAtUtc: D(3, 11, 0), durationMinutes: 45, memberNotes: null, practitionerNotes: 'Piano calorico aggiustato a 1800 kcal', roomUrl: '#' },
  { id: 'a6', memberId: 'dm2', memberName: 'Marco Bianchi', practitionerId: 'p5', practitionerName: 'Dr. Paolo Rossi', practitionerRole: 'Physiotherapist', type: 'InPerson', status: 'Completed', scheduledAtUtc: D(5, 10, 30), durationMinutes: 60, memberNotes: null, practitionerNotes: 'Lombalgia risolta. Esercizi di rinforzo prescritti.', roomUrl: null },
  { id: 'a7', memberId: 'dm3', memberName: 'Alessia Romano', practitionerId: 'p3', practitionerName: 'Giulia Marini', practitionerRole: 'PersonalTrainer', type: 'InPerson', status: 'Cancelled', scheduledAtUtc: D(2, 8, 0), durationMinutes: 60, memberNotes: 'Disdetta per malattia', practitionerNotes: null, roomUrl: null },
  { id: 'a8', memberId: 'dm4', memberName: 'Roberto Martini', practitionerId: 'p4', practitionerName: 'Dr.ssa Anna Ferri', practitionerRole: 'MentalCoach', type: 'Telehealth', status: 'NoShow', scheduledAtUtc: D(4, 15, 0), durationMinutes: 50, memberNotes: null, practitionerNotes: 'Non si è presentato', roomUrl: '#' },
  { id: 'a9', memberId: 'dm1', memberName: 'Giulia Ferretti', practitionerId: 'p1', practitionerName: 'Dr.ssa Sara Lombardi', practitionerRole: 'Physiotherapist', type: 'Telehealth', status: 'Scheduled', scheduledAtUtc: D(-3, 10, 0), durationMinutes: 45, memberNotes: null, practitionerNotes: null, roomUrl: '#' },
  { id: 'a10', memberId: 'dm2', memberName: 'Marco Bianchi', practitionerId: 'p2', practitionerName: 'Dr. Marco Venezia', practitionerRole: 'Nutritionist', type: 'InPerson', status: 'Scheduled', scheduledAtUtc: D(-5, 11, 0), durationMinutes: 60, memberNotes: null, practitionerNotes: null, roomUrl: null },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  Physiotherapist: 'Fisioterapista', Nutritionist: 'Nutrizionista',
  PersonalTrainer: 'Personal Trainer', MentalCoach: 'Mental Coach',
}
const ROLE_COLOR: Record<string, string> = {
  Physiotherapist: 'bg-blue-100 text-blue-700', Nutritionist: 'bg-emerald-100 text-emerald-700',
  PersonalTrainer: 'bg-violet-100 text-violet-700', MentalCoach: 'bg-amber-100 text-amber-700',
}
const STATUS_COLOR: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-700', Confirmed: 'bg-green-100 text-green-700',
  Completed: 'bg-slate-100 text-slate-600', Cancelled: 'bg-red-100 text-red-600', NoShow: 'bg-amber-100 text-amber-700',
}
const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-indigo-500']
function Avatar({ name }: { name: string }) {
  const c = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${c}`}>{name[0]}</div>
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Wellness() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'practitioners' | 'appointments' | 'add-practitioner'>('practitioners')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: pracData } = useQuery({ queryKey: ['wellness', 'practitioners'], queryFn: () => api.get<PractitionerDto[]>('/api/v1/wellness/practitioners'), retry: false })
  const { data: apptData } = useQuery({ queryKey: ['wellness', 'appointments'], queryFn: () => api.get<AppointmentDto[]>('/api/v1/wellness/appointments'), retry: false })

  const rawPrac  = (pracData?.data as any)?.data ?? pracData?.data ?? []
  const rawAppts = (apptData?.data as any)?.data ?? apptData?.data ?? []
  const practitioners = (Array.isArray(rawPrac)  && rawPrac.length  > 0 ? rawPrac  : DEMO_PRACTITIONERS) as PractitionerDto[]
  const allAppts      = (Array.isArray(rawAppts) && rawAppts.length > 0 ? rawAppts : DEMO_APPOINTMENTS) as AppointmentDto[]
  const appointments  = statusFilter ? allAppts.filter(a => a.status === statusFilter) : allAppts

  const toggleMutation = useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => api.put(`/api/v1/wellness/practitioners/${id}/toggle`, { active }), onSuccess: () => qc.invalidateQueries({ queryKey: ['wellness', 'practitioners'] }) })
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/api/v1/wellness/appointments/${id}/status`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['wellness', 'appointments'] }) })

  const [form, setForm] = useState({ name: '', role: 'Physiotherapist', bio: '', hourlyRateEur: '', acceptsTelehealth: true })
  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/api/v1/wellness/practitioners', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wellness', 'practitioners'] }); setForm({ name: '', role: 'Physiotherapist', bio: '', hourlyRateEur: '', acceptsTelehealth: true }); setTab('practitioners') },
  })
  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({ name: form.name, role: form.role, bio: form.bio || null, avatarUrl: null, acceptsTelehealth: form.acceptsTelehealth, hourlyRateEur: form.hourlyRateEur ? Number(form.hourlyRateEur) : null })
  }

  // KPI
  const activeProfs = practitioners.filter(p => p.isActive).length
  const telehealthAppts = allAppts.filter(a => a.type === 'Telehealth')
  const thisWeekAppts = allAppts.filter(a => {
    const d = new Date(a.scheduledAtUtc); const now = new Date('2026-06-24'); const diff = (d.getTime() - now.getTime()) / 86400000
    return diff >= -7 && diff <= 7
  })
  const ricavoMese = allAppts.filter(a => a.status === 'Completed').reduce((s, a) => {
    const p = practitioners.find(x => x.id === a.practitionerId)
    return s + (p?.hourlyRateEur ?? 0) * (a.durationMinutes / 60)
  }, 0)
  const todayAppts = allAppts.filter(a => a.scheduledAtUtc.startsWith('2026-06-24'))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wellness Hub</h1>
          <p className="mt-0.5 text-sm text-slate-500">Fisioterapia, nutrizione e sessioni telehealth.</p>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">⚠️ Daily.co stub</div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Professionisti attivi', value: activeProfs, sub: `su ${practitioners.length} totali`, color: 'text-slate-800' },
          { label: 'Appuntamenti (14gg)', value: thisWeekAppts.length, sub: `${todayAppts.length} oggi`, color: 'text-brand-600' },
          { label: '% Telehealth', value: `${allAppts.length ? Math.round(telehealthAppts.length / allAppts.length * 100) : 0}%`, sub: `${telehealthAppts.length} sessioni online`, color: 'text-violet-600' },
          { label: 'Ricavo (completati)', value: `€${ricavoMese.toFixed(0)}`, sub: 'sessioni completate', color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Today's appointments banner */}
      {todayAppts.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">📅 Appuntamenti di oggi ({todayAppts.length})</p>
          <div className="flex flex-wrap gap-2">
            {todayAppts.map(a => (
              <div key={a.id} className="rounded-lg bg-white border border-blue-100 px-3 py-2 text-xs">
                <span className="font-semibold text-slate-700">{new Date(a.scheduledAtUtc).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-slate-500 ml-1">— {a.memberName ?? a.memberId.slice(0, 6)} con {a.practitionerName.split(' ').slice(-1)[0]}</span>
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${a.type === 'Telehealth' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{a.type === 'Telehealth' ? '📹' : '🏥'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([
          ['practitioners', `👥 Professionisti (${practitioners.length})`],
          ['appointments', `📅 Appuntamenti (${allAppts.length})`],
          ['add-practitioner', '+ Aggiungi'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB PRACTITIONERS ── */}
      {tab === 'practitioners' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {practitioners.map(p => (
            <div key={p.id} className={`rounded-xl border bg-white p-5 space-y-3 ${!p.isActive ? 'opacity-55' : ''}`}>
              <div className="flex items-start gap-3">
                <Avatar name={p.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 leading-tight">{p.name}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[p.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ROLE_LABELS[p.role] ?? p.role}
                  </span>
                </div>
                <button onClick={() => toggleMutation.mutate({ id: p.id, active: !p.isActive })}
                  className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-lg ${p.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>
                  {p.isActive ? 'Disattiva' : 'Attiva'}
                </button>
              </div>
              {p.bio && <p className="text-xs text-slate-500 line-clamp-2">{p.bio}</p>}
              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                <span className="text-sm font-bold text-slate-700">{p.hourlyRateEur ? `€${p.hourlyRateEur}/h` : '—'}</span>
                {p.acceptsTelehealth && <span className="text-xs font-medium text-violet-600">📹 Telehealth</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB APPOINTMENTS ── */}
      {tab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'NoShow'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                {s || `Tutti (${allAppts.length})`}
                {s ? ` (${allAppts.filter(a => a.status === s).length})` : ''}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {appointments.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">Nessun appuntamento trovato.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <tr>
                      {['Data / Ora', 'Membro', 'Professionista', 'Tipo', 'Durata', 'Stato', 'Azioni'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {new Date(a.scheduledAtUtc).toLocaleDateString('it-IT')}
                          <span className="ml-1 text-xs text-slate-400">{new Date(a.scheduledAtUtc).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{a.memberName ?? a.memberId.slice(0, 8) + '…'}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">{a.practitionerName}</p>
                          <span className={`text-xs rounded-full px-1.5 py-0.5 ${ROLE_COLOR[a.practitionerRole] ?? 'bg-slate-100 text-slate-500'}`}>{ROLE_LABELS[a.practitionerRole] ?? a.practitionerRole}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.type === 'Telehealth' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                            {a.type === 'Telehealth' ? '📹 Telehealth' : '🏥 Di persona'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{a.durationMinutes} min</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[a.status] ?? 'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {a.status === 'Scheduled' && <button onClick={() => statusMutation.mutate({ id: a.id, status: 'Confirmed' })} className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">Conferma</button>}
                            {['Scheduled', 'Confirmed'].includes(a.status) && <button onClick={() => statusMutation.mutate({ id: a.id, status: 'Completed' })} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">Completa</button>}
                            {!['Cancelled', 'Completed'].includes(a.status) && <button onClick={() => statusMutation.mutate({ id: a.id, status: 'Cancelled' })} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Annulla</button>}
                            {a.roomUrl && a.roomUrl !== '#' && <a href={a.roomUrl} target="_blank" rel="noreferrer" className="rounded px-2 py-1 text-xs bg-violet-600 text-white hover:bg-violet-700">📹</a>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB ADD PRACTITIONER ── */}
      {tab === 'add-practitioner' && (
        <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">Nuovo professionista</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Nome e cognome *</label>
              <input required value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Ruolo *</label>
              <select value={form.role} onChange={e => setForm(s => ({ ...s, role: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Bio</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm(s => ({ ...s, bio: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Tariffa oraria (€)</label>
              <input type="number" min="0" step="0.01" value={form.hourlyRateEur} onChange={e => setForm(s => ({ ...s, hourlyRateEur: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.acceptsTelehealth} onChange={e => setForm(s => ({ ...s, acceptsTelehealth: e.target.checked }))} />
              Accetta sessioni telehealth
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {createMutation.isPending ? 'Salvataggio…' : 'Salva'}
              </button>
              <button type="button" onClick={() => setTab('practitioners')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
