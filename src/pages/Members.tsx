import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge } from '../components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberDto {
  id: string
  email: string
  fullName: string
  phone: string | null
  status: string
  dateOfBirth: string | null
  fiscalCode: string | null
  gender: string
  addressStreet: string | null
  addressCity: string | null
  addressPostalCode: string | null
  addressProvince: string | null
  createdAtUtc: string
  medicalCertExpiry: string | null
}

interface PlanDto { id: string; name: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; tone: 'green' | 'amber' | 'slate' | 'red' }> = {
  Active:    { label: 'Attivo',   tone: 'green' },
  Trialing:  { label: 'In prova', tone: 'amber' },
  Paused:    { label: 'In pausa', tone: 'slate' },
  Cancelled: { label: 'Disdetto', tone: 'red' },
}

function age(dob: string | null): string {
  if (!dob) return '—'
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
  return `${years} anni`
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function RowMenu({ id, name, onDelete }: { id: string; name: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/60 ring-1 ring-slate-900/5">
          <button
            onClick={() => { setOpen(false); navigate(`/members/${id}`) }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400 shrink-0">
              <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
            </svg>
            Apri scheda
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
            Elimina socio
          </button>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-400'
const selectCls = inputCls

// ── Empty form state ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  fullName: '', email: '', phone: '', dateOfBirth: '',
  fiscalCode: '', gender: 'Unspecified',
  addressStreet: '', addressCity: '', addressPostalCode: '', addressProvince: '',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Members() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['members', search],
    queryFn: () => api.get<MemberDto[]>(`/api/v1/members${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    retry: false,
  })
  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<PlanDto[]>('/api/v1/plans'),
    retry: false,
  })

  const deleteMember = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/members/${id}`),
    onSuccess: () => {
      setDeletingId(null)
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const create = useMutation({
    mutationFn: () => api.post<MemberDto>('/api/v1/members', {
      email: form.email,
      fullName: form.fullName,
      phone: form.phone || null,
      dateOfBirth: form.dateOfBirth || null,
      fiscalCode: form.fiscalCode || null,
      gender: form.gender,
      addressStreet: form.addressStreet || null,
      addressCity: form.addressCity || null,
      addressPostalCode: form.addressPostalCode || null,
      addressProvince: form.addressProvince || null,
    }),
    onSuccess: () => {
      setForm({ ...EMPTY_FORM })
      setFormError(null)
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['members'] })
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Errore nella creazione'),
  })

  const set = (patch: Partial<typeof EMPTY_FORM>) => setForm(f => ({ ...f, ...patch }))

  const allMembers = data?.data ?? []
  const members = statusFilter
    ? allMembers.filter(m => m.status === statusFilter)
    : allMembers

  const total = data?.meta?.totalCount ?? allMembers.length
  const active = allMembers.filter(m => m.status === 'Active').length
  const trialing = allMembers.filter(m => m.status === 'Trialing').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Anagrafiche Soci</h1>
          <p className="text-sm text-slate-500">{total} soci registrati · {active} attivi · {trialing} in prova</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm shrink-0"
        >
          {showForm ? '✕ Chiudi' : '+ Nuovo socio'}
        </button>
      </div>

      {/* ── Scheda nuovo socio ── */}
      {showForm && (
        <div className="rounded-xl border border-brand-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-800">Nuovo socio — dati anagrafici completi</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tutti i campi contrassegnati * sono obbligatori</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate() }}
            className="p-6 space-y-5">

            {/* Dati personali */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Dati personali</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
                  <input required className={inputCls} placeholder="Mario Rossi"
                    value={form.fullName} onChange={e => set({ fullName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                  <input required type="email" className={inputCls} placeholder="mario@email.it"
                    value={form.email} onChange={e => set({ email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefono</label>
                  <input className={inputCls} placeholder="+39 333 123 4567"
                    value={form.phone} onChange={e => set({ phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Data di nascita</label>
                  <input type="date" className={inputCls}
                    value={form.dateOfBirth} onChange={e => set({ dateOfBirth: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Codice fiscale</label>
                  <input className={inputCls} placeholder="RSSMRA80A01H501Z"
                    value={form.fiscalCode} onChange={e => set({ fiscalCode: e.target.value.toUpperCase() })}
                    maxLength={16} style={{ fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Genere</label>
                  <select className={selectCls} value={form.gender} onChange={e => set({ gender: e.target.value })}>
                    <option value="Unspecified">Non specificato</option>
                    <option value="Male">Maschio</option>
                    <option value="Female">Femmina</option>
                    <option value="Other">Altro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Indirizzo */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Indirizzo di residenza</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Via e numero civico</label>
                  <input className={inputCls} placeholder="Via Roma, 42"
                    value={form.addressStreet} onChange={e => set({ addressStreet: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Città</label>
                  <input className={inputCls} placeholder="Milano"
                    value={form.addressCity} onChange={e => set({ addressCity: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CAP</label>
                    <input className={inputCls} placeholder="20121" maxLength={5}
                      value={form.addressPostalCode} onChange={e => set({ addressPostalCode: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prov.</label>
                    <input className={inputCls} placeholder="MI" maxLength={2}
                      value={form.addressProvince} onChange={e => set({ addressProvince: e.target.value.toUpperCase() })} />
                  </div>
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={create.isPending}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                {create.isPending ? 'Salvataggio…' : 'Crea socio'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); setFormError(null) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra ricerca + filtri */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput) }} className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              className="rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-64"
              placeholder="Cerca nome, email, codice fiscale…"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); if (!e.target.value) setSearch('') }}
            />
          </div>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput('') }}
              className="text-xs text-slate-400 hover:text-slate-600">✕ Cancella</button>
          )}
        </form>

        <div className="flex flex-wrap gap-1.5">
          {[
            { value: '', label: 'Tutti' },
            { value: 'Active', label: 'Attivi' },
            { value: 'Trialing', label: 'In prova' },
            { value: 'Paused', label: 'In pausa' },
            { value: 'Cancelled', label: 'Disdetti' },
          ].map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === f.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-slate-400">{members.length} risultati</span>
      </div>

      {/* Tabella soci */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Caricamento soci…</div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-sm font-medium text-slate-600">Nessun socio trovato</div>
            <div className="text-xs text-slate-400 mt-1">Aggiungi il primo socio con il pulsante "Nuovo socio"</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 w-8 hidden sm:table-cell">#</th>
                  <th className="px-4 py-3">Socio</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">Telefono</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Codice fiscale</th>
                  <th className="px-4 py-3 hidden md:table-cell">Città</th>
                  <th className="px-4 py-3 hidden md:table-cell">Età</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Iscritto il</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Cert. medico</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((m, i) => {
                  const st = STATUS_MAP[m.status] ?? { label: m.status, tone: 'slate' as const }
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono hidden sm:table-cell">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.fullName} />
                          <div>
                            <Link to={`/members/${m.id}`}
                              className="font-semibold text-slate-800 hover:text-brand-600 hover:underline">
                              {m.fullName}
                            </Link>
                            {m.gender && m.gender !== 'Unspecified' && (
                              <div className="text-xs text-slate-400">{m.gender === 'Male' ? 'M' : m.gender === 'Female' ? 'F' : '—'}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{m.email}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">{m.phone ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden lg:table-cell">
                        {m.fiscalCode
                          ? <span className="rounded bg-slate-100 px-2 py-0.5">{m.fiscalCode}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {m.addressCity
                          ? <>{m.addressCity}{m.addressProvince && <span className="text-slate-400"> ({m.addressProvince})</span>}</>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{age(m.dateOfBirth)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">
                        {new Date(m.createdAtUtc).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {m.medicalCertExpiry
                          ? (() => {
                              const days = Math.floor((new Date(m.medicalCertExpiry).getTime() - Date.now()) / 86_400_000)
                              if (days < 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Scaduto</span>
                              if (days <= 30) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">{days}gg</span>
                              return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600">✓</span>
                            })()
                          : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <RowMenu id={m.id} name={m.fullName} onDelete={() => setDeletingId(m.id)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer info */}
      {members.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Clicca sull'icona occhio per aprire il profilo completo con note CRM, tag, consensi GDPR e fatture.
        </p>
      )}

      {/* Modale conferma eliminazione */}
      {deletingId && (() => {
        const target = members.find(m => m.id === deletingId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 mx-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-500">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-center text-base font-semibold text-slate-900 mb-1">Elimina socio</h3>
              <p className="text-center text-sm text-slate-500 mb-6">
                Stai per eliminare <span className="font-semibold text-slate-700">{target?.fullName}</span>. Questa azione è irreversibile.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Annulla
                </button>
                <button
                  onClick={() => deleteMember.mutate(deletingId)}
                  disabled={deleteMember.isPending}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {deleteMember.isPending ? 'Eliminazione…' : 'Elimina'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
