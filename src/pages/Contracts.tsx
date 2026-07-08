import { Fragment, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, API_BASE_URL } from '../lib/api'
import { Badge } from '../components/ui'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ContractDto {
  id: string
  memberId: string
  memberName: string | null
  memberEmail: string | null
  title: string
  templateType: string | null
  description: string | null
  status: string
  youSignSignatureLink: string | null
  createdAtUtc: string
  expiresAt: string | null
  signedAtUtc: string | null
  sentAtUtc: string | null
  reminderSentAt: string | null
}

interface TemplateDto { id: string; name: string; description: string; icon: string }

// ── Stubs ─────────────────────────────────────────────────────────────────────
const DEMO_CONTRACTS: ContractDto[] = [
  { id: 'c1', memberId: 'm1', memberName: 'Giulia Ferretti',  memberEmail: 'giulia@email.it',    title: 'Contratto iscrizione annuale 2026',   templateType: 'Iscrizione',      description: 'Contratto annuale Premium',          status: 'Signed',           youSignSignatureLink: null, createdAtUtc: '2026-01-14T10:00:00Z', expiresAt: '2027-01-14',       signedAtUtc: '2026-01-15T14:22:00Z', sentAtUtc: '2026-01-14T10:05:00Z', reminderSentAt: null },
  { id: 'c2', memberId: 'm2', memberName: 'Marco Bianchi',    memberEmail: 'marco@email.it',     title: 'Contratto iscrizione mensile',        templateType: 'Iscrizione',      description: 'Abbonamento mensile rinnovabile',    status: 'Signed',           youSignSignatureLink: null, createdAtUtc: '2026-02-28T09:00:00Z', expiresAt: null,               signedAtUtc: '2026-03-01T11:10:00Z', sentAtUtc: '2026-02-28T09:05:00Z', reminderSentAt: null },
  { id: 'c3', memberId: 'm3', memberName: 'Alessia Romano',  memberEmail: 'alessia@email.it',   title: 'Regolamento interno',                 templateType: 'Regolamento',     description: 'Accettazione regolamento palestra',  status: 'Signed',           youSignSignatureLink: null, createdAtUtc: '2026-04-09T15:00:00Z', expiresAt: null,               signedAtUtc: '2026-04-10T09:30:00Z', sentAtUtc: '2026-04-09T15:05:00Z', reminderSentAt: null },
  { id: 'c4', memberId: 'm4', memberName: 'Luca Conti',       memberEmail: 'luca@email.it',      title: 'Contratto iscrizione mensile',        templateType: 'Iscrizione',      description: null,                                 status: 'SentForSignature', youSignSignatureLink: 'https://sign.yousign.com/stub-c4', createdAtUtc: '2026-06-17T10:00:00Z', expiresAt: null, signedAtUtc: null, sentAtUtc: '2026-06-17T10:05:00Z', reminderSentAt: null },
  { id: 'c5', memberId: 'm5', memberName: 'Sara Esposito',   memberEmail: 'sara@email.it',      title: 'Contratto personal trainer',          templateType: 'PersonalTrainer', description: '10 sessioni personal trainer',       status: 'SentForSignature', youSignSignatureLink: 'https://sign.yousign.com/stub-c5', createdAtUtc: '2026-06-20T09:00:00Z', expiresAt: '2026-09-20', signedAtUtc: null, sentAtUtc: '2026-06-20T09:05:00Z', reminderSentAt: '2026-06-22T09:00:00Z' },
  { id: 'c6', memberId: 'm6', memberName: 'Fabio De Luca',   memberEmail: 'fabio@email.it',     title: 'Contratto iscrizione annuale 2025',   templateType: 'Iscrizione',      description: 'Rinnovato 2026',                     status: 'Expired',          youSignSignatureLink: null, createdAtUtc: '2025-02-01T09:00:00Z', expiresAt: '2026-02-01',       signedAtUtc: '2025-02-02T10:00:00Z', sentAtUtc: '2025-02-01T09:05:00Z', reminderSentAt: null },
  { id: 'c7', memberId: 'm7', memberName: 'Chiara Lombardi', memberEmail: 'chiara@email.it',    title: 'Regolamento interno',                 templateType: 'Regolamento',     description: null,                                 status: 'Draft',            youSignSignatureLink: null, createdAtUtc: '2026-06-23T11:00:00Z', expiresAt: null,               signedAtUtc: null, sentAtUtc: null, reminderSentAt: null },
  { id: 'c8', memberId: 'm8', memberName: 'Antonio Ricci',   memberEmail: 'antonio@email.it',   title: 'Contratto iscrizione mensile',        templateType: 'Iscrizione',      description: null,                                 status: 'Cancelled',        youSignSignatureLink: null, createdAtUtc: '2025-11-30T09:00:00Z', expiresAt: '2026-06-01',       signedAtUtc: '2025-12-01T10:00:00Z', sentAtUtc: '2025-11-30T09:05:00Z', reminderSentAt: null },
]

