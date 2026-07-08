import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { Button, Card, Input } from '../components/ui'

// LocalStorage key per gym — evita di riproporre il wizard a gym già configurate
function doneKey(gymId: string) { return `fitcore_onboarding_${gymId}` }

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Palestra', 'Piano', 'Branding', 'Fatto!']

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            i < current ? 'bg-emerald-500 text-white'
            : i === current ? 'bg-brand-600 text-white'
            : 'bg-slate-100 text-slate-400'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${i === current ? 'text-brand-700' : 'text-slate-400'}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < current ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  )
}

// ── Step 1 — Profilo palestra ─────────────────────────────────────────────────

interface GymDto { name: string; legalName: string | null; vatNumber: string | null; contactEmail: string | null; address: { street: string; city: string; postalCode: string; province: string } | null }

function StepProfile({ onDone }: { onDone: () => void }) {
  const { data } = useQuery({ queryKey: ['gym'], queryFn: () => api.get<GymDto>('/api/v1/gym') })
  const gym = data?.data

  const [name, setName] = useState(gym?.name ?? '')
  const [legalName, setLegalName] = useState(gym?.legalName ?? '')
  const [vatNumber, setVatNumber] = useState(gym?.vatNumber ?? '')
  const [email, setEmail] = useState(gym?.contactEmail ?? '')
  const [street, setStreet] = useState(gym?.address?.street ?? '')
  const [city, setCity] = useState(gym?.address?.city ?? '')
  const [postalCode, setPostalCode] = useState(gym?.address?.postalCode ?? '')
  const [province, setProvince] = useState(gym?.address?.province ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gym) return
    setName(gym.name ?? '')
    setLegalName(gym.legalName ?? '')
    setVatNumber(gym.vatNumber ?? '')
    setEmail(gym.contactEmail ?? '')
    setStreet(gym.address?.street ?? '')
    setCity(gym.address?.city ?? '')
    setPostalCode(gym.address?.postalCode ?? '')
    setProvince(gym.address?.province ?? '')
  }, [gym])

  const save = useMutation({
    mutationFn: () => api.put('/api/v1/gym', {
      name, legalName: legalName || null, vatNumber: vatNumber || null,
      contactEmail: email || null,
      address: street ? { street, city, postalCode, province, country: 'IT' } : null,
    }),
    onSuccess: onDone,
    onError: (e) => setError(e instanceof Error ? e.message : 'Errore'),
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Informazioni sulla palestra</h2>
        <p className="mt-1 text-sm text-slate-500">Questi dati appariranno su fatture e contratti.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome palestra *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="CrossFit Milano" />
        </div>
        <div>
          <label className="label">Ragione sociale</label>
          <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="CrossFit Milano Srl" />
        </div>
        <div>
          <label className="label">P.IVA</label>
          <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="12345678901" maxLength={11} />
        </div>
        <div>
          <label className="label">Email di contatto</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@palestra.it" />
        </div>
        <div>
          <label className="label">Via / Piazza</label>
          <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Via Roma 1" />
        </div>
        <div>
          <label className="label">Città</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Milano" />
        </div>
        <div>
          <label className="label">CAP</label>
          <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="20121" maxLength={5} />
        </div>
        <div>
          <label className="label">Provincia</label>
          <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="MI" maxLength={2} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvo…' : 'Avanti →'}</Button>
      </div>
    </form>
  )
}

// ── Step 2 — Primo piano ──────────────────────────────────────────────────────

