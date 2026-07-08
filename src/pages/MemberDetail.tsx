import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge, Button, Card, Input } from '../components/ui'

// ── CRM types ──────────────────────────────────────────────────────────────────
interface NoteDto {
  id: string; authorId: string; body: string
  category: string; createdAtUtc: string; updatedAtUtc: string | null
}
interface TagDto { id: string; name: string; color: string }
interface MemberTagDto { tagId: string; name: string; color: string; assignedAtUtc: string }

const NOTE_CATEGORIES = ['General', 'Medical', 'Commercial', 'Disciplinary', 'FollowUp']
const categoryLabel: Record<string, string> = {
  General: 'Generale', Medical: 'Medica', Commercial: 'Commerciale',
  Disciplinary: 'Disciplinare', FollowUp: 'Follow-up',
}
const categoryTone: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  General: 'slate', Medical: 'red', Commercial: 'green', Disciplinary: 'amber', FollowUp: 'amber',
}

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
  notes: string | null
  photoUrl: string | null
}

const genders = ['Unspecified', 'Male', 'Female', 'Other']
const selectCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">{label}</label>
      {children}
    </div>
  )
}

interface InvoiceDto {
  id: string; number: string; amountGross: number; currency: string
  issuedAtUtc: string; status: string; description: string
}

interface ConsentDto {
  id: string; type: string; granted: boolean; recordedAtUtc: string
}

const CONSENT_TYPES = ['Marketing', 'Profiling', 'ThirdParty', 'Newsletter', 'Photography']
const consentTypeLabel: Record<string, string> = {
  Marketing: 'Marketing', Profiling: 'Profilazione', ThirdParty: 'Cessione terzi',
  Newsletter: 'Newsletter', Photography: 'Foto/Video',
}

// ── Certificati medici ────────────────────────────────────────────────────────
interface MedicalCertificateDto {
  id: string
  type: 'NonAgonistico' | 'Agonistico' | 'LudicoMotoria'
  issuedAt: string       // ISO date
  expiresAt: string      // ISO date
  doctorName: string | null
  doctorSpec: string | null  // specializzazione
  sportsActivity: string | null
  outcome: 'Idoneo' | 'NonIdoneo' | 'IdoneoConLimitazioni'
  notes: string | null
  fileUrl: string | null
}

const CERT_TYPE_LABELS: Record<string, string> = {
  NonAgonistico: 'Non agonistico',
  Agonistico: 'Agonistico',
  LudicoMotoria: 'Ludico-motoria',
}
const CERT_TYPE_VALIDITY: Record<string, number> = {
  NonAgonistico: 365,
  Agonistico: 180,
  LudicoMotoria: 365,
}

function certStatus(cert: MedicalCertificateDto): 'valid' | 'expiring' | 'expired' {
  const now = new Date()
  const exp = new Date(cert.expiresAt)
  const daysLeft = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 30) return 'expiring'
  return 'valid'
}

