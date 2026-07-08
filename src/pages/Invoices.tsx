import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────
interface InvoiceDto {
  id: string; number: string; paymentId: string; memberId: string | null
  customerName: string; customerEmail: string; amountNet: number; vatRate: number
  vatAmount: number; amountGross: number; currency: string; description: string
  issuedAtUtc: string; status: string
}

// ── Status UI ─────────────────────────────────────────────────────────────────
const STATUS_UI: Record<string, { label: string; tone: 'green' | 'blue' | 'slate' | 'red' | 'amber' }> = {
  Issued:   { label: 'Emessa',    tone: 'green' },
  Sent:     { label: 'Inviata',   tone: 'blue'  },
  Draft:    { label: 'Bozza',     tone: 'slate' },
  Void:     { label: 'Annullata', tone: 'red'   },
  Overdue:  { label: 'Scaduta',   tone: 'amber' },
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_INVOICES: InvoiceDto[] = [
  { id: 'inv01', number: 'FIT-2026-0156', paymentId: 'p1',  memberId: 'm2',  customerName: 'Marco Bianchi',    customerEmail: 'marco.bianchi@email.it',    amountNet: 49.10,  vatRate: 0.22, vatAmount: 10.80,  amountGross: 59.90,  currency: 'EUR', description: 'Premium Mensile — Giugno 2026',      issuedAtUtc: '2026-06-24T09:12:00Z', status: 'Issued'  },
  { id: 'inv02', number: 'FIT-2026-0155', paymentId: 'p2',  memberId: 'm3',  customerName: 'Alessia Romano',   customerEmail: 'alessia.romano@email.it',   amountNet: 32.70,  vatRate: 0.22, vatAmount: 7.19,   amountGross: 39.90,  currency: 'EUR', description: 'Base Mensile — Giugno 2026',          issuedAtUtc: '2026-06-23T14:30:00Z', status: 'Sent'    },
  { id: 'inv03', number: 'FIT-2026-0154', paymentId: 'p3',  memberId: 'm6',  customerName: 'Fabio De Luca',    customerEmail: 'fabio.deluca@email.it',     amountNet: 24.51,  vatRate: 0.22, vatAmount: 5.39,   amountGross: 29.90,  currency: 'EUR', description: 'Student Mensile — Giugno 2026',       issuedAtUtc: '2026-06-23T08:00:00Z', status: 'Issued'  },
  { id: 'inv04', number: 'FIT-2026-0153', paymentId: 'p4',  memberId: 'm9',  customerName: 'Valentina Greco',  customerEmail: 'valentina.greco@email.it',  amountNet: 49.10,  vatRate: 0.22, vatAmount: 10.80,  amountGross: 59.90,  currency: 'EUR', description: 'Premium Mensile — Giugno 2026',      issuedAtUtc: '2026-06-22T18:45:00Z', status: 'Issued'  },
  { id: 'inv05', number: 'FIT-2026-0152', paymentId: 'p5',  memberId: 'm10', customerName: 'Roberto Martini',  customerEmail: 'roberto.martini@email.it',  amountNet: 408.61, vatRate: 0.22, vatAmount: 90.39,  amountGross: 499.00, currency: 'EUR', description: 'Annuale Top — Anno 2026',             issuedAtUtc: '2026-06-20T10:00:00Z', status: 'Sent'    },
  { id: 'inv06', number: 'FIT-2026-0151', paymentId: 'p6',  memberId: 'm11', customerName: 'Luigi Moretti',    customerEmail: 'luigi.moretti@email.it',    amountNet: 32.70,  vatRate: 0.22, vatAmount: 7.19,   amountGross: 39.90,  currency: 'EUR', description: 'Base Mensile — Giugno 2026',          issuedAtUtc: '2026-06-19T16:20:00Z', status: 'Void'    },
  { id: 'inv07', number: 'FIT-2026-0150', paymentId: 'p7',  memberId: 'm12', customerName: 'Anna Santoro',     customerEmail: 'anna.santoro@email.it',     amountNet: 49.10,  vatRate: 0.22, vatAmount: 10.80,  amountGross: 59.90,  currency: 'EUR', description: 'Premium Mensile — Giugno 2026',      issuedAtUtc: '2026-06-18T09:00:00Z', status: 'Issued'  },
  { id: 'inv08', number: 'FIT-2026-0149', paymentId: 'p8',  memberId: 'm1',  customerName: 'Giulia Ferretti',  customerEmail: 'giulia.ferretti@email.it',  amountNet: 408.61, vatRate: 0.22, vatAmount: 90.39,  amountGross: 499.00, currency: 'EUR', description: 'Annuale Top — Anno 2026',             issuedAtUtc: '2026-01-15T10:00:00Z', status: 'Sent'    },
  { id: 'inv09', number: 'FIT-2026-0148', paymentId: 'p9',  memberId: 'm13', customerName: 'Simone Rizzo',     customerEmail: 'simone.rizzo@email.it',     amountNet: 106.56, vatRate: 0.22, vatAmount: 23.44,  amountGross: 129.00, currency: 'EUR', description: 'Trimestrale — Q2 2026',              issuedAtUtc: '2026-06-01T08:00:00Z', status: 'Sent'    },
  { id: 'inv10', number: 'FIT-2026-0147', paymentId: 'p10', memberId: 'm14', customerName: 'Elena Russo',      customerEmail: 'elena.russo@email.it',      amountNet: 49.10,  vatRate: 0.22, vatAmount: 10.80,  amountGross: 59.90,  currency: 'EUR', description: 'Premium Mensile — Maggio 2026',      issuedAtUtc: '2026-05-24T10:00:00Z', status: 'Issued'  },
  { id: 'inv11', number: 'FIT-2026-0146', paymentId: 'p11', memberId: 'm15', customerName: 'Francesco Vitale', customerEmail: 'f.vitale@email.it',         amountNet: 32.70,  vatRate: 0.22, vatAmount: 7.19,   amountGross: 39.90,  currency: 'EUR', description: 'Base Mensile — Maggio 2026',          issuedAtUtc: '2026-05-23T11:00:00Z', status: 'Sent'    },
  { id: 'inv12', number: 'FIT-2026-0145', paymentId: 'p12', memberId: 'm16', customerName: 'Irene Costa',      customerEmail: 'irene.costa@email.it',      amountNet: 24.51,  vatRate: 0.22, vatAmount: 5.39,   amountGross: 29.90,  currency: 'EUR', description: 'Student Mensile — Maggio 2026',       issuedAtUtc: '2026-05-22T09:00:00Z', status: 'Issued'  },
  { id: 'inv13', number: 'FIT-2026-0144', paymentId: 'p13', memberId: 'm17', customerName: 'Davide Mancini',   customerEmail: 'davide.mancini@email.it',   amountNet: 49.10,  vatRate: 0.22, vatAmount: 10.80,  amountGross: 59.90,  currency: 'EUR', description: 'Premium Mensile — Maggio 2026',      issuedAtUtc: '2026-05-21T14:00:00Z', status: 'Overdue' },
  { id: 'inv14', number: 'FIT-2026-0143', paymentId: 'p14', memberId: 'm18', customerName: 'Chiara Lombardi',  customerEmail: 'chiara.lombardi@email.it',  amountNet: 408.61, vatRate: 0.22, vatAmount: 90.39,  amountGross: 499.00, currency: 'EUR', description: 'Annuale Top — Anno 2026',             issuedAtUtc: '2026-03-10T08:00:00Z', status: 'Sent'    },
  { id: 'inv15', number: 'FIT-2026-0142', paymentId: 'p15', memberId: 'm19', customerName: 'Matteo Ferrari',   customerEmail: 'matteo.ferrari@email.it',   amountNet: 24.51,  vatRate: 0.22, vatAmount: 5.39,   amountGross: 29.90,  currency: 'EUR', description: 'Student Mensile — Maggio 2026',       issuedAtUtc: '2026-05-10T10:00:00Z', status: 'Draft'   },
]

const MONTHLY_CHART = [
  { mese: 'Gen', emesse: 7200, ivA: 1300 }, { mese: 'Feb', emesse: 7380, ivA: 1333 },
  { mese: 'Mar', emesse: 7560, ivA: 1366 }, { mese: 'Apr', emesse: 7620, ivA: 1376 },
  { mese: 'Mag', emesse: 7680, ivA: 1387 }, { mese: 'Giu', emesse: 7740, ivA: 1397 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

function fmt(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
}
function fmtK(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700']
  return <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${colors[name.charCodeAt(0) % colors.length]}`}>{initials}</div>
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Invoices() {
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showChart, setShowChart] = useState(false)

  const { data: remoteData } = useQuery({
    queryKey: ['invoices', page],
    queryFn: () => api.get<InvoiceDto[]>(`/api/v1/documents/invoices?page=${page}&pageSize=${PAGE_SIZE}`),
    retry: false,
  })

  const allInvoices: InvoiceDto[] = remoteData?.data ?? DEMO_INVOICES

  // Client-side filtering on demo data (server handles it via query params in production)
  const filtered = useMemo(() => {
    let list = allInvoices
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.customerName.toLowerCase().includes(q) ||
        i.customerEmail.toLowerCase().includes(q) ||
        i.number.toLowerCase().includes(q)
      )
    }
    if (statusFilter) list = list.filter(i => i.status === statusFilter)
    return list
  }, [allInvoices, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Totals
  const totNet    = filtered.reduce((a, i) => a + (i.status !== 'Void' ? i.amountNet : 0), 0)
  const totVat    = filtered.reduce((a, i) => a + (i.status !== 'Void' ? i.vatAmount : 0), 0)
  const totGross  = filtered.reduce((a, i) => a + (i.status !== 'Void' ? i.amountGross : 0), 0)
  const emesseMese = allInvoices.filter(i => {
    const d = new Date(i.issuedAtUtc); return d.getMonth() === 5 && d.getFullYear() === 2026 && i.status !== 'Void'
  }).reduce((a, i) => a + i.amountGross, 0)
  const daIncassare = allInvoices.filter(i => i.status === 'Issued' || i.status === 'Overdue').reduce((a, i) => a + i.amountGross, 0)
  const annullate   = allInvoices.filter(i => i.status === 'Void').length

  async function downloadPdf(inv: InvoiceDto) {
    setDownloading(inv.id)
    try {
      await api.downloadFile(`/api/v1/documents/invoices/${inv.id}/pdf`, `fattura-${inv.number}.pdf`)
    } catch {
      alert('Errore download PDF')
    } finally {
      setDownloading(null)
    }
  }

  function exportCsv() {
    const header = 'Numero,Cliente,Email,Data,Imponibile,IVA,Totale,Stato'
    const rows   = filtered.map(i =>
      [i.number, `"${i.customerName}"`, i.customerEmail,
       new Date(i.issuedAtUtc).toLocaleDateString('it-IT'),
       i.amountNet.toFixed(2), i.vatAmount.toFixed(2), i.amountGross.toFixed(2), i.status
      ].join(',')
    ).join('\n')
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `fatture-fitcore-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fatture</h1>
          <p className="mt-0.5 text-sm text-slate-500">Documenti fiscali generati dai pagamenti. Fatturazione elettronica SDI: configurazione separata.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowChart(c => !c)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            {showChart ? 'Nascondi grafico' : '📊 Grafico mensile'}
          </button>
          <button onClick={exportCsv}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            ↓ Esporta CSV
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Emesse (mese)',    value: fmtK(emesseMese),                  sub: 'Giugno 2026',           color: 'text-brand-600'   },
          { label: 'Totale fatturato', value: fmtK(totGross),                    sub: 'Tutti i periodi',       color: 'text-violet-600'  },
          { label: 'IVA riscossa',     value: fmtK(totVat),                      sub: `su ${fmtK(totNet)} impon.`, color: 'text-blue-600' },
          { label: 'Da incassare',     value: fmtK(daIncassare),                 sub: 'Emesse + Scadute',      color: daIncassare > 500 ? 'text-amber-600' : 'text-emerald-600' },
          { label: 'Annullate',        value: String(annullate),                 sub: 'Note di credito',       color: 'text-slate-500'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Optional chart */}
      {showChart && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Fatturato mensile — 2026</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_CHART} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: number) => [fmtK(v)]} />
              <Bar dataKey="emesse" name="Imponibile" fill="#7c3aed" radius={[3,3,0,0]} />
              <Bar dataKey="ivA"    name="IVA"        fill="#c4b5fd" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cerca per cliente, email o numero fattura…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['', 'Issued', 'Sent', 'Draft', 'Overdue', 'Void'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s
                ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {s === '' ? 'Tutte' : STATUS_UI[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {paginated.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🧾</div>
            <p className="font-medium text-slate-600">Nessuna fattura trovata</p>
            <p className="mt-1 text-sm text-slate-400">Prova a modificare i filtri di ricerca.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">N. Fattura</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Descrizione</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Imponibile</th>
                  <th className="px-4 py-3 text-right">IVA</th>
                  <th className="px-4 py-3 text-right">Totale</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map(inv => {
                  const st = STATUS_UI[inv.status] ?? { label: inv.status, tone: 'slate' as const }
                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/60 transition-colors ${inv.status === 'Void' ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">{inv.number}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={inv.customerName} />
                          <div>
                            <div className="font-medium text-slate-800 leading-tight">{inv.customerName}</div>
                            <div className="text-xs text-slate-400">{inv.customerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[160px] truncate">{inv.description}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(inv.issuedAtUtc).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600">{fmt(inv.amountNet)}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-400">
                        {fmt(inv.vatAmount)}
                        <span className="ml-0.5 text-slate-300">({(inv.vatRate * 100).toFixed(0)}%)</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">{fmt(inv.amountGross)}</td>
                      <td className="px-4 py-3.5"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => downloadPdf(inv)} disabled={downloading === inv.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                          {downloading === inv.id ? '…' : '↓ PDF'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <td className="px-5 py-3" colSpan={4}>{filtered.filter(i => i.status !== 'Void').length} fatture attive</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{fmt(totNet)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{fmt(totVat)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900 font-bold">{fmt(totGross)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-400">{filtered.length} fatture — pagina {page} di {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  ← Prec
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                  return n <= totalPages ? (
                    <button key={n} onClick={() => setPage(n)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${n === page ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {n}
                    </button>
                  ) : null
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  Succ →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
