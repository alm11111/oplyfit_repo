import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button, Card, Input } from '../components/ui'

interface WhiteLabelDto {
  brandName: string | null
  primaryColorHex: string | null
  secondaryColorHex: string | null
  accentColorHex: string | null
  fontFamily: string | null
  logoUrl: string | null
}

interface GymDto {
  id: string
  name: string
  legalName: string | null
  vatNumber: string | null
  taxCode: string | null
  address: { street: string; city: string; postalCode: string; province: string } | null
  contactEmail: string | null
  contactPhone: string | null
  whiteLabel: WhiteLabelDto
  timezone: string
  locale: string
  currency: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-slate-100 px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input type="color" value={value || '#2563eb'} onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5" />
        <Input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="#2563eb" className="font-mono" />
      </div>
    </Field>
  )
}

export default function GymProfile() {
  const qc = useQueryClient()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['gym'],
    queryFn: () => api.get<GymDto>('/api/v1/gym'),
  })
  const gym = data?.data ?? null

  // Profile form
  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [province, setProvince] = useState('')

  // White-label form
  const [brandName, setBrandName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#1e40af')
  const [accentColor, setAccentColor] = useState('#f59e0b')
  const [fontFamily, setFontFamily] = useState('')

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [wlMsg, setWlMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [logoMsg, setLogoMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!gym) return
    setName(gym.name ?? '')
    setLegalName(gym.legalName ?? '')
    setVatNumber(gym.vatNumber ?? '')
    setTaxCode(gym.taxCode ?? '')
    setContactEmail(gym.contactEmail ?? '')
    setContactPhone(gym.contactPhone ?? '')
    setStreet(gym.address?.street ?? '')
    setCity(gym.address?.city ?? '')
    setPostalCode(gym.address?.postalCode ?? '')
    setProvince(gym.address?.province ?? '')
    setBrandName(gym.whiteLabel?.brandName ?? '')
    setPrimaryColor(gym.whiteLabel?.primaryColorHex ?? '#2563eb')
    setSecondaryColor(gym.whiteLabel?.secondaryColorHex ?? '#1e40af')
    setAccentColor(gym.whiteLabel?.accentColorHex ?? '#f59e0b')
    setFontFamily(gym.whiteLabel?.fontFamily ?? '')
  }, [gym])

  const saveProfile = useMutation({
    mutationFn: () => api.put<GymDto>('/api/v1/gym', {
      name, legalName: legalName || null, vatNumber: vatNumber || null, taxCode: taxCode || null,
      contactEmail: contactEmail || null, contactPhone: contactPhone || null,
      address: street ? { street, city, postalCode, province, country: 'IT' } : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym'] }); setProfileMsg({ ok: true, text: 'Profilo aggiornato.' }); setTimeout(() => setProfileMsg(null), 3000) },
    onError: (e) => setProfileMsg({ ok: false, text: e instanceof Error ? e.message : 'Errore' }),
  })

  const saveWhiteLabel = useMutation({
    mutationFn: () => api.put<GymDto>('/api/v1/gym/white-label', {
      brandName: brandName || null,
      primaryColorHex: primaryColor || null,
      secondaryColorHex: secondaryColor || null,
      accentColorHex: accentColor || null,
      fontFamily: fontFamily || null,
      logoUrl: gym?.whiteLabel?.logoUrl ?? null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym'] }); setWlMsg({ ok: true, text: 'Branding aggiornato.' }); setTimeout(() => setWlMsg(null), 3000) },
    onError: (e) => setWlMsg({ ok: false, text: e instanceof Error ? e.message : 'Errore' }),
  })

  const uploadLogo = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('logo', file)
      return api.upload<GymDto>('/api/v1/gym/logo', fd)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym'] }); setLogoMsg({ ok: true, text: 'Logo caricato.' }); setTimeout(() => setLogoMsg(null), 3000) },
    onError: (e) => setLogoMsg({ ok: false, text: e instanceof Error ? e.message : 'Errore caricamento' }),
  })

  if (isLoading) return <div className="p-8 text-sm text-slate-400">Caricamento…</div>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Profilo Palestra</h1>
        <p className="text-sm text-slate-500">Dati fiscali, recapiti e personalizzazione brand</p>
      </div>

      {/* ── Dati palestra ── */}
      <Card>
        <SectionHeader title="Dati palestra" subtitle="Ragione sociale, P.IVA e recapiti" />
        <form onSubmit={(e) => { e.preventDefault(); saveProfile.mutate() }} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome palestra *">
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="CrossFit Milano" />
            </Field>
            <Field label="Ragione sociale">
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="CrossFit Milano Srl" />
            </Field>
            <Field label="Partita IVA">
              <Input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="12345678901" maxLength={11} />
            </Field>
            <Field label="Codice Fiscale">
              <Input value={taxCode} onChange={(e) => setTaxCode(e.target.value)} placeholder="ABCDEF12G34H567I" />
            </Field>
            <Field label="Email contatto">
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@palestra.it" />
            </Field>
            <Field label="Telefono">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+39 02 12345678" />
            </Field>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Sede legale</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Via / Piazza">
                <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Via Roma 1" />
              </Field>
              <Field label="Città">
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Milano" />
              </Field>
              <Field label="CAP">
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="20121" maxLength={5} />
              </Field>
              <Field label="Provincia">
                <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="MI" maxLength={2} />
              </Field>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            {profileMsg && <span className={`text-sm ${profileMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{profileMsg.text}</span>}
            <div className="ml-auto">
              <Button type="submit" disabled={saveProfile.isPending}>{saveProfile.isPending ? 'Salvo…' : 'Salva profilo'}</Button>
            </div>
          </div>
        </form>
      </Card>

      {/* ── Logo ── */}
      <Card>
        <SectionHeader title="Logo palestra" subtitle="JPG, PNG, WEBP o SVG — max 2MB" />
        <div className="flex items-center gap-6 p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
            {gym?.whiteLabel?.logoUrl
              ? <img src={gym.whiteLabel.logoUrl} alt="logo" className="h-full w-full object-contain p-1" />
              : <span className="text-2xl font-black text-slate-300">{gym?.name?.[0] ?? 'F'}</span>
            }
          </div>
          <div className="space-y-2">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f) }} />
            <Button onClick={() => logoInputRef.current?.click()} disabled={uploadLogo.isPending}>
              {uploadLogo.isPending ? 'Carico…' : 'Carica logo'}
            </Button>
            {logoMsg && <p className={`text-sm ${logoMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{logoMsg.text}</p>}
            <p className="text-xs text-slate-400">Il logo appare nella sidebar e nell'app membro.</p>
          </div>
        </div>
      </Card>

      {/* ── White label ── */}
      <Card>
        <SectionHeader title="Brand & colori" subtitle="Personalizza l'aspetto dell'app per i tuoi membri" />
        <form onSubmit={(e) => { e.preventDefault(); saveWhiteLabel.mutate() }} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand name">
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="CrossFit Milano" />
            </Field>
            <Field label="Font family">
              <Input value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} placeholder="Inter, sans-serif" />
            </Field>
          </div>

          {/* Preview strip */}
          <div className="rounded-xl overflow-hidden border border-slate-100">
            <div className="flex gap-3 p-4" style={{ backgroundColor: primaryColor || '#2563eb' }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-black"
                style={{ backgroundColor: accentColor || '#f59e0b', color: '#fff' }}>
                {brandName?.[0] ?? 'F'}
              </div>
              <span className="text-white font-semibold self-center">{brandName || 'Nome palestra'}</span>
            </div>
            <div className="flex gap-2 p-4 bg-white">
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: primaryColor || '#2563eb' }}>Primario</span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: secondaryColor || '#1e40af' }}>Secondario</span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: accentColor || '#f59e0b' }}>Accento</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ColorField label="Colore primario" value={primaryColor} onChange={setPrimaryColor} />
            <ColorField label="Colore secondario" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorField label="Colore accento" value={accentColor} onChange={setAccentColor} />
          </div>

          <div className="flex items-center justify-between pt-1">
            {wlMsg && <span className={`text-sm ${wlMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{wlMsg.text}</span>}
            <div className="ml-auto">
              <Button type="submit" disabled={saveWhiteLabel.isPending}>{saveWhiteLabel.isPending ? 'Salvo…' : 'Salva brand'}</Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Config */}
      {gym && (
        <Card className="p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Configurazione</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-xs text-slate-400">Timezone</div><div className="font-medium text-ink">{gym.timezone}</div></div>
            <div><div className="text-xs text-slate-400">Locale</div><div className="font-medium text-ink">{gym.locale}</div></div>
            <div><div className="text-xs text-slate-400">Valuta</div><div className="font-medium text-ink">{gym.currency}</div></div>
          </div>
        </Card>
      )}
    </div>
  )
}
