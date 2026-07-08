import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface BranchDto {
  id: string
  branchTenantId: string
  branchName: string
  cachedMemberCount: number
  cachedMrr: number
  statsRefreshedAtUtc: string | null
  joinedAtUtc: string
}

interface FranchiseDto {
  id: string
  name: string
  description: string | null
  createdAtUtc: string
  branches: BranchDto[]
}

interface FranchiseDashboardDto {
  franchiseName: string
  totalBranches: number
  totalMembers: number
  totalMrr: number
  branches: BranchDto[]
}

export default function Franchise() {
  const qc = useQueryClient()
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [addTenantId, setAddTenantId] = useState('')
  const [addName, setAddName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data: franchiseData, isLoading, error } = useQuery({
    queryKey: ['franchise'],
    queryFn: () => api.get<FranchiseDto>('/api/v1/franchise/'),
    retry: false,
  })
  const franchise = franchiseData?.data

  const { data: dashboardData } = useQuery({
    queryKey: ['franchise-dashboard'],
    queryFn: () => api.get<FranchiseDashboardDto>('/api/v1/franchise/dashboard'),
    enabled: !!franchise,
  })
  const dashboard = dashboardData?.data

  const createMut = useMutation({
    mutationFn: () => api.post('/api/v1/franchise/', { name: createName, description: createDesc || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['franchise'] }); setCreateName(''); setCreateDesc('') },
  })

  const addBranchMut = useMutation({
    mutationFn: () => api.post('/api/v1/franchise/branches', {
      branchTenantId: addTenantId,
      branchName: addName,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['franchise'] })
      qc.invalidateQueries({ queryKey: ['franchise-dashboard'] })
      setAddTenantId(''); setAddName(''); setShowAdd(false)
    },
  })

  const removeBranchMut = useMutation({
    mutationFn: (branchId: string) => api.delete(`/api/v1/franchise/branches/${branchId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['franchise'] })
      qc.invalidateQueries({ queryKey: ['franchise-dashboard'] })
    },
  })

  const refreshMut = useMutation({
    mutationFn: () => api.post('/api/v1/franchise/dashboard/refresh', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['franchise-dashboard'] }),
  })

  if (isLoading) return <div className="p-8 text-slate-500">Caricamento…</div>

  // Franchise non ancora creata
  const notFound = (error as { code?: string })?.code === 'NOT_FOUND' || !franchise

  if (notFound) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multi-sede & Franchise</h1>
          <p className="mt-1 text-sm text-slate-500">
            Raggruppa più palestre sotto un'unica franchise per monitorare tutte le sedi in un colpo d'occhio.
          </p>
        </div>

        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Crea la tua Franchise</h2>
          <p className="text-sm text-slate-500 mb-6">
            Questa palestra diventerà la sede principale. Potrai aggiungere altre sedi tramite il loro Tenant ID.
          </p>

          <div className="space-y-3 text-left">
            <input
              type="text"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              placeholder="Nome franchise (es. Oplyfit Group)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            />
            <textarea
              value={createDesc}
              onChange={e => setCreateDesc(e.target.value)}
              placeholder="Descrizione (opzionale)"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={() => createMut.mutate()}
              disabled={!createName.trim() || createMut.isPending}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {createMut.isPending ? 'Creazione…' : '🏢 Crea Franchise'}
            </button>
            {createMut.isError && (
              <p className="text-xs text-red-600">{(createMut.error as Error).message}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{franchise.name}</h1>
          {franchise.description && (
            <p className="mt-1 text-sm text-slate-500">{franchise.description}</p>
          )}
        </div>
        <button
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshMut.isPending ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : '🔄'} Aggiorna dati sedi
        </button>
      </div>

      {/* KPI aggregati */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Sedi totali" value={String(dashboard?.totalBranches ?? franchise.branches.length)} icon="🏢" color="#2563eb" />
        <KpiCard label="Soci totali" value={String(dashboard?.totalMembers ?? 0)} icon="👥" color="#10b981" />
        <KpiCard
          label="MRR aggregato"
          value={`€ ${(dashboard?.totalMrr ?? 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
          icon="💰"
          color="#8b5cf6"
        />
      </div>

      {/* Griglia sedi */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Sedi</h2>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Aggiungi sede
          </button>
        </div>

        {/* Form aggiungi sede */}
        {showAdd && (
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-3 text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Aggiungi sede
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Tenant ID della sede</label>
                <input
                  type="text"
                  value={addTenantId}
                  onChange={e => setAddTenantId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Nome sede</label>
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="es. Oplyfit Milano Nord"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => addBranchMut.mutate()}
                disabled={!addTenantId.trim() || !addName.trim() || addBranchMut.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {addBranchMut.isPending ? 'Aggiunta…' : 'Aggiungi'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Annulla
              </button>
            </div>
            {addBranchMut.isError && (
              <p className="mt-2 text-xs text-red-600">{(addBranchMut.error as Error).message}</p>
            )}
          </div>
        )}

        {franchise.branches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
            <div className="text-4xl mb-2">🏪</div>
            <p className="text-sm">Nessuna sede aggiunta. Clicca "Aggiungi sede" per iniziare.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {franchise.branches.map(branch => {
              const stats = dashboard?.branches.find(b => b.id === branch.id)
              return (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  stats={stats}
                  onRemove={() => removeBranchMut.mutate(branch.id)}
                  removing={removeBranchMut.isPending}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function BranchCard({
  branch,
  stats,
  onRemove,
  removing,
}: {
  branch: BranchDto
  stats?: BranchDto
  onRemove: () => void
  removing: boolean
}) {
  const memberCount = stats?.cachedMemberCount ?? branch.cachedMemberCount
  const mrr = stats?.cachedMrr ?? branch.cachedMrr
  const refreshed = stats?.statsRefreshedAtUtc ?? branch.statsRefreshedAtUtc

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        onClick={onRemove}
        disabled={removing}
        className="absolute right-3 top-3 text-slate-300 hover:text-red-400 disabled:opacity-40 text-xs"
        title="Rimuovi sede"
      >
        ✕
      </button>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-lg">🏪</div>
        <div>
          <p className="text-sm font-bold text-slate-800">{branch.branchName}</p>
          <p className="text-xs text-slate-400 font-mono">{branch.branchTenantId.slice(0, 8)}…</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs text-slate-400">Soci</p>
          <p className="text-lg font-bold text-slate-800">{memberCount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">MRR</p>
          <p className="text-lg font-bold text-emerald-600">€ {mrr.toFixed(0)}</p>
        </div>
      </div>

      {refreshed && (
        <p className="mt-2 text-xs text-slate-300">
          Aggiornato: {new Date(refreshed).toLocaleDateString('it-IT')}
        </p>
      )}
      {!refreshed && (
        <p className="mt-2 text-xs text-amber-400">⚠ Dati non ancora aggiornati</p>
      )}
    </div>
  )
}