const TEMPLATES: TemplateDto[] = [
  { id: 't1', name: 'Iscrizione Annuale',   description: 'Contratto standard per abbonamento annuale con rinnovo automatico', icon: '📋' },
  { id: 't2', name: 'Iscrizione Mensile',   description: 'Contratto mensile rinnovabile con disdetta 30 giorni', icon: '📅' },
  { id: 't3', name: 'Personal Trainer',     description: 'Pacchetto sessioni PT con obiettivi e calendario', icon: '💪' },
  { id: 't4', name: 'Regolamento Interno',  description: 'Accettazione regolamento palestra e norme comportamentali', icon: '📜' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_UI: Record<string, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'slate'; icon: string }> = {
  Draft:            { label: 'Bozza',       tone: 'slate', icon: '✏️' },
  SentForSignature: { label: 'In firma',    tone: 'blue',  icon: '✉️' },
  Signed:           { label: 'Firmato',     tone: 'green', icon: '✅' },
  Declined:         { label: 'Rifiutato',   tone: 'red',   icon: '❌' },
  Expired:          { label: 'Scaduto',     tone: 'amber', icon: '⏰' },
  Cancelled:        { label: 'Annullato',   tone: 'slate', icon: '🚫' },
}

const TEMPLATE_TYPE_LABEL: Record<string, string> = {
  Iscrizione: 'Iscrizione', PersonalTrainer: 'Personal Trainer', Regolamento: 'Regolamento', Altro: 'Altro',
}

const EMPTY_FORM = { memberId: '', memberName: '', memberEmail: '', title: '', templateType: 't1', description: '', expiresAt: '' }

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700']
  const color = colors[name.charCodeAt(0) % colors.length]
  return <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${color}`}>{initials}</div>
}

function timeline(c: ContractDto) {
  const steps: { label: string; date: string | null; done: boolean }[] = [
    { label: 'Creato',    date: c.createdAtUtc,   done: true },
    { label: 'Inviato',   date: c.sentAtUtc,       done: !!c.sentAtUtc },
    { label: 'Promemoria', date: c.reminderSentAt, done: !!c.reminderSentAt },
    { label: 'Firmato',   date: c.signedAtUtc,     done: !!c.signedAtUtc },
  ]
  return steps
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Contracts() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'list' | 'templates' | 'new'>('list')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState<string | null>(null)
  const [detail, setDetail] = useState<ContractDto | null>(null)
  const [sendFile, setSendFile] = useState<File | null>(null)
  const [sendEmail, setSendEmail] = useState('')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState<string | null>(null)

  const { data, isError } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => api.get<ContractDto[]>('/api/v1/contracts/'),
    retry: false,
  })
  const contracts: ContractDto[] = data?.data ?? DEMO_CONTRACTS

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/v1/contracts/', {
      memberId: form.memberId || 'demo',
      title: form.title,
      description: form.description || null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      pdfBlobUrl: null,
    }),
    onSuccess: () => {
      setForm({ ...EMPTY_FORM })
      setFormError(null)
      setTab('list')
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Errore'),
  })

  const sendMutation = useMutation({
    mutationFn: async ({ id, email, file }: { id: string; email: string; file: File }) => {
      const fd = new FormData()
      fd.append('pdf', file)
      fd.append('signerEmail', email)
      fd.append('signerName', contracts.find(c => c.id === id)?.memberName ?? '')
      return fetch(`${API_BASE_URL}/api/v1/contracts/${id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('fitcore_token')}` },
        body: fd,
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); setSending(null) },
  })

  // ── KPIs ──
  const total    = contracts.length
  const signed   = contracts.filter(c => c.status === 'Signed').length
  const pending  = contracts.filter(c => c.status === 'SentForSignature').length
  const drafts   = contracts.filter(c => c.status === 'Draft').length
  const expired  = contracts.filter(c => c.status === 'Expired').length

  const filtered = contracts.filter(c => {
    const matchStatus = !statusFilter || c.status === statusFilter
    const matchSearch = !search
      || (c.memberName ?? '').toLowerCase().includes(search.toLowerCase())
      || c.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratti Digitali</h1>
          <p className="mt-0.5 text-sm text-slate-500">Firma elettronica via Yousign v3 — stub attivo (Enabled: false)</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">⚠️ Yousign stub</span>
          <button onClick={() => setTab('new')}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
            + Nuovo contratto
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Totale',     value: total,   color: 'text-slate-700'   },
          { label: 'Firmati',    value: signed,  color: 'text-emerald-600' },
          { label: 'In firma',   value: pending, color: 'text-blue-600'    },
          { label: 'Bozze',      value: drafts,  color: 'text-slate-500'   },
          { label: 'Scaduti',    value: expired, color: 'text-amber-600'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-1 text-xs text-slate-400">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['list', 'templates', 'new'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'list' ? `Lista contratti (${total})`
              : t === 'templates' ? 'Template predefiniti'
              : '+ Nuovo contratto'}
          </button>
        ))}
      </div>

      {/* ── LISTA ── */}
      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Cerca socio o titolo…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="flex gap-1 flex-wrap">
              {['', 'Draft', 'SentForSignature', 'Signed', 'Expired', 'Cancelled'].map(s => {
                const ui = STATUS_UI[s]
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {s === '' ? 'Tutti' : ui?.label ?? s}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl">📝</p>
                <p className="mt-2 font-semibold text-slate-700">Nessun contratto trovato</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Socio</th>
                    <th className="px-4 py-3">Contratto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Stato</th>
                    <th className="px-4 py-3">Creato</th>
                    <th className="px-4 py-3">Scadenza</th>
                    <th className="px-4 py-3">Firmato il</th>
                    <th className="px-4 py-3">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(c => {
                    const ui = STATUS_UI[c.status] ?? { label: c.status, tone: 'slate' as const, icon: '•' }
                    return (
                      <Fragment key={c.id}>
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              {c.memberName && <Avatar name={c.memberName} />}
                              <div>
                                <div className="font-medium text-slate-800">{c.memberName ?? <span className="font-mono text-xs text-slate-400">{c.memberId.slice(0,8)}…</span>}</div>
                                {c.memberEmail && <div className="text-xs text-slate-400">{c.memberEmail}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-700">{c.title}</div>
                            {c.description && <div className="text-xs text-slate-400 mt-0.5">{c.description}</div>}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {c.templateType ? TEMPLATE_TYPE_LABEL[c.templateType] ?? c.templateType : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={ui.tone}>{ui.icon} {ui.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.createdAtUtc).toLocaleDateString('it-IT')}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('it-IT') : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {c.signedAtUtc ? new Date(c.signedAtUtc).toLocaleDateString('it-IT') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => setDetail(detail?.id === c.id ? null : c)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                Dettagli
                              </button>
                              {c.status === 'Draft' && (
                                <button onClick={() => setSending(sending === c.id ? null : c.id)}
                                  className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                                  ✉ Invia
                                </button>
                              )}
                              {c.status === 'SentForSignature' && !c.reminderSentAt && (
                                <button className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors">
                                  🔔 Sollecita
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Pannello invio firma inline */}
                        {sending === c.id && (
                          <tr>
                            <td colSpan={8} className="px-5 py-3 bg-blue-50">
                              <div className="flex flex-wrap items-end gap-3">
                                <div>
                                  <label className="text-xs font-medium text-slate-500">Email firmatario</label>
                                  <input value={sendEmail} onChange={e => setSendEmail(e.target.value)}
                                    placeholder={c.memberEmail ?? 'email@esempio.it'}
                                    className="mt-1 block rounded-lg border border-slate-200 px-3 py-1.5 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-brand-200" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-slate-500">PDF contratto</label>
                                  <input type="file" accept=".pdf" onChange={e => setSendFile(e.target.files?.[0] ?? null)}
                                    className="mt-1 block text-xs" />
                                </div>
                                <button
                                  disabled={sendMutation.isPending || !sendEmail || !sendFile}
                                  onClick={() => sendFile && sendMutation.mutate({ id: c.id, email: sendEmail, file: sendFile })}
                                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
                                  {sendMutation.isPending ? 'Invio…' : 'Invia per firma →'}
                                </button>
                                <button onClick={() => setSending(null)} className="text-xs text-slate-400 hover:text-slate-600">Annulla</button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Pannello dettaglio + timeline */}
                        {detail?.id === c.id && (
                          <tr>
                            <td colSpan={8} className="px-5 py-4 bg-slate-50/80">
                              <div className="max-w-lg">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline firma</p>
                                <ol className="relative ml-2 border-l border-slate-200">
                                  {timeline(c).map((step, i) => (
                                    <li key={i} className="mb-3 ml-5">
                                      <div className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                        {step.done && <span className="text-[10px] text-white">✓</span>}
                                      </div>
                                      <p className={`text-xs font-medium ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                                      {step.date && <p className="text-xs text-slate-400">{new Date(step.date).toLocaleString('it-IT')}</p>}
                                    </li>
                                  ))}
                                </ol>
                                {c.youSignSignatureLink && (
                                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                    <p className="text-xs font-medium text-blue-700 mb-1">Link firma Yousign (stub)</p>
                                    <code className="text-xs text-blue-600 break-all">{c.youSignSignatureLink}</code>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TEMPLATE ── */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map(t => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 flex items-start gap-4 hover:border-brand-300 hover:shadow-sm transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-2xl flex-shrink-0">{t.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{t.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>
              </div>
              <button
                onClick={() => { setForm(f => ({ ...f, title: t.name, templateType: t.id })); setTab('new') }}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors flex-shrink-0">
                Usa →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── NUOVO ── */}
      {tab === 'new' && (
        <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-800">Crea nuovo contratto</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome socio *</label>
                <input value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))}
                  placeholder="Giulia Ferretti"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email socio</label>
                <input type="email" value={form.memberEmail} onChange={e => setForm(f => ({ ...f, memberEmail: e.target.value }))}
                  placeholder="giulia@email.it"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo contratto</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setForm(f => ({ ...f, templateType: t.id, title: f.title || t.name }))}
                    className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${form.templateType === t.id
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <span className="mr-1">{t.icon}</span>{t.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Titolo *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="es. Contratto iscrizione annuale 2026"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descrizione</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data scadenza</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3">
              <button disabled={!form.title || createMutation.isPending} onClick={() => createMutation.mutate()}
                className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
                {createMutation.isPending ? 'Creazione…' : 'Crea bozza'}
              </button>
              <button onClick={() => setTab('list')}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
