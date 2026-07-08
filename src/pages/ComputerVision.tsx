import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
interface PostureAssessmentDto {
  id: string; memberId: string; assessedAtUtc: string; overallScore: number
  headAlignment: string | null; shoulderBalance: string | null; spineAlignment: string | null
  hipLevel: string | null; kneeAlignment: string | null; recommendations: string | null; isStub: boolean
}
interface MemberDto { id: string; firstName: string; lastName: string; email: string }

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MEMBERS: MemberDto[] = [
  { id: 'dm1', firstName: 'Giulia', lastName: 'Ferretti', email: 'giulia@demo.it' },
  { id: 'dm2', firstName: 'Marco', lastName: 'Bianchi', email: 'marco@demo.it' },
  { id: 'dm3', firstName: 'Alessia', lastName: 'Romano', email: 'alessia@demo.it' },
  { id: 'dm4', firstName: 'Roberto', lastName: 'Martini', email: 'roberto@demo.it' },
]
const ago = (n: number) => { const d = new Date('2026-06-24'); d.setDate(d.getDate() - n); return d.toISOString() }
const DEMO_ASSESSMENTS: Record<string, PostureAssessmentDto[]> = {
  dm1: [
    { id: 'pa1a', memberId: 'dm1', assessedAtUtc: ago(120), overallScore: 65, headAlignment: 'Leggera protrusione', shoulderBalance: 'Spalla destra +1cm', spineAlignment: 'Cifosi dorsale lieve', hipLevel: 'Simmetrico', kneeAlignment: 'Lieve valgo bilaterale', recommendations: '["Esercizi di retrazione scapolare","Stretching pettorale","Rinforzo glutei"]', isStub: true },
    { id: 'pa1b', memberId: 'dm1', assessedAtUtc: ago(90), overallScore: 71, headAlignment: 'Posizione neutra', shoulderBalance: 'Spalla destra +0.5cm', spineAlignment: 'Cifosi dorsale lieve', hipLevel: 'Simmetrico', kneeAlignment: 'Valgo migliorato', recommendations: '["Proseguire esercizi scapolari","Aggiungere plank laterale"]', isStub: true },
    { id: 'pa1c', memberId: 'dm1', assessedAtUtc: ago(60), overallScore: 76, headAlignment: 'Posizione neutra', shoulderBalance: 'Simmetrico', spineAlignment: 'Nella norma', hipLevel: 'Simmetrico', kneeAlignment: 'Nella norma', recommendations: '["Mantenere programma attuale","Aggiungere mobilità toracica"]', isStub: true },
    { id: 'pa1d', memberId: 'dm1', assessedAtUtc: ago(30), overallScore: 82, headAlignment: 'Ottimo', shoulderBalance: 'Simmetrico', spineAlignment: 'Nella norma', hipLevel: 'Simmetrico', kneeAlignment: 'Ottimo', recommendations: '["Continuare progressione","Allenamento con bilanciere consigliato"]', isStub: true },
    { id: 'pa1e', memberId: 'dm1', assessedAtUtc: ago(5), overallScore: 88, headAlignment: 'Ottimo', shoulderBalance: 'Simmetrico', spineAlignment: 'Ottima curvatura fisiologica', hipLevel: 'Simmetrico', kneeAlignment: 'Ottimo', recommendations: '["Ottima postura","Manutenzione con esercizi mobilità"]', isStub: true },
  ],
  dm2: [
    { id: 'pa2a', memberId: 'dm2', assessedAtUtc: ago(90), overallScore: 85, headAlignment: 'Posizione neutra', shoulderBalance: 'Simmetrico', spineAlignment: 'Nella norma', hipLevel: 'Simmetrico', kneeAlignment: 'Nella norma', recommendations: '["Postura eccellente","Mantenere allenamento attuale"]', isStub: true },
    { id: 'pa2b', memberId: 'dm2', assessedAtUtc: ago(60), overallScore: 87, headAlignment: 'Ottimo', shoulderBalance: 'Simmetrico', spineAlignment: 'Ottima', hipLevel: 'Simmetrico', kneeAlignment: 'Ottimo', recommendations: '["Aggiungere overhead squat per mobilità spalle"]', isStub: true },
    { id: 'pa2c', memberId: 'dm2', assessedAtUtc: ago(30), overallScore: 90, headAlignment: 'Ottimo', shoulderBalance: 'Simmetrico', spineAlignment: 'Ottima', hipLevel: 'Simmetrico', kneeAlignment: 'Ottimo', recommendations: '["Score top 10% utenti"]', isStub: true },
    { id: 'pa2d', memberId: 'dm2', assessedAtUtc: ago(5), overallScore: 92, headAlignment: 'Ottimo', shoulderBalance: 'Simmetrico', spineAlignment: 'Eccellente', hipLevel: 'Simmetrico', kneeAlignment: 'Eccellente', recommendations: '["Postura atletica ottimale","Nessuna correzione necessaria"]', isStub: true },
  ],
  dm3: [
    { id: 'pa3a', memberId: 'dm3', assessedAtUtc: ago(120), overallScore: 78, headAlignment: 'Posizione neutra', shoulderBalance: 'Simmetrico', spineAlignment: 'Lordosi lombare nella norma', hipLevel: 'Asimmetria lieve', kneeAlignment: 'Nella norma', recommendations: '["Rinforzo core","Esercizi pelvi neutra"]', isStub: true },
    { id: 'pa3b', memberId: 'dm3', assessedAtUtc: ago(60), overallScore: 80, headAlignment: 'Ottimo', shoulderBalance: 'Simmetrico', spineAlignment: 'Nella norma', hipLevel: 'Migliorato', kneeAlignment: 'Nella norma', recommendations: '["Continuare esercizi core"]', isStub: true },
    { id: 'pa3c', memberId: 'dm3', assessedAtUtc: ago(10), overallScore: 84, headAlignment: 'Ottimo', shoulderBalance: 'Simmetrico', spineAlignment: 'Nella norma', hipLevel: 'Simmetrico', kneeAlignment: 'Nella norma', recommendations: '["Ottima risposta al protocollo","Manutenzione consigliata"]', isStub: true },
  ],
  dm4: [
    { id: 'pa4a', memberId: 'dm4', assessedAtUtc: ago(90), overallScore: 48, headAlignment: 'Protrusione marcata', shoulderBalance: 'Spalla sinistra +2cm', spineAlignment: 'Ipercifosi dorsale', hipLevel: 'Asimmetria 1.5cm', kneeAlignment: 'Valgo bilaterale', recommendations: '["Fisioterapia urgente consigliata","Esercizi di riequilibrio posturale","Ridurre sedentarietà","Rinforzo posteriore catena"]', isStub: true },
    { id: 'pa4b', memberId: 'dm4', assessedAtUtc: ago(60), overallScore: 52, headAlignment: 'Protrusione lieve', shoulderBalance: 'Spalla sinistra +1.5cm', spineAlignment: 'Cifosi in miglioramento', hipLevel: 'Asimmetria 1cm', kneeAlignment: 'Valgo migliorato', recommendations: '["Continuare fisioterapia","Rinforzare posteriore catena","Stretching flessori anca"]', isStub: true },
    { id: 'pa4c', memberId: 'dm4', assessedAtUtc: ago(10), overallScore: 58, headAlignment: 'Lieve protrusione', shoulderBalance: 'Spalla sinistra +1cm', spineAlignment: 'Lieve cifosi', hipLevel: 'Asimmetria 0.5cm', kneeAlignment: 'Nella norma', recommendations: '["Buon progresso","Continuare protocollo riabilitativo"]', isStub: true },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const scoreColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-600' : 'text-red-600'
const scoreBg    = (s: number) => s >= 80 ? 'bg-emerald-100' : s >= 60 ? 'bg-amber-100' : 'bg-red-100'
const parseRecs  = (json: string | null): string[] => { if (!json) return []; try { return JSON.parse(json) } catch { return [] } }

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ComputerVision() {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberDto | null>(null)
  const [lookupId, setLookupId] = useState('')
  const debQuery = useDebounce(query, 300)

  const isDemoMember = selectedMember?.id.startsWith('dm') ?? false

  const { data: searchData } = useQuery({
    queryKey: ['members-search', debQuery],
    queryFn: () => api.get<MemberDto[]>(`/api/v1/members/search?q=${encodeURIComponent(debQuery)}&limit=8`),
    enabled: debQuery.trim().length >= 2 && !isDemoMember,
    retry: false,
  })
  const remoteMembers: MemberDto[] = (searchData?.data as any)?.data ?? searchData?.data ?? []
  const demoFiltered = DEMO_MEMBERS.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(debQuery.toLowerCase()))
  const displayMembers = remoteMembers.length > 0 ? remoteMembers : demoFiltered

  const { data, isLoading } = useQuery({
    queryKey: ['posture', 'history', lookupId],
    queryFn: () => api.get<PostureAssessmentDto[]>(`/api/v1/posture/members/${lookupId}/history?limit=10`),
    enabled: !!lookupId && !isDemoMember,
    retry: false,
  })
  const remoteAssessments: PostureAssessmentDto[] = (data?.data as any)?.data ?? data?.data ?? []
  const assessments: PostureAssessmentDto[] = isDemoMember ? (DEMO_ASSESSMENTS[selectedMember!.id] ?? []) : remoteAssessments

  const trendData = [...assessments].reverse().map((a, i) => ({
    n: `V${i + 1}`, score: a.overallScore, date: new Date(a.assessedAtUtc).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
  }))
  const latest = assessments[0]

  function selectMember(m: MemberDto) {
    setSelectedMember(m)
    setQuery(`${m.firstName} ${m.lastName}`)
    setShowDropdown(false)
    setLookupId(m.id.startsWith('dm') ? '' : m.id)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analisi Postura AI</h1>
        <p className="mt-0.5 text-sm text-slate-500">Azure Computer Vision 4.0 — rilevamento persone e analisi posturale tramite foto.</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl">🧠</p>
          <p className="mt-2 font-semibold text-slate-800">Azure Computer Vision</p>
          <p className="text-sm text-slate-500">imageanalysis:analyze?features=people</p>
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Non attiva</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl">📊</p>
          <p className="mt-2 font-semibold text-slate-800">Score posturale</p>
          <p className="text-sm text-slate-500">0–100 · calcolato su 5 segmenti corpo</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">≥80 Ottimo</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">60–79 Da migliorare</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">&lt;60 Critico</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-2xl">📱</p>
          <p className="mt-2 font-semibold text-slate-800">Acquisizione da app</p>
          <p className="text-sm text-slate-500">Il membro scatta una foto → inviata come base64 → analisi server-side.</p>
        </div>
      </div>

      {/* Member selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Seleziona socio</h2>
        <div className="relative max-w-sm">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); if (!e.target.value) { setSelectedMember(null); setLookupId('') } }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
            placeholder="Cerca per nome…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {showDropdown && query.length >= 1 && displayMembers.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {displayMembers.map(m => {
                const demos = DEMO_ASSESSMENTS[m.id]
                const latestScore = demos ? demos[0]?.overallScore : null
                return (
                  <button key={m.id} onMouseDown={() => selectMember(m)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-slate-400 truncate">{m.email}</p>
                    </div>
                    {latestScore !== null && (
                      <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${scoreBg(latestScore)} ${scoreColor(latestScore)}`}>{latestScore}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {selectedMember && (isLoading && !isDemoMember ? (
        <p className="text-sm text-slate-400">Caricamento…</p>
      ) : assessments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-3xl">🏃</p>
          <p className="mt-2 font-semibold text-slate-700">Nessuna analisi trovata</p>
          <p className="text-sm text-slate-400">{selectedMember.firstName} non ha ancora eseguito analisi posturali.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Trend chart */}
          {trendData.length >= 2 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="mb-1 text-sm font-semibold text-slate-700">Trend score posturale — {selectedMember.firstName} {selectedMember.lastName}</p>
              <p className="text-xs text-slate-400 mb-4">{assessments.length} valutazioni disponibili</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v, 'Score']} />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 2" label={{ value: 'Ottimo', position: 'insideTopRight', fontSize: 10, fill: '#10b981' }} />
                  <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Soglia', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Latest assessment highlight */}
          {latest && (
            <div className={`rounded-xl border p-5 ${latest.overallScore >= 80 ? 'border-emerald-200 bg-emerald-50' : latest.overallScore >= 60 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-black ${scoreBg(latest.overallScore)} ${scoreColor(latest.overallScore)}`}>
                  {latest.overallScore}
                </div>
                <div>
                  <p className="font-bold text-slate-800">Ultima valutazione</p>
                  <p className="text-sm text-slate-500">{new Date(latest.assessedAtUtc).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {assessments.length >= 2 && (
                    <p className={`text-sm font-medium mt-0.5 ${latest.overallScore > assessments[1].overallScore ? 'text-emerald-600' : 'text-red-500'}`}>
                      {latest.overallScore > assessments[1].overallScore ? '↑' : '↓'} {Math.abs(latest.overallScore - assessments[1].overallScore)} pts rispetto alla precedente
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* All assessments */}
          {assessments.map(a => {
            const recs = parseRecs(a.recommendations)
            return (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-700">{new Date(a.assessedAtUtc).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className={`rounded-full px-4 py-1.5 text-xl font-black ${scoreBg(a.overallScore)} ${scoreColor(a.overallScore)}`}>{a.overallScore}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[
                    { label: 'Testa', val: a.headAlignment },
                    { label: 'Spalle', val: a.shoulderBalance },
                    { label: 'Colonna', val: a.spineAlignment },
                    { label: 'Bacino', val: a.hipLevel },
                    { label: 'Ginocchia', val: a.kneeAlignment },
                  ].map(seg => (
                    <div key={seg.label} className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-400">{seg.label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-700 leading-tight">{seg.val ?? '—'}</p>
                    </div>
                  ))}
                </div>
                {recs.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Raccomandazioni</p>
                    <ul className="space-y-1">
                      {recs.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-brand-500 mt-0.5 flex-shrink-0">→</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