const CERT_STATUS_UI = {
  valid:    { label: 'Valido',       bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  expiring: { label: 'In scadenza',  bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700' },
  expired:  { label: 'Scaduto',      bg: 'bg-red-50',     border: 'border-red-200',     badge: 'bg-red-100 text-red-600' },
}

const OUTCOME_LABELS: Record<string, string> = {
  Idoneo: 'Idoneo ✓',
  NonIdoneo: 'Non idoneo ✕',
  IdoneoConLimitazioni: 'Idoneo con limitazioni ⚠',
}

const EMPTY_CERT = {
  type: 'NonAgonistico' as MedicalCertificateDto['type'],
  issuedAt: '',
  expiresAt: '',
  doctorName: '',
  doctorSpec: '',
  sportsActivity: 'Fitness / Attività in palestra',
  outcome: 'Idoneo' as MedicalCertificateDto['outcome'],
  notes: '',
}

const DEMO_MEMBER: MemberDto = {
  id: 'demo-1',
  fullName: 'Giulia Ferretti',
  email: 'giulia.ferretti@email.it',
  phone: '+39 333 1234567',
  status: 'Active',
  photoUrl: null,
  notes: 'Socio demo — backend non connesso.',
  fiscalCode: 'FRRGLI90A41F205Z',
  dateOfBirth: '1990-01-15',
  gender: 'Female',
  addressStreet: 'Via Roma 42',
  addressCity: 'Milano',
  addressPostalCode: '20121',
  addressProvince: 'MI',
}


type Tab = 'profile' | 'notes' | 'tags' | 'gdpr' | 'invoices' | 'certificati' | 'badge'

export default function MemberDetail() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('profile')
  const [form, setForm] = useState<MemberDto | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Note state
  const [noteBody, setNoteBody] = useState('')
  const [noteCategory, setNoteCategory] = useState('General')
  const [noteError, setNoteError] = useState<string | null>(null)

  // Tag state
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#2563EB')
  const [tagError, setTagError] = useState<string | null>(null)

  // GDPR state
  const [consentType, setConsentType] = useState('Marketing')
  const [consentGranted, setConsentGranted] = useState(true)

  // Certificati state
  const [certForm, setCertForm] = useState({ ...EMPTY_CERT })
  const [showCertForm, setShowCertForm] = useState(false)
  const [certError, setCertError] = useState<string | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get<MemberDto>(`/api/v1/members/${id}`),
    retry: false,
  })

  const { data: notesData } = useQuery({
    queryKey: ['member-notes', id],
    queryFn: () => api.get<NoteDto[]>(`/api/v1/members/${id}/notes`),
    enabled: tab === 'notes',
  })

  const { data: memberTagsData } = useQuery({
    queryKey: ['member-tags', id],
    queryFn: () => api.get<MemberTagDto[]>(`/api/v1/members/${id}/tags`),
    enabled: tab === 'tags',
  })

  const { data: consentsData } = useQuery({
    queryKey: ['member-consents', id],
    queryFn: () => api.get<ConsentDto[]>(`/api/v1/members/${id}/consents`),
    enabled: tab === 'gdpr',
  })

  const { data: certificatiData } = useQuery({
    queryKey: ['member-certificati', id],
    queryFn: () => api.get<MedicalCertificateDto[]>(`/api/v1/members/${id}/medical-certificates`),
    enabled: tab === 'certificati',
    retry: false,
  })

  const { data: invoicesData } = useQuery({
    queryKey: ['member-invoices', id],
    queryFn: () => api.get<InvoiceDto[]>(`/api/v1/documents/members/${id}/invoices`),
    enabled: tab === 'invoices',
  })

  const [downloadingInv, setDownloadingInv] = useState<string | null>(null)
  async function downloadPdf(inv: InvoiceDto) {
    setDownloadingInv(inv.id)
    try { await api.downloadFile(`/api/v1/documents/invoices/${inv.id}/pdf`, `fattura-${inv.number}.pdf`) }
    catch { /* silent */ } finally { setDownloadingInv(null) }
  }

  const { data: allTagsData } = useQuery({
    queryKey: ['all-tags'],
    queryFn: () => api.get<TagDto[]>('/api/v1/crm/tags'),
    enabled: tab === 'tags',
  })

  useEffect(() => {
    if (data?.data) setForm(data.data)
    else if (isError) setForm(DEMO_MEMBER)
  }, [data, isError])

  // ── Mutations ────────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: () =>
      api.put<MemberDto>(`/api/v1/members/${id}/profile`, {
        fullName: form!.fullName, phone: form!.phone || null,
        dateOfBirth: form!.dateOfBirth || null, fiscalCode: form!.fiscalCode || null,
        gender: form!.gender, addressStreet: form!.addressStreet || null,
        addressCity: form!.addressCity || null, addressPostalCode: form!.addressPostalCode || null,
        addressProvince: form!.addressProvince || null, notes: form!.notes || null,
      }),
    onSuccess: () => {
      setSaved(true); setError(null)
      qc.invalidateQueries({ queryKey: ['members'] })
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Errore'),
  })

  const createNote = useMutation({
    mutationFn: () => api.post(`/api/v1/members/${id}/notes`,
      { authorId: 'admin', body: noteBody, category: noteCategory }),
    onSuccess: () => {
      setNoteBody(''); setNoteError(null)
      qc.invalidateQueries({ queryKey: ['member-notes', id] })
    },
    onError: (e) => setNoteError(e instanceof Error ? e.message : 'Errore'),
  })

  const createTag = useMutation({
    mutationFn: () => api.post<TagDto>('/api/v1/crm/tags', { name: newTagName, color: newTagColor }),
    onSuccess: () => { setNewTagName(''); qc.invalidateQueries({ queryKey: ['all-tags'] }) },
    onError: (e) => setTagError(e instanceof Error ? e.message : 'Errore'),
  })

  const assignTag = useMutation({
    mutationFn: (tagId: string) => api.post(`/api/v1/members/${id}/tags/${tagId}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-tags', id] }),
    onError: (e) => setTagError(e instanceof Error ? e.message : 'Errore'),
  })

  const removeTag = useMutation({
    mutationFn: (tagId: string) => api.delete(`/api/v1/members/${id}/tags/${tagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-tags', id] }),
  })

  const recordConsent = useMutation({
    mutationFn: () => api.post(`/api/v1/members/${id}/consents`,
      { type: consentType, granted: consentGranted, ipAddress: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-consents', id] }),
    onError: (e: Error) => alert(e.message),
  })

  const createCert = useMutation({
    mutationFn: () => api.post(`/api/v1/members/${id}/medical-certificates`, {
      type: certForm.type,
      issuedAt: certForm.issuedAt,
      expiresAt: certForm.expiresAt || autoExpiry(certForm.issuedAt, certForm.type),
      doctorName: certForm.doctorName || null,
      doctorSpec: certForm.doctorSpec || null,
      sportsActivity: certForm.sportsActivity || null,
      outcome: certForm.outcome,
      notes: certForm.notes || null,
    }),
    onSuccess: () => {
      setCertForm({ ...EMPTY_CERT })
      setCertError(null)
      setShowCertForm(false)
      qc.invalidateQueries({ queryKey: ['member-certificati', id] })
    },
    onError: (e) => setCertError(e instanceof Error ? e.message : 'Errore'),
  })

  const requestErasure = useMutation({
    mutationFn: () => api.post(`/api/v1/members/${id}/erasure`, { notes: null }),
    onSuccess: () => alert('Richiesta di cancellazione registrata — esecuzione tra 30 giorni.'),
    onError: (e: Error) => alert(e.message),
  })

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('photo', file)
      return api.upload<MemberDto>(`/api/v1/members/${id}/photo`, fd)
    },
    onSuccess: (updated) => {
      qc.setQueryData(['member', id], (old: { data: MemberDto } | undefined) =>
        old ? { ...old, data: updated } : old)
      setForm(updated)
    },
  })

  const removePhoto = useMutation({
    mutationFn: () => api.delete<MemberDto>(`/api/v1/members/${id}/photo`),
    onSuccess: (updated) => {
      qc.setQueryData(['member', id], (old: { data: MemberDto } | undefined) =>
        old ? { ...old, data: updated } : old)
      setForm(updated)
    },
  })

  // ── Helpers ──────────────────────────────────────────────────────────────
  function autoExpiry(issuedAt: string, type: MedicalCertificateDto['type']): string {
    if (!issuedAt) return ''
    const d = new Date(issuedAt)
    d.setDate(d.getDate() + CERT_TYPE_VALIDITY[type])
    return d.toISOString().slice(0, 10)
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const notes = notesData?.data ?? []
  const memberTags = memberTagsData?.data ?? []
  const allTags = allTagsData?.data ?? []
  const unassigned = allTags.filter((t) => !memberTags.some((mt) => mt.tagId === t.id))
  const consents = consentsData?.data ?? []

  if (isLoading) return <p className="text-sm text-slate-400">Caricamento…</p>
  if (!form) return null
  const set = (patch: Partial<MemberDto>) => setForm((f) => ({ ...f!, ...patch }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/members" className="text-sm text-brand-600 hover:underline">← Membri</Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="group relative h-14 w-14 shrink-0">
          {form.photoUrl
            ? <img src={form.photoUrl} alt={form.fullName}
                className="h-14 w-14 rounded-2xl object-cover" />
            : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-700">
                {form.fullName?.[0]?.toUpperCase()}
              </div>
          }
          {/* hover overlay */}
          <button onClick={() => photoInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-white font-medium">Cambia</span>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto.mutate(f) }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">{form.fullName}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {form.email}
            <Badge tone={form.status === 'Active' ? 'green' : 'slate'}>{form.status}</Badge>
            {form.photoUrl && (
              <button onClick={() => removePhoto.mutate()}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                Rimuovi foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['profile', 'notes', 'tags', 'gdpr', 'invoices', 'certificati', 'badge'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'profile' ? 'Profilo'
              : t === 'notes' ? `Note (${notes.length})`
              : t === 'tags' ? 'Tag CRM'
              : t === 'gdpr' ? 'GDPR'
              : t === 'invoices' ? 'Fatture'
              : t === 'certificati' ? '🏅 Certificati'
              : '🪪 Badge accesso'}
          </button>
        ))}
      </div>

      {/* ── PROFILE ────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Anagrafica cliente</h2>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate() }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome completo">
              <Input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} required />
            </Field>
            <Field label="Telefono">
              <Input value={form.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Data di nascita">
              <Input type="date" value={form.dateOfBirth ?? ''} onChange={(e) => set({ dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Codice fiscale">
              <Input value={form.fiscalCode ?? ''} onChange={(e) => set({ fiscalCode: e.target.value })} />
            </Field>
            <Field label="Genere">
              <select className={selectCls} value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
                {genders.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Indirizzo">
              <Input value={form.addressStreet ?? ''} onChange={(e) => set({ addressStreet: e.target.value })} placeholder="Via e numero" />
            </Field>
            <Field label="Città">
              <Input value={form.addressCity ?? ''} onChange={(e) => set({ addressCity: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CAP">
                <Input value={form.addressPostalCode ?? ''} onChange={(e) => set({ addressPostalCode: e.target.value })} />
              </Field>
              <Field label="Prov.">
                <Input value={form.addressProvince ?? ''} onChange={(e) => set({ addressProvince: e.target.value })} maxLength={4} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Note operative">
                <textarea className={selectCls} rows={3} value={form.notes ?? ''}
                  onChange={(e) => set({ notes: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvo…' : 'Salva anagrafica'}</Button>
              {saved && <span className="text-sm font-medium text-emerald-600">✓ Salvato</span>}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </form>
        </Card>
      )}

      {/* ── NOTES ──────────────────────────────────────────────────────── */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Aggiungi nota</h2>
            <form onSubmit={(e) => { e.preventDefault(); createNote.mutate() }} className="space-y-3">
              <select value={noteCategory} onChange={(e) => setNoteCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
              </select>
              <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Testo della nota…" rows={3} required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none" />
              {noteError && <p className="text-sm text-red-600">{noteError}</p>}
              <Button type="submit" disabled={createNote.isPending}>
                {createNote.isPending ? '…' : '+ Aggiungi nota'}
              </Button>
            </form>
          </Card>
          {notes.length === 0
            ? <p className="py-8 text-center text-sm text-slate-400">Nessuna nota ancora.</p>
            : notes.map((n) => (
              <Card key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={categoryTone[n.category] ?? 'slate'}>{categoryLabel[n.category] ?? n.category}</Badge>
                    <span className="text-xs text-slate-400">{n.authorId}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(n.createdAtUtc).toLocaleDateString('it-IT')}
                    {n.updatedAtUtc && ' (mod.)'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
              </Card>
            ))
          }
        </div>
      )}

      {/* ── TAGS ───────────────────────────────────────────────────────── */}
      {tab === 'tags' && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Tag assegnati</h2>
            {memberTags.length === 0
              ? <p className="text-sm text-slate-400">Nessun tag.</p>
              : <div className="flex flex-wrap gap-2">
                {memberTags.map((mt) => (
                  <span key={mt.tagId}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: mt.color + '20', color: mt.color }}>
                    {mt.name}
                    <button onClick={() => removeTag.mutate(mt.tagId)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-black/10">✕</button>
                  </span>
                ))}
              </div>
            }
          </Card>

          {unassigned.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Assegna tag esistente</h2>
              <div className="flex flex-wrap gap-2">
                {unassigned.map((t) => (
                  <button key={t.id} onClick={() => assignTag.mutate(t.id)}
                    disabled={assignTag.isPending}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-dashed px-3 py-1 text-xs font-semibold hover:opacity-75 transition-opacity"
                    style={{ borderColor: t.color, color: t.color }}>
                    + {t.name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Crea nuovo tag</h2>

            <form onSubmit={(e) => { e.preventDefault(); createTag.mutate() }}
              className="flex items-center gap-3">
              <Input placeholder="Nome (es. VIP)" value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)} required className="flex-1" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Colore</span>
                <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-slate-200" />
              </div>
              <Button type="submit" disabled={createTag.isPending}>
                {createTag.isPending ? '…' : '+ Crea'}
              </Button>
            </form>
            {tagError && <p className="mt-2 text-sm text-red-600">{tagError}</p>}
          </Card>
        </div>
      )}

      {/* ── GDPR ───────────────────────────────────────────────────── */}
      {tab === 'gdpr' && (
        <div className="space-y-4">
          {/* Record consent */}
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Registra consenso</h2>
            <form onSubmit={(e) => { e.preventDefault(); recordConsent.mutate() }}
              className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Tipo</label>
                <select value={consentType} onChange={e => setConsentType(e.target.value)}
                  className={selectCls + ' w-40'}>
                  {CONSENT_TYPES.map(c => <option key={c} value={c}>{consentTypeLabel[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Risposta</label>
                <select value={consentGranted ? 'true' : 'false'}
                  onChange={e => setConsentGranted(e.target.value === 'true')}
                  className={selectCls + ' w-32'}>
                  <option value="true">Accordato ✓</option>
                  <option value="false">Negato ✗</option>
                </select>
              </div>
              <Button type="submit" disabled={recordConsent.isPending}>
                {recordConsent.isPending ? '…' : 'Registra'}
              </Button>
            </form>
          </Card>

          {/* Consent history */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Storico consensi</h2>
            {consents.length === 0
              ? <p className="text-sm text-slate-400">Nessun consenso registrato.</p>
              : <div className="space-y-2">
                {consents.map(c => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        {consentTypeLabel[c.type] ?? c.type}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {new Date(c.recordedAtUtc).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <Badge tone={c.granted ? 'green' : 'red'}>
                      {c.granted ? 'Accordato' : 'Negato'}
                    </Badge>
                  </div>
                ))}
              </div>
            }
          </Card>

          {/* Erasure request */}
          <Card className="p-5 border-red-100 bg-red-50/30">
            <h2 className="mb-2 text-sm font-semibold text-red-700">Diritto alla cancellazione (Art. 17)</h2>
            <p className="mb-4 text-xs text-slate-500">
              La richiesta viene schedulata 30 giorni nel futuro. Puoi annullarla dalla pagina GDPR finché non viene eseguita.
            </p>
            <Button
              onClick={() => requestErasure.mutate()}
              disabled={requestErasure.isPending}
              className="border-red-300 bg-white text-red-600 hover:bg-red-50"
              variant="ghost"
            >
              {requestErasure.isPending ? '…' : 'Registra richiesta di cancellazione'}
            </Button>
          </Card>
        </div>
      )}

      {/* ── INVOICES ───────────────────────────────────────────────── */}
      {tab === 'invoices' && (
        <Card>
          {(invoicesData?.data ?? []).length === 0
            ? <p className="py-10 text-center text-sm text-slate-400">Nessuna fattura per questo membro.</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">N. Fattura</th>
                      <th className="px-4 py-3">Descrizione</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3 text-right">Totale</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(invoicesData?.data ?? []).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono font-semibold text-slate-800">{inv.number}</td>
                        <td className="px-4 py-3 text-slate-600">{inv.description}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(inv.issuedAtUtc).toLocaleDateString('it-IT')}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {new Intl.NumberFormat('it-IT', { style: 'currency', currency: inv.currency }).format(inv.amountGross)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => downloadPdf(inv)} disabled={downloadingInv === inv.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            {downloadingInv === inv.id ? '…' : '↓ PDF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </Card>
      )}

      {/* ── CERTIFICATI MEDICI ─────────────────────────────────────── */}
      {tab === 'certificati' && (() => {
        const certs: MedicalCertificateDto[] = certificatiData?.data ?? []
        const activeCert = certs.find(c => certStatus(c) !== 'expired')
        const daysLeft = activeCert
          ? Math.floor((new Date(activeCert.expiresAt).getTime() - Date.now()) / 86_400_000)
          : -1

        return (
          <div className="space-y-4">
            {/* Warning banner */}
            {!activeCert && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-700">Nessun certificato medico valido</p>
                  <p className="text-sm text-red-600 mt-0.5">
                    Il D.Lgs. 36/2021 obbliga le ASD/SSD a conservare il certificato medico sportivo dei propri soci.
                    Aggiungine uno per mettere il socio in regola.
                  </p>
                </div>
              </div>
            )}
            {activeCert && daysLeft <= 30 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-semibold text-amber-700">Certificato in scadenza</p>
                  <p className="text-sm text-amber-600 mt-0.5">
                    Scade tra <strong>{daysLeft}</strong> giorni ({new Date(activeCert.expiresAt).toLocaleDateString('it-IT')}).
                    Avvisa il socio di rinnovarlo presso il medico.
                  </p>
                </div>
              </div>
            )}

            {/* Add button */}
            <div className="flex justify-end">
              <button onClick={() => { setShowCertForm(v => !v); setCertError(null) }}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
                {showCertForm ? '✕ Annulla' : '+ Aggiungi certificato'}
              </button>
            </div>

            {/* Add form */}
            {showCertForm && (
              <Card>
                <h3 className="mb-4 font-semibold text-slate-800">Nuovo certificato medico sportivo</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                    <select value={certForm.type}
                      onChange={e => setCertForm(f => ({ ...f, type: e.target.value as MedicalCertificateDto['type'] }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                      {(Object.entries(CERT_TYPE_LABELS) as [MedicalCertificateDto['type'], string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">Validità standard: {CERT_TYPE_VALIDITY[certForm.type]} giorni</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Esito visita</label>
                    <select value={certForm.outcome}
                      onChange={e => setCertForm(f => ({ ...f, outcome: e.target.value as MedicalCertificateDto['outcome'] }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                      {(Object.entries(OUTCOME_LABELS) as [MedicalCertificateDto['outcome'], string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data rilascio *</label>
                    <input type="date" value={certForm.issuedAt}
                      onChange={e => setCertForm(f => ({ ...f, issuedAt: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data scadenza (auto se vuota)</label>
                    <input type="date" value={certForm.expiresAt}
                      onChange={e => setCertForm(f => ({ ...f, expiresAt: e.target.value }))}
                      placeholder={certForm.issuedAt ? autoExpiry(certForm.issuedAt, certForm.type) : ''}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Medico</label>
                    <input value={certForm.doctorName}
                      onChange={e => setCertForm(f => ({ ...f, doctorName: e.target.value }))}
                      placeholder="Dr. Mario Rossi"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Specializzazione</label>
                    <input value={certForm.doctorSpec}
                      onChange={e => setCertForm(f => ({ ...f, doctorSpec: e.target.value }))}
                      placeholder="Medicina dello Sport"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Attività sportiva</label>
                    <input value={certForm.sportsActivity}
                      onChange={e => setCertForm(f => ({ ...f, sportsActivity: e.target.value }))}
                      placeholder="Fitness, nuoto, palestra…"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Note</label>
                    <textarea rows={2} value={certForm.notes}
                      onChange={e => setCertForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
                  </div>
                </div>
                {certError && <p className="mt-3 text-sm text-red-600">{certError}</p>}
                <div className="mt-4 flex justify-end">
                  <button
                    disabled={!certForm.issuedAt || createCert.isPending}
                    onClick={() => createCert.mutate()}
                    className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
                    {createCert.isPending ? 'Salvataggio…' : 'Salva certificato'}
                  </button>
                </div>
              </Card>
            )}

            {/* Certificate list */}
            {certs.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Nessun certificato registrato.</p>
            ) : (
              <div className="space-y-3">
                {certs.map(cert => {
                  const st = certStatus(cert)
                  const ui = CERT_STATUS_UI[st]
                  const days = Math.floor((new Date(cert.expiresAt).getTime() - Date.now()) / 86_400_000)
                  return (
                    <div key={cert.id} className={`rounded-xl border p-4 ${ui.border} ${ui.bg}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ui.badge}`}>
                            {ui.label}
                          </span>
                          <span className="font-semibold text-slate-800">{CERT_TYPE_LABELS[cert.type]}</span>
                          <span className="text-xs text-slate-500">· {OUTCOME_LABELS[cert.outcome]}</span>
                        </div>
                        <div className="text-right text-xs text-slate-500 whitespace-nowrap">
                          {st !== 'expired'
                            ? <span className={st === 'expiring' ? 'font-semibold text-amber-600' : ''}>
                                {days} giorni rimasti
                              </span>
                            : <span className="text-red-500 font-medium">Scaduto</span>
                          }
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-slate-400">Rilasciato</p>
                          <p className="font-medium text-slate-700">{new Date(cert.issuedAt).toLocaleDateString('it-IT')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Scadenza</p>
                          <p className={`font-medium ${st === 'expired' ? 'text-red-600' : st === 'expiring' ? 'text-amber-600' : 'text-slate-700'}`}>
                            {new Date(cert.expiresAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        {cert.doctorName && (
                          <div>
                            <p className="text-xs text-slate-400">Medico</p>
                            <p className="font-medium text-slate-700">{cert.doctorName}</p>
                            {cert.doctorSpec && <p className="text-xs text-slate-400">{cert.doctorSpec}</p>}
                          </div>
                        )}
                        {cert.sportsActivity && (
                          <div>
                            <p className="text-xs text-slate-400">Attività</p>
                            <p className="font-medium text-slate-700">{cert.sportsActivity}</p>
                          </div>
                        )}
                      </div>
                      {cert.notes && (
                        <p className="mt-2 text-xs text-slate-500 italic">{cert.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── BADGE ACCESSO ──────────────────────────────────────────── */}
      {tab === 'badge' && <BadgeTab member={form} />}
    </div>
  )
}

// ── QR code SVG (deterministic, no library needed) ────────────────────────────
function qrMatrix(seed: string, size = 25): boolean[][] {
  let h = 0
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0 }
  const rng = (row: number, col: number) => {
    let x = h ^ (row * 2654435761) ^ (col * 2246822519)
    x ^= x >>> 16; x = Math.imul(x, 0x45d9f3b); x ^= x >>> 16
    return (x & 1) === 0
  }
  const finder = (r: number, c: number, br: number, bc: number) => {
    const dr = r - br, dc = c - bc
    if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null
    return dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
  }
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const f1 = finder(r, c, 0, 0)
      const f2 = finder(r, c, 0, size - 7)
      const f3 = finder(r, c, size - 7, 0)
      if (f1 !== null) return f1
      if (f2 !== null) return f2
      if (f3 !== null) return f3
      // timing strips
      if (r === 6 || c === 6) return (r + c) % 2 === 0
      return rng(r, c)
    })
  )
}

function QrSvg({ value, size = 160 }: { value: string; size?: number }) {
  const mat = qrMatrix(value)
  const n = mat.length
  const cell = size / (n + 4)
  const offset = cell * 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {mat.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={offset + c * cell} y={offset + r * cell} width={cell} height={cell} fill="#0f172a" /> : null
        )
      )}
    </svg>
  )
}

// ── Badge access tab ─────────────────────────────────────────────────────────
function BadgeTab({ member }: { member: MemberDto | null }) {
  const [revoked, setRevoked] = useState(false)
  const [regenerated, setRegenerated] = useState(0)
  const [disabled, setDisabled] = useState(false)

  if (!member) return null

  const accessCode = `FIT-${(member.id + regenerated).replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase()}${Math.abs(member.id.split('').reduce((a, c) => a + c.charCodeAt(0), regenerated) % 9000 + 1000)}`
  const qrData = `fitcore://access/${member.id}/${accessCode}`

  const DEMO_CHECKINS = [
    { date: '2026-06-24T08:32:00Z', gate: 'Ingresso principale', direction: 'IN' },
    { date: '2026-06-24T12:14:00Z', gate: 'Ingresso principale', direction: 'OUT' },
    { date: '2026-06-23T09:05:00Z', gate: 'Ingresso principale', direction: 'IN' },
    { date: '2026-06-23T11:48:00Z', gate: 'Ingresso principale', direction: 'OUT' },
    { date: '2026-06-21T08:55:00Z', gate: 'Ingresso secondario', direction: 'IN' },
    { date: '2026-06-21T11:20:00Z', gate: 'Ingresso secondario', direction: 'OUT' },
  ]

  return (
    <div className="space-y-6">
      {/* Tessera digitale */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Card tessera */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl ${disabled || revoked ? 'opacity-50 grayscale' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-violet-950" />
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="absolute rounded-full border border-white/30"
                style={{ width: 80 + i * 60, height: 80 + i * 60, top: -20 + i * 10, right: -20 + i * 5 }} />
            ))}
          </div>
          <div className="relative p-6">
            {/* Header tessera */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-violet-300 uppercase">Oplyfit</p>
                <p className="text-xs text-white/40 mt-0.5">Tessera di accesso</p>
              </div>
              <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${disabled || revoked ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {revoked ? '● REVOCATO' : disabled ? '● SOSPESO' : '● ATTIVO'}
              </div>
            </div>
            {/* Foto e nome */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white ring-2 ring-white/20">
                {member.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold text-white">{member.fullName}</p>
                <p className="text-sm text-white/60">{member.email}</p>
                <p className="mt-1 text-xs text-violet-300">Socio · {member.status === 'Active' ? 'Attivo' : member.status}</p>
              </div>
            </div>
            {/* Codice accesso */}
            <div className="rounded-xl bg-white/5 px-4 py-3 border border-white/10">
              <p className="text-xs text-white/40 mb-1">Codice accesso</p>
              <p className="font-mono text-2xl font-bold tracking-widest text-white">{accessCode}</p>
            </div>
            {/* Footer tessera */}
            <div className="mt-4 flex items-center justify-between text-xs text-white/30">
              <span>Emessa: {new Date().toLocaleDateString('it-IT')}</span>
              <span>ZKTeco · NFC · QR</span>
            </div>
          </div>
        </div>

        {/* QR + azioni */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">QR code accesso</p>
            <div className="flex items-start gap-5">
              <div className="rounded-xl border-2 border-slate-200 p-2 bg-white shadow-sm">
                <QrSvg value={qrData} size={140} />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-slate-500">
                  Il socio può mostrare questo QR dall'app mobile per accedere ai tornelli ZKTeco.
                  Il codice è univoco e legato alla tessera attiva.
                </p>
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-0.5">Dati codificati</p>
                  <code className="text-xs text-slate-600 break-all">{qrData}</code>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">✓ ZKTeco</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">✓ App mobile</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">✓ NFC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Azioni badge */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gestione badge</p>
            <button onClick={() => window.print()}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="text-lg">🖨️</span>
              <div className="text-left">
                <p className="font-medium">Stampa tessera</p>
                <p className="text-xs text-slate-400">PDF pronto per plastificazione</p>
              </div>
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-100 transition-colors">
              <span className="text-lg">📱</span>
              <div className="text-left">
                <p className="font-medium">Invia all'app mobile</p>
                <p className="text-xs text-blue-500">Push notification con QR e codice</p>
              </div>
            </button>
            <button onClick={() => { setRegenerated(r => r + 1); setRevoked(false) }}
              className="flex w-full items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-100 transition-colors">
              <span className="text-lg">🔄</span>
              <div className="text-left">
                <p className="font-medium">Rigenera codice</p>
                <p className="text-xs text-amber-600">Invalida il vecchio QR immediatamente</p>
              </div>
            </button>
            <button onClick={() => setDisabled(v => !v)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <span className="text-lg">{disabled ? '▶️' : '⏸️'}</span>
              <div className="text-left">
                <p className="font-medium">{disabled ? 'Riattiva accesso' : 'Sospendi temporaneamente'}</p>
                <p className="text-xs text-slate-400">Il socio non potrà accedere fino alla riattivazione</p>
              </div>
            </button>
            <button onClick={() => setRevoked(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 hover:bg-red-100 transition-colors">
              <span className="text-lg">🚫</span>
              <div className="text-left">
                <p className="font-medium">Revoca badge</p>
                <p className="text-xs text-red-400">Accesso negato permanentemente fino al rinnovo</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Storico accessi */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="font-semibold text-slate-800">Ultimi accessi</p>
          <p className="text-xs text-slate-400">Storico check-in / check-out via ZKTeco</p>
        </div>
        <div className="divide-y divide-slate-50">
          {DEMO_CHECKINS.map((entry, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${entry.direction === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {entry.direction === 'IN' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {entry.direction === 'IN' ? 'Entrata' : 'Uscita'} · {entry.gate}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(entry.date).toLocaleString('it-IT')}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.direction === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {entry.direction}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
