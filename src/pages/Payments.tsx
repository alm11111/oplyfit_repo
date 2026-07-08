import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, Input } from '../components/ui'

// ── Fatture acquisto types ────────────────────────────────────────────────────

interface Supplier {
  id: string
  ragioneSociale: string
  piva: string
  cf: string
  email: string
  telefono: string
  indirizzo: string
  iban: string
  categoria: SupplierCategory
  note: string
}

type SupplierCategory =
  | 'Attrezzature' | 'Manutenzione' | 'Pulizie' | 'Consulenza' | 'Marketing'
  | 'Software' | 'Utenze' | 'Assicurazioni' | 'Alimentari' | 'Altro'

const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  'Attrezzature', 'Manutenzione', 'Pulizie', 'Consulenza', 'Marketing',
  'Software', 'Utenze', 'Assicurazioni', 'Alimentari', 'Altro',
]

type InvoiceStatus = 'DaPagare' | 'Pagata' | 'Scaduta' | 'Contestata'

type UnitaMisura = 'pz' | 'kg' | 'lt' | 'ore' | 'mese' | 'anno' | 'servizio' | 'altro'
const UNITA_MISURA: UnitaMisura[] = ['pz', 'kg', 'lt', 'ore', 'mese', 'anno', 'servizio', 'altro']

interface InvoiceItem {
  id: string
  descrizione: string
  quantita: number
  prezzoUnitario: number
  aliquotaIva: number
  unitaMisura: UnitaMisura
}

function itemImponibile(item: InvoiceItem) { return item.quantita * item.prezzoUnitario }
function itemTotale(item: InvoiceItem) { return itemImponibile(item) * (1 + item.aliquotaIva / 100) }

interface PurchaseInvoice {
  id: string
  supplierId: string
  numeroFattura: string
  dataEmissione: string
  dataScadenza: string
  imponibile: number
  totale: number
  stato: InvoiceStatus
  note: string
  dataPagamento: string | null
  items: InvoiceItem[]
  createdAtUtc: string
}

// ── Demo suppliers ────────────────────────────────────────────────────────────

const DEMO_SUPPLIERS: Supplier[] = [
  { id: 's1', ragioneSociale: 'Technogym Italia Srl', piva: '01234567890', cf: '01234567890', email: 'fatture@technogym.com', telefono: '0547 56047', indirizzo: 'Via Perticari 20, Cesena (FC)', iban: 'IT60X0542811101000000123456', categoria: 'Attrezzature', note: 'Fornitore principale macchinari' },
  { id: 's2', ragioneSociale: 'CleanPro Srl', piva: '09876543210', cf: '09876543210', email: 'admin@cleanpro.it', telefono: '02 1234567', indirizzo: 'Via Pulizie 5, Milano (MI)', iban: 'IT80Q0306909606100000009988', categoria: 'Pulizie', note: 'Servizio pulizie bisettimanale' },
  { id: 's3', ragioneSociale: 'Studio Legale Bianchi & Soci', piva: '05544332211', cf: '05544332211', email: 'studio@bianchisoci.it', telefono: '02 9988776', indirizzo: 'Corso Vittorio Emanuele 12, Milano (MI)', iban: 'IT22A0760101600000000123456', categoria: 'Consulenza', note: 'Consulenza contrattuale annuale' },
  { id: 's4', ragioneSociale: 'Enel Energia Spa', piva: '06655971007', cf: '06655971007', email: 'fatture@enel.it', telefono: '800 900 800', indirizzo: 'Viale Regina Margherita 137, Roma', iban: '', categoria: 'Utenze', note: 'Fornitura energia elettrica' },
  { id: 's5', ragioneSociale: 'WebAgency Plus Srl', piva: '11122233344', cf: '11122233344', email: 'billing@webagencyplus.it', telefono: '02 5551234', indirizzo: 'Via Digitale 88, Milano (MI)', iban: 'IT90M0300203280324516712908', categoria: 'Marketing', note: 'Campagne Meta + Google Ads' },
]

// ── Demo purchase invoices ────────────────────────────────────────────────────

const fmtDate = (d: Date) => d.toISOString().slice(0, 10)
const todayDate = new Date()

function buildDemoInvoices(): PurchaseInvoice[] {
  const m = todayDate.getMonth()
  const y = todayDate.getFullYear()
  const items1: InvoiceItem[] = [
    { id: 'i1a', descrizione: 'Tapis roulant Technogym Run 1000', quantita: 1, prezzoUnitario: 2800, aliquotaIva: 22, unitaMisura: 'pz' },
    { id: 'i1b', descrizione: 'Cyclette Technogym Ride 100', quantita: 2, prezzoUnitario: 290, aliquotaIva: 22, unitaMisura: 'pz' },
    { id: 'i1c', descrizione: 'Manubri in ghisa set 5-30 kg', quantita: 1, prezzoUnitario: 120, aliquotaIva: 22, unitaMisura: 'pz' },
  ]
  const imp1 = items1.reduce((s, i) => s + itemImponibile(i), 0)
  const items2: InvoiceItem[] = [
    { id: 'i2a', descrizione: 'Servizio pulizie sale allenamento', quantita: 8, prezzoUnitario: 45, aliquotaIva: 22, unitaMisura: 'servizio' },
    { id: 'i2b', descrizione: 'Pulizia vetri e specchi', quantita: 2, prezzoUnitario: 60, aliquotaIva: 22, unitaMisura: 'servizio' },
    { id: 'i2c', descrizione: 'Prodotti igienizzanti', quantita: 3, prezzoUnitario: 20, aliquotaIva: 22, unitaMisura: 'pz' },
  ]
  const imp2 = items2.reduce((s, i) => s + itemImponibile(i), 0)
  const items3: InvoiceItem[] = [
    { id: 'i3a', descrizione: 'Consulenza redazione contratti istruttori', quantita: 8, prezzoUnitario: 120, aliquotaIva: 22, unitaMisura: 'ore' },
    { id: 'i3b', descrizione: 'Revisione regolamento interno palestra', quantita: 4, prezzoUnitario: 120, aliquotaIva: 22, unitaMisura: 'ore' },
  ]
  const imp3 = items3.reduce((s, i) => s + itemImponibile(i), 0)
  const items4: InvoiceItem[] = [
    { id: 'i4a', descrizione: 'Energia elettrica consumo kWh', quantita: 1, prezzoUnitario: 412, aliquotaIva: 22, unitaMisura: 'mese' },
    { id: 'i4b', descrizione: 'Quota fissa mensile', quantita: 1, prezzoUnitario: 95, aliquotaIva: 22, unitaMisura: 'mese' },
  ]
  const imp4 = items4.reduce((s, i) => s + itemImponibile(i), 0)
  const items5: InvoiceItem[] = [
    { id: 'i5a', descrizione: 'Campagna Meta Ads — maggio', quantita: 1, prezzoUnitario: 500, aliquotaIva: 22, unitaMisura: 'servizio' },
    { id: 'i5b', descrizione: 'Gestione Google Ads — maggio', quantita: 1, prezzoUnitario: 300, aliquotaIva: 22, unitaMisura: 'servizio' },
  ]
  const imp5 = items5.reduce((s, i) => s + itemImponibile(i), 0)
  const items6: InvoiceItem[] = [
    { id: 'i6a', descrizione: 'Integratori Whey Protein 2kg × 10', quantita: 10, prezzoUnitario: 38, aliquotaIva: 10, unitaMisura: 'pz' },
    { id: 'i6b', descrizione: 'Barrette proteiche scatola 24pz', quantita: 4, prezzoUnitario: 32, aliquotaIva: 10, unitaMisura: 'pz' },
    { id: 'i6c', descrizione: 'Creatina monoidrato 500g × 5', quantita: 5, prezzoUnitario: 22, aliquotaIva: 10, unitaMisura: 'pz' },
    { id: 'i6d', descrizione: 'Shaker brandizzati Oplyfit', quantita: 20, prezzoUnitario: 4.5, aliquotaIva: 22, unitaMisura: 'pz' },
  ]
  const imp6 = items6.reduce((s, i) => s + itemImponibile(i), 0)
  const items7: InvoiceItem[] = [
    { id: 'i7a', descrizione: 'Energia elettrica consumo kWh', quantita: 1, prezzoUnitario: 525, aliquotaIva: 22, unitaMisura: 'mese' },
    { id: 'i7b', descrizione: 'Quota fissa mensile', quantita: 1, prezzoUnitario: 95, aliquotaIva: 22, unitaMisura: 'mese' },
  ]
  const imp7 = items7.reduce((s, i) => s + itemImponibile(i), 0)
  return [
    { id: 'fi1', supplierId: 's1', numeroFattura: 'TG-2026-0421', dataEmissione: fmtDate(new Date(y, m - 1, 10)), dataScadenza: fmtDate(new Date(y, m, 10)), imponibile: imp1, totale: items1.reduce((s, i) => s + itemTotale(i), 0), stato: 'DaPagare', note: 'Ordine attrezzature sala 2', dataPagamento: null, items: items1, createdAtUtc: new Date().toISOString() },
    { id: 'fi2', supplierId: 's2', numeroFattura: 'CP-2026-0088', dataEmissione: fmtDate(new Date(y, m, 1)), dataScadenza: fmtDate(new Date(y, m, 30)), imponibile: imp2, totale: items2.reduce((s, i) => s + itemTotale(i), 0), stato: 'DaPagare', note: 'Servizio pulizie giugno', dataPagamento: null, items: items2, createdAtUtc: new Date().toISOString() },
    { id: 'fi3', supplierId: 's3', numeroFattura: 'BS-2026-0012', dataEmissione: fmtDate(new Date(y, m - 1, 5)), dataScadenza: fmtDate(new Date(y, m - 1, 20)), imponibile: imp3, totale: items3.reduce((s, i) => s + itemTotale(i), 0), stato: 'Pagata', note: 'Consulenza contratto nuovi istruttori', dataPagamento: fmtDate(new Date(y, m - 1, 18)), items: items3, createdAtUtc: new Date().toISOString() },
    { id: 'fi4', supplierId: 's4', numeroFattura: 'EN-2026-05441', dataEmissione: fmtDate(new Date(y, m - 2, 15)), dataScadenza: fmtDate(new Date(y, m - 1, 15)), imponibile: imp4, totale: items4.reduce((s, i) => s + itemTotale(i), 0), stato: 'Pagata', note: 'Energia elettrica aprile', dataPagamento: fmtDate(new Date(y, m - 1, 14)), items: items4, createdAtUtc: new Date().toISOString() },
    { id: 'fi5', supplierId: 's5', numeroFattura: 'WAP-2026-0334', dataEmissione: fmtDate(new Date(y, m - 2, 1)), dataScadenza: fmtDate(new Date(y, m - 2, 25)), imponibile: imp5, totale: items5.reduce((s, i) => s + itemTotale(i), 0), stato: 'Scaduta', note: 'Campagna maggio — da verificare con ufficio marketing', dataPagamento: null, items: items5, createdAtUtc: new Date().toISOString() },
    { id: 'fi6', supplierId: 's1', numeroFattura: 'INT-2026-0199', dataEmissione: fmtDate(new Date(y, m, 5)), dataScadenza: fmtDate(new Date(y, m + 1, 5)), imponibile: imp6, totale: items6.reduce((s, i) => s + itemTotale(i), 0), stato: 'DaPagare', note: 'Riassortimento integratori e accessori bar', dataPagamento: null, items: items6, createdAtUtc: new Date().toISOString() },
    { id: 'fi7', supplierId: 's4', numeroFattura: 'EN-2026-06112', dataEmissione: fmtDate(new Date(y, m, 15)), dataScadenza: fmtDate(new Date(y, m + 1, 15)), imponibile: imp7, totale: items7.reduce((s, i) => s + itemTotale(i), 0), stato: 'DaPagare', note: 'Energia elettrica giugno', dataPagamento: null, items: items7, createdAtUtc: new Date().toISOString() },
  ]
}