function StepPlan({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [name, setName] = useState('Abbonamento Base')
  const [price, setPrice] = useState('49.90')
  const [interval, setInterval] = useState('Monthly')
  const [trialDays, setTrialDays] = useState('7')
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  const create = useMutation({
    mutationFn: () => api.post('/api/v1/plans', {
      name, priceAmount: Number(price), billingInterval: interval, trialDays: Number(trialDays),
    }),
    onSuccess: () => { setCreated(true); setTimeout(onDone, 800) },
    onError: (e) => setError(e instanceof Error ? e.message : 'Errore'),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Crea il tuo primo piano</h2>
        <p className="mt-1 text-sm text-slate-500">I piani definiscono i prezzi degli abbonamenti. Potrai aggiungerne altri in seguito.</p>
      </div>

      {created ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-5 py-4 text-emerald-700">
          <span className="text-2xl">✓</span>
          <div>
            <div className="font-semibold">Piano creato!</div>
            <div className="text-sm">Procedo al passo successivo…</div>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nome piano *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Abbonamento Base" />
            </div>
            <div>
              <label className="label">Prezzo (€) *</label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="49.90" />
            </div>
            <div>
              <label className="label">Cadenza</label>
              <select value={interval} onChange={(e) => setInterval(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                <option value="Monthly">Mensile</option>
                <option value="Quarterly">Trimestrale</option>
                <option value="Yearly">Annuale</option>
              </select>
            </div>
            <div>
              <label className="label">Giorni di prova gratuita</label>
              <Input type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} placeholder="7" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <button type="button" onClick={onSkip} className="text-sm text-slate-400 hover:text-slate-600 underline">
              Salta, lo faccio dopo
            </button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creo…' : 'Crea piano →'}</Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Step 3 — Branding ─────────────────────────────────────────────────────────

function StepBranding({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [brandName, setBrandName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [error, setError] = useState<string | null>(null)
  const [logoMsg, setLogoMsg] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => api.put('/api/v1/gym/white-label', {
      brandName: brandName || null, primaryColorHex: primaryColor,
      secondaryColorHex: null, accentColorHex: null, fontFamily: null, logoUrl: null,
    }),
    onSuccess: onDone,
    onError: (e) => setError(e instanceof Error ? e.message : 'Errore'),
  })

  const uploadLogo = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append('logo', file)
      return api.upload('/api/v1/gym/logo', fd)
    },
    onSuccess: () => setLogoMsg('Logo caricato!'),
    onError: () => setLogoMsg('Errore caricamento logo'),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Personalizza il tuo brand</h2>
        <p className="mt-1 text-sm text-slate-500">Il nome e il colore appariranno nella sidebar e nell'app per i soci.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome brand</label>
          <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="CrossFit Milano" />
        </div>
        <div>
          <label className="label">Colore primario</label>
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5" />
            <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono" />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: primaryColor }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-black text-white">
            {brandName?.[0]?.toUpperCase() ?? 'F'}
          </div>
          <span className="font-semibold text-white">{brandName || 'Nome palestra'}</span>
        </div>
        <div className="bg-white px-4 py-2 text-xs text-slate-400">Anteprima sidebar</div>
      </div>

      {/* Logo */}
      <div>
        <label className="label">Logo (opzionale)</label>
        <div className="flex items-center gap-3">
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f) }} />
          <Button variant="ghost" onClick={() => logoInputRef.current?.click()} disabled={uploadLogo.isPending}>
            {uploadLogo.isPending ? 'Carico…' : '⬆ Carica logo'}
          </Button>
          {logoMsg && <span className="text-sm text-emerald-600">{logoMsg}</span>}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <button type="button" onClick={onSkip} className="text-sm text-slate-400 hover:text-slate-600 underline">
          Salta, lo faccio dopo
        </button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Salvo…' : 'Avanti →'}</Button>
      </div>
    </div>
  )
}

// ── Step 4 — Completato ───────────────────────────────────────────────────────

function StepDone({ onFinish }: { onFinish: () => void }) {
  const { data } = useQuery({ queryKey: ['gym'], queryFn: () => api.get<{ name: string }>('/api/v1/gym') })

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <span className="text-4xl">🎉</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-ink">Tutto pronto!</h2>
        <p className="mt-2 text-slate-500">
          <strong>{data?.data?.name ?? 'La tua palestra'}</strong> è configurata e pronta all'uso.
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-left space-y-3">
        <p className="text-sm font-semibold text-slate-700">Prossimi passi suggeriti:</p>
        <ul className="space-y-2 text-sm text-slate-600">
          {[
            ['◈', 'Anagrafiche', '/members', 'Aggiungi i tuoi soci'],
            ['◆', 'Abbonamenti', '/plans', 'Verifica o crea altri piani'],
            ['⚐', 'Staff', '/staff', 'Invita trainer e personale'],
            ['⚙', 'Integrazioni', '/credentials', 'Configura Stripe, email e notifiche'],
          ].map(([icon, label, , desc]) => (
            <li key={label} className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-500">{icon}</span>
              <span><strong>{label}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={onFinish} className="mx-auto">Vai alla dashboard →</Button>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate()
  const { claims } = useAuth()
  const [step, setStep] = useState(0)  // 0=profile, 1=plan, 2=branding, 3=done

  // Se già completato, redirect immediato
  useEffect(() => {
    if (claims?.gym_id && localStorage.getItem(doneKey(claims.gym_id)) === 'done') {
      navigate('/', { replace: true })
    }
  }, [claims?.gym_id, navigate])

  function finish() {
    if (claims?.gym_id) localStorage.setItem(doneKey(claims.gym_id), 'done')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
            <span className="text-2xl font-black text-white">F</span>
          </div>
          <h1 className="text-3xl font-black text-ink">Configura Oplyfit</h1>
          <p className="mt-1 text-sm text-slate-500">Ci vogliono circa 2 minuti</p>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="mb-6 flex justify-center">
            <StepDots current={step} />
          </div>
        )}

        {/* Card */}
        <Card className="p-6 sm:p-8">
          {step === 0 && <StepProfile onDone={() => setStep(1)} />}
          {step === 1 && <StepPlan onDone={() => setStep(2)} onSkip={() => setStep(2)} />}
          {step === 2 && <StepBranding onDone={() => setStep(3)} onSkip={() => setStep(3)} />}
          {step === 3 && <StepDone onFinish={finish} />}
        </Card>

        {/* Skip all */}
        {step < 3 && (
          <div className="mt-4 text-center">
            <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-600 underline">
              Salta tutta la configurazione
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
