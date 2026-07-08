import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface MerchProductDto {
  id: string; name: string; description: string | null; category: string
  price: number; currency: string; thumbnailUrl: string; stockQty: number | null
  sizes: string[] | null; isActive: boolean
}
interface MerchOrderDto {
  id: string; memberId: string; productId: string; productName: string
  size: string | null; quantity: number; totalPrice: number; currency: string
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  trackingCode: string | null; createdAtUtc: string
}

// ── Demo data ─────────────────────────────────────────────────────────────────
function dAgo(n: number) { const d = new Date('2026-06-25'); d.setDate(d.getDate() - n); return d.toISOString() }

const DEMO_PRODUCTS: MerchProductDto[] = [
  { id: 'm1', name: 'T-Shirt Oplyfit Performance',   description: 'Tessuto tecnico traspirante 100% poliestere riciclato. Logo Oplyfit sul petto.',        category: 'Abbigliamento', price: 29.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 48,  sizes: ['XS','S','M','L','XL','XXL'], isActive: true  },
  { id: 'm2', name: 'Felpa Oplyfit con Cappuccio',   description: 'Felpa premium in cotone organico. Fit oversize, tasche laterali, zip nascosta.',         category: 'Abbigliamento', price: 59.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 22,  sizes: ['S','M','L','XL'],            isActive: true  },
  { id: 'm3', name: 'Leggings Oplyfit Pro',          description: 'Compressione graduata, cuciture piatte, tasche laterali. 80% nylon/20% lycra.',          category: 'Abbigliamento', price: 44.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 18,  sizes: ['XS','S','M','L'],            isActive: true  },
  { id: 'm4', name: 'Tank Top Oplyfit',              description: 'Canotta ultra-leggera con back aperto. Ideale per cardio e allenamento funzionale.',     category: 'Abbigliamento', price: 19.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 35,  sizes: ['S','M','L','XL'],            isActive: true  },
  { id: 'm5', name: 'Borraccia Termica 750ml',       description: 'Acciaio inox 18/8, doppia parete. Mantiene freddo 24h, caldo 12h. Logo laser.',         category: 'Accessori',     price: 24.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 40,  sizes: null,                          isActive: true  },
  { id: 'm6', name: 'Sacca Palestra Oplyfit',        description: 'Sacca sport in nylon impermeabile 20L. Scarpa separata, gancio moschettone.',            category: 'Accessori',     price: 34.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 15,  sizes: null,                          isActive: true  },
  { id: 'm7', name: 'Cappellino Oplyfit Logo',       description: 'Berretto regolabile, ricamo frontale Oplyfit, tagliatura curva.',                       category: 'Accessori',     price: 17.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 50,  sizes: null,                          isActive: true  },
  { id: 'm8', name: 'Proteina Whey Oplyfit 1kg',     description: 'Whey concentrate 80% proteine. Gusti: Cioccolato, Vaniglia, Fragola. Made in Italy.',   category: 'Nutrizione',    price: 39.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 25,  sizes: null,                          isActive: true  },
  { id: 'm9', name: 'Shaker Oplyfit 700ml',          description: 'Shaker con griglia interna antigrumi e chiusura click-lock. BPA free.',                 category: 'Accessori',     price: 9.99,  currency: 'EUR', thumbnailUrl: '/stub', stockQty: 60,  sizes: null,                          isActive: true  },
  { id: 'm10',name: 'Creatina Monoidrato 300g',      description: 'Creatina micronizzata pura 99,9%. Senza additivi, 60 porzioni da 5g.',                  category: 'Nutrizione',    price: 19.99, currency: 'EUR', thumbnailUrl: '/stub', stockQty: 30,  sizes: null,                          isActive: false },
]
const DEMO_ORDERS: MerchOrderDto[] = [
  { id: 'mo1', memberId: 'dm2', productId: 'm1', productName: 'T-Shirt Oplyfit Performance', size: 'L',  quantity: 2, totalPrice: 59.98, currency: 'EUR', status: 'Delivered',  trackingCode: 'GLS123456789IT', createdAtUtc: dAgo(30) },
  { id: 'mo2', memberId: 'dm1', productId: 'm2', productName: 'Felpa Oplyfit con Cappuccio', size: 'M',  quantity: 1, totalPrice: 59.99, currency: 'EUR', status: 'Delivered',  trackingCode: 'GLS987654321IT', createdAtUtc: dAgo(25) },
  { id: 'mo3', memberId: 'dm3', productId: 'm5', productName: 'Borraccia Termica 750ml',     size: null, quantity: 1, totalPrice: 24.99, currency: 'EUR', status: 'Shipped',    trackingCode: 'BRT456123IT',    createdAtUtc: dAgo(8)  },
  { id: 'mo4', memberId: 'dm2', productId: 'm8', productName: 'Proteina Whey Oplyfit 1kg',   size: null, quantity: 2, totalPrice: 79.98, currency: 'EUR', status: 'Processing', trackingCode: null,              createdAtUtc: dAgo(4)  },
  { id: 'mo5', memberId: 'dm4', productId: 'm9', productName: 'Shaker Oplyfit 700ml',         size: null, quantity: 1, totalPrice: 9.99,  currency: 'EUR', status: 'Pending',    trackingCode: null,              createdAtUtc: dAgo(2)  },
  { id: 'mo6', memberId: 'dm1', productId: 'm3', productName: 'Leggings Oplyfit Pro',         size: 'S',  quantity: 1, totalPrice: 44.99, currency: 'EUR', status: 'Pending',    trackingCode: null,              createdAtUtc: dAgo(1)  },
  { id: 'mo7', memberId: 'dm3', productId: 'm6', productName: 'Sacca Palestra Oplyfit',       size: null, quantity: 1, totalPrice: 34.99, currency: 'EUR', status: 'Cancelled',  trackingCode: null,              createdAtUtc: dAgo(15) },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORIES = ['Abbigliamento', 'Accessori', 'Nutrizione']
const CAT_GRADIENT: Record<string, string> = {
  Abbigliamento: 'from-violet-400 to-indigo-600',
  Accessori:     'from-slate-400 to-slate-600',
  Nutrizione:    'from-emerald-400 to-teal-600',
}
const CAT_EMOJI: Record<string, string> = { Abbigliamento: '👕', Accessori: '🎒', Nutrizione: '💊' }
const STATUS_CHIP: Record<string, string> = {
  Pending:    'bg-amber-100 text-amber-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped:    'bg-violet-100 text-violet-700',
  Delivered:  'bg-emerald-100 text-emerald-700',
  Cancelled:  'bg-red-100 text-red-600',
}
const STATUS_IT: Record<string, string> = {
  Pending: 'In attesa', Processing: 'In lavorazione',
  Shipped: 'Spedito', Delivered: 'Consegnato', Cancelled: 'Cancellato',
}
const MEMBER_NAMES: Record<string, string> = {
  dm1: 'Giulia Ferretti', dm2: 'Marco Bianchi', dm3: 'Alessia Romano', dm4: 'Roberto Martini',
}

// ── Component ─────────────────────────────────────────────────────────────────
type Tab = 'catalog' | 'orders'
export default function Merch() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('catalog')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [orderForm, setOrderForm] = useState({ memberId: '', productId: '', size: '', quantity: '1' })

  const { data: productsData } = useQuery({ queryKey: ['merch-products'], queryFn: () => api.get<MerchProductDto[]>('/api/v1/merch/products'), retry: false })
  const { data: ordersData }   = useQuery({ queryKey: ['merch-orders'],   queryFn: () => api.get<MerchOrderDto[]>('/api/v1/merch/orders'),   enabled: tab === 'orders', retry: false })

  const rawProducts = (productsData?.data as any)?.data ?? productsData?.data ?? []
  const rawOrders   = (ordersData?.data   as any)?.data ?? ordersData?.data   ?? []
  const products = (Array.isArray(rawProducts) && rawProducts.length > 0 ? rawProducts : DEMO_PRODUCTS) as MerchProductDto[]
  const allOrders = (Array.isArray(rawOrders) && rawOrders.length > 0 ? rawOrders : DEMO_ORDERS) as MerchOrderDto[]
  const orders = statusFilter ? allOrders.filter(o => o.status === statusFilter) : allOrders
  const filtered = catFilter ? products.filter(p => p.category === catFilter) : products

  const selectedProduct = products.find(p => p.id === orderForm.productId)

  const placeOrderMutation = useMutation({
    mutationFn: () => api.post('/api/v1/merch/orders', { memberId: orderForm.memberId, productId: orderForm.productId, size: orderForm.size || null, quantity: Number(orderForm.quantity) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['merch-orders'] }); setOrderForm({ memberId: '', productId: '', size: '', quantity: '1' }) },
  })
  const shipMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => api.put(`/api/v1/merch/orders/${id}/ship`, { trackingCode: code }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merch-orders'] }),
  })

  const totalRevenue = allOrders.filter(o => ['Processing','Shipped','Delivered'].includes(o.status)).reduce((s, o) => s + o.totalPrice, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Merchandise</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestione catalogo prodotti e ordini merchandise della palestra.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: '👕', label: 'Prodotti attivi', value: products.filter(p => p.isActive).length, sub: `su ${products.length} totali`,                                   color: 'text-slate-800'   },
          { icon: '📦', label: 'Ordini totali',   value: allOrders.length,                         sub: `${allOrders.filter(o=>o.status==='Pending').length} in attesa`,   color: 'text-brand-600'   },
          { icon: '🚚', label: 'Spediti',         value: allOrders.filter(o=>['Shipped','Delivered'].includes(o.status)).length, sub: 'con tracking',                    color: 'text-violet-600'  },
          { icon: '💶', label: 'Fatturato',       value: `€${totalRevenue.toFixed(0)}`,            sub: 'ordini confermati',                                               color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xl">{k.icon}</p>
            <p className={`text-xl font-black mt-0.5 ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([['catalog',`👕 Catalogo (${products.length})`],['orders',`📦 Ordini (${allOrders.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Catalogo ── */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['', ...CATEGORIES]).map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${catFilter === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {c && <span>{CAT_EMOJI[c]}</span>}{c || 'Tutti'}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(p => (
              <div key={p.id} className={`rounded-xl border border-slate-200 bg-white overflow-hidden transition hover:shadow-md ${!p.isActive ? 'opacity-60' : ''}`}>
                {/* Thumbnail placeholder */}
                <div className={`aspect-square bg-gradient-to-br ${CAT_GRADIENT[p.category] ?? 'from-slate-300 to-slate-500'} flex flex-col items-center justify-center gap-2`}>
                  <span className="text-5xl">{CAT_EMOJI[p.category] ?? '🎁'}</span>
                  {!p.isActive && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">Non attivo</span>}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{p.name}</p>
                  {p.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{p.description}</p>}
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-black text-brand-600">€{p.price.toFixed(2)}</p>
                      {p.sizes && <p className="text-xs text-slate-400 mt-0.5">{p.sizes.join(' / ')}</p>}
                    </div>
                    {p.stockQty !== null && (
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${p.stockQty < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {p.stockQty} pz
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ordini ── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {/* Registra ordine in loco */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Registra ordine in loco</h2>
            <form onSubmit={e => { e.preventDefault(); placeOrderMutation.mutate() }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <select value={orderForm.memberId} onChange={e => setOrderForm(s=>({...s,memberId:e.target.value}))} required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                <option value="">Socio…</option>
                {['dm1','dm2','dm3','dm4'].map(id => <option key={id} value={id}>{MEMBER_NAMES[id]}</option>)}
              </select>
              <select value={orderForm.productId} onChange={e => setOrderForm(s=>({...s,productId:e.target.value,size:''}))} required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                <option value="">Prodotto…</option>
                {products.filter(p=>p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} — €{p.price.toFixed(2)}</option>)}
              </select>
              {selectedProduct?.sizes ? (
                <select value={orderForm.size} onChange={e => setOrderForm(s=>({...s,size:e.target.value}))} required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                  <option value="">Taglia…</option>
                  {selectedProduct.sizes.map(sz => <option key={sz}>{sz}</option>)}
                </select>
              ) : (
                <input type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm(s=>({...s,quantity:e.target.value}))}
                  placeholder="Qty" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
              )}
              <button type="submit" disabled={placeOrderMutation.isPending}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {placeOrderMutation.isPending ? 'Registro…' : '+ Ordine'}
              </button>
            </form>
          </div>

          {/* Filtri */}
          <div className="flex flex-wrap gap-2">
            {(['','Pending','Processing','Shipped','Delivered','Cancelled'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s === '' ? 'Tutti' : STATUS_IT[s]}
              </button>
            ))}
          </div>

          {/* Tabella ordini */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3">Prodotto</th>
                  <th className="px-4 py-3">Totale</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">Nessun ordine trovato.</td></tr>
                )}
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs text-slate-400">{new Date(o.createdAtUtc).toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{MEMBER_NAMES[o.memberId] ?? o.memberId.slice(0,8)+'…'}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{o.productName}</p>
                      {o.size && <p className="text-xs text-slate-400">Taglia: {o.size}</p>}
                      {o.quantity > 1 && <p className="text-xs text-slate-400">x{o.quantity}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-600">€{o.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[o.status]}`}>
                        {STATUS_IT[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {o.trackingCode
                        ? <span className="font-mono text-xs text-slate-600">{o.trackingCode}</span>
                        : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {o.status === 'Processing' && (
                        <button onClick={() => { const code = prompt('Codice tracking:'); if (code) shipMutation.mutate({ id: o.id, code }) }}
                          className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100">
                          🚚 Spedisci
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