// ── Supplier modal ─────────────────────────────────────────────────────────────

function emptySupplier(): Omit<Supplier, 'id'> {
  return { ragioneSociale: '', piva: '', cf: '', email: '', telefono: '', indirizzo: '', iban: '', categoria: 'Altro', note: '' }
}

function SupplierModal({ supplier, onClose, onSave }: {
  supplier: Supplier | null; onClose: () => void; onSave: (data: Omit<Supplier, 'id'>) => void
}) {
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(supplier ?? emptySupplier())
  const f = (k: keyof Omit<Supplier, 'id'>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-800">{supplier ? 'Modifica fornitore' : 'Nuovo fornitore'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ragione sociale *</label>
            <Input value={form.ragioneSociale} onChange={f('ragioneSociale')} required placeholder="Es. Technogym Italia Srl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">P. IVA</label>
              <Input value={form.piva} onChange={f('piva')} placeholder="IT01234567890" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Codice Fiscale</label>
              <Input value={form.cf} onChange={f('cf')} placeholder="RSSMRA80A01H501Z" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <Input type="email" value={form.email} onChange={f('email')} placeholder="fatture@fornitore.it" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Telefono</label>
              <Input value={form.telefono} onChange={f('telefono')} placeholder="02 12345678" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Indirizzo</label>
            <Input value={form.indirizzo} onChange={f('indirizzo')} placeholder="Via Roma 1, Milano (MI)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IBAN</label>
              <Input value={form.iban} onChange={f('iban')} placeholder="IT60X054281..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
              <select className={selectCls} value={form.categoria} onChange={f('categoria')}>
                {SUPPLIER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Note interne</label>
            <textarea value={form.note} onChange={f('note')} rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
              placeholder="Condizioni di pagamento, contatti, osservazioni…" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            <Button type="submit">{supplier ? 'Salva modifiche' : 'Aggiungi fornitore'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

// ── Delete supplier confirm ────────────────────────────────────────────────────

function DeleteSupplierModal({ supplier, onClose, onConfirm }: { supplier: Supplier; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">Elimina fornitore</h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Stai per eliminare <span className="font-semibold text-slate-700">"{supplier.ragioneSociale}"</span>.<br />
          Le fatture associate non verranno eliminate.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annulla</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">Elimina</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Purchase invoice modal ─────────────────────────────────────────────────────

interface InvoiceHeaderForm {
  supplierId: string; numeroFattura: string; dataEmissione: string
  dataScadenza: string; stato: InvoiceStatus; note: string; dataPagamento: string
}

function emptyHeader(suppliers: Supplier[]): InvoiceHeaderForm {
  return { supplierId: suppliers[0]?.id ?? '', numeroFattura: '', dataEmissione: fmtDate(todayDate), dataScadenza: '', stato: 'DaPagare', note: '', dataPagamento: '' }
}

function newItem(): InvoiceItem {
  return { id: `item-${Date.now()}-${Math.random()}`, descrizione: '', quantita: 1, prezzoUnitario: 0, aliquotaIva: 22, unitaMisura: 'pz' }
}

const ivaCls = 'rounded border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-brand-500 w-full'

function SupplierSearchSelect({ suppliers, value, onChange }: {
  suppliers: Supplier[]; value: string; onChange: (id: string) => void
}) {
  const selected = suppliers.find(s => s.id === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const filtered = suppliers.filter(s =>
    s.ragioneSociale.toLowerCase().includes(query.toLowerCase()) ||
    s.piva.includes(query) ||
    s.categoria.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (id: string) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center gap-1.5 rounded-lg border ${open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'} bg-white px-2.5 py-1.5`}>
        {!open && selected && (
          <span className="flex-1 text-sm text-slate-800 truncate">{selected.ragioneSociale}</span>
        )}
        <input
          className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400 min-w-0"
          placeholder={open || !selected ? 'Cerca fornitore…' : ''}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
        />
        <button type="button" onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-slate-600 text-xs shrink-0">
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg py-1 max-h-52 overflow-y-auto">
          {filtered.length === 0
            ? <p className="px-3 py-2 text-xs text-slate-400">Nessun fornitore trovato</p>
            : filtered.map(s => (
                <button key={s.id} type="button" onClick={() => handleSelect(s.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${s.id === value ? 'bg-brand-50' : ''}`}>
                  <div className="text-left min-w-0">
                    <p className={`font-medium truncate ${s.id === value ? 'text-brand-700' : 'text-slate-800'}`}>{s.ragioneSociale}</p>
                    {s.piva && <p className="text-[10px] text-slate-400">P.IVA {s.piva}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{s.categoria}</span>
                </button>
              ))
          }
        </div>
      )}
    </div>
  )
}

function PurchaseInvoiceModal({ invoice, suppliers, onClose, onSave }: {
  invoice: PurchaseInvoice | null; suppliers: Supplier[]
  onClose: () => void; onSave: (data: Omit<PurchaseInvoice, 'id' | 'createdAtUtc'>) => void
}) {
  const [header, setHeader] = useState<InvoiceHeaderForm>(
    invoice
      ? { supplierId: invoice.supplierId, numeroFattura: invoice.numeroFattura, dataEmissione: invoice.dataEmissione, dataScadenza: invoice.dataScadenza, stato: invoice.stato, note: invoice.note, dataPagamento: invoice.dataPagamento ?? '' }
      : emptyHeader(suppliers)
  )
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items?.length ? invoice.items : [newItem()])

  const fh = (k: keyof InvoiceHeaderForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setHeader(prev => ({ ...prev, [k]: e.target.value }))

  const updateItem = (id: string, k: keyof InvoiceItem, v: string | number) =>
    setItems(prev => prev.map(it => it.id !== id ? it : { ...it, [k]: k === 'descrizione' || k === 'unitaMisura' ? v : (parseFloat(v as string) || 0) }))

  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id))
  const addItem = () => setItems(prev => [...prev, newItem()])

  const totalImponibile = items.reduce((s, i) => s + itemImponibile(i), 0)
  const totalIva = items.reduce((s, i) => s + (itemTotale(i) - itemImponibile(i)), 0)
  const totalFattura = totalImponibile + totalIva

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    onSave({
      supplierId: header.supplierId,
      numeroFattura: header.numeroFattura,
      dataEmissione: header.dataEmissione,
      dataScadenza: header.dataScadenza,
      imponibile: totalImponibile,
      totale: totalFattura,
      stato: header.stato,
      note: header.note,
      dataPagamento: header.stato === 'Pagata' && header.dataPagamento ? header.dataPagamento : null,
      items,
    })
  }

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="font-semibold text-slate-800">{invoice ? 'Modifica fattura' : 'Registra fattura di acquisto'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-5">

            {/* Header fields */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Fornitore *</label>
                {suppliers.length === 0
                  ? <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Nessun fornitore. Creane uno prima.</p>
                  : <SupplierSearchSelect
                      suppliers={suppliers}
                      value={header.supplierId}
                      onChange={id => setHeader(prev => ({ ...prev, supplierId: id }))}
                    />
                }
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° Fattura *</label>
                <Input value={header.numeroFattura} onChange={fh('numeroFattura')} required placeholder="TG-2026-0421" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Stato</label>
                <select className={selectCls} value={header.stato} onChange={fh('stato')}>
                  <option value="DaPagare">Da pagare</option>
                  <option value="Pagata">Pagata</option>
                  <option value="Scaduta">Scaduta</option>
                  <option value="Contestata">Contestata</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Data emissione *</label>
                <Input type="date" value={header.dataEmissione} onChange={fh('dataEmissione')} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Data scadenza *</label>
                <Input type="date" value={header.dataScadenza} onChange={fh('dataScadenza')} required />
              </div>
              {header.stato === 'Pagata' && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Data pagamento</label>
                  <Input type="date" value={header.dataPagamento} onChange={fh('dataPagamento')} />
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Articoli / Voci</label>
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors">
                  + Aggiungi riga
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 font-medium w-[34%]">Descrizione</th>
                        <th className="px-2 py-2 font-medium w-16">U.M.</th>
                        <th className="px-2 py-2 font-medium w-16 text-right">Qtà</th>
                        <th className="px-2 py-2 font-medium w-24 text-right">Prezzo unit.</th>
                        <th className="px-2 py-2 font-medium w-16 text-right">IVA %</th>
                        <th className="px-2 py-2 font-medium w-24 text-right">Tot. lordo</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50/60">
                          <td className="px-2 py-1.5">
                            <input
                              className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100"
                              value={it.descrizione}
                              onChange={e => updateItem(it.id, 'descrizione', e.target.value)}
                              placeholder="Es. Whey Protein 2kg, Tapis roulant…"
                              required
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select className={ivaCls} value={it.unitaMisura} onChange={e => updateItem(it.id, 'unitaMisura', e.target.value)}>
                              {UNITA_MISURA.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min="0.001" step="0.001" className={ivaCls + ' text-right'}
                              value={it.quantita}
                              onChange={e => updateItem(it.id, 'quantita', e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min="0" step="0.01" className={ivaCls + ' text-right'}
                              value={it.prezzoUnitario}
                              onChange={e => updateItem(it.id, 'prezzoUnitario', e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <select className={ivaCls + ' text-right'} value={it.aliquotaIva} onChange={e => updateItem(it.id, 'aliquotaIva', e.target.value)}>
                              <option value={0}>0%</option>
                              <option value={4}>4%</option>
                              <option value={10}>10%</option>
                              <option value={22}>22%</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className="font-semibold text-slate-700">
                              €{itemTotale(it).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </span>
                            <p className="text-[10px] text-slate-400">imp. €{itemImponibile(it).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                          </td>
                          <td className="px-1.5 py-1.5">
                            <button type="button" onClick={() => removeItem(it.id)}
                              disabled={items.length === 1}
                              className="flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td colSpan={3} className="px-3 py-2 text-[10px] text-slate-400 uppercase tracking-wide">
                          {items.length} {items.length === 1 ? 'articolo' : 'articoli'}
                        </td>
                        <td colSpan={2} className="px-2 py-2 text-right">
                          <p className="text-[10px] text-slate-400">Imponibile</p>
                          <p className="font-semibold text-slate-700">€{totalImponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <p className="text-[10px] text-slate-400">IVA</p>
                          <p className="font-semibold text-slate-700">€{totalIva.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                        </td>
                        <td />
                      </tr>
                      <tr className="bg-brand-50 border-t border-brand-100">
                        <td colSpan={5} className="px-3 py-2.5 text-xs font-semibold text-brand-700">Totale fattura</td>
                        <td className="px-2 py-2.5 text-right">
                          <span className="text-base font-black text-brand-700">€{totalFattura.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              {items.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Aggiungi almeno un articolo per registrare la fattura.</p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Note</label>
              <textarea value={header.note} onChange={fh('note')} rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                placeholder="Riferimento ordine d'acquisto, numero DDT, osservazioni…" />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            <Button type="submit" disabled={suppliers.length === 0 || items.length === 0}>
              {invoice ? 'Salva modifiche' : 'Registra fattura'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

// ── Delete invoice confirm ─────────────────────────────────────────────────────

function DeleteInvoiceModal({ invoice, onClose, onConfirm }: { invoice: PurchaseInvoice; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">Elimina fattura</h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Stai per eliminare la fattura <span className="font-semibold text-slate-700">"{invoice.numeroFattura}"</span>. Azione irreversibile.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annulla</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">Elimina</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Invoice status helpers ────────────────────────────────────────────────────

const INVOICE_STATUS_BADGE: Record<InvoiceStatus, { tone: 'green' | 'amber' | 'red' | 'slate'; label: string }> = {
  Pagata:     { tone: 'green', label: 'Pagata' },
  DaPagare:   { tone: 'amber', label: 'Da pagare' },
  Scaduta:    { tone: 'red',   label: 'Scaduta' },
  Contestata: { tone: 'slate', label: 'Contestata' },
}

// ── Fatture acquisto tab ───────────────────────────────────────────────────────

function FattureAcquistoTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEMO_SUPPLIERS)
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(buildDemoInvoices)

  // Supplier modals
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [showSupplierDetail, setShowSupplierDetail] = useState<Supplier | null>(null)

  // Invoice modals
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<PurchaseInvoice | null>(null)

  // Filters & UI
  const [supplierFilter, setSupplierFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [view, setView] = useState<'invoices' | 'suppliers'>('invoices')
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null)

  const nextId = () => `local-${Date.now()}`

  // Supplier CRUD
  const handleSaveSupplier = (data: Omit<Supplier, 'id'>) => {
    if (editingSupplier) {
      setSuppliers(ss => ss.map(s => s.id === editingSupplier.id ? { ...s, ...data } : s))
      setEditingSupplier(null)
    } else {
      setSuppliers(ss => [...ss, { id: nextId(), ...data }])
      setCreatingSupplier(false)
    }
  }
  const handleDeleteSupplier = (id: string) => {
    setSuppliers(ss => ss.filter(s => s.id !== id))
    setDeletingSupplier(null)
  }

  // Invoice CRUD
  const handleSaveInvoice = (data: Omit<PurchaseInvoice, 'id' | 'createdAtUtc'>) => {
    if (editingInvoice) {
      setInvoices(ii => ii.map(i => i.id === editingInvoice.id ? { ...i, ...data } : i))
      setEditingInvoice(null)
    } else {
      setInvoices(ii => [{ id: nextId(), createdAtUtc: new Date().toISOString(), ...data }, ...ii])
      setCreatingInvoice(false)
    }
  }
  const handleDeleteInvoice = (id: string) => {
    setInvoices(ii => ii.filter(i => i.id !== id))
    setDeletingInvoice(null)
  }
  const toggleInvoicePaid = (id: string) => {
    setInvoices(ii => ii.map(i => i.id !== id ? i : {
      ...i,
      stato: i.stato === 'Pagata' ? 'DaPagare' : 'Pagata',
      dataPagamento: i.stato !== 'Pagata' ? fmtDate(todayDate) : null,
    }))
  }

  const supplierById = (id: string) => suppliers.find(s => s.id === id)

  // Filtered invoices
  const filtered = invoices.filter(i => {
    if (supplierFilter && i.supplierId !== supplierFilter) return false
    if (statusFilter && i.stato !== statusFilter) return false
    return true
  })

  // KPIs
  const totaleAcquisti = invoices.reduce((s, i) => s + i.totale, 0)
  const daPagare = invoices.filter(i => i.stato === 'DaPagare').reduce((s, i) => s + i.totale, 0)
  const scadute = invoices.filter(i => i.stato === 'Scaduta')
  const ivaACredito = invoices.filter(i => i.stato !== 'Pagata').reduce((s, i) => s + (i.totale - i.imponibile), 0)

  return (
    <div className="space-y-5">
      {/* Modals */}
      {(creatingSupplier || editingSupplier) && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => { setCreatingSupplier(false); setEditingSupplier(null) }}
          onSave={handleSaveSupplier}
        />
      )}
      {deletingSupplier && (
        <DeleteSupplierModal
          supplier={deletingSupplier}
          onClose={() => setDeletingSupplier(null)}
          onConfirm={() => handleDeleteSupplier(deletingSupplier.id)}
        />
      )}
      {(creatingInvoice || editingInvoice) && (
        <PurchaseInvoiceModal
          invoice={editingInvoice}
          suppliers={suppliers}
          onClose={() => { setCreatingInvoice(false); setEditingInvoice(null) }}
          onSave={handleSaveInvoice}
        />
      )}
      {deletingInvoice && (
        <DeleteInvoiceModal
          invoice={deletingInvoice}
          onClose={() => setDeletingInvoice(null)}
          onConfirm={() => handleDeleteInvoice(deletingInvoice.id)}
        />
      )}

      {/* Supplier detail drawer-style modal */}
      {showSupplierDetail && (
        <Modal onClose={() => setShowSupplierDetail(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-800">{showSupplierDetail.ragioneSociale}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{showSupplierDetail.categoria}</p>
              </div>
              <button onClick={() => setShowSupplierDetail(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {[
                ['P. IVA', showSupplierDetail.piva || '—'],
                ['C.F.', showSupplierDetail.cf || '—'],
                ['Email', showSupplierDetail.email || '—'],
                ['Telefono', showSupplierDetail.telefono || '—'],
                ['Indirizzo', showSupplierDetail.indirizzo || '—'],
                ['IBAN', showSupplierDetail.iban || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-400 shrink-0">{k}</span>
                  <span className="text-slate-700 text-right break-all">{v}</span>
                </div>
              ))}
              {showSupplierDetail.note && (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 mt-2">{showSupplierDetail.note}</div>
              )}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Fatture registrate</p>
                <p className="text-lg font-black text-slate-800">
                  {invoices.filter(i => i.supplierId === showSupplierDetail.id).length} fatture ·{' '}
                  €{invoices.filter(i => i.supplierId === showSupplierDetail.id).reduce((s, i) => s + i.totale, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowSupplierDetail(null); setEditingSupplier(showSupplierDetail) }}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">✏ Modifica</button>
                <button onClick={() => { setShowSupplierDetail(null); setDeletingSupplier(showSupplierDetail) }}
                  className="flex-1 rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50">🗑 Elimina</button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Totale acquisti', value: `€${totaleAcquisti.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, sub: `${invoices.length} fatture`, color: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Da pagare', value: `€${daPagare.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, sub: `${invoices.filter(i => i.stato === 'DaPagare').length} fatture aperte`, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Fatture scadute', value: String(scadute.length), sub: scadute.length > 0 ? 'richiedono attenzione' : 'tutto in ordine', color: scadute.length > 0 ? 'text-red-700' : 'text-emerald-700', bg: scadute.length > 0 ? 'bg-red-50' : 'bg-emerald-50' },
          { label: 'IVA da detrarre', value: `€${ivaACredito.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, sub: 'su fatture non pagate', color: 'text-violet-700', bg: 'bg-violet-50' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold mb-1 ${k.bg} ${k.color}`}>{k.sub}</div>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-view switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
          {([['invoices', '🧾 Fatture', invoices.length], ['suppliers', '🏢 Fornitori', suppliers.length]] as const).map(([v, l, count]) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {l}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${view === v ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
            </button>
          ))}
        </div>
        {view === 'invoices'
          ? <Button onClick={() => setCreatingInvoice(true)}>+ Registra fattura</Button>
          : <Button onClick={() => setCreatingSupplier(true)}>+ Nuovo fornitore</Button>
        }
      </div>

      {/* ── INVOICES VIEW ── */}
      {view === 'invoices' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
              <option value="">Tutti i fornitori</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.ragioneSociale}</option>)}
            </select>
            <div className="h-5 w-px bg-slate-200" />
            {([['', 'Tutti gli stati'], ['DaPagare', 'Da pagare'], ['Pagata', 'Pagate'], ['Scaduta', 'Scadute'], ['Contestata', 'Contestate']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === v ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {v === 'Scaduta' && scadute.length > 0 ? `⚠ ${l} (${scadute.length})` : l}
              </button>
            ))}
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl">🧾</p>
                <p className="mt-2 text-sm font-medium text-slate-600">Nessuna fattura trovata.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Fornitore / N° Fattura</th>
                      <th className="px-3 py-3 font-medium hidden md:table-cell">Emissione</th>
                      <th className="px-3 py-3 font-medium">Scadenza</th>
                      <th className="px-3 py-3 font-medium text-right hidden sm:table-cell">Imponibile</th>
                      <th className="px-3 py-3 font-medium text-right">Totale</th>
                      <th className="px-3 py-3 font-medium">Stato</th>
                      <th className="px-3 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(inv => {
                      const sup = supplierById(inv.supplierId)
                      const { tone, label } = INVOICE_STATUS_BADGE[inv.stato]
                      const daysToScad = daysUntil(inv.dataScadenza)
                      const isOverdue = inv.stato !== 'Pagata' && daysToScad < 0
                      const isUrgent = inv.stato === 'DaPagare' && daysToScad >= 0 && daysToScad <= 7
                      const isExpanded = expandedInvoiceId === inv.id
                      const ivaCalc = inv.totale - inv.imponibile
                      return (
                        <>
                          <tr key={inv.id} className={`border-b border-slate-50 ${isOverdue || inv.stato === 'Scaduta' ? 'bg-red-50/30' : isUrgent ? 'bg-amber-50/30' : 'hover:bg-slate-50/60'} ${isExpanded ? 'border-b-0' : ''}`}>
                            <td className="px-5 py-3">
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs transition-colors ${isExpanded ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                  title={isExpanded ? 'Nascondi articoli' : 'Mostra articoli'}
                                >
                                  {isExpanded ? '▲' : '▼'}
                                </button>
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-800 leading-tight">{sup?.ragioneSociale ?? 'Fornitore eliminato'}</p>
                                  <p className="text-xs text-slate-400 font-mono">{inv.numeroFattura}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                                      {inv.items.length} {inv.items.length === 1 ? 'articolo' : 'articoli'}
                                    </span>
                                    {inv.note && <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{inv.note}</p>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 hidden md:table-cell text-xs text-slate-500">
                              {new Date(inv.dataEmissione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </td>
                            <td className="px-3 py-3 text-xs">
                              <p className={`font-medium ${isOverdue || inv.stato === 'Scaduta' ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-slate-600'}`}>
                                {new Date(inv.dataScadenza).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })}
                              </p>
                              {inv.stato === 'Pagata' && inv.dataPagamento
                                ? <p className="text-[10px] text-emerald-600">pag. {new Date(inv.dataPagamento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</p>
                                : inv.stato !== 'Pagata'
                                  ? <p className={`text-[10px] ${isOverdue || inv.stato === 'Scaduta' ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                                      {daysToScad < 0 ? `${Math.abs(daysToScad)}g fa` : daysToScad === 0 ? 'oggi' : `tra ${daysToScad}g`}
                                    </p>
                                  : null
                              }
                            </td>
                            <td className="px-3 py-3 text-right hidden sm:table-cell">
                              <span className="text-slate-600">€{inv.imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                              <p className="text-[10px] text-slate-400">IVA €{ivaCalc.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="font-bold text-slate-800">€{inv.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                            </td>
                            <td className="px-3 py-3">
                              <Badge tone={tone}>{label}</Badge>
                            </td>
                            <td className="px-3 py-3">
                              <RowMenu
                                isPaid={inv.stato === 'Pagata'}
                                onTogglePaid={() => toggleInvoicePaid(inv.id)}
                                onEdit={() => setEditingInvoice(inv)}
                                onDelete={() => setDeletingInvoice(inv)}
                              />
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${inv.id}-items`} className="border-b border-slate-100">
                              <td colSpan={7} className="px-5 pb-3 pt-0">
                                <div className="ml-7 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
                                        <th className="px-3 py-1.5 font-medium">Descrizione</th>
                                        <th className="px-2 py-1.5 font-medium">U.M.</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Qtà</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Prezzo unit.</th>
                                        <th className="px-2 py-1.5 font-medium text-right">IVA %</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Imponibile</th>
                                        <th className="px-2 py-1.5 font-medium text-right">Tot. lordo</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {inv.items.map(it => (
                                        <tr key={it.id} className="bg-white">
                                          <td className="px-3 py-1.5 text-slate-700 font-medium">{it.descrizione}</td>
                                          <td className="px-2 py-1.5 text-slate-400">{it.unitaMisura}</td>
                                          <td className="px-2 py-1.5 text-right text-slate-600">{it.quantita}</td>
                                          <td className="px-2 py-1.5 text-right text-slate-600">€{it.prezzoUnitario.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                                          <td className="px-2 py-1.5 text-right text-slate-400">{it.aliquotaIva}%</td>
                                          <td className="px-2 py-1.5 text-right text-slate-600">€{itemImponibile(it).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                                          <td className="px-2 py-1.5 text-right font-semibold text-slate-700">€{itemTotale(it).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-5 py-3" colSpan={4}>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Totale ({filtered.length} fatture)</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-black text-slate-800">€{filtered.reduce((s, i) => s + i.totale, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── SUPPLIERS VIEW ── */}
      {view === 'suppliers' && (
        <div className="space-y-3">
          {suppliers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
              <p className="text-3xl mb-2">🏢</p>
              <p className="text-sm font-medium text-slate-600 mb-3">Nessun fornitore registrato.</p>
              <Button onClick={() => setCreatingSupplier(true)}>+ Aggiungi il primo fornitore</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {suppliers.map(s => {
                const supInvoices = invoices.filter(i => i.supplierId === s.id)
                const totalSup = supInvoices.reduce((acc, i) => acc + i.totale, 0)
                const pending = supInvoices.filter(i => i.stato === 'DaPagare' || i.stato === 'Scaduta').length
                return (
                  <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                          🏢
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{s.ragioneSociale}</p>
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 mt-0.5">{s.categoria}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setEditingSupplier(s)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-sm">✏</button>
                        <button onClick={() => setDeletingSupplier(s)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors text-sm">🗑</button>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-slate-500 mb-3">
                      {s.email && <p className="flex items-center gap-1.5"><span>✉</span>{s.email}</p>}
                      {s.telefono && <p className="flex items-center gap-1.5"><span>📞</span>{s.telefono}</p>}
                      {s.piva && <p className="flex items-center gap-1.5"><span>🏦</span>P.IVA {s.piva}</p>}
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400">Totale acquistato</p>
                        <p className="font-black text-slate-800 text-sm">€{totalSup.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">{supInvoices.length} fatture</p>
                        {pending > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{pending} da saldare</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSupplierDetail(s)}
                      className="mt-3 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Vedi dettaglio →
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentType = 'Fisso' | 'Straordinario'
type PaymentCategory =
  | 'Affitto'
  | 'Stipendi'
  | 'Utenze'
  | 'Assicurazioni'
  | 'Manutenzione'
  | 'Attrezzature'
  | 'Marketing'
  | 'Software'
  | 'Fornitori'
  | 'Tasse'
  | 'Altro'

interface Payment {
  id: string
  description: string
  category: PaymentCategory
  type: PaymentType
  amount: number
  currency: string
  dueDate: string
  paidDate: string | null
  isPaid: boolean
  recurrenceMonths: number | null
  notes: string | null
  createdAtUtc: string
}

// ── Staff data (mirrors Staff.tsx demo — used for Stipendi tab) ───────────────
interface StaffSalaryEntry {
  id: string; fullName: string; role: string; contractType: string
  monthlySalary: number; isActive: boolean; email: string
}
const ROLE_LABEL: Record<string, string> = {
  GymManager: 'Direttore', Trainer: 'Istruttore', Nutritionist: 'Nutrizionista',
  Physiotherapist: 'Fisioterapista', Receptionist: 'Reception',
}
const STAFF_LIST: StaffSalaryEntry[] = [
  { id: 'st1', fullName: 'Carlo Ferrara',   role: 'GymManager',     contractType: 'Dipendente',    monthlySalary: 2800, isActive: true,  email: 'carlo@fitcore.it'   },
  { id: 'st2', fullName: 'Laura Bianchi',   role: 'Trainer',         contractType: 'Dipendente',    monthlySalary: 1900, isActive: true,  email: 'laura@fitcore.it'   },
  { id: 'st3', fullName: 'Marco Verdi',     role: 'Trainer',         contractType: 'Dipendente',    monthlySalary: 2100, isActive: true,  email: 'marco@fitcore.it'   },
  { id: 'st4', fullName: 'Sara Esposito',   role: 'Trainer',         contractType: 'Collaboratore', monthlySalary: 1200, isActive: true,  email: 'sara@fitcore.it'    },
  { id: 'st5', fullName: 'Fabio De Luca',   role: 'Trainer',         contractType: 'Dipendente',    monthlySalary: 2000, isActive: true,  email: 'fabio@fitcore.it'   },
  { id: 'st6', fullName: 'Chiara Lombardi', role: 'Trainer',         contractType: 'Collaboratore', monthlySalary: 1100, isActive: true,  email: 'chiara@fitcore.it'  },
  { id: 'st7', fullName: 'Andrea Russo',    role: 'Nutritionist',    contractType: 'Partita IVA',   monthlySalary: 1800, isActive: true,  email: 'andrea@fitcore.it'  },
  { id: 'st8', fullName: 'Valentina Greco', role: 'Physiotherapist', contractType: 'Partita IVA',   monthlySalary: 1600, isActive: true,  email: 'vale@fitcore.it'    },
  { id: 'st9', fullName: 'Roberto Martini', role: 'Receptionist',    contractType: 'Dipendente',    monthlySalary: 1400, isActive: true,  email: 'roberto@fitcore.it' },
  { id: 'stX', fullName: 'Giulia Moretti',  role: 'Receptionist',    contractType: 'Dipendente',    monthlySalary: 1400, isActive: false, email: 'giuliam@fitcore.it' },
]

interface SalaryRecord {
  staffId: string; month: string; isPaid: boolean; paidDate: string | null
  amount: number; notes: string | null
}

const currentMonthKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function buildDemoSalaries(): SalaryRecord[] {
  const mk = currentMonthKey()
  return STAFF_LIST.filter(s => s.isActive).map(s => ({
    staffId: s.id, month: mk, isPaid: false, paidDate: null,
    amount: s.monthlySalary, notes: null,
  }))
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const today = new Date()
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
const fmt = (d: Date) => d.toISOString().slice(0, 10)

const DEMO_PAYMENTS: Payment[] = [
  { id: 'd1', description: 'Affitto locale palestra', category: 'Affitto', type: 'Fisso', amount: 2800, currency: 'EUR', dueDate: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), paidDate: fmt(new Date(today.getFullYear(), today.getMonth(), 2)), isPaid: true, recurrenceMonths: 1, notes: 'Bonifico a Immobiliare Rossi Srl', createdAtUtc: new Date().toISOString() },
  { id: 'd3', description: 'Energia elettrica', category: 'Utenze', type: 'Fisso', amount: 620, currency: 'EUR', dueDate: fmt(new Date(today.getFullYear(), today.getMonth(), 20)), paidDate: fmt(new Date(today.getFullYear(), today.getMonth(), 19)), isPaid: true, recurrenceMonths: 1, notes: null, createdAtUtc: new Date().toISOString() },
  { id: 'd4', description: 'Abbonamento Oplyfit SaaS', category: 'Software', type: 'Fisso', amount: 199, currency: 'EUR', dueDate: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), paidDate: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), isPaid: true, recurrenceMonths: 1, notes: null, createdAtUtc: new Date().toISOString() },
  { id: 'd5', description: 'Assicurazione RCT palestra', category: 'Assicurazioni', type: 'Fisso', amount: 1400, currency: 'EUR', dueDate: fmt(new Date(today.getFullYear(), 0, 15)), paidDate: fmt(new Date(today.getFullYear(), 0, 14)), isPaid: true, recurrenceMonths: 12, notes: 'Polizza annuale UnipolSai', createdAtUtc: new Date().toISOString() },
  { id: 'd6', description: 'Sostituzione tapis roulant sala 2', category: 'Attrezzature', type: 'Straordinario', amount: 3500, currency: 'EUR', dueDate: fmt(new Date(today.getFullYear(), today.getMonth(), 15)), paidDate: null, isPaid: false, recurrenceMonths: null, notes: 'Technogym Run 1000 — fattura TG-2025-0812', createdAtUtc: new Date().toISOString() },
  { id: 'd7', description: 'Campagna Meta Ads giugno', category: 'Marketing', type: 'Straordinario', amount: 800, currency: 'EUR', dueDate: fmt(nextMonth), paidDate: null, isPaid: false, recurrenceMonths: null, notes: 'Budget approvato in CdA del 10/06', createdAtUtc: new Date().toISOString() },
  { id: 'd8', description: 'IRAP + IRES acconto giugno', category: 'Tasse', type: 'Straordinario', amount: 2240, currency: 'EUR', dueDate: fmt(new Date(today.getFullYear(), 5, 30)), paidDate: null, isPaid: false, recurrenceMonths: null, notes: null, createdAtUtc: new Date().toISOString() },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORIES: PaymentCategory[] = [
  'Affitto', 'Stipendi', 'Utenze', 'Assicurazioni', 'Manutenzione',
  'Attrezzature', 'Marketing', 'Software', 'Fornitori', 'Tasse', 'Altro',
]

const CAT_ICON: Record<PaymentCategory, string> = {
  Affitto: '🏠', Stipendi: '👥', Utenze: '⚡', Assicurazioni: '🛡️',
  Manutenzione: '🔧', Attrezzature: '🏋️', Marketing: '📢',
  Software: '💻', Fornitori: '📦', Tasse: '📋', Altro: '💼',
}

const CAT_COLOR: Record<PaymentCategory, string> = {
  Affitto: 'bg-blue-50 text-blue-700', Stipendi: 'bg-violet-50 text-violet-700',
  Utenze: 'bg-amber-50 text-amber-700', Assicurazioni: 'bg-teal-50 text-teal-700',
  Manutenzione: 'bg-orange-50 text-orange-700', Attrezzature: 'bg-brand-50 text-brand-700',
  Marketing: 'bg-pink-50 text-pink-700', Software: 'bg-slate-50 text-slate-600',
  Fornitori: 'bg-emerald-50 text-emerald-700', Tasse: 'bg-red-50 text-red-700', Altro: 'bg-slate-50 text-slate-500',
}

const selectCls = 'rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full'

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(diff / 86400000)
}

// ── Modal backdrop ─────────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── Row menu ─────────────────────────────────────────────────────────────────
function RowMenu({ onEdit, onDelete, onTogglePaid, isPaid }: { onEdit: () => void; onDelete: () => void; onTogglePaid: () => void; isPaid: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5">
          <button onClick={() => { setOpen(false); onTogglePaid() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            {isPaid
              ? <><span className="text-amber-500">↩</span> Segna non pagato</>
              : <><span className="text-emerald-500">✓</span> Segna pagato</>
            }
          </button>
          <button onClick={() => { setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            </svg>
            Modifica
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
            Elimina
          </button>
        </div>
      )}
    </div>
  )
}

// ── Payment form (create + edit) ───────────────────────────────────────────────
interface PaymentFormData {
  description: string; category: PaymentCategory; type: PaymentType
  amount: string; dueDate: string; isPaid: boolean; paidDate: string
  recurrenceMonths: string; notes: string
}

function emptyForm(): PaymentFormData {
  return { description: '', category: 'Affitto', type: 'Fisso', amount: '', dueDate: fmt(today), isPaid: false, paidDate: '', recurrenceMonths: '1', notes: '' }
}

function fromPayment(p: Payment): PaymentFormData {
  return {
    description: p.description, category: p.category, type: p.type,
    amount: String(p.amount), dueDate: p.dueDate, isPaid: p.isPaid,
    paidDate: p.paidDate ?? '', recurrenceMonths: p.recurrenceMonths !== null ? String(p.recurrenceMonths) : '',
    notes: p.notes ?? '',
  }
}

function PaymentModal({ payment, onClose, onSave }: {
  payment: Payment | null; onClose: () => void; onSave: (data: Omit<Payment, 'id' | 'createdAtUtc'>) => void
}) {
  const [form, setForm] = useState<PaymentFormData>(payment ? fromPayment(payment) : emptyForm())
  const f = (k: keyof PaymentFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))
  const cb = (k: keyof PaymentFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.checked }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      description: form.description,
      category: form.category,
      type: form.type,
      amount: parseFloat(form.amount),
      currency: 'EUR',
      dueDate: form.dueDate,
      isPaid: form.isPaid,
      paidDate: form.isPaid && form.paidDate ? form.paidDate : null,
      recurrenceMonths: form.type === 'Fisso' && form.recurrenceMonths ? parseInt(form.recurrenceMonths) : null,
      notes: form.notes || null,
    })
  }

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-800">{payment ? 'Modifica pagamento' : 'Nuovo pagamento'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrizione *</label>
            <Input value={form.description} onChange={f('description')} required placeholder="Es. Affitto locale gennaio" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
              <select className={selectCls} value={form.category} onChange={f('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select className={selectCls} value={form.type} onChange={f('type')}>
                <option value="Fisso">Fisso (ricorrente)</option>
                <option value="Straordinario">Straordinario (una tantum)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Importo (€) *</label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={f('amount')} required placeholder="0.00" />
            </div>
            {form.type === 'Fisso' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ricorrenza (mesi)</label>
                <select className={selectCls} value={form.recurrenceMonths} onChange={f('recurrenceMonths')}>
                  <option value="1">Mensile</option>
                  <option value="3">Trimestrale</option>
                  <option value="6">Semestrale</option>
                  <option value="12">Annuale</option>
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Scadenza</label>
              <Input type="date" value={form.dueDate} onChange={f('dueDate')} required />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <input type="checkbox" checked={form.isPaid} onChange={cb('isPaid')} className="h-4 w-4 rounded accent-emerald-600" />
                <span className="text-sm text-slate-700">Già pagato</span>
              </label>
            </div>
          </div>
          {form.isPaid && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data pagamento</label>
              <Input type="date" value={form.paidDate} onChange={f('paidDate')} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Note</label>
            <textarea value={form.notes} onChange={f('notes')} rows={2}
              placeholder="Riferimento fattura, IBAN, note interne…"
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            <Button type="submit">{payment ? 'Salva modifiche' : 'Aggiungi pagamento'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteModal({ payment, onClose, onConfirm }: { payment: Payment; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">Elimina pagamento</h3>
        <p className="text-center text-sm text-slate-500 mb-6">Stai per eliminare <span className="font-semibold text-slate-700">"{payment.description}"</span>. Azione irreversibile.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annulla</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">Elimina</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Edit salary modal ────────────────────────────────────────────────────────
function EditSalaryModal({ entry, staff, onClose, onSave }: {
  entry: SalaryRecord; staff: StaffSalaryEntry; onClose: () => void
  onSave: (amount: number, notes: string | null) => void
}) {
  const [amount, setAmount] = useState(String(entry.amount))
  const [notes, setNotes] = useState(entry.notes ?? '')
  const cls = 'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-800">Modifica compenso — {staff.fullName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Compenso mensile lordo (€)</label>
            <input type="number" min="0" step="50" className={cls} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Note (opzionale)</label>
            <textarea className={cls + ' resize-none'} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Riferimento bonifico, dettagli…" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
            <button onClick={() => onSave(parseFloat(amount) || entry.amount, notes || null)}
              className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700">Salva</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Stipendi tab ──────────────────────────────────────────────────────────────
const CONTRACT_COLOR: Record<string, string> = {
  Dipendente:    'bg-emerald-100 text-emerald-700',
  Collaboratore: 'bg-blue-100 text-blue-700',
  'Partita IVA': 'bg-violet-100 text-violet-700',
}
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
const AVATAR_COLORS = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-red-100 text-red-700','bg-teal-100 text-teal-700']

function StipendiTab() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>(buildDemoSalaries)
  const [editingSalary, setEditingSalary] = useState<{ record: SalaryRecord; staff: StaffSalaryEntry } | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const activeStaff = STAFF_LIST.filter(s => showInactive ? true : s.isActive)

  const getRecord = (staffId: string) => salaries.find(s => s.staffId === staffId)

  const togglePaid = (staffId: string) => {
    setSalaries(prev => prev.map(r => r.staffId !== staffId ? r : {
      ...r, isPaid: !r.isPaid, paidDate: !r.isPaid ? fmt(today) : null,
    }))
  }

  const handleSalaryEdit = (staffId: string, amount: number, notes: string | null) => {
    setSalaries(prev => prev.map(r => r.staffId !== staffId ? r : { ...r, amount, notes }))
    setEditingSalary(null)
  }

  const totalMassaSalariale = STAFF_LIST.filter(s => s.isActive).reduce((s, x) => s + x.monthlySalary, 0)
  const totalPagati = salaries.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0)
  const totalDaPagare = salaries.filter(r => !r.isPaid).reduce((s, r) => s + r.amount, 0)
  const nPagati = salaries.filter(r => r.isPaid).length
  const scadenzaPagamenti = fmt(new Date(today.getFullYear(), today.getMonth(), 27))
  const daysLeft = daysUntil(scadenzaPagamenti)

  const monthLabel = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      {editingSalary && (
        <EditSalaryModal
          entry={editingSalary.record}
          staff={editingSalary.staff}
          onClose={() => setEditingSalary(null)}
          onSave={(amount, notes) => handleSalaryEdit(editingSalary.staff.id, amount, notes)}
        />
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Massa salariale/mese', value: `€${totalMassaSalariale.toLocaleString('it-IT')}`, color: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Pagati questo mese', value: `${nPagati} / ${salaries.length}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Da pagare', value: `€${totalDaPagare.toLocaleString('it-IT')}`, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Scadenza stipendi', value: daysLeft < 0 ? 'Scaduta' : daysLeft === 0 ? 'Oggi' : `tra ${daysLeft}gg`, color: daysLeft <= 5 ? 'text-red-700' : 'text-slate-700', bg: daysLeft <= 5 ? 'bg-red-50' : 'bg-slate-50' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold mb-1 ${k.bg} ${k.color}`}>{k.label}</div>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-slate-700 capitalize">Competenze — {monthLabel}</h2>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
          Mostra inattivi
        </label>
      </div>

      {/* Tabella stipendi */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Dipendente</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Contratto</th>
                <th className="px-4 py-3 font-medium text-right">Lordo mensile</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Note</th>
                <th className="px-4 py-3 font-medium">Stato</th>
                <th className="px-4 py-3 font-medium w-28 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeStaff.map((s) => {
                const rec = getRecord(s.id)
                const color = AVATAR_COLORS[s.fullName.charCodeAt(0) % AVATAR_COLORS.length]
                return (
                  <tr key={s.id} className={`hover:bg-slate-50/60 transition-colors ${!s.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
                          {initials(s.fullName)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 leading-tight">{s.fullName}</p>
                          <p className="text-xs text-slate-400">{ROLE_LABEL[s.role] ?? s.role} · {s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTRACT_COLOR[s.contractType] ?? 'bg-slate-100 text-slate-500'}`}>
                        {s.contractType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-slate-800">€{(rec?.amount ?? s.monthlySalary).toLocaleString('it-IT')}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400 max-w-[160px] truncate">
                      {rec?.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {!s.isActive
                        ? <Badge tone="slate">Inattivo</Badge>
                        : rec?.isPaid
                          ? <div>
                              <Badge tone="green">Pagato</Badge>
                              {rec.paidDate && <p className="text-[10px] text-slate-400 mt-0.5">{new Date(rec.paidDate).toLocaleDateString('it-IT')}</p>}
                            </div>
                          : <Badge tone="amber">Da pagare</Badge>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {s.isActive && rec && (
                          <button
                            onClick={() => togglePaid(s.id)}
                            title={rec.isPaid ? 'Segna non pagato' : 'Segna pagato'}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${rec.isPaid ? 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-700' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                            {rec.isPaid ? '↩ Annulla' : '✓ Paga'}
                          </button>
                        )}
                        <button
                          onClick={() => rec && setEditingSalary({ record: rec, staff: s })}
                          title="Modifica compenso"
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                          ✏
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-5 py-3" colSpan={2}>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Totale</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-black text-slate-800">€{totalMassaSalariale.toLocaleString('it-IT')}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell" />
                <td className="px-4 py-3">
                  <span className="text-xs text-emerald-600 font-semibold">€{totalPagati.toLocaleString('it-IT')} pagati</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Riepilogo per tipo contratto */}
      <div className="grid grid-cols-3 gap-3">
        {(['Dipendente', 'Collaboratore', 'Partita IVA'] as const).map(ct => {
          const members = STAFF_LIST.filter(s => s.isActive && s.contractType === ct)
          const total = members.reduce((s, m) => s + m.monthlySalary, 0)
          return (
            <div key={ct} className="rounded-xl border border-slate-200 bg-white p-4">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTRACT_COLOR[ct]}`}>{ct}</span>
              <p className="mt-2 text-lg font-black text-slate-800">€{total.toLocaleString('it-IT')}</p>
              <p className="text-xs text-slate-400">{members.length} {members.length === 1 ? 'persona' : 'persone'}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Payments() {
  const [tab, setTab] = useState<'spese' | 'stipendi' | 'fatture'>('spese')
  const [payments, setPayments] = useState<Payment[]>(DEMO_PAYMENTS)
  const [typeFilter, setTypeFilter] = useState<PaymentType | ''>('')
  const [catFilter, setCatFilter] = useState<PaymentCategory | ''>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState<Payment | null>(null)

  const nextId = () => `local-${Date.now()}`

  const handleSave = (data: Omit<Payment, 'id' | 'createdAtUtc'>) => {
    if (editing) {
      setPayments(ps => ps.map(p => p.id === editing.id ? { ...p, ...data } : p))
      setEditing(null)
    } else {
      setPayments(ps => [{ id: nextId(), createdAtUtc: new Date().toISOString(), ...data }, ...ps])
      setCreating(false)
    }
  }

  const handleDelete = (id: string) => {
    setPayments(ps => ps.filter(p => p.id !== id))
    setDeleting(null)
  }

  const togglePaid = (id: string) => {
    setPayments(ps => ps.map(p => p.id !== id ? p : {
      ...p, isPaid: !p.isPaid, paidDate: !p.isPaid ? fmt(today) : null,
    }))
  }

  const filtered = payments.filter(p => {
    if (typeFilter && p.type !== typeFilter) return false
    if (catFilter && p.category !== catFilter) return false
    if (statusFilter === 'paid' && !p.isPaid) return false
    if (statusFilter === 'unpaid' && p.isPaid) return false
    if (statusFilter === 'overdue' && (p.isPaid || daysUntil(p.dueDate) >= 0)) return false
    return true
  })

  // KPI
  const totalMonthly = payments.filter(p => p.type === 'Fisso' && p.recurrenceMonths === 1).reduce((s, p) => s + p.amount, 0)
  const totalPendingMonth = payments.filter(p => !p.isPaid).reduce((s, p) => s + p.amount, 0)
  const overdue = payments.filter(p => !p.isPaid && daysUntil(p.dueDate) < 0)
  const paidThisMonth = payments.filter(p => p.isPaid && p.paidDate?.startsWith(fmt(today).slice(0, 7))).reduce((s, p) => s + p.amount, 0)

  // Spesa per categoria (top 5)
  const byCat = CATEGORIES.map(c => ({
    cat: c, total: payments.filter(p => p.category === c).reduce((s, p) => s + p.amount, 0),
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total).slice(0, 5)
  const maxCat = byCat[0]?.total ?? 1

  return (
    <div className="space-y-6">
      {creating && <PaymentModal payment={null} onClose={() => setCreating(false)} onSave={handleSave} />}
      {editing && <PaymentModal payment={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      {deleting && <DeleteModal payment={deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting.id)} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagamenti</h1>
          <p className="text-sm text-slate-500 mt-0.5">Costi fissi, spese straordinarie, stipendi e fatture di acquisto.</p>
        </div>
        {tab === 'spese' && <Button onClick={() => setCreating(true)}>+ Nuovo pagamento</Button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([['spese', '💸 Spese operative'], ['stipendi', '👥 Stipendi staff'], ['fatture', '🧾 Fatture acquisto']] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'stipendi' && <StipendiTab />}
      {tab === 'fatture' && <FattureAcquistoTab />}

      {tab === 'spese' && <>
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Costi fissi / mese', value: `€${totalMonthly.toLocaleString('it-IT')}`, sub: 'ricorrenti mensili', color: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Da pagare', value: `€${totalPendingMonth.toLocaleString('it-IT')}`, sub: `${payments.filter(p => !p.isPaid).length} pagamenti aperti`, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Scaduti', value: String(overdue.length), sub: overdue.length > 0 ? 'richiedono attenzione' : 'tutto in ordine', color: overdue.length > 0 ? 'text-red-700' : 'text-emerald-700', bg: overdue.length > 0 ? 'bg-red-50' : 'bg-emerald-50' },
          { label: 'Pagato questo mese', value: `€${paidThisMonth.toLocaleString('it-IT')}`, sub: 'uscite confermate', color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold mb-1 ${k.bg} ${k.color}`}>{k.sub}</div>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Layout 2 colonne: tabella + sidebar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">

        {/* Lista pagamenti — 3/4 */}
        <div className="lg:col-span-3 space-y-4">

          {/* Filtri */}
          <div className="flex flex-wrap gap-2">
            {/* Stato */}
            {([['all', 'Tutti'], ['unpaid', 'Da pagare'], ['overdue', 'Scaduti'], ['paid', 'Pagati']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === v ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {v === 'overdue' && overdue.length > 0 ? `⚠ ${l} (${overdue.length})` : l}
              </button>
            ))}
            <div className="h-5 w-px bg-slate-200 self-center" />
            {/* Tipo */}
            {([['', 'Tutti i tipi'], ['Fisso', 'Fissi'], ['Straordinario', 'Straordinari']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${typeFilter === v ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Categoria filter */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCatFilter('')}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${catFilter === '' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              Tutte
            </button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c === catFilter ? '' : c)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${catFilter === c ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {CAT_ICON[c]} {c}
              </button>
            ))}
          </div>

          {/* Tabella */}
          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl">💸</p>
                <p className="mt-2 text-sm font-medium text-slate-600">Nessun pagamento trovato.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Descrizione</th>
                      <th className="px-3 py-3 font-medium hidden sm:table-cell">Tipo</th>
                      <th className="px-3 py-3 font-medium">Scadenza</th>
                      <th className="px-3 py-3 font-medium text-right">Importo</th>
                      <th className="px-3 py-3 font-medium">Stato</th>
                      <th className="px-3 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const days = daysUntil(p.dueDate)
                      const isOverdue = !p.isPaid && days < 0
                      const isUrgent = !p.isPaid && days >= 0 && days <= 5
                      return (
                        <tr key={p.id} className={`border-b border-slate-50 last:border-0 ${isOverdue ? 'bg-red-50/40' : isUrgent ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${CAT_COLOR[p.category]}`}>
                                {CAT_ICON[p.category]}
                              </span>
                              <div>
                                <p className="font-medium text-slate-800 leading-tight">{p.description}</p>
                                <p className="text-xs text-slate-400">{p.category}{p.recurrenceMonths === 1 ? ' · mensile' : p.recurrenceMonths ? ` · ogni ${p.recurrenceMonths}m` : ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.type === 'Fisso' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                              {p.type}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs">
                            <p className={`font-medium ${isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-slate-600'}`}>
                              {new Date(p.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                            </p>
                            {!p.isPaid && (
                              <p className={`text-[10px] ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                                {isOverdue ? `${Math.abs(days)}g fa` : days === 0 ? 'oggi' : `tra ${days}g`}
                              </p>
                            )}
                            {p.isPaid && p.paidDate && (
                              <p className="text-[10px] text-emerald-600">pagato {new Date(p.paidDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</p>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-bold text-slate-800">€{p.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-3 py-3">
                            {p.isPaid
                              ? <Badge tone="green">Pagato</Badge>
                              : isOverdue
                                ? <Badge tone="red">Scaduto</Badge>
                                : <Badge tone="amber">In attesa</Badge>
                            }
                          </td>
                          <td className="px-3 py-3">
                            <RowMenu
                              isPaid={p.isPaid}
                              onTogglePaid={() => togglePaid(p.id)}
                              onEdit={() => setEditing(p)}
                              onDelete={() => setDeleting(p)}
                            />
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

        {/* Sidebar — 1/4 */}
        <div className="space-y-4">

          {/* Spesa per categoria */}
          <Card className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Spesa per categoria</h3>
            <div className="space-y-2.5">
              {byCat.map(({ cat, total }) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-slate-600">{CAT_ICON[cat]} {cat}</span>
                    <span className="font-semibold text-slate-700">€{total.toLocaleString('it-IT')}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(total / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Prossimi in scadenza */}
          <Card className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Prossime scadenze</h3>
            <div className="space-y-2">
              {payments
                .filter(p => !p.isPaid)
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map(p => {
                  const days = daysUntil(p.dueDate)
                  const overdue = days < 0
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{p.description}</p>
                        <p className="text-[10px] text-slate-400">{new Date(p.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${overdue ? 'bg-red-100 text-red-700' : days <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {overdue ? `−${Math.abs(days)}g` : days === 0 ? 'oggi' : `+${days}g`}
                      </span>
                    </div>
                  )
                })}
              {payments.filter(p => !p.isPaid).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Tutto pagato 🎉</p>
              )}
            </div>
          </Card>

          {/* Riepilogo mese */}
          <Card className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Riepilogo mensile</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Costi fissi</span><span className="font-semibold text-slate-700">€{totalMonthly.toLocaleString('it-IT')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Straordinari</span><span className="font-semibold text-slate-700">€{payments.filter(p => p.type === 'Straordinario').reduce((s, p) => s + p.amount, 0).toLocaleString('it-IT')}</span></div>
              <div className="border-t border-slate-100 pt-2 flex justify-between"><span className="font-semibold text-slate-600">Totale uscite</span><span className="font-black text-red-700">€{payments.reduce((s, p) => s + p.amount, 0).toLocaleString('it-IT')}</span></div>
            </div>
          </Card>
        </div>
      </div>
      </>}
    </div>
  )
}
