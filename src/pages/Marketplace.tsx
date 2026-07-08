import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge, Button, Card, Input } from '../components/ui'

type ProductCategory = 'PtSession' | 'NutritionPlan' | 'Merchandise' | 'Event' | 'DayPass' | 'Other'
type OrderStatus = 'Pending' | 'Paid' | 'Fulfilled' | 'Cancelled'

interface ProductDto {
  id: string; name: string; description: string | null; category: ProductCategory
  price: number; currency: string; stockQty: number | null; isActive: boolean; createdAtUtc: string
  photoUrl: string | null; sku: string | null; eanCode: string | null
  weightNetG: number | null; weightGrossG: number | null; dimensions: string | null
  countryOfOrigin: string | null; producerInfo: string | null
  ingredients: string | null; storageConditions: string | null
  minDurabilityDate: string | null; servingSizeG: number | null; nutritionReferenceNote: string | null
  energyKj: number | null; energyKcal: number | null; fatG: number | null; saturatedFatG: number | null
  carbohydratesG: number | null; sugarsG: number | null; fiberG: number | null; proteinG: number | null; saltG: number | null
  allergens: string | null
}
interface OrderDto {
  id: string; memberId: string; productId: string; productName: string
  quantity: number; unitPrice: number; totalPrice: number; currency: string
  status: OrderStatus; notes: string | null; createdAtUtc: string; fulfilledAtUtc: string | null
}
interface MemberDto { id: string; fullName: string }

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_PRODUCTS: ProductDto[] = [
  { id: 'demo-1', name: 'Sessione Personal Training (60 min)', description: 'Allenamento personalizzato con trainer certificato CONI.', category: 'PtSession', price: 55, currency: 'EUR', stockQty: null, isActive: true, createdAtUtc: new Date().toISOString(), photoUrl: null, sku: 'PT-60', eanCode: null, weightNetG: null, weightGrossG: null, dimensions: null, countryOfOrigin: null, producerInfo: null, ingredients: null, storageConditions: null, minDurabilityDate: null, servingSizeG: null, nutritionReferenceNote: null, energyKj: null, energyKcal: null, fatG: null, saturatedFatG: null, carbohydratesG: null, sugarsG: null, fiberG: null, proteinG: null, saltG: null, allergens: null },
  { id: 'demo-2', name: 'Protein Bar CrossFit Edition', description: 'Barretta proteica 40g proteine. Senza glutine. Prodotta in Italia.', category: 'Merchandise', price: 3.9, currency: 'EUR', stockQty: 48, isActive: true, createdAtUtc: new Date().toISOString(), photoUrl: null, sku: 'MERCH-PB01', eanCode: '8012345678901', weightNetG: 70, weightGrossG: 75, dimensions: '12x5x3 cm', countryOfOrigin: 'Italia', producerInfo: 'FitSnack Srl, Via Roma 1, Milano', ingredients: 'Proteine del siero di latte, cacao, sciroppo di glucosio, grassi vegetali.', storageConditions: 'Conservare in luogo fresco e asciutto, lontano dalla luce diretta.', minDurabilityDate: '12/2025', servingSizeG: 70, nutritionReferenceNote: 'Valori per 100 g', energyKj: 1680, energyKcal: 401, fatG: 12, saturatedFatG: 4.2, carbohydratesG: 38, sugarsG: 22, fiberG: 3.5, proteinG: 40, saltG: 0.3, allergens: 'Latte,Soia' },
  { id: 'demo-3', name: 'Piano Nutrizionale Mensile', description: 'Piano alimentare personalizzato elaborato dal nostro nutrizionista.', category: 'NutritionPlan', price: 89, currency: 'EUR', stockQty: null, isActive: true, createdAtUtc: new Date().toISOString(), photoUrl: null, sku: null, eanCode: null, weightNetG: null, weightGrossG: null, dimensions: null, countryOfOrigin: null, producerInfo: null, ingredients: null, storageConditions: null, minDurabilityDate: null, servingSizeG: null, nutritionReferenceNote: null, energyKj: null, energyKcal: null, fatG: null, saturatedFatG: null, carbohydratesG: null, sugarsG: null, fiberG: null, proteinG: null, saltG: null, allergens: null },
]
const DEMO_ORDERS: OrderDto[] = [
  { id: 'demo-ord-1', memberId: 'demo-m1', productId: 'demo-1', productName: 'Sessione Personal Training (60 min)', quantity: 1, unitPrice: 55, totalPrice: 55, currency: 'EUR', status: 'Pending', notes: null, createdAtUtc: new Date(Date.now() - 3600000).toISOString(), fulfilledAtUtc: null },
  { id: 'demo-ord-2', memberId: 'demo-m2', productId: 'demo-2', productName: 'Protein Bar CrossFit Edition', quantity: 3, unitPrice: 3.9, totalPrice: 11.7, currency: 'EUR', status: 'Paid', notes: 'Consegna in palestra', createdAtUtc: new Date(Date.now() - 86400000).toISOString(), fulfilledAtUtc: null },
  { id: 'demo-ord-3', memberId: 'demo-m1', productId: 'demo-3', productName: 'Piano Nutrizionale Mensile', quantity: 1, unitPrice: 89, totalPrice: 89, currency: 'EUR', status: 'Fulfilled', notes: null, createdAtUtc: new Date(Date.now() - 172800000).toISOString(), fulfilledAtUtc: new Date(Date.now() - 86400000).toISOString() },
]

