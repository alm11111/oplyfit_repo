import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

interface MemberSearchItem {
  id: string
  fullName: string
  email: string
}

interface MembersPage {
  items: MemberSearchItem[]
  totalCount: number
}

type DownloadState = 'idle' | 'loading' | 'done' | 'error'

function useDownload(path: string, filename: string) {
  const [state, setState] = useState<DownloadState>('idle')
  const [error, setError] = useState<string | null>(null)

  async function download() {
    setState('loading')
    setError(null)
    try {
      await api.downloadFile(path, filename)
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Download fallito')
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return { state, error, download }
}

function ReportCard({
  icon,
  title,
  description,
  filename,
  path,
  accent = '#2563eb',
}: {
  icon: string
  title: string
  description: string
  filename: string
  path: string
  accent?: string
}) {
  const { state, error, download } = useDownload(path, filename)
  const loading = state === 'loading'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: accent + '18' }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {state === 'error' && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ❌ {error}
        </div>
      )}
      {state === 'done' && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          ✅ Download completato
        </div>
      )}

      <button
        onClick={download}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        style={{ backgroundColor: loading ? '#94a3b8' : accent }}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generando PDF…
          </>
        ) : (
          <>⬇ Scarica PDF</>
        )}
      </button>
    </div>
  )
}

export default function Reports() {
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberSearchItem | null>(null)
  const [cardState, setCardState] = useState<DownloadState>('idle')
  const [cardError, setCardError] = useState<string | null>(null)

  const { data: searchData } = useQuery({
    queryKey: ['member-search-report', memberSearch],
    queryFn: () => api.get<MembersPage>(
      `/api/v1/members?page=1&pageSize=8&search=${encodeURIComponent(memberSearch)}`
    ),
    enabled: memberSearch.length >= 2,
  })
  const searchResults = searchData?.data?.items ?? []

  async function downloadCard(member: MemberSearchItem) {
    setSelectedMember(member)
    setCardState('loading')
    setCardError(null)
    try {
      await api.downloadFile(
        `/api/v1/reports/members/${member.id}/card.pdf`,
        `scheda-${member.fullName.replace(/\s+/g, '-').toLowerCase()}.pdf`
      )
      setCardState('done')
      setTimeout(() => setCardState('idle'), 3000)
    } catch (e: unknown) {
      setCardError(e instanceof Error ? e.message : 'Download fallito')
      setCardState('error')
      setTimeout(() => setCardState('idle'), 4000)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report & Export PDF</h1>
        <p className="mt-1 text-sm text-slate-500">
          Genera e scarica report in formato PDF per soci, tesoreria e schede individuali.
        </p>
      </div>

      {/* Report generali */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Report Generali
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ReportCard
            icon="👥"
            title="Lista Soci"
            description="Elenco completo di tutti i soci con stato, contatti e data di iscrizione. Formato A4 orizzontale."
            path="/api/v1/reports/members.pdf"
            filename={`lista-soci-${new Date().toISOString().slice(0, 10)}.pdf`}
            accent="#2563eb"
          />
          <ReportCard
            icon="💰"
            title="Report Tesoreria"
            description="MRR, abbonamenti attivi/sospesi/annullati e statistiche finanziarie della palestra."
            path="/api/v1/reports/treasury.pdf"
            filename={`report-tesoreria-${new Date().toISOString().slice(0, 10)}.pdf`}
            accent="#10b981"
          />
        </div>
      </section>

      {/* Scheda socio */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Scheda Socio Individuale
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl bg-violet-50">
              🪪
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Scheda Socio PDF</h3>
              <p className="mt-1 text-sm text-slate-500">
                Genera la scheda personale di un socio con tutti i dati anagrafici e di contatto.
              </p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={memberSearch}
              onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null) }}
              placeholder="Cerca per nome o email…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />

            {searchResults.length > 0 && !selectedMember && memberSearch.length >= 2 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                {searchResults.map(m => (
                  <li key={m.id}>
                    <button
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                      onClick={() => { setSelectedMember(m); setMemberSearch(m.fullName) }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {m.fullName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{m.fullName}</div>
                        <div className="text-xs text-slate-400">{m.email}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cardState === 'error' && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              ❌ {cardError}
            </div>
          )}
          {cardState === 'done' && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              ✅ Scheda scaricata per {selectedMember?.fullName}
            </div>
          )}

          <button
            onClick={() => selectedMember && downloadCard(selectedMember)}
            disabled={!selectedMember || cardState === 'loading'}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {cardState === 'loading' ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando PDF…
              </>
            ) : (
              <>🪪 Scarica Scheda PDF</>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
