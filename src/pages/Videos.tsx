import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button, Input } from '../components/ui'

interface Video {
  id: string; title: string; description?: string; category: string
  blobUrl: string; thumbnailUrl?: string; durationSeconds?: number
  isPublished: boolean; tags?: string; createdAtUtc: string
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const now = '2026-06-24'
const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString() }
const DEMO_VIDEOS: Video[] = [
  { id: 'v01', title: 'Riscaldamento Completo 10 Min', description: 'Routine di warm-up per iniziare qualsiasi allenamento.', category: 'Riscaldamento', blobUrl: '', durationSeconds: 612, isPublished: true, tags: 'warm-up, mobilità, principiante', createdAtUtc: daysAgo(45) },
  { id: 'v02', title: 'Squat Tecnica Perfetta', description: 'Analisi frame-by-frame della tecnica del back squat.', category: 'Forza', blobUrl: '', durationSeconds: 845, isPublished: true, tags: 'squat, gambe, tecnica', createdAtUtc: daysAgo(40) },
  { id: 'v03', title: 'HIIT Cardio 20 Min', description: 'Circuito ad alta intensità senza attrezzi.', category: 'Cardio', blobUrl: '', durationSeconds: 1215, isPublished: true, tags: 'hiit, cardio, bruciagrassi', createdAtUtc: daysAgo(35) },
  { id: 'v04', title: 'Stretching Post-Workout', description: 'Defaticamento completo per gambe e schiena.', category: 'Flessibilita', blobUrl: '', durationSeconds: 720, isPublished: true, tags: 'stretching, flessibilità, recupero', createdAtUtc: daysAgo(30) },
  { id: 'v05', title: 'Stacco da Terra – Guida', description: 'Impostazione del deadlift per principianti e intermedi.', category: 'Tecnica', blobUrl: '', durationSeconds: 1080, isPublished: true, tags: 'deadlift, schiena, forza', createdAtUtc: daysAgo(28) },
  { id: 'v06', title: 'Foam Rolling Recupero', description: 'Protocollo di automassaggio con foam roller.', category: 'Recupero', blobUrl: '', durationSeconds: 540, isPublished: true, tags: 'foam roller, muscoli, recupero', createdAtUtc: daysAgo(22) },
  { id: 'v07', title: 'Push Day – Petto e Tricipiti', description: 'Allenamento completo spinta 45 minuti.', category: 'Forza', blobUrl: '', durationSeconds: 2700, isPublished: true, tags: 'petto, tricipiti, panca', createdAtUtc: daysAgo(18) },
  { id: 'v08', title: 'Corsa: Tecnica di Passo', description: 'Come migliorare la cadenza e ridurre gli infortuni.', category: 'Cardio', blobUrl: '', durationSeconds: 632, isPublished: true, tags: 'corsa, tecnica, gamba', createdAtUtc: daysAgo(15) },
  { id: 'v09', title: 'Yoga Mattutino 15 Min', description: 'Sequenza leggera per attivare il corpo al risveglio.', category: 'Flessibilita', blobUrl: '', durationSeconds: 918, isPublished: true, tags: 'yoga, mattino, stretching', createdAtUtc: daysAgo(12) },
  { id: 'v10', title: 'Pull-up: da 0 a 10 ripetizioni', description: 'Progressione per imparare le trazioni da zero.', category: 'Tecnica', blobUrl: '', durationSeconds: 756, isPublished: true, tags: 'trazioni, dorso, peso corporeo', createdAtUtc: daysAgo(10) },
  { id: 'v11', title: 'Mobilità Spalle e Polsi', description: 'Esercizi di mobilità per chi lavora al computer.', category: 'Riscaldamento', blobUrl: '', durationSeconds: 480, isPublished: false, tags: 'mobilità, spalle, ufficio', createdAtUtc: daysAgo(5) },
  { id: 'v12', title: 'Kettlebell Swing – Tutorial', description: 'Tecnica e programmazione dello swing con kettlebell.', category: 'Forza', blobUrl: '', durationSeconds: 695, isPublished: false, tags: 'kettlebell, swing, glutei', createdAtUtc: daysAgo(2) },
]

