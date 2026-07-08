import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ── Types ────────────────────────────────────────────────────────────────────
interface ZkDevice {
  id: string
  serialNumber: string
  name: string
  isEnabled: boolean
  registeredAtUtc: string
}

interface ZkMapping {
  id: string
  zkUserId: string
  memberId: string
  label?: string
  deviceId?: string
  createdAtUtc: string
}

interface MemberBasic {
  id: string
  fullName: string
  email: string
}

interface CheckIn {
  memberId: string
  memberName: string | null
  checkedInAtUtc: string
  checkInType: string
  result: string
  deviceName?: string
}

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_DEVICES: ZkDevice[] = [
  { id: 'd1', serialNumber: 'ZKTK20240001', name: 'Ingresso principale', isEnabled: true,  registeredAtUtc: '2026-01-15' },
  { id: 'd2', serialNumber: 'ZKTK20240002', name: 'Uscita laterale',     isEnabled: true,  registeredAtUtc: '2026-01-15' },
  { id: 'd3', serialNumber: 'ZKTK20240003', name: 'Area locker',         isEnabled: false, registeredAtUtc: '2026-03-10' },
]

const DEMO_MEMBERS: MemberBasic[] = [
  { id: 'm1', fullName: 'Mario Rossi',     email: 'mario.rossi@email.it' },
  { id: 'm2', fullName: 'Luca Ferrari',    email: 'luca.ferrari@email.it' },
  { id: 'm3', fullName: 'Sara Bianchi',    email: 'sara.bianchi@email.it' },
  { id: 'm4', fullName: 'Anna Conti',      email: 'anna.conti@email.it' },
  { id: 'm5', fullName: 'Marco Verdi',     email: 'marco.verdi@email.it' },
]

const DEMO_MAPPINGS: ZkMapping[] = [
  { id: 'mp1', zkUserId: '001', memberId: 'm1', label: 'Dito indice destro',  deviceId: 'd1', createdAtUtc: '2026-01-20' },
  { id: 'mp2', zkUserId: '045', memberId: 'm1', label: 'Badge RFID',          deviceId: 'd2', createdAtUtc: '2026-02-05' },
  { id: 'mp3', zkUserId: '002', memberId: 'm2', label: 'Dito medio destro',   deviceId: 'd1', createdAtUtc: '2026-01-22' },
  { id: 'mp4', zkUserId: '003', memberId: 'm3', label: 'Dito indice sinistro',deviceId: 'd1', createdAtUtc: '2026-01-22' },
  { id: 'mp5', zkUserId: '088', memberId: 'm3', label: 'Dito indice destro',  deviceId: 'd3', createdAtUtc: '2026-03-12' },
  { id: 'mp6', zkUserId: '004', memberId: 'm4', label: 'Dito pollice',        deviceId: 'd1', createdAtUtc: '2026-02-01' },
]

const DEMO_CHECKINS: CheckIn[] = [
  { memberId: 'm1', memberName: 'Mario Rossi',  checkedInAtUtc: '2026-06-30T08:14:00Z', checkInType: 'Biometric', result: 'Allowed', deviceName: 'Ingresso principale' },
  { memberId: 'm3', memberName: 'Sara Bianchi', checkedInAtUtc: '2026-06-30T08:21:00Z', checkInType: 'Biometric', result: 'Allowed', deviceName: 'Ingresso principale' },
  { memberId: 'm2', memberName: 'Luca Ferrari', checkedInAtUtc: '2026-06-30T08:35:00Z', checkInType: 'QrCode',    result: 'Allowed', deviceName: 'Uscita laterale' },
  { memberId: 'm4', memberName: 'Anna Conti',   checkedInAtUtc: '2026-06-30T09:02:00Z', checkInType: 'Biometric', result: 'Denied',  deviceName: 'Ingresso principale' },
  { memberId: 'm5', memberName: 'Marco Verdi',  checkedInAtUtc: '2026-06-30T09:18:00Z', checkInType: 'Biometric', result: 'Allowed', deviceName: 'Ingresso principale' },
  { memberId: 'm1', memberName: 'Mario Rossi',  checkedInAtUtc: '2026-06-30T10:45:00Z', checkInType: 'Biometric', result: 'Allowed', deviceName: 'Uscita laterale' },
  { memberId: 'm3', memberName: 'Sara Bianchi', checkedInAtUtc: '2026-06-30T11:00:00Z', checkInType: 'QrCode',    result: 'Allowed', deviceName: 'Ingresso principale' },
  { memberId: null as any, memberName: null,    checkedInAtUtc: '2026-06-30T11:30:00Z', checkInType: 'Biometric', result: 'Denied',  deviceName: 'Area locker' },
]