// ── Allergens (Allegato II Reg. UE 1169/2011) ─────────────────────────────────
const EU_ALLERGENS = [
  'Glutine', 'Crostacei', 'Uova', 'Pesce', 'Arachidi', 'Soia',
  'Latte', 'Frutta a guscio', 'Sedano', 'Senape', 'Semi di sesamo',
  'Anidride solforosa e solfiti', 'Lupini', 'Molluschi',
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  PtSession: 'Sessione PT', NutritionPlan: 'Piano Nutrizionale',
  Merchandise: 'Merchandising', Event: 'Evento', DayPass: 'Day Pass', Other: 'Altro',
}
const CATEGORY_ICON: Record<ProductCategory, string> = {
  PtSession: '🏋️', NutritionPlan: '🥗', Merchandise: '👕', Event: '🎪', DayPass: '🎫', Other: '⭐',
}
const CATEGORY_ACCENT: Record<ProductCategory, string> = {
  PtSession: 'bg-brand-50 text-brand-700', NutritionPlan: 'bg-emerald-50 text-emerald-700',
  Merchandise: 'bg-violet-50 text-violet-700', Event: 'bg-pink-50 text-pink-700',
  DayPass: 'bg-amber-50 text-amber-700', Other: 'bg-slate-50 text-slate-600',
}
const ORDER_TONE: Record<OrderStatus, 'green' | 'amber' | 'slate' | 'red'> = {
  Pending: 'amber', Paid: 'green', Fulfilled: 'slate', Cancelled: 'red',
}
const ORDER_LABEL: Record<OrderStatus, string> = {
  Pending: 'In attesa', Paid: 'Pagato', Fulfilled: 'Evaso', Cancelled: 'Cancellato',
}
const selectCls = 'rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

