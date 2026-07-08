import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

type StaffRole = 'GymOwner' | 'GymManager' | 'Trainer' | 'Nutritionist' | 'Physiotherapist'

interface PortalUserDto {
  id: string
  email: string
  fullName: string
  role: StaffRole
  phone: string | null
  isActive: boolean
  allowedPages: string[]
  createdAtUtc: string
  lastLoginUtc: string | null
  notes: string | null
}

// ── Page permission map (mirrors DashboardLayout navGroups) ───────────────────

interface PermSection { label: string; icon: string; pages: { to: string; label: string }[] }

const PERM_SECTIONS: PermSection[] = [
  {
    label: 'Dashboard', icon: '🏠',
    pages: [
      { to: '/', label: 'Panoramica' },
      { to: '/kpi', label: 'KPI Avanzati' },
    ],
  },
  {
    label: 'Soci', icon: '👥',
    pages: [
      { to: '/members', label: 'Anagrafiche' },
      { to: '/plans', label: 'Abbonamenti' },
      { to: '/contracts', label: 'Contratti' },
      { to: '/campaigns', label: 'Campagne Email' },
      { to: '/churn', label: 'Churn Predictor' },
    ],
  },
  {
    label: 'Operativo', icon: '📅',
    pages: [
      { to: '/classes', label: 'Classi & Sessioni' },
      { to: '/staff', label: 'Staff' },
      { to: '/zkteco', label: 'Controllo Accessi' },
      { to: '/machines', label: 'Macchinari' },
    ],
  },
  {
    label: 'Amministrazione', icon: '💶',
    pages: [
      { to: '/treasury', label: 'Tesoreria' },
      { to: '/invoices', label: 'Fatture' },
      { to: '/payments', label: 'Pagamenti' },
      { to: '/forecast', label: 'AI Previsioni' },
    ],
  },
  {
    label: 'Salute & Fitness', icon: '💪',
    pages: [
      { to: '/nutrition', label: 'Nutrizione' },
      { to: '/aicoach', label: 'AI Coach' },
      { to: '/workouts', label: 'Schede & Sessioni' },
      { to: '/recovery', label: 'Recovery Score' },
      { to: '/bodyscore', label: 'Body Score' },
      { to: '/healthsync', label: 'Health Sync' },
      { to: '/wellness', label: 'Wellness Hub' },
      { to: '/videos', label: 'Video Esercizi' },
      { to: '/computervision', label: 'Analisi Postura' },
      { to: '/sportspsychology', label: 'Psicologia Sportiva' },
    ],
  },
  {
    label: 'Engagement', icon: '🏆',
    pages: [
      { to: '/gamification', label: 'FitPoints' },
      { to: '/challenges', label: 'Sfide & Loyalty' },
      { to: '/courses', label: 'Corsi & Live' },
      { to: '/referral', label: 'Referral' },
      { to: '/fitchain', label: 'FitChain Wallet' },
    ],
  },
  {
    label: 'Shop & Servizi', icon: '🛍️',
    pages: [
      { to: '/marketplace', label: 'Marketplace' },
      { to: '/servicemarket', label: 'Servizi Premium' },
      { to: '/merch', label: 'Merchandise' },
    ],
  },
  {
    label: 'Report', icon: '📊',
    pages: [
      { to: '/reports', label: 'Report & Export' },
      { to: '/insights', label: 'Premium Insights' },
      { to: '/franchise', label: 'Multi-sede' },
      { to: '/corporate', label: 'Corporate Wellness' },
    ],
  },
  {
    label: 'Impostazioni', icon: '⚙️',
    pages: [
      { to: '/gym', label: 'Palestra' },
      { to: '/whitelabel', label: 'White Label' },
      { to: '/technogym', label: 'Technogym' },
      { to: '/lifefitness', label: 'Life Fitness' },
      { to: '/arvr', label: 'AR/VR Classi' },
      { to: '/localization', label: 'Localizzazione' },
      { to: '/notifications', label: 'Notifiche' },
      { to: '/compliance', label: 'GDPR & Privacy' },
      { to: '/users', label: 'Utenti & Permessi' },
    ],
  },
]

const ALL_PAGES = PERM_SECTIONS.flatMap(s => s.pages.map(p => p.to))

// ── Preset configurations ─────────────────────────────────────────────────────

interface Preset { label: string; pages: string[] }

const PRESETS: Preset[] = [
  {
    label: 'Manager Completo',
    pages: ['/', '/kpi', '/members', '/plans', '/contracts', '/campaigns', '/churn',
      '/classes', '/staff', '/zkteco', '/machines', '/treasury', '/invoices', '/payments',
      '/forecast', '/reports', '/insights'],
  },
  {
    label: 'Solo Classi',
    pages: ['/', '/classes', '/members'],
  },
  {
    label: 'Solo Vendite',
    pages: ['/', '/members', '/plans', '/marketplace', '/payments', '/invoices'],
  },
  {
    label: 'Trainer',
    pages: ['/', '/members', '/classes', '/workouts', '/nutrition', '/aicoach', '/videos'],
  },
  {
    label: 'Reception',
    pages: ['/', '/members', '/classes', '/plans', '/zkteco'],
  },
]