const FINGER_LABELS = [
  'Pollice destro', 'Indice destro', 'Medio destro', 'Anulare destro', 'Mignolo destro',
  'Pollice sinistro', 'Indice sinistro', 'Medio sinistro', 'Anulare sinistro', 'Mignolo sinistro',
  'Badge RFID', 'Altro',
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(s: string) {
  return new Date(s).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
]

// ── Add Access Form (per member) ──────────────────────────────────────────────
function AddAccessForm({
  memberId, devices, onDone, onCancel,
}: {
  memberId: string; devices: ZkDevice[]; onDone: () => void; onCancel: () => void
}) {
  const [zkUserId, setZkUserId] = useState('')
  const [label, setLabel] = useState('Indice destro')
  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? '')

  const mutation = useMutation({
    mutationFn: () => api.post('/api/v1/access/zk/mappings', { zkUserId, memberId, label, deviceId }),
    onSuccess: onDone,
    onError: (e: Error) => alert(e.message),
  })

  return (
    <form onSubmit={e => { e.preventDefault(); mutation.mutate() }}
      className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-brand-700">Aggiungi accesso biometrico</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tipo dito / accesso</label>
          <select value={label} onChange={e => setLabel(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
            {FINGER_LABELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Punto di accesso</label>
          <select value={deviceId} onChange={e => setDeviceId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
            {devices.filter(d => d.isEnabled).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">ID dispositivo (assegnato dal lettore)</label>
          <input value={zkUserId} onChange={e => setZkUserId(e.target.value)}
            placeholder="es. 042"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" required />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={mutation.isPending}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
          {mutation.isPending ? 'Salvataggio…' : '+ Aggiungi'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
          Annulla
        </button>
      </div>
    </form>
  )
}

// ── Member Access Row ─────────────────────────────────────────────────────────
function MemberAccessRow({
  member, mappings, devices, colorClass, onAdd, onDelete,
}: {
  member: MemberBasic
  mappings: ZkMapping[]
  devices: ZkDevice[]
  colorClass: string
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const qc = useQueryClient()

  function handleAdded() {
    qc.invalidateQueries({ queryKey: ['zk-mappings'] })
    setAddOpen(false)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(p => !p)}>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${colorClass}`}>
          {initials(member.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{member.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{member.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {mappings.length > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {mappings.length} {mappings.length === 1 ? 'accesso' : 'accessi'}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-400">
              Nessun accesso
            </span>
          )}
          <span className={`text-slate-400 text-xs transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
          {mappings.length === 0 && !addOpen && (
            <p className="text-sm text-slate-400 py-2">Nessun accesso biometrico configurato per questo socio.</p>
          )}
          {mappings.map(mp => {
            const device = devices.find(d => d.id === mp.deviceId)
            return (
              <div key={mp.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-lg">
                  {mp.label?.includes('Badge') ? '🏷️' : mp.label?.includes('Pollice') ? '👍' : '☝️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{mp.label ?? 'Accesso biometrico'}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">
                      {device ? `📍 ${device.name}` : '📍 Dispositivo non trovato'}
                    </span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="font-mono text-xs text-violet-600">ID {mp.zkUserId}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">aggiunto {fmtDate(mp.createdAtUtc)}</span>
                  </div>
                </div>
                <button onClick={() => onDelete(mp.id)}
                  className="rounded-lg border border-red-100 px-2.5 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0">
                  Rimuovi
                </button>
              </div>
            )
          })}

          {addOpen ? (
            <AddAccessForm
              memberId={member.id}
              devices={devices}
              onDone={handleAdded}
              onCancel={() => setAddOpen(false)}
            />
          ) : (
            <button onClick={() => setAddOpen(true)}
              className="mt-1 flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:border-brand-400 transition-colors w-full justify-center">
              + Aggiungi impronta o badge
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Register Device Form ──────────────────────────────────────────────────────
function RegisterDeviceForm({ onDone }: { onDone: () => void }) {
  const [serial, setSerial] = useState('')
  const [name, setName]   = useState('')
  const [open, setOpen]   = useState(false)
  const [apiKey]          = useState(() => crypto.randomUUID().replace(/-/g, ''))

  const mutation = useMutation({
    mutationFn: () => api.post('/api/v1/access/zk/devices', { serialNumber: serial, name, apiKey }),
    onSuccess: () => { onDone(); setSerial(''); setName(''); setOpen(false) },
    onError: (e: Error) => alert(e.message),
  })

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="mb-5 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors w-full justify-center">
        + Aggiungi lettore biometrico
      </button>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); mutation.mutate() }}
      className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-700">Registra nuovo lettore</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Nome del punto di accesso *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="es. Ingresso principale, Area locker…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" required />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Numero seriale dispositivo *</label>
          <input value={serial} onChange={e => setSerial(e.target.value)}
            placeholder="es. ZKTK20240001"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400" required />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={mutation.isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
          {mutation.isPending ? 'Registrazione…' : 'Registra lettore'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
          Annulla
        </button>
      </div>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ZkTeco() {
  const qc = useQueryClient()
  const [tab, setTab]       = useState<'devices' | 'soci' | 'log'>('devices')
  const [search, setSearch] = useState('')

  // Members
  const { data: membersData } = useQuery({
    queryKey: ['members-all'],
    queryFn: () => api.get<MemberBasic[]>('/api/v1/members?pageSize=500'),
    staleTime: 60_000,
  })
  const members: MemberBasic[] = useMemo(() => {
    const remote = membersData?.data ?? []
    return remote.length > 0 ? remote : DEMO_MEMBERS
  }, [membersData])

  // Devices
  const { data: devicesData } = useQuery({
    queryKey: ['zk-devices'],
    queryFn: () => api.get<ZkDevice[]>('/api/v1/access/zk/devices'),
  })
  const devices: ZkDevice[] = useMemo(() => {
    const remote = devicesData?.data ?? []
    return remote.length > 0 ? remote : DEMO_DEVICES
  }, [devicesData])

  // Mappings
  const { data: mappingsData } = useQuery({
    queryKey: ['zk-mappings'],
    queryFn: () => api.get<ZkMapping[]>('/api/v1/access/zk/mappings'),
    enabled: tab === 'soci',
  })
  const mappings: ZkMapping[] = useMemo(() => {
    const remote = mappingsData?.data ?? []
    return remote.length > 0 ? remote : DEMO_MAPPINGS
  }, [mappingsData])

  // Check-ins
  const { data: checkinsData, isLoading: logLoading } = useQuery({
    queryKey: ['biometric-checkins'],
    queryFn: () => api.get<CheckIn[]>('/api/v1/access/checkins?limit=50'),
    enabled: tab === 'log',
    refetchInterval: tab === 'log' ? 10_000 : false,
  })
  const checkins: CheckIn[] = useMemo(() => {
    const remote = checkinsData?.data ?? []
    return remote.length > 0 ? remote : DEMO_CHECKINS
  }, [checkinsData])

  const deleteMapping = useMutation({
    mutationFn: (id: string) => api.del(`/api/v1/access/zk/mappings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zk-mappings'] }),
  })

  const toggleDevice = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      api.put(`/api/v1/access/zk/devices/${id}/enabled`, { isEnabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zk-devices'] }),
  })

  // Stats
  const activeDevices = devices.filter(d => d.isEnabled).length
  const todayCheckins = checkins.filter(c => c.result === 'Allowed').length
  const denied        = checkins.filter(c => c.result === 'Denied').length
  const registered    = mappings.map(m => m.memberId).filter((v, i, a) => a.indexOf(v) === i).length

  // Filtered members for "soci" tab
  const filteredMembers = useMemo(() =>
    members.filter(m =>
      !search || m.fullName.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    )
  , [members, search])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Controllo Accessi Biometrico</h1>
        <p className="mt-0.5 text-sm text-slate-500">Lettori ZKTeco · Impronta digitale e badge RFID</p>
      </div>

      {/* Come funziona — in plain language for staff */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
        <p className="text-sm font-bold text-slate-800 mb-3">Come funziona per i soci</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: '🖐️', title: 'Il socio si avvicina', desc: 'Appoggia il dito (o avvicina il badge) al lettore all\'ingresso' },
            { icon: '✅', title: 'Verifica automatica', desc: 'Oplyfit controlla che l\'abbonamento sia attivo e non scaduto' },
            { icon: '🚪', title: 'Accesso aperto', desc: 'Se tutto è in ordine il tornello o la porta si apre in automatico' },
            { icon: '📋', title: 'Presenza registrata', desc: 'Ogni ingresso viene salvato e conteggiato nelle statistiche' },
          ].map(s => (
            <div key={s.title} className="rounded-xl bg-white/70 p-3 text-center border border-white/80">
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">{s.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 flex items-start gap-2">
          <span className="text-base mt-0.5">💡</span>
          <p className="text-xs text-amber-800">
            <strong>Abbonamento scaduto?</strong> L'accesso viene bloccato automaticamente e il socio riceve un avviso sul telefono.
            Ogni socio può avere <strong>più impronte registrate</strong> (es. dito indice e medio) e accedere da più ingressi.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Lettori attivi',      value: `${activeDevices}/${devices.length}`, icon: '📡', color: activeDevices > 0 ? 'text-emerald-600' : 'text-red-500' },
          { label: 'Ingressi oggi',       value: String(todayCheckins),                icon: '✅', color: 'text-blue-600' },
          { label: 'Accessi negati',      value: String(denied),                       icon: '🚫', color: denied > 0 ? 'text-red-500' : 'text-slate-400' },
          { label: 'Soci registrati',     value: String(registered),                   icon: '👥', color: 'text-violet-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{k.icon}</span>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </div>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          ['devices', '📡 Lettori'],
          ['soci',    '👥 Soci e accessi'],
          ['log',     '📋 Log ingressi'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === key
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LETTORI ── */}
      {tab === 'devices' && (
        <div className="space-y-3">
          <RegisterDeviceForm onDone={() => qc.invalidateQueries({ queryKey: ['zk-devices'] })} />
          {devices.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-14 text-center">
              <p className="text-3xl mb-2">📡</p>
              <p className="font-medium text-slate-500">Nessun lettore configurato</p>
              <p className="text-sm text-slate-400 mt-1">Aggiungi il primo lettore biometrico con il pulsante sopra.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map(d => (
                <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${d.isEnabled ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    📡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{d.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {d.isEnabled ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="font-mono text-xs text-slate-400">{d.serialNumber}</span>
                      <span className="text-xs text-slate-400">Configurato il {fmtDate(d.registeredAtUtc)}</span>
                    </div>
                    {/* Mappings count for this device */}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {mappings.filter(m => m.deviceId === d.id).length} soci abilitati su questo lettore
                    </p>
                  </div>
                  <button
                    onClick={() => toggleDevice.mutate({ id: d.id, isEnabled: !d.isEnabled })}
                    disabled={toggleDevice.isPending}
                    className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      d.isEnabled
                        ? 'border border-red-200 text-red-600 hover:bg-red-50'
                        : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}>
                    {d.isEnabled ? 'Disabilita' : 'Riabilita'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SOCI E ACCESSI ── */}
      {tab === 'soci' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cerca socio…"
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <p className="text-sm text-slate-400">{filteredMembers.length} soci</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
            <span>💡</span>
            <span>Espandi un socio per aggiungere o rimuovere i suoi accessi biometrici. Ogni socio può avere più impronte su più lettori.</span>
          </div>

          <div className="space-y-2">
            {filteredMembers.map((m, i) => (
              <MemberAccessRow
                key={m.id}
                member={m}
                mappings={mappings.filter(mp => mp.memberId === m.id)}
                devices={devices}
                colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                onAdd={() => {}}
                onDelete={(id) => deleteMapping.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── LOG INGRESSI ── */}
      {tab === 'log' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Ultimi 50 accessi · aggiornamento automatico ogni 10 secondi</p>
            <button onClick={() => qc.invalidateQueries({ queryKey: ['biometric-checkins'] })}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              ↻ Aggiorna
            </button>
          </div>

          {logLoading ? (
            <div className="py-14 text-center text-slate-400">Caricamento…</div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 text-left">Data/Ora</th>
                    <th className="px-4 py-3 text-left">Socio</th>
                    <th className="px-4 py-3 text-left">Tipo accesso</th>
                    <th className="px-4 py-3 text-left">Punto di accesso</th>
                    <th className="px-4 py-3 text-left">Esito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {checkins.map((ci, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {fmtTime(ci.checkedInAtUtc)}
                      </td>
                      <td className="px-4 py-3">
                        {ci.memberName ? (
                          <div className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {initials(ci.memberName)}
                            </div>
                            <span className="font-medium text-slate-700">{ci.memberName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Socio non riconosciuto</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ci.checkInType === 'Biometric' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {ci.checkInType === 'Biometric' ? '🖐 Impronta' : '📱 QR Code'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {ci.deviceName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          ci.result === 'Allowed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {ci.result === 'Allowed' ? '✅ Consentito' : '🚫 Negato'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {checkins.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-14 text-center text-slate-400">Nessun accesso registrato.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