const CATEGORIES = ['Riscaldamento', 'Forza', 'Cardio', 'Flessibilita', 'Tecnica', 'Recupero', 'Altro']

const CAT_GRADIENT: Record<string, string> = {
  Riscaldamento: 'from-orange-400 to-amber-500',
  Forza:         'from-blue-500 to-indigo-600',
  Cardio:        'from-red-500 to-rose-600',
  Flessibilita:  'from-emerald-400 to-teal-500',
  Tecnica:       'from-violet-500 to-purple-600',
  Recupero:      'from-slate-400 to-slate-600',
  Altro:         'from-gray-400 to-gray-600',
}
const CAT_ICON: Record<string, string> = {
  Riscaldamento: '🔥', Forza: '🏋️', Cardio: '🏃', Flessibilita: '🧘', Tecnica: '🎯', Recupero: '💆', Altro: '📹',
}

function formatDuration(s?: number) {
  if (!s) return '—'
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Videos() {
  const qc = useQueryClient()
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [preview, setPreview] = useState<Video | null>(null)
  const [form, setForm] = useState({ title: '', description: '', category: 'Forza', blobUrl: '', thumbnailUrl: '', durationSeconds: '', tags: '' })

  const { data } = useQuery({
    queryKey: ['videos', filterCat, search],
    queryFn: () => { const p = new URLSearchParams(); if (filterCat) p.set('category', filterCat); if (search) p.set('search', search); return api.get<any>(`/api/v1/videos/?${p}`) },
    retry: false,
  })
  const rawVideos: Video[] = (data?.data as any)?.data ?? []
  const allVideos = rawVideos.length > 0 ? rawVideos : DEMO_VIDEOS

  const filtered = useMemo(() => allVideos.filter(v => {
    const matchCat    = !filterCat || v.category === filterCat
    const matchSearch = !search    || v.title.toLowerCase().includes(search.toLowerCase()) || (v.tags ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [allVideos, filterCat, search])

  const createVideo = useMutation({ mutationFn: () => api.post('/api/v1/videos/', { ...form, durationSeconds: form.durationSeconds ? +form.durationSeconds : null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['videos'] }); setShowForm(false) } })
  const togglePublish = useMutation({ mutationFn: ({ id, published }: { id: string; published: boolean }) => api.put(`/api/v1/videos/${id}/publish`, { published }), onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }) })
  const deleteVideo = useMutation({ mutationFn: (id: string) => api.delete(`/api/v1/videos/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }) })

  const totalSec = allVideos.filter(v => v.isPublished).reduce((s, v) => s + (v.durationSeconds ?? 0), 0)
  const totalMin = Math.round(totalSec / 60)
  const catStats = CATEGORIES.map(c => ({ cat: c, count: allVideos.filter(v => v.category === c).length })).filter(x => x.count > 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Libreria Video</h1>
          <p className="mt-0.5 text-sm text-slate-500">Video esercizi pubblicati per i soci.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">+ Aggiungi video</button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Video totali',    value: allVideos.length,                         sub: `${catStats.length} categorie`,       color: 'text-slate-800' },
          { label: 'Pubblicati',      value: allVideos.filter(v => v.isPublished).length, sub: `${allVideos.filter(v => !v.isPublished).length} in bozza`, color: 'text-emerald-600' },
          { label: 'Durata totale',   value: `${totalMin} min`,                        sub: 'contenuto pubblicato',               color: 'text-brand-600' },
          { label: 'Aggiunti (30gg)', value: allVideos.filter(v => { const d = new Date(v.createdAtUtc); return (new Date(now).getTime() - d.getTime()) / 86400000 <= 30 }).length, sub: 'nuovi video', color: 'text-slate-800' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca titolo o tag…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 w-56" />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterCat('')}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition ${!filterCat ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
            Tutti ({allVideos.length})
          </button>
          {catStats.map(c => (
            <button key={c.cat} onClick={() => setFilterCat(filterCat === c.cat ? '' : c.cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${filterCat === c.cat ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
              {CAT_ICON[c.cat]} {c.cat} ({c.count})
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 max-w-2xl">
          <h3 className="font-semibold text-slate-800">Aggiungi video</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Titolo *</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Categoria</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Durata (secondi)</label>
              <Input type="number" value={form.durationSeconds} onChange={e => setForm(p => ({ ...p, durationSeconds: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-slate-500">URL video (Azure Blob / CDN) *</label>
              <Input value={form.blobUrl} onChange={e => setForm(p => ({ ...p, blobUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-slate-500">URL thumbnail (opzionale)</label>
              <Input value={form.thumbnailUrl} onChange={e => setForm(p => ({ ...p, thumbnailUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Tag (separati da virgola)</label>
              <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="squat, gambe, principiante" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Descrizione</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => createVideo.mutate()} disabled={createVideo.isPending || !form.title || !form.blobUrl}>
              {createVideo.isPending ? 'Salvataggio…' : 'Aggiungi (bozza)'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Annulla</Button>
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => (
          <div key={v.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
            <div className={`relative aspect-video cursor-pointer bg-gradient-to-br ${CAT_GRADIENT[v.category] ?? 'from-slate-400 to-slate-600'}`}
              onClick={() => setPreview(v)}>
              {v.thumbnailUrl ? (
                <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-5xl opacity-60">{CAT_ICON[v.category] ?? '▶'}</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl ml-1">▶</span>
                </div>
              </div>
              {v.durationSeconds && (
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(v.durationSeconds)}
                </span>
              )}
              {!v.isPublished && (
                <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded">
                  Bozza
                </span>
              )}
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="font-semibold text-slate-800 leading-tight">{v.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{v.category} · {new Date(v.createdAtUtc).toLocaleDateString('it-IT')}</p>
              </div>
              {v.tags && (
                <div className="flex flex-wrap gap-1">
                  {v.tags.split(',').map(t => (
                    <span key={t} className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">{t.trim()}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Button variant={v.isPublished ? 'ghost' : 'primary'} onClick={() => togglePublish.mutate({ id: v.id, published: !v.isPublished })}>
                  {v.isPublished ? 'Nascondi' : 'Pubblica'}
                </Button>
                <button onClick={() => deleteVideo.mutate(v.id)} className="ml-auto text-xs text-red-400 hover:text-red-600">Elimina</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !showForm && (
          <div className="col-span-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-3xl">📹</p>
            <p className="mt-2 font-semibold text-slate-600">Nessun video trovato</p>
            <p className="text-sm text-slate-400">Prova a cambiare categoria o filtro di ricerca.</p>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="bg-black rounded-2xl overflow-hidden max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {preview.blobUrl ? (
              <video src={preview.blobUrl} controls autoPlay className="w-full aspect-video bg-black" />
            ) : (
              <div className={`w-full aspect-video bg-gradient-to-br ${CAT_GRADIENT[preview.category] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center`}>
                <div className="text-center text-white">
                  <p className="text-6xl mb-3">{CAT_ICON[preview.category]}</p>
                  <p className="text-sm opacity-70">Anteprima non disponibile in modalità demo</p>
                </div>
              </div>
            )}
            <div className="p-4 flex justify-between items-start">
              <div>
                <p className="text-white font-semibold">{preview.title}</p>
                <p className="text-slate-400 text-sm">{preview.category} · {formatDuration(preview.durationSeconds)}</p>
                {preview.description && <p className="text-slate-400 text-xs mt-1">{preview.description}</p>}
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-white text-sm ml-4 flex-shrink-0">Chiudi ✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