// ── Role options ──────────────────────────────────────────────────────────────

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'GymManager', label: 'Manager' },
  { value: 'Trainer', label: 'Trainer' },
  { value: 'Nutritionist', label: 'Nutrizionista' },
  { value: 'Physiotherapist', label: 'Fisioterapista' },
]

const ROLE_COLOR: Record<StaffRole, string> = {
  GymOwner: 'bg-purple-100 text-purple-700',
  GymManager: 'bg-blue-100 text-blue-700',
  Trainer: 'bg-green-100 text-green-700',
  Nutritionist: 'bg-orange-100 text-orange-700',
  Physiotherapist: 'bg-teal-100 text-teal-700',
}

const ROLE_LABEL: Record<StaffRole, string> = {
  GymOwner: 'Owner',
  GymManager: 'Manager',
  Trainer: 'Trainer',
  Nutritionist: 'Nutrizionista',
  Physiotherapist: 'Fisioterapista',
}

// ── Permission grid component ─────────────────────────────────────────────────

function PermissionGrid({
  selected,
  onChange,
}: {
  selected: Set<string>
  onChange: (s: Set<string>) => void
}) {
  function togglePage(to: string) {
    const next = new Set(selected)
    next.has(to) ? next.delete(to) : next.add(to)
    onChange(next)
  }

  function toggleSection(section: PermSection) {
    const paths = section.pages.map(p => p.to)
    const allSelected = paths.every(p => selected.has(p))
    const next = new Set(selected)
    if (allSelected) paths.forEach(p => next.delete(p))
    else paths.forEach(p => next.add(p))
    onChange(next)
  }

  function applyPreset(preset: Preset) {
    onChange(new Set(preset.pages))
  }

  return (
    <div>
      {/* Presets */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Preset rapidi</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange(new Set(ALL_PAGES))}
            className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition"
          >
            Tutto
          </button>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
          >
            Nessuno
          </button>
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
        {PERM_SECTIONS.map(section => {
          const paths = section.pages.map(p => p.to)
          const allSel = paths.every(p => selected.has(p))
          const someSel = paths.some(p => selected.has(p))
          return (
            <div key={section.label} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  allSel ? 'bg-brand-50 text-brand-700' : someSel ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
                }`}
              >
                <span>{section.icon} {section.label}</span>
                <span className="text-xs normal-case font-normal opacity-70">
                  {paths.filter(p => selected.has(p)).length}/{paths.length}
                </span>
              </button>
              <div className="grid grid-cols-2 gap-1 p-2">
                {section.pages.map(page => (
                  <label
                    key={page.to}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer text-sm transition ${
                      selected.has(page.to)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(page.to)}
                      onChange={() => togglePage(page.to)}
                      className="accent-blue-600"
                    />
                    {page.label}
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── User modal ────────────────────────────────────────────────────────────────

interface UserForm {
  email: string
  fullName: string
  role: StaffRole
  phone: string
  notes: string
  isActive: boolean
  allowedPages: Set<string>
}

function emptyForm(): UserForm {
  return {
    email: '', fullName: '', role: 'GymManager', phone: '',
    notes: '', isActive: true, allowedPages: new Set(),
  }
}

function userToForm(u: PortalUserDto): UserForm {
  return {
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    phone: u.phone ?? '',
    notes: u.notes ?? '',
    isActive: u.isActive,
    allowedPages: new Set(u.allowedPages),
  }
}

function UserModal({
  editing,
  onClose,
  onSave,
}: {
  editing: PortalUserDto | null
  onClose: () => void
  onSave: (form: UserForm) => void
}) {
  const [form, setForm] = useState<UserForm>(() => editing ? userToForm(editing) : emptyForm())
  const [tab, setTab] = useState<'info' | 'perms'>('info')

  function set(key: keyof UserForm, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {editing ? 'Modifica utente' : 'Nuovo utente portale'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(['info', 'perms'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t === 'info' ? '👤 Dati' : '🔒 Permessi'}
            </button>
          ))}
          <div className="ml-auto text-xs text-slate-400 self-center">
            {form.allowedPages.size === 0
              ? 'Nessuna pagina selezionata'
              : form.allowedPages.size === ALL_PAGES.length
                ? 'Accesso completo'
                : `${form.allowedPages.size} pagine`
            }
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'info' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nome completo *</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.fullName}
                    onChange={e => set('fullName', e.target.value)}
                    placeholder="Mario Rossi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="mario@palestra.it"
                    disabled={!!editing}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Ruolo</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.role}
                    onChange={e => set('role', e.target.value as StaffRole)}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Telefono</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+39 340 123 4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Note</label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Eventuali note sull'utente..."
                />
              </div>
              {editing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set('isActive', !form.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {form.isActive ? 'Utente attivo' : 'Utente disattivato'}
                  </span>
                </label>
              )}
            </div>
          ) : (
            <PermissionGrid
              selected={form.allowedPages}
              onChange={s => set('allowedPages', s)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Annulla
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.fullName.trim() || !form.email.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition"
          >
            {editing ? 'Salva modifiche' : 'Crea utente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DEMO_USERS: PortalUserDto[] = [
  {
    id: '1', email: 'manager@crossfit-milano.it', fullName: 'Luca Ferrari',
    role: 'GymManager', phone: '+39 338 111 2233', isActive: true,
    allowedPages: ['/', '/kpi', '/members', '/plans', '/classes', '/staff',
      '/treasury', '/invoices', '/payments', '/reports'],
    createdAtUtc: '2026-03-01T10:00:00Z', lastLoginUtc: '2026-06-29T09:15:00Z', notes: 'Manager principale',
  },
  {
    id: '2', email: 'trainer1@crossfit-milano.it', fullName: 'Sara Moretti',
    role: 'Trainer', phone: '+39 347 555 6677', isActive: true,
    allowedPages: ['/', '/members', '/classes', '/workouts', '/nutrition', '/aicoach', '/videos'],
    createdAtUtc: '2026-04-15T08:00:00Z', lastLoginUtc: '2026-06-28T14:20:00Z', notes: null,
  },
  {
    id: '3', email: 'nutrizionista@crossfit-milano.it', fullName: 'Giulia Bianchi',
    role: 'Nutritionist', phone: null, isActive: false,
    allowedPages: ['/', '/members', '/nutrition', '/bodyscore'],
    createdAtUtc: '2026-05-10T11:00:00Z', lastLoginUtc: null, notes: 'Account temporaneamente sospeso',
  },
]

export default function UserPermissions() {
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['portal-users'],
    queryFn: () => api.get<PortalUserDto[]>('/api/v1/portal-users'),
    placeholderData: { data: DEMO_USERS, meta: undefined },
  })
  const users = data?.data ?? DEMO_USERS

  const [modalUser, setModalUser] = useState<PortalUserDto | null | 'new'>(null)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<PortalUserDto | null>(null)

  const createMut = useMutation({
    mutationFn: (form: UserForm) =>
      api.post('/api/v1/portal-users', {
        email: form.email,
        fullName: form.fullName,
        role: form.role,
        phone: form.phone || null,
        allowedPages: [...form.allowedPages],
        notes: form.notes || null,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portal-users'] }); setModalUser(null) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, form }: { id: string; form: UserForm }) =>
      api.put(`/api/v1/portal-users/${id}`, {
        fullName: form.fullName,
        role: form.role,
        phone: form.phone || null,
        allowedPages: [...form.allowedPages],
        isActive: form.isActive,
        notes: form.notes || null,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portal-users'] }); setModalUser(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/portal-users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portal-users'] }); setConfirmDelete(null) },
  })

  function handleSave(form: UserForm) {
    if (modalUser === 'new') {
      createMut.mutate(form)
    } else if (modalUser) {
      updateMut.mutate({ id: modalUser.id, form })
    }
  }

  const filtered = users.filter(u =>
    !search || u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = users.filter(u => u.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Utenti & Permessi</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestisci gli account del portale e controlla quali sezioni può vedere ogni utente
          </p>
        </div>
        <button
          onClick={() => setModalUser('new')}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          + Nuovo utente
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Utenti totali', value: users.length, icon: '👥' },
          { label: 'Attivi', value: activeCount, icon: '✅' },
          { label: 'Inattivi', value: users.length - activeCount, icon: '⏸️' },
          { label: 'Ruoli diversi', value: new Set(users.map(u => u.role)).size, icon: '🪪' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="text-xl font-bold text-slate-800">{k.value}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <span className="text-lg">ℹ️</span>
        <div>
          <strong>GymOwner</strong> ha sempre accesso completo a tutte le sezioni e non compare in questa lista.
          Gli utenti creati qui hanno accesso limitato alle sole pagine selezionate.
          Se non selezioni nessuna pagina, l'utente non potrà accedere a nessuna sezione.
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Cerca per nome o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Utente</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3 hidden md:table-cell">Pagine</th>
              <th className="px-4 py-3 hidden lg:table-cell">Ultimo accesso</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Nessun utente trovato
                </td>
              </tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700 shrink-0">
                      {u.fullName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{u.fullName}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLOR[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {u.allowedPages.length === 0 ? (
                    <span className="text-xs text-red-500 font-medium">Nessun accesso</span>
                  ) : u.allowedPages.length >= ALL_PAGES.length ? (
                    <span className="text-xs text-green-600 font-medium">Accesso completo</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all"
                          style={{ width: `${(u.allowedPages.length / ALL_PAGES.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{u.allowedPages.length}/{ALL_PAGES.length}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                  {u.lastLoginUtc
                    ? new Date(u.lastLoginUtc).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {u.isActive ? '● Attivo' : '○ Inattivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setModalUser(u)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalUser !== null && (
        <UserModal
          editing={modalUser === 'new' ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Elimina utente</h3>
            <p className="text-sm text-slate-600 mb-5">
              Sei sicuro di voler eliminare <strong>{confirmDelete.fullName}</strong>?
              L'utente perderà immediatamente l'accesso al portale.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Annulla
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                disabled={deleteMut.isPending}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition"
              >
                {deleteMut.isPending ? 'Eliminando…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
