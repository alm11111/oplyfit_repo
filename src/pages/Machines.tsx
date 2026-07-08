import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button, Input } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface GymMachine {
  id: string; name: string; brand: string; model?: string; category: string
  serialNumber?: string; status: string; location?: string
  maintenanceIntervalDays: number; lastMaintenanceDate?: string; isDueMaintenance: boolean
}
interface MaintenanceAlert {
  machineId: string; machineName: string; brand: string
  lastMaintenanceDate?: string; daysSinceMaintenance: number; intervalDays: number
}
interface MaintenanceRecord {
  id: string; machineId: string; performedAtUtc: string
  type: string; notes?: string; performedBy?: string; costEur?: number
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MACHINES: GymMachine[] = [
  { id: 'm01', name: 'Tapis Roulant TechnoGym', brand: 'Technogym', model: 'Run Artis', category: 'Cardio', serialNumber: 'TG-2022-001', status: 'Attiva', location: 'Sala Cardio A', maintenanceIntervalDays: 90, lastMaintenanceDate: '2026-05-10', isDueMaintenance: false },
  { id: 'm02', name: 'Bike Spinning', brand: 'Life Fitness', model: 'IC7', category: 'Cardio', serialNumber: 'LF-2021-044', status: 'Attiva', location: 'Sala Spinning', maintenanceIntervalDays: 60, lastMaintenanceDate: '2026-03-15', isDueMaintenance: true },
  { id: 'm03', name: 'Ellittica Matrix', brand: 'Matrix', model: 'E50', category: 'Cardio', serialNumber: 'MX-2023-012', status: 'Attiva', location: 'Sala Cardio A', maintenanceIntervalDays: 90, lastMaintenanceDate: '2026-04-20', isDueMaintenance: false },
  { id: 'm04', name: 'Vogatore Concept2', brand: 'Concept2', model: 'Model D', category: 'Cardio', serialNumber: 'C2-2022-007', status: 'Manutenzione', location: 'Sala Cardio B', maintenanceIntervalDays: 120, lastMaintenanceDate: '2026-01-05', isDueMaintenance: true },
  { id: 'm05', name: 'Leg Press Panatta', brand: 'Panatta', model: 'FP150', category: 'Forza', serialNumber: 'PA-2020-033', status: 'Attiva', location: 'Sala Pesi', maintenanceIntervalDays: 180, lastMaintenanceDate: '2026-02-28', isDueMaintenance: false },
  { id: 'm06', name: 'Chest Press Hammer Strength', brand: 'Hammer Strength', model: 'MTS', category: 'Forza', serialNumber: 'HS-2021-019', status: 'Attiva', location: 'Sala Pesi', maintenanceIntervalDays: 180, lastMaintenanceDate: '2026-04-10', isDueMaintenance: false },
  { id: 'm07', name: 'Lat Machine Panatta', brand: 'Panatta', model: 'SP150', category: 'Forza', serialNumber: 'PA-2020-034', status: 'Attiva', location: 'Sala Pesi', maintenanceIntervalDays: 180, lastMaintenanceDate: '2026-03-01', isDueMaintenance: true },
  { id: 'm08', name: 'Cable Machine Life Fitness', brand: 'Life Fitness', model: 'Signature', category: 'Forza', serialNumber: 'LF-2022-055', status: 'Attiva', location: 'Sala Pesi', maintenanceIntervalDays: 120, lastMaintenanceDate: '2026-05-15', isDueMaintenance: false },
  { id: 'm09', name: 'Squat Rack Rogue', brand: 'Rogue', model: 'Monster Rack', category: 'Forza', serialNumber: 'RG-2023-001', status: 'Attiva', location: 'Sala Pesi', maintenanceIntervalDays: 365, lastMaintenanceDate: '2026-01-10', isDueMaintenance: false },
  { id: 'm10', name: 'TRX Zone (4 stazioni)', brand: 'TRX', model: 'PRO4', category: 'Funzionale', serialNumber: 'TRX-2022-004', status: 'Attiva', location: 'Sala Funzionale', maintenanceIntervalDays: 90, lastMaintenanceDate: '2026-06-01', isDueMaintenance: false },
  { id: 'm11', name: 'Kettlebell Rack (5–32 kg)', brand: 'Rogue', model: 'Rack KB', category: 'Funzionale', serialNumber: 'RG-2022-010', status: 'Attiva', location: 'Sala Funzionale', maintenanceIntervalDays: 365, lastMaintenanceDate: '2026-03-20', isDueMaintenance: false },
  { id: 'm12', name: 'Foam Roller Station', brand: 'TriggerPoint', model: 'Grid Pro', category: 'Recupero', serialNumber: 'TP-2023-008', status: 'Attiva', location: 'Area Recupero', maintenanceIntervalDays: 180, lastMaintenanceDate: '2026-04-05', isDueMaintenance: false },
]
const DEMO_ALERTS: MaintenanceAlert[] = [
  { machineId: 'm02', machineName: 'Bike Spinning', brand: 'Life Fitness', lastMaintenanceDate: '2026-03-15', daysSinceMaintenance: 101, intervalDays: 60 },
  { machineId: 'm04', machineName: 'Vogatore Concept2', brand: 'Concept2', lastMaintenanceDate: '2026-01-05', daysSinceMaintenance: 170, intervalDays: 120 },
  { machineId: 'm07', machineName: 'Lat Machine Panatta', brand: 'Panatta', lastMaintenanceDate: '2026-03-01', daysSinceMaintenance: 115, intervalDays: 180 },
]
const DEMO_HISTORY: Record<string, MaintenanceRecord[]> = {
  m02: [
    { id: 'r1', machineId: 'm02', performedAtUtc: '2026-03-15T09:00:00Z', type: 'Ordinaria', notes: 'Lubrificazione catena, controllo frizione', performedBy: 'Tecnico Mario Bozzi', costEur: 95 },
    { id: 'r2', machineId: 'm02', performedAtUtc: '2025-12-10T10:00:00Z', type: 'Riparazione', notes: 'Sostituzione display LCD', performedBy: 'Life Fitness Service', costEur: 280 },
  ],
  m04: [
    { id: 'r3', machineId: 'm04', performedAtUtc: '2026-01-05T08:00:00Z', type: 'Ordinaria', notes: 'Controllo monofiamento, pulizia guidascorri', performedBy: 'Tecnico Mario Bozzi', costEur: 60 },
  ],
  m05: [
    { id: 'r4', machineId: 'm05', performedAtUtc: '2026-02-28T11:00:00Z', type: 'Ordinaria', notes: 'Controllo pesi e bulloni di sicurezza', performedBy: 'Panatta Service', costEur: 120 },
    { id: 'r5', machineId: 'm05', performedAtUtc: '2025-09-12T09:00:00Z', type: 'Ispezione', notes: 'Ispezione annuale', performedBy: 'Panatta Service', costEur: 200 },
  ],
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['Cardio', 'Forza', 'Funzionale', 'Stretching', 'Recupero', 'Altro']
const MAINT_TYPES = ['Ordinaria', 'Riparazione', 'Emergenza', 'Ispezione']
const STATUS_MAP: Record<string, string> = {
  Attiva: 'text-emerald-700 bg-emerald-100', Manutenzione: 'text-orange-700 bg-orange-100', FuoriServizio: 'text-red-700 bg-red-100',
}
const CAT_COLOR: Record<string, string> = {
  Cardio: 'bg-red-100 text-red-700', Forza: 'bg-blue-100 text-blue-700',
  Funzionale: 'bg-violet-100 text-violet-700', Stretching: 'bg-emerald-100 text-emerald-700',
  Recupero: 'bg-amber-100 text-amber-700', Altro: 'bg-slate-100 text-slate-600',
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Machines() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'inventory' | 'alerts' | 'maintenance' | 'stats'>('inventory')
  const [selectedMachine, setSelectedMachine] = useState<GymMachine | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [showMaintForm, setShowMaintForm] = useState(false)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [regForm, setRegForm] = useState({ name: '', brand: '', model: '', category: 'Cardio', serialNumber: '', location: '', maintenanceIntervalDays: 90 })
  const [maintForm, setMaintForm] = useState({ type: 'Ordinaria', notes: '', performedBy: '', costEur: '' })

  const { data: machinesData } = useQuery({ queryKey: ['machines'], queryFn: () => api.get<any>('/api/v1/machines/'), retry: false })
  const { data: alertsData }   = useQuery({ queryKey: ['maintenance-alerts'], queryFn: () => api.get<any>('/api/v1/machines/alerts/maintenance'), enabled: tab === 'alerts', retry: false })
  const { data: historyData }  = useQuery({ queryKey: ['maintenance-history', selectedMachine?.id], queryFn: () => api.get<any>(`/api/v1/machines/${selectedMachine!.id}/maintenance`), enabled: tab === 'maintenance' && !!selectedMachine, retry: false })

  const rawMachines: GymMachine[] = (machinesData?.data as any)?.data ?? []
  const rawAlerts: MaintenanceAlert[] = (alertsData?.data as any)?.data ?? []
  const rawHistory: MaintenanceRecord[] = (historyData?.data as any)?.data ?? []

  const machines = rawMachines.length > 0 ? rawMachines : DEMO_MACHINES
  const alerts   = rawAlerts.length > 0   ? rawAlerts   : DEMO_ALERTS
  const history  = rawHistory.length > 0  ? rawHistory  : (selectedMachine ? (DEMO_HISTORY[selectedMachine.id] ?? []) : [])

  const filteredMachines = useMemo(() => machines.filter(m => {
    const matchCat    = !filterCat || m.category === filterCat
    const matchSearch = !search    || m.name.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [machines, filterCat, search])

  const catStats = useMemo(() => CATEGORIES.map(c => ({ cat: c, count: machines.filter(m => m.category === c).length })).filter(x => x.count > 0), [machines])
  const totalCost = Object.values(DEMO_HISTORY).flat().reduce((s, r) => s + (r.costEur ?? 0), 0)

  const registerMachine = useMutation({ mutationFn: () => api.post('/api/v1/machines/', regForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['machines'] }); setShowRegister(false) } })
  const recordMaintenance = useMutation({
    mutationFn: () => api.post(`/api/v1/machines/${selectedMachine!.id}/maintenance`, { ...maintForm, costEur: maintForm.costEur ? +maintForm.costEur : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['machines'] }); qc.invalidateQueries({ queryKey: ['maintenance-history', selectedMachine?.id] }); qc.invalidateQueries({ queryKey: ['maintenance-alerts'] }); setShowMaintForm(false) },
  })
  const updateStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/api/v1/machines/${id}/status`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['machines'] }) })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestione Macchinari</h1>
          <p className="mt-0.5 text-sm text-slate-500">Inventario, alert manutenzione e storico interventi.</p>
        </div>
        <button onClick={() => setShowRegister(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          + Registra macchinario
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Macchinari totali', value: machines.length, color: 'text-slate-800', sub: `${machines.filter(m => m.status === 'Attiva').length} attivi` },
          { label: 'In manutenzione',   value: machines.filter(m => m.status === 'Manutenzione').length, color: 'text-orange-600', sub: `${machines.filter(m => m.status === 'FuoriServizio').length} fuori servizio` },
          { label: 'Alert scaduti',     value: alerts.length, color: alerts.length > 0 ? 'text-red-600' : 'text-emerald-600', sub: alerts.length === 0 ? '✓ tutto in regola' : 'richiedono intervento' },
          { label: 'Costo manut. YTD',  value: `€${totalCost.toFixed(0)}`, color: 'text-slate-800', sub: 'interventi registrati' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([
          ['inventory',   '🏋️ Inventario'],
          ['alerts',      `⚠️ Alert (${alerts.length})`],
          ['maintenance', '🔧 Manutenzioni'],
          ['stats',       '📊 Statistiche'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Register form */}
      {showRegister && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 max-w-2xl">
          <h3 className="font-semibold text-slate-800">Registra nuovo macchinario</h3>
          <div className="grid grid-cols-2 gap-3">
            {[['name','Nome *'], ['brand','Marca *'], ['model','Modello'], ['serialNumber','N° serie'], ['location','Zona / posizione']].map(([k, label]) => (
              <div key={k} className={k === 'location' ? 'col-span-2' : ''}>
                <label className="mb-1 block text-xs text-slate-500">{label}</label>
                <Input value={(regForm as any)[k]} onChange={e => setRegForm(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs text-slate-500">Categoria</label>
              <select value={regForm.category} onChange={e => setRegForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Intervallo manutenzione (gg)</label>
              <Input type="number" value={regForm.maintenanceIntervalDays} onChange={e => setRegForm(p => ({ ...p, maintenanceIntervalDays: +e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => registerMachine.mutate()} disabled={registerMachine.isPending}>
              {registerMachine.isPending ? 'Salvataggio…' : 'Registra'}
            </Button>
            <Button variant="ghost" onClick={() => setShowRegister(false)}>Annulla</Button>
          </div>
        </div>
      )}

      {/* ── TAB INVENTORY ── */}
      {tab === 'inventory' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca macchinario…"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 w-56" />
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setFilterCat('')}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${!filterCat ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                Tutti ({machines.length})
              </button>
              {catStats.map(c => (
                <button key={c.cat} onClick={() => setFilterCat(filterCat === c.cat ? '' : c.cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${filterCat === c.cat ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                  {c.cat} ({c.count})
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                <tr>
                  {['Macchinario', 'Marca / Modello', 'Categoria', 'Zona', 'Stato', 'Ultima manut.', 'Azioni'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMachines.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {m.name}
                      {m.isDueMaintenance && <span className="ml-2 text-red-500 text-xs">⚠️</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{m.brand}{m.model ? ` ${m.model}` : ''}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CAT_COLOR[m.category] ?? 'bg-slate-100 text-slate-600'}`}>{m.category}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{m.location ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_MAP[m.status] ?? 'bg-slate-100 text-slate-600'}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {m.lastMaintenanceDate ? new Date(m.lastMaintenanceDate).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedMachine(m); setTab('maintenance') }} className="text-xs text-brand-600 hover:underline">Storico</button>
                        <button onClick={() => { setSelectedMachine(m); setShowMaintForm(true) }} className="text-xs text-slate-500 hover:underline">Manut.</button>
                        {m.status !== 'Manutenzione' && (
                          <button onClick={() => updateStatus.mutate({ id: m.id, status: 'Manutenzione' })} className="text-xs text-orange-500 hover:underline">In manut.</button>
                        )}
                        {m.status === 'Manutenzione' && (
                          <button onClick={() => updateStatus.mutate({ id: m.id, status: 'Attiva' })} className="text-xs text-emerald-600 hover:underline">Riattiva</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMachines.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nessun macchinario trovato.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB ALERTS ── */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-700">
              <p className="text-3xl">✅</p>
              <p className="mt-2 font-semibold">Tutti i macchinari sono in regola con la manutenzione.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                ⚠️ <strong>{alerts.length} macchinari</strong> hanno superato l'intervallo di manutenzione programmata.
              </div>
              {alerts.map(a => {
                const overdue = a.daysSinceMaintenance - a.intervalDays
                return (
                  <div key={a.machineId} className="rounded-xl border border-red-200 bg-white p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">{a.machineName} — <span className="text-slate-500 font-normal">{a.brand}</span></p>
                      <p className="text-sm text-red-600 mt-0.5">
                        Ultima manut. {a.daysSinceMaintenance} giorni fa · intervallo {a.intervalDays}gg ·
                        <span className="font-bold"> +{overdue} giorni di ritardo</span>
                      </p>
                    </div>
                    <button onClick={() => { const m = machines.find(x => x.id === a.machineId); if (m) { setSelectedMachine(m); setShowMaintForm(true) } }}
                      className="flex-shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                      Registra intervento
                    </button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* ── TAB MAINTENANCE ── */}
      {tab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Seleziona macchinario</label>
              <select value={selectedMachine?.id ?? ''} onChange={e => setSelectedMachine(machines.find(x => x.id === e.target.value) ?? null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none min-w-[200px]">
                <option value="">— Scegli —</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            {selectedMachine && (
              <button onClick={() => setShowMaintForm(true)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                + Registra intervento
              </button>
            )}
          </div>

          {selectedMachine && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{selectedMachine.name}</p>
                  <p className="text-xs text-slate-400">{selectedMachine.brand} · {selectedMachine.location} · intervallo {selectedMachine.maintenanceIntervalDays}gg</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_MAP[selectedMachine.status] ?? ''}`}>{selectedMachine.status}</span>
              </div>
              {history.length === 0 ? (
                <p className="p-6 text-sm text-slate-400">Nessun intervento registrato per questo macchinario.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                    <tr>
                      {['Data', 'Tipo', 'Tecnico', 'Costo', 'Note'].map(h => <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{new Date(r.performedAtUtc).toLocaleDateString('it-IT')}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{r.type}</span></td>
                        <td className="px-4 py-3 text-slate-500">{r.performedBy ?? '—'}</td>
                        <td className="px-4 py-3 font-medium">{r.costEur != null ? `€${r.costEur.toFixed(0)}` : '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{r.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB STATS ── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-slate-700">Macchinari per categoria</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="cat" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, 'Macchinari']} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-slate-700">Stato parco macchine</p>
              <div className="space-y-3 mt-2">
                {[
                  { label: 'Attivi', count: machines.filter(m => m.status === 'Attiva').length, color: 'bg-emerald-500' },
                  { label: 'In manutenzione', count: machines.filter(m => m.status === 'Manutenzione').length, color: 'bg-orange-500' },
                  { label: 'Fuori servizio', count: machines.filter(m => m.status === 'FuoriServizio').length, color: 'bg-red-500' },
                  { label: 'Alert scaduti', count: alerts.length, color: 'bg-red-400' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="font-semibold text-slate-800">{s.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.count / machines.length) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prossimi interventi programmati */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Prossimi interventi da pianificare</p>
            <div className="space-y-2">
              {machines.filter(m => m.lastMaintenanceDate && !m.isDueMaintenance).slice(0, 5).map(m => {
                const last = new Date(m.lastMaintenanceDate!)
                const next = new Date(last); next.setDate(next.getDate() + m.maintenanceIntervalDays)
                const daysLeft = Math.ceil((next.getTime() - new Date('2026-06-24').getTime()) / 86400000)
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.location} · intervallo {m.maintenanceIntervalDays}gg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-700">{next.toLocaleDateString('it-IT')}</p>
                      <p className={`text-xs ${daysLeft < 30 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                        {daysLeft > 0 ? `fra ${daysLeft} giorni` : 'scaduto'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Maintenance form modal */}
      {showMaintForm && selectedMachine && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4 w-full max-w-md">
            <h3 className="font-bold text-slate-900">Registra manutenzione</h3>
            <p className="text-sm text-slate-500">{selectedMachine.name} — {selectedMachine.brand}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Tipo intervento</label>
                <select value={maintForm.type} onChange={e => setMaintForm(p => ({ ...p, type: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                  {MAINT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Tecnico / Eseguita da</label>
                <Input value={maintForm.performedBy} onChange={e => setMaintForm(p => ({ ...p, performedBy: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Costo (€)</label>
                <Input type="number" step="0.01" value={maintForm.costEur} onChange={e => setMaintForm(p => ({ ...p, costEur: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Note</label>
                <Input value={maintForm.notes} onChange={e => setMaintForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => recordMaintenance.mutate()} disabled={recordMaintenance.isPending}>
                {recordMaintenance.isPending ? 'Salvataggio…' : 'Registra'}
              </Button>
              <Button variant="ghost" onClick={() => setShowMaintForm(false)}>Annulla</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
