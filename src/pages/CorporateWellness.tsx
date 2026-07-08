import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ── Tipi ─────────────────────────────────────────────────────────────────────

interface CompanySummaryDto {
  id: string; name: string; contactEmail: string | null
  allocatedSeats: number; contractValueEur: number | null
  isActive: boolean; activeEmployees: number; seatUsagePercent: number
}

interface EnrollmentDto {
  id: string; memberId: string; memberName: string; memberEmail: string
  enrolledAtUtc: string; endedAtUtc: string | null; isActive: boolean
}

interface CompanyDto extends CompanySummaryDto {
  vatNumber: string | null; fiscalCode: string | null
  contactPerson: string | null; contactPhone: string | null
  billingAddress: string | null; createdAtUtc: string
  enrollments: EnrollmentDto[]
}

interface MemberSearchItem { id: string; fullName: string; email: string }

// ── helpers ───────────────────────────────────────────────────────────────────

function SeatBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round(used * 100 / total)) : 0
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">{used}/{total}</span>
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function CorporateWellness() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CompanyDto | null>(null)
  const [search, setSearch] = useState('')
  const [enrollSearch, setEnrollSearch] = useState('')
  const [enrollPick, setEnrollPick] = useState<MemberSearchItem | null>(null)

  const { data: listData } = useQuery({
    queryKey: ['cw-companies', search],
    queryFn: () => api.get<{ items: CompanySummaryDto[]; totalCount: number }>(
      `/api/v1/corporate/companies?search=${encodeURIComponent(search)}`),
  })
  const companies = listData?.data?.items ?? []

  const { data: detailData } = useQuery({
    queryKey: ['cw-company', selected],
    queryFn: () => api.get<CompanyDto>(`/api/v1/corporate/companies/${selected}`),
    enabled: !!selected,
  })
  const company = detailData?.data

  const { data: memberSearchData } = useQuery({
    queryKey: ['cw-member-search', enrollSearch],
    queryFn: () => api.get<{ items: MemberSearchItem[] }>(
      `/api/v1/members?search=${encodeURIComponent(enrollSearch)}&pageSize=6`),
    enabled: enrollSearch.length >= 2,
  })
  const memberResults = memberSearchData?.data?.items ?? []

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/api/v1/corporate/companies', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cw-companies'] }); setShowForm(false); setEditing(null) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      api.put(`/api/v1/corporate/companies/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cw-companies'] })
      qc.invalidateQueries({ queryKey: ['cw-company', selected] })
      setShowForm(false); setEditing(null)
    },
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/corporate/companies/${id}/toggle`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cw-companies'] })
      qc.invalidateQueries({ queryKey: ['cw-company', selected] })
    },
  })

  const enrollMut = useMutation({
    mutationFn: ({ companyId, member }: { companyId: string; member: MemberSearchItem }) =>
      api.post(`/api/v1/corporate/companies/${companyId}/employees`, {
        memberId: member.id, memberName: member.fullName, memberEmail: member.email,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cw-company', selected] })
      qc.invalidateQueries({ queryKey: ['cw-companies'] })
      setEnrollSearch(''); setEnrollPick(null)
    },
  })

  const unenrollMut = useMutation({
    mutationFn: ({ companyId, enrollmentId }: { companyId: string; enrollmentId: string }) =>
      api.delete(`/api/v1/corporate/companies/${companyId}/employees/${enrollmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cw-company', selected] })
      qc.invalidateQueries({ queryKey: ['cw-companies'] })
    },
  })

  const [form, setForm] = useState({
    name: '', allocatedSeats: '10', vatNumber: '', fiscalCode: '',
    contactPerson: '', contactEmail: '', contactPhone: '',
    billingAddress: '', contractValueEur: '',
  })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', allocatedSeats: '10', vatNumber: '', fiscalCode: '', contactPerson: '', contactEmail: '', contactPhone: '', billingAddress: '', contractValueEur: '' })
    setShowForm(true)
  }

  function openEdit(c: CompanyDto) {
    setEditing(c)
    setForm({
      name: c.name, allocatedSeats: String(c.allocatedSeats),
      vatNumber: c.vatNumber ?? '', fiscalCode: c.fiscalCode ?? '',
      contactPerson: c.contactPerson ?? '', contactEmail: c.contactEmail ?? '',
      contactPhone: c.contactPhone ?? '', billingAddress: c.billingAddress ?? '',
      contractValueEur: c.contractValueEur != null ? String(c.contractValueEur) : '',
    })
    setShowForm(true)
  }

  function submitForm() {
    const body = {
      name: form.name, allocatedSeats: parseInt(form.allocatedSeats) || 1,
      vatNumber: form.vatNumber || null, fiscalCode: form.fiscalCode || null,
      contactPerson: form.contactPerson || null, contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null, billingAddress: form.billingAddress || null,
      contractValueEur: form.contractValueEur ? parseFloat(form.contractValueEur) : null,
    }
    if (editing) updateMut.mutate({ id: editing.id, body })
    else createMut.mutate(body)
  }

  const mutPending = createMut.isPending || updateMut.isPending

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      {/* Sidebar — lista aziende */}
      <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Corporate Wellness</h1>
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Azienda
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca azienda…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />

        {companies.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            Nessuna azienda ancora
          </div>
        )}

        {companies.map(c => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`rounded-xl border p-4 text-left transition ${
              selected === c.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm font-semibold text-slate-800">{c.name}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {c.isActive ? 'Attiva' : 'Inattiva'}
              </span>
            </div>
            <p className="mb-2 text-xs text-slate-400">{c.contactEmail ?? '—'}</p>
            <SeatBar used={c.activeEmployees} total={c.allocatedSeats} />
            {c.contractValueEur != null && (
              <p className="mt-1.5 text-xs font-medium text-emerald-600">
                € {c.contractValueEur.toLocaleString('it-IT', { minimumFractionDigits: 2 })} / anno
              </p>
            )}
          </button>
        ))}
      </aside>

      {/* Dettaglio azienda */}
      <main className="flex-1 overflow-y-auto">
        {!selected && (
          <div className="flex h-full items-center justify-center text-slate-400">
            <div className="text-center">
              <div className="text-5xl mb-3">🏢</div>
              <p>Seleziona un'azienda o creane una nuova</p>
            </div>
          </div>
        )}

        {selected && company && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
                <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                  {company.vatNumber && <span>P.IVA: {company.vatNumber}</span>}
                  {company.contactEmail && <span>{company.contactEmail}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(company)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  ✏️ Modifica
                </button>
                <button
                  onClick={() => toggleMut.mutate(company.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    company.isActive
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {company.isActive ? 'Disattiva' : 'Riattiva'}
                </button>
              </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-400">Posti allocati</p>
                <p className="text-2xl font-bold text-blue-600">{company.allocatedSeats}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-400">Dipendenti attivi</p>
                <p className="text-2xl font-bold text-emerald-600">{company.activeEmployees}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-400">Utilizzo posti</p>
                <p className="text-2xl font-bold text-slate-800">{company.seatUsagePercent}%</p>
                <SeatBar used={company.activeEmployees} total={company.allocatedSeats} />
              </div>
            </div>

            {/* Iscrivi dipendente */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Iscrivi dipendente</h3>
              <div className="relative">
                <input
                  type="text"
                  value={enrollSearch}
                  onChange={e => { setEnrollSearch(e.target.value); setEnrollPick(null) }}
                  placeholder="Cerca socio per nome o email…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                {memberResults.length > 0 && !enrollPick && enrollSearch.length >= 2 && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {memberResults.map(m => (
                      <li key={m.id}>
                        <button
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                          onClick={() => { setEnrollPick(m); setEnrollSearch(m.fullName) }}
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {m.fullName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{m.fullName}</p>
                            <p className="text-xs text-slate-400">{m.email}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => enrollPick && enrollMut.mutate({ companyId: company.id, member: enrollPick })}
                disabled={!enrollPick || enrollMut.isPending}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {enrollMut.isPending ? 'Iscrizione…' : '+ Iscrivi'}
              </button>
              {enrollMut.isError && (
                <p className="mt-2 text-xs text-red-600">{(enrollMut.error as Error).message}</p>
              )}
            </div>

            {/* Elenco dipendenti */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Dipendenti iscritti ({company.activeEmployees} attivi)
                </h3>
              </div>
              {company.enrollments.filter(e => e.isActive).length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400 text-center">Nessun dipendente iscritto</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="px-5 py-2.5 text-left font-medium">Nome</th>
                      <th className="px-5 py-2.5 text-left font-medium">Email</th>
                      <th className="px-5 py-2.5 text-left font-medium">Iscritto il</th>
                      <th className="px-5 py-2.5 text-left font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.enrollments
                      .filter(e => e.isActive)
                      .map(e => (
                        <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-800">{e.memberName}</td>
                          <td className="px-5 py-3 text-slate-500">{e.memberEmail}</td>
                          <td className="px-5 py-3 text-slate-400">
                            {new Date(e.enrolledAtUtc).toLocaleDateString('it-IT')}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => unenrollMut.mutate({ companyId: company.id, enrollmentId: e.id })}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Rimuovi
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal form crea/modifica */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-bold text-slate-900">
              {editing ? 'Modifica azienda' : 'Nuova azienda corporate'}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-500">Ragione sociale *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Acme S.r.l." className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Posti allocati *</label>
                <input type="number" min={1} value={form.allocatedSeats}
                  onChange={e => setForm(f => ({ ...f, allocatedSeats: e.target.value }))}
                  className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Valore contratto (€/anno)</label>
                <input type="number" value={form.contractValueEur}
                  onChange={e => setForm(f => ({ ...f, contractValueEur: e.target.value }))}
                  placeholder="0.00" className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">P.IVA</label>
                <input value={form.vatNumber} onChange={e => setForm(f => ({ ...f, vatNumber: e.target.value }))}
                  placeholder="IT12345678901" className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Codice Fiscale</label>
                <input value={form.fiscalCode} onChange={e => setForm(f => ({ ...f, fiscalCode: e.target.value }))}
                  className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Referente</label>
                <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                  placeholder="Mario Rossi" className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Email referente</label>
                <input type="email" value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="mario@acme.it" className="field" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Telefono</label>
                <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  className="field" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-500">Indirizzo fatturazione</label>
                <input value={form.billingAddress}
                  onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))}
                  placeholder="Via Roma 1, 20100 Milano MI" className="field" />
              </div>
            </div>

            {(createMut.isError || updateMut.isError) && (
              <p className="mt-3 text-xs text-red-600">
                {((createMut.error ?? updateMut.error) as Error)?.message}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Annulla
              </button>
              <button
                onClick={submitForm}
                disabled={!form.name.trim() || mutPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {mutPending ? 'Salvataggio…' : editing ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.field { width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 14px; outline: none; } .field:focus { border-color: #60a5fa; }`}</style>
    </div>
  )
}