type Tab = 'products' | 'orders'

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

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHead({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 pt-3 pb-1 border-t border-slate-100 mt-2">{children}</p>
}

// ── Nutrizione row ─────────────────────────────────────────────────────────────
function NutRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 text-xs ${bold ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}

// ── Edit product modal ─────────────────────────────────────────────────────────
function EditProductModal({ product, onClose }: { product: ProductDto; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description ?? '')
  const [category, setCategory] = useState<ProductCategory>(product.category)
  const [price, setPrice] = useState(String(product.price))
  const [stockQty, setStockQty] = useState(product.stockQty !== null ? String(product.stockQty) : '')
  const [isActive, setIsActive] = useState(product.isActive)
  // Identificatori
  const [sku, setSku] = useState(product.sku ?? '')
  const [eanCode, setEanCode] = useState(product.eanCode ?? '')
  // Fisici
  const [weightNetG, setWeightNetG] = useState(product.weightNetG !== null ? String(product.weightNetG) : '')
  const [weightGrossG, setWeightGrossG] = useState(product.weightGrossG !== null ? String(product.weightGrossG) : '')
  const [dimensions, setDimensions] = useState(product.dimensions ?? '')
  const [countryOfOrigin, setCountryOfOrigin] = useState(product.countryOfOrigin ?? '')
  const [producerInfo, setProducerInfo] = useState(product.producerInfo ?? '')
  // Etichettatura
  const [ingredients, setIngredients] = useState(product.ingredients ?? '')
  const [storageConditions, setStorageConditions] = useState(product.storageConditions ?? '')
  const [minDurabilityDate, setMinDurabilityDate] = useState(product.minDurabilityDate ?? '')
  const [servingSizeG, setServingSizeG] = useState(product.servingSizeG !== null ? String(product.servingSizeG) : '')
  const [nutritionReferenceNote, setNutritionReferenceNote] = useState(product.nutritionReferenceNote ?? '')
  // Nutrizionali
  const [energyKj, setEnergyKj] = useState(product.energyKj !== null ? String(product.energyKj) : '')
  const [energyKcal, setEnergyKcal] = useState(product.energyKcal !== null ? String(product.energyKcal) : '')
  const [fatG, setFatG] = useState(product.fatG !== null ? String(product.fatG) : '')
  const [saturatedFatG, setSaturatedFatG] = useState(product.saturatedFatG !== null ? String(product.saturatedFatG) : '')
  const [carbohydratesG, setCarbohydratesG] = useState(product.carbohydratesG !== null ? String(product.carbohydratesG) : '')
  const [sugarsG, setSugarsG] = useState(product.sugarsG !== null ? String(product.sugarsG) : '')
  const [fiberG, setFiberG] = useState(product.fiberG !== null ? String(product.fiberG) : '')
  const [proteinG, setProteinG] = useState(product.proteinG !== null ? String(product.proteinG) : '')
  const [saltG, setSaltG] = useState(product.saltG !== null ? String(product.saltG) : '')
  // Allergeni
  const [allergenSet, setAllergenSet] = useState<Set<string>>(new Set(product.allergens ? product.allergens.split(',').map(s => s.trim()).filter(Boolean) : []))
  // Foto
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(product.photoUrl)
  const [error, setError] = useState<string | null>(null)

  const toggleAllergen = (a: string) => setAllergenSet(prev => {
    const next = new Set(prev)
    next.has(a) ? next.delete(a) : next.add(a)
    return next
  })

  const f = (v: string) => v ? parseFloat(v) : null
  const n = (v: string) => v ? parseInt(v) : null

  const isDemo = product.id.startsWith('demo-')

  const uploadPhoto = useMutation({
    mutationFn: async (productId: string) => {
      if (!photoFile) return
      const fd = new FormData()
      fd.append('photo', photoFile)
      await fetch(`/api/v1/marketplace/products/${productId}/photo`, {
        method: 'POST',
        body: fd,
        headers: { Authorization: `Bearer ${localStorage.getItem('fitcore_token')}` },
      })
    },
  })

  const update = useMutation({
    mutationFn: async () => {
      if (isDemo) { return { data: product } }
      const res = await api.put(`/api/v1/marketplace/products/${product.id}`, {
        name, description: description || null, category,
        price: parseFloat(price), currency: product.currency,
        stockQty: n(stockQty), isActive,
        sku: sku || null, eanCode: eanCode || null,
        weightNetG: f(weightNetG), weightGrossG: f(weightGrossG),
        dimensions: dimensions || null, countryOfOrigin: countryOfOrigin || null, producerInfo: producerInfo || null,
        ingredients: ingredients || null, storageConditions: storageConditions || null,
        minDurabilityDate: minDurabilityDate || null,
        servingSizeG: f(servingSizeG), nutritionReferenceNote: nutritionReferenceNote || null,
        energyKj: f(energyKj), energyKcal: f(energyKcal),
        fatG: f(fatG), saturatedFatG: f(saturatedFatG),
        carbohydratesG: f(carbohydratesG), sugarsG: f(sugarsG),
        fiberG: f(fiberG), proteinG: f(proteinG), saltG: f(saltG),
        allergens: allergenSet.size > 0 ? [...allergenSet].join(',') : null,
      })
      if (photoFile) await uploadPhoto.mutateAsync(product.id)
      return res
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace-products'] }); onClose() },
    onError: (e) => setError(e instanceof Error ? e.message : 'Errore'),
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="font-semibold text-slate-800">Modifica prodotto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); update.mutate() }} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">

            {/* Foto */}
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                {photoPreview
                  ? <img src={photoPreview} alt="foto" className="h-full w-full object-cover" />
                  : <span className="text-3xl">{CATEGORY_ICON[category]}</span>
                }
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Foto prodotto</label>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
                    <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
                  </svg>
                  {photoFile ? photoFile.name : 'Carica foto (JPG, PNG, WebP)'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" />
                </label>
                <p className="text-xs text-slate-400 mt-1">Max 5MB · Rapporto 1:1 consigliato</p>
              </div>
            </div>

            {/* Dati base */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Categoria</label>
                <select className={selectCls + ' w-full'} value={category} onChange={e => setCategory(e.target.value as ProductCategory)}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Prezzo (€) *</label>
                <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Stock (vuoto = illimitato)</label>
                <Input type="number" min="0" value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="∞" />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                  <span className="text-sm text-slate-700">Prodotto attivo</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descrizione</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrizione opzionale" />
            </div>

            {/* Identificatori */}
            <SectionHead>Identificatori</SectionHead>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">SKU / Codice interno</label>
                <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="es. MERCH-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Codice EAN / GTIN</label>
                <Input value={eanCode} onChange={e => setEanCode(e.target.value)} placeholder="es. 8012345678901" maxLength={14} />
              </div>
            </div>

            {/* Dati fisici */}
            <SectionHead>Dati fisici (per prodotti fisici)</SectionHead>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Peso netto (g)</label>
                <Input type="number" min="0" step="0.1" value={weightNetG} onChange={e => setWeightNetG(e.target.value)} placeholder="es. 500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Peso lordo (g)</label>
                <Input type="number" min="0" step="0.1" value={weightGrossG} onChange={e => setWeightGrossG(e.target.value)} placeholder="es. 520" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dimensioni (L×P×A)</label>
                <Input value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder="es. 10×5×3 cm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Paese di origine</label>
                <Input value={countryOfOrigin} onChange={e => setCountryOfOrigin(e.target.value)} placeholder="es. Italia" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Produttore / Responsabile</label>
                <Input value={producerInfo} onChange={e => setProducerInfo(e.target.value)} placeholder="Ragione sociale e indirizzo" />
              </div>
            </div>

            {/* Etichettatura alimentare — Reg. UE 1169/2011 */}
            <SectionHead>Etichettatura alimentare (Reg. UE 1169/2011)</SectionHead>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ingredienti</label>
              <textarea
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder="Elenco ingredienti in ordine decrescente di peso…"
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Condizioni di conservazione</label>
                <Input value={storageConditions} onChange={e => setStorageConditions(e.target.value)} placeholder="es. Conservare in luogo fresco e asciutto" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">TMC / Scadenza</label>
                <Input value={minDurabilityDate} onChange={e => setMinDurabilityDate(e.target.value)} placeholder="es. 12/2025" />
              </div>
            </div>

            {/* Valori nutrizionali */}
            <SectionHead>Valori nutrizionali per 100 g/ml (Reg. UE 1169/2011)</SectionHead>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dimensione porzione (g)</label>
                <Input type="number" min="0" step="0.1" value={servingSizeG} onChange={e => setServingSizeG(e.target.value)} placeholder="es. 70" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nota riferimento</label>
                <Input value={nutritionReferenceNote} onChange={e => setNutritionReferenceNote(e.target.value)} placeholder="es. Valori per 100 g" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Energia (kJ)</label>
                <Input type="number" min="0" step="0.1" value={energyKj} onChange={e => setEnergyKj(e.target.value)} placeholder="es. 1680" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Energia (kcal)</label>
                <Input type="number" min="0" step="0.1" value={energyKcal} onChange={e => setEnergyKcal(e.target.value)} placeholder="es. 401" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Grassi totali (g)</label>
                <Input type="number" min="0" step="0.01" value={fatG} onChange={e => setFatG(e.target.value)} placeholder="es. 12.5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">di cui saturi (g)</label>
                <Input type="number" min="0" step="0.01" value={saturatedFatG} onChange={e => setSaturatedFatG(e.target.value)} placeholder="es. 4.2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Carboidrati (g)</label>
                <Input type="number" min="0" step="0.01" value={carbohydratesG} onChange={e => setCarbohydratesG(e.target.value)} placeholder="es. 38" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">di cui zuccheri (g)</label>
                <Input type="number" min="0" step="0.01" value={sugarsG} onChange={e => setSugarsG(e.target.value)} placeholder="es. 22" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fibre (g)</label>
                <Input type="number" min="0" step="0.01" value={fiberG} onChange={e => setFiberG(e.target.value)} placeholder="es. 3.5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Proteine (g)</label>
                <Input type="number" min="0" step="0.01" value={proteinG} onChange={e => setProteinG(e.target.value)} placeholder="es. 40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sale (g)</label>
                <Input type="number" min="0" step="0.001" value={saltG} onChange={e => setSaltG(e.target.value)} placeholder="es. 0.3" />
              </div>
            </div>

            {/* Allergeni — Allegato II Reg. UE 1169/2011 */}
            <SectionHead>Allergeni (Allegato II Reg. UE 1169/2011)</SectionHead>
            <div className="grid grid-cols-2 gap-1.5">
              {EU_ALLERGENS.map(a => (
                <label key={a} className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-100 px-2.5 py-1.5 hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={allergenSet.has(a)}
                    onChange={() => toggleAllergen(a)}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-amber-500"
                  />
                  <span className="text-xs text-slate-700">{a}</span>
                </label>
              ))}
            </div>
            {allergenSet.size > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <span className="font-semibold">Contiene:</span> {[...allergenSet].join(', ')}
              </div>
            )}

          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          {error && <p className="mr-auto text-sm text-red-600">{error}</p>}
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Annulla
          </button>
          <Button onClick={() => update.mutate()} disabled={update.isPending}>
            {update.isPending ? 'Salvataggio…' : 'Salva modifiche'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete confirm modal ───────────────────────────────────────────────────────
function DeleteProductModal({ product, onClose }: { product: ProductDto; onClose: () => void }) {
  const qc = useQueryClient()
  const del = useMutation({
    mutationFn: () => product.id.startsWith('demo-') ? Promise.resolve() : api.delete(`/api/v1/marketplace/products/${product.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace-products'] }); onClose() },
  })
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">Elimina prodotto</h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Stai per eliminare <span className="font-semibold text-slate-700">"{product.name}"</span>. Questa azione è irreversibile.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Annulla
          </button>
          <button onClick={() => del.mutate()} disabled={del.isPending}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {del.isPending ? 'Eliminazione…' : 'Elimina'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Order detail modal ─────────────────────────────────────────────────────────
function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const isDemo = orderId.startsWith('demo-')
  const demoOrder = isDemo ? DEMO_ORDERS.find(o => o.id === orderId) ?? null : null

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace-order', orderId],
    queryFn: () => api.get<OrderDto>(`/api/v1/marketplace/orders/${orderId}`),
    enabled: !isDemo,
  })
  const order: OrderDto | null = isDemo ? demoOrder : (data?.data ?? null)

  const transition = useMutation({
    mutationFn: (verb: 'pay' | 'fulfill' | 'cancel') =>
      isDemo ? Promise.resolve() : api.post(`/api/v1/marketplace/orders/${orderId}/${verb}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplace-order', orderId] })
      qc.invalidateQueries({ queryKey: ['marketplace-orders'] })
    },
  })

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">Dettaglio ordine</h2>
            {order && <p className="text-xs text-slate-400 font-mono mt-0.5">{order.id.slice(0, 16)}…</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Caricamento…</div>
        ) : !order ? (
          <div className="py-12 text-center text-sm text-red-500">Ordine non trovato.</div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge tone={ORDER_TONE[order.status]}>{ORDER_LABEL[order.status]}</Badge>
              <span className="text-xs text-slate-400">{new Date(order.createdAtUtc).toLocaleString('it-IT')}</span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
              <Row label="Prodotto" value={order.productName} />
              <Row label="Quantità" value={String(order.quantity)} />
              <Row label="Prezzo unitario" value={`${order.unitPrice.toFixed(2)} ${order.currency}`} />
              <div className="border-t border-slate-200 pt-2 mt-2">
                <Row label="Totale" value={`${order.totalPrice.toFixed(2)} ${order.currency}`} bold />
              </div>
            </div>

            {order.notes && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                <span className="font-semibold">Note:</span> {order.notes}
              </div>
            )}

            {order.fulfilledAtUtc && (
              <p className="text-xs text-slate-400">Evaso il {new Date(order.fulfilledAtUtc).toLocaleString('it-IT')}</p>
            )}

            {(order.status === 'Pending' || order.status === 'Paid') && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {order.status === 'Pending' && (
                  <button onClick={() => transition.mutate('pay')} disabled={transition.isPending}
                    className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                    Segna Pagato
                  </button>
                )}
                {order.status === 'Paid' && (
                  <button onClick={() => transition.mutate('fulfill')} disabled={transition.isPending}
                    className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Evadi ordine
                  </button>
                )}
                <button onClick={() => transition.mutate('cancel')} disabled={transition.isPending}
                  className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
                  Cancella
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? 'font-bold text-brand-600' : 'font-medium text-slate-800'}>{value}</span>
    </div>
  )
}

// ── Product card kebab menu ────────────────────────────────────────────────────
function ProductMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
        <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5">
          <button onClick={() => { setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
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

// ── Nutritional badge on card ─────────────────────────────────────────────────
function NutriBadge({ p }: { p: ProductDto }) {
  if (!p.energyKcal && !p.proteinG) return null
  return (
    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs">
      <p className="font-medium text-slate-500 text-[10px] uppercase tracking-wide mb-0.5">Valori nutrizionali / 100 g</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-600">
        {p.energyKcal !== null && <span><b>{p.energyKcal}</b> kcal</span>}
        {p.proteinG !== null && <span>Prot. <b>{p.proteinG} g</b></span>}
        {p.fatG !== null && <span>Grassi <b>{p.fatG} g</b></span>}
        {p.carbohydratesG !== null && <span>Carbo. <b>{p.carbohydratesG} g</b></span>}
      </div>
      {p.allergens && (
        <p className="mt-1 text-amber-600 font-medium text-[10px]">⚠ Contiene: {p.allergens.split(',').join(', ')}</p>
      )}
    </div>
  )
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProductCategory>('PtSession')
  const [price, setPrice] = useState('')
  const [stockQty, setStockQty] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<ProductCategory | ''>('')
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: () => api.get<ProductDto[]>('/api/v1/marketplace/products'),
    retry: false,
  })

  const products: ProductDto[] = (() => {
    if (isError) return DEMO_PRODUCTS
    const raw = (data?.data as any)?.data ?? data?.data
    return Array.isArray(raw) && raw.length > 0 ? raw : DEMO_PRODUCTS
  })()
  const filtered = catFilter ? products.filter(p => p.category === catFilter) : products

  const create = useMutation({
    mutationFn: () => api.post('/api/v1/marketplace/products', {
      name, description: description || null, category,
      price: parseFloat(price), currency: 'EUR',
      stockQty: stockQty ? parseInt(stockQty) : null,
    }),
    onSuccess: () => { setName(''); setDescription(''); setPrice(''); setStockQty(''); setFormError(null); qc.invalidateQueries({ queryKey: ['marketplace-products'] }) },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Errore'),
  })

  const toggle = useMutation({
    mutationFn: (p: ProductDto) => p.id.startsWith('demo-') ? Promise.resolve() : api.put(`/api/v1/marketplace/products/${p.id}`, {
      name: p.name, description: p.description, category: p.category,
      price: p.price, currency: p.currency, stockQty: p.stockQty, isActive: !p.isActive,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace-products'] }),
  })

  const activeCount = products.filter(p => p.isActive).length

  return (
    <div className="space-y-5">
      {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
      {deletingProduct && <DeleteProductModal product={deletingProduct} onClose={() => setDeletingProduct(null)} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Prodotti totali',  value: products.length,                                    sub: `${activeCount} attivi`,         color: 'text-slate-800'   },
          { label: 'Sessioni PT',      value: products.filter(p=>p.category==='PtSession').length, sub: 'servizi PT',                   color: 'text-brand-600'   },
          { label: 'Con stock',        value: products.filter(p=>p.stockQty!=null).length,         sub: 'quantità limitata',            color: 'text-amber-600'   },
          { label: 'Valore catalogo',  value: `€${products.filter(p=>p.isActive).reduce((s,p)=>s+p.price,0).toFixed(0)}`, sub: 'prezzo totale attivi', color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Nuovo prodotto / servizio</h2>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
            <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="flex gap-2">
              <Input type="number" placeholder="Prezzo €" value={price} min="0" step="0.01" onChange={(e) => setPrice(e.target.value)} required className="flex-1" />
              <Input type="number" placeholder="Stock (opz.)" value={stockQty} min="0" onChange={(e) => setStockQty(e.target.value)} className="w-28" />
            </div>
          </div>
          <Input placeholder="Descrizione (opzionale)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex items-center justify-between">
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button type="submit" disabled={create.isPending} className="ml-auto">
              {create.isPending ? 'Aggiungo…' : '+ Aggiungi prodotto'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([['', 'Tutti'], ...Object.entries(CATEGORY_LABELS)] as [string, string][]).map(([k, v]) => (
          <button key={k} onClick={() => setCatFilter(k as ProductCategory | '')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${catFilter === k ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {k && <span>{CATEGORY_ICON[k as ProductCategory]}</span>}{v}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Caricamento…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-2 font-semibold text-slate-700">Nessun prodotto in questa categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className={`p-0 overflow-hidden ${!p.isActive ? 'opacity-55' : ''}`}>
              {/* Foto o placeholder */}
              <div className="h-36 bg-slate-100 relative overflow-hidden">
                {p.photoUrl
                  ? <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center text-5xl">{CATEGORY_ICON[p.category]}</div>
                }
                <div className="absolute top-2 left-2">
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm ${CATEGORY_ACCENT[p.category]}`}>
                    {CATEGORY_ICON[p.category]} {CATEGORY_LABELS[p.category]}
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button onClick={() => toggle.mutate(p)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium shadow-sm transition ${p.isActive ? 'bg-white/90 text-slate-500 hover:bg-slate-100' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                    {p.isActive ? 'Disattiva' : 'Attiva'}
                  </button>
                  <div className="bg-white/90 rounded-lg shadow-sm">
                    <ProductMenu onEdit={() => setEditingProduct(p)} onDelete={() => setDeletingProduct(p)} />
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="font-semibold text-slate-800">{p.name}</div>
                {p.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{p.description}</p>}

                {/* SKU / EAN */}
                {(p.sku || p.eanCode) && (
                  <p className="mt-1 text-[10px] text-slate-400 font-mono">{p.sku && `SKU: ${p.sku}`}{p.sku && p.eanCode && ' · '}{p.eanCode && `EAN: ${p.eanCode}`}</p>
                )}

                {/* Nutrizionali in miniatura */}
                <NutriBadge p={p} />

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-600">{p.price === 0 ? 'Gratuito' : `${p.price.toFixed(2)} €`}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {p.weightNetG !== null && <span>{p.weightNetG} g</span>}
                    {p.stockQty !== null && (
                      <span className={p.stockQty < 5 ? 'text-red-500 font-medium' : ''}>Stock: {p.stockQty}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [memberId, setMemberId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [orderError, setOrderError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data: ordersData, isLoading, isError: ordersError } = useQuery({
    queryKey: ['marketplace-orders', statusFilter],
    queryFn: () => { const p = statusFilter ? `?status=${statusFilter}` : ''; return api.get<OrderDto[]>(`/api/v1/marketplace/orders${p}`) },
    retry: false,
  })
  const { data: productsData } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: () => api.get<ProductDto[]>('/api/v1/marketplace/products'),
    retry: false,
  })
  const { data: membersData } = useQuery({
    queryKey: ['members-list-slim'],
    queryFn: () => api.get<MemberDto[]>('/api/v1/members?pageSize=200'),
    retry: false,
  })

  const orders: OrderDto[] = (() => {
    if (ordersError) return DEMO_ORDERS
    const raw = (ordersData?.data as any)?.data ?? ordersData?.data
    return Array.isArray(raw) && raw.length > 0 ? raw : DEMO_ORDERS
  })()
  const productList: ProductDto[] = (() => {
    const raw = (productsData?.data as any)?.data ?? productsData?.data
    return Array.isArray(raw) && raw.length > 0 ? raw : DEMO_PRODUCTS
  })()
  const memberList: MemberDto[] = (() => {
    const raw = (membersData?.data as any)?.data ?? membersData?.data
    return Array.isArray(raw) ? raw : []
  })()

  const memberMap: Record<string, string> = Object.fromEntries(memberList.map(m => [m.id, m.fullName]))

  const revenueConfirmed = orders.filter(o => ['Paid','Fulfilled'].includes(o.status)).reduce((s, o) => s + o.totalPrice, 0)

  const placeOrder = useMutation({
    mutationFn: () => api.post<{ id: string }>('/api/v1/marketplace/orders', {
      memberId, productId, quantity: parseInt(quantity), notes: notes || null,
    }),
    onSuccess: () => { setMemberId(''); setProductId(''); setQuantity('1'); setNotes(''); setOrderError(null); qc.invalidateQueries({ queryKey: ['marketplace-orders'] }) },
    onError: (e) => setOrderError(e instanceof Error ? e.message : 'Errore'),
  })

  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders

  return (
    <div className="space-y-5">
      {selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Ordini totali', value: orders.length,                                             color: 'text-slate-800'  },
          { label: 'In attesa',     value: orders.filter(o=>o.status==='Pending').length,             color: 'text-amber-600'  },
          { label: 'Da evadere',    value: orders.filter(o=>o.status==='Paid').length,                color: 'text-blue-600'   },
          { label: 'Incassato',     value: `€${revenueConfirmed.toFixed(0)}`,                        color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 p-3">
          <span className="mt-0.5 text-brand-500">ℹ</span>
          <p className="text-xs text-brand-700">
            <span className="font-semibold">Gli ordini online arrivano automaticamente</span> — quando un socio acquista dall'app, l'ordine appare qui già con stato <em>Pagato</em> grazie al webhook Stripe. Il form sottostante serve solo per vendite in loco (contanti, POS fisico).
          </p>
        </div>
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Registra vendita in loco</h2>
        <p className="mb-3 text-xs text-slate-400">Contanti / POS fisico / pagamento non tracciato online.</p>
        <form onSubmit={(e) => { e.preventDefault(); placeOrder.mutate() }} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select className={selectCls} value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            <option value="">Socio…</option>
            {memberList.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select>
          <select className={selectCls} value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">Prodotto…</option>
            {productList.filter(p => p.isActive).map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price.toFixed(2)} €</option>)}
          </select>
          <div className="flex gap-2">
            <Input type="number" placeholder="Qty" value={quantity} min="1" onChange={(e) => setQuantity(e.target.value)} required className="flex-1" />
            <Input placeholder="Note (opz.)" value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1" />
          </div>
          <Button type="submit" disabled={placeOrder.isPending}>{placeOrder.isPending ? 'Registro…' : '+ Registra'}</Button>
        </form>
        {orderError && <p className="mt-2 text-sm text-red-600">{orderError}</p>}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {(['', 'Pending', 'Paid', 'Fulfilled', 'Cancelled'] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s === '' ? 'Tutti' : ORDER_LABEL[s]}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Caricamento…</p>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl">🧾</p>
            <p className="mt-2 font-semibold text-slate-600">Nessun ordine{statusFilter ? ` con stato "${ORDER_LABEL[statusFilter]}"` : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Membro</th>
                  <th className="px-5 py-3 font-medium">Prodotto</th>
                  <th className="px-5 py-3 font-medium">Qty</th>
                  <th className="px-5 py-3 font-medium">Totale</th>
                  <th className="px-5 py-3 font-medium">Stato</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => setSelectedOrderId(o.id)}>
                    <td className="px-5 py-3 text-slate-700 font-medium">{memberMap[o.memberId] ?? (o.memberId.startsWith('demo-') ? 'Mario Rossi' : o.memberId.slice(0, 8) + '…')}</td>
                    <td className="px-5 py-3 text-slate-800">{o.productName}</td>
                    <td className="px-5 py-3 text-slate-500">{o.quantity}</td>
                    <td className="px-5 py-3 font-semibold text-brand-600">{o.totalPrice.toFixed(2)} {o.currency}</td>
                    <td className="px-5 py-3"><Badge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</Badge></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{new Date(o.createdAtUtc).toLocaleDateString('it-IT')}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); setSelectedOrderId(o.id) }}
                        className="text-xs text-brand-600 hover:underline font-medium">
                        Apri →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Marketplace() {
  const [tab, setTab] = useState<Tab>('products')
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
          <p className="text-sm text-slate-500 mt-0.5">Prodotti e servizi aggiuntivi — PT, nutrizione, eventi, day pass e merchandising.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">⚠️ Stripe stub</span>
      </div>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {(['products', 'orders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'products' ? '📦 Prodotti' : '🧾 Ordini'}
          </button>
        ))}
      </div>
      {tab === 'products' ? <ProductsTab /> : <OrdersTab />}
    </div>
  )
}
