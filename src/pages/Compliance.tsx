import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge, Card } from '../components/ui'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ErasureRequestDto {
  id: string
  memberId: string
  status: 'Pending' | 'Executed' | 'Cancelled'
  requestedAtUtc: string
  scheduledForUtc: string
  executedAtUtc: string | null
}

interface MemberBasic { id: string; fullName: string; email: string }

const STATUS_TONE: Record<ErasureRequestDto['status'], 'amber' | 'green' | 'slate'> = {
  Pending: 'amber',
  Executed: 'green',
  Cancelled: 'slate',
}

const STATUS_LABEL: Record<ErasureRequestDto['status'], string> = {
  Pending: 'In attesa',
  Executed: 'Eseguita',
  Cancelled: 'Annullata',
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Compliance() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Executed' | 'Cancelled'>('Pending')

  const { data: erasureData, isLoading } = useQuery({
    queryKey: ['erasure-requests'],
    queryFn: () => api.get<ErasureRequestDto[]>('/api/v1/compliance/erasure-requests'),
    refetchInterval: 60_000,
  })

  const { data: membersData } = useQuery({
    queryKey: ['members-all'],
    queryFn: () => api.get<MemberBasic[]>('/api/v1/members?pageSize=500'),
    staleTime: 60_000,
  })

  const cancelMutation = useMutation({
    mutationFn: ({ memberId, requestId }: { memberId: string; requestId: string }) =>
      api.delete(`/api/v1/members/${memberId}/erasure/${requestId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erasure-requests'] }),
    onError: (e: Error) => alert(e.message),
  })

  const allRequests = erasureData?.data ?? []
  const memberMap = Object.fromEntries((membersData?.data ?? []).map(m => [m.id, m]))

  const filtered = filter === 'all' ? allRequests : allRequests.filter(r => r.status === filter)
  const pendingCount = allRequests.filter(r => r.status === 'Pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">GDPR & Compliance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestisci le richieste di cancellazione (Art. 17 GDPR) e monitora i consensi dei soci.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-3xl font-black text-amber-600">{pendingCount}</div>
          <div className="mt-1 text-sm font-medium text-slate-600">Richieste pendenti</div>
          {pendingCount > 0 && (
            <p className="mt-1 text-xs text-amber-500">Richiedono attenzione</p>
          )}
        </Card>
        <Card className="p-5">
          <div className="text-3xl font-black text-emerald-600">
            {allRequests.filter(r => r.status === 'Executed').length}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">Eseguite</div>
        </Card>
        <Card className="p-5">
          <div className="text-3xl font-black text-slate-500">
            {allRequests.length}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-600">Totale richieste</div>
        </Card>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800">
        <p className="font-semibold mb-1">Come funziona la cancellazione (Art. 17)</p>
        <p className="text-blue-700">
          Quando un socio richiede la cancellazione, la sua richiesta rimane <em>In attesa</em> per 30 giorni
          prima dell'esecuzione automatica. Puoi annullarla entro quel termine se il socio revoca la richiesta.
          Per gestire i <strong>consensi</strong> del singolo socio, apri la sua scheda → tab <strong>GDPR</strong>.
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        {(['all', 'Pending', 'Executed', 'Cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'Tutte' : STATUS_LABEL[f]}
            {f === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-white text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="py-10 text-center text-slate-400">Caricamento…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="font-semibold text-slate-700">Nessuna richiesta{filter !== 'all' ? ` in stato "${STATUS_LABEL[filter as ErasureRequestDto['status']]}"` : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Socio</th>
                  <th className="px-5 py-3 font-medium">Richiesta il</th>
                  <th className="px-5 py-3 font-medium">Esecuzione prevista</th>
                  <th className="px-5 py-3 font-medium">Stato</th>
                  <th className="px-5 py-3 font-medium text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(r => {
                  const member = memberMap[r.memberId]
                  const daysLeft = Math.ceil(
                    (new Date(r.scheduledForUtc).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        {member ? (
                          <div>
                            <Link
                              to={`/members/${r.memberId}`}
                              className="font-semibold text-slate-800 hover:text-brand-600 hover:underline"
                            >
                              {member.fullName}
                            </Link>
                            <div className="text-xs text-slate-400">{member.email}</div>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-slate-400">{r.memberId}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(r.requestedAtUtc).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-5 py-3">
                        {r.status === 'Pending' ? (
                          <span className={`text-sm font-medium ${daysLeft <= 3 ? 'text-red-600' : 'text-slate-600'}`}>
                            {new Date(r.scheduledForUtc).toLocaleDateString('it-IT')}
                            {daysLeft > 0 && <span className="ml-1 text-xs text-slate-400">({daysLeft}gg)</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {r.executedAtUtc
                              ? new Date(r.executedAtUtc).toLocaleDateString('it-IT')
                              : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.status === 'Pending' && (
                          <button
                            onClick={() => cancelMutation.mutate({ memberId: r.memberId, requestId: r.id })}
                            disabled={cancelMutation.isPending}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                          >
                            Annulla
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
