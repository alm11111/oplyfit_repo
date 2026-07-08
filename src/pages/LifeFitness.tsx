import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

interface LFEquipment {
  id: string
  name: string
  type: string
  model: string
  serialNumber: string | null
  firmwareVersion: string | null
  isOnline: boolean
}

interface LFSyncResult {
  equipmentSynced: number
  workoutsSynced: number
  syncedAtUtc: string
  isStub: boolean
}

interface StatusDto {
  enabled: boolean
  configured: boolean
  gymId: string | null
}

export default function LifeFitness() {
  const { data: statusData } = useQuery({
    queryKey: ['lifefitness', 'status'],
    queryFn: () => api.get<StatusDto>('/api/v1/lifefitness/status'),
  })

  const { data: equipmentData, isLoading, refetch } = useQuery({
    queryKey: ['lifefitness', 'equipment'],
    queryFn: () => api.get<LFEquipment[]>('/api/v1/lifefitness/equipment'),
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post<LFSyncResult>('/api/v1/lifefitness/sync', {}),
    onSuccess: () => refetch(),
  })

  const status = statusData?.data
  const equipment = equipmentData?.data ?? []
  const syncResult = syncMutation.data?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Life Fitness LFopen</h1>
        <p className="mt-1 text-sm text-slate-500">
          Integrazione API Key con LFopen — attrezzature Life Fitness e dati allenamento.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🚴</div>
          <div className="flex-1">
            <div className="font-semibold text-ink">LFopen API</div>
            <div className="text-sm text-slate-500">API Key auth — Gym {status?.gymId ?? 'GYM_ID_PLACEHOLDER'}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {status?.enabled ? (status.configured ? 'Attivo' : 'Non configurato') : 'Non attivo'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Attrezzature ({equipment.length})</h2>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {syncMutation.isPending ? 'Sincronizzazione…' : '🔄 Sincronizza workout'}
        </button>
      </div>

      {syncResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Sync completato: {syncResult.equipmentSynced} attrezzature, {syncResult.workoutsSynced} workout
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Caricamento…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Modello</th>
                  <th className="px-4 py-3">Seriale</th>
                  <th className="px-4 py-3">Firmware</th>
                  <th className="px-4 py-3">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {equipment.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-ink">{eq.name}</td>
                    <td className="px-4 py-3 text-slate-600">{eq.type}</td>
                    <td className="px-4 py-3 text-slate-600">{eq.model}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{eq.serialNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{eq.firmwareVersion ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${eq.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {eq.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                ))}
                {equipment.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Nessuna attrezzatura trovata.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
