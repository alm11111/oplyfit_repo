import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button, Card, Input } from '../components/ui'

export default function Notifications() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const broadcast = useMutation({
    mutationFn: () => api.post<boolean>('/api/v1/notifications/broadcast', { title, body }),
    onSuccess: () => {
      setResult({ ok: true, text: 'Notifica inviata a tutti i membri con app installata.' })
      setTitle('')
      setBody('')
      setTimeout(() => setResult(null), 5000)
    },
    onError: (e) => setResult({ ok: false, text: e instanceof Error ? e.message : 'Errore invio' }),
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Notifiche</h1>
        <p className="text-sm text-slate-500">Invia comunicazioni push a tutti i membri della palestra</p>
      </div>

      {/* Broadcast card */}
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Broadcast push</h2>
          <p className="mt-0.5 text-xs text-slate-400">Raggiunge tutti i membri che hanno installato l'app e abilitato le notifiche</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); broadcast.mutate() }}
          className="space-y-4 p-6"
        >
          {/* Preview */}
          <div className="rounded-2xl bg-slate-800 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">F</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Oplyfit • ora</span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {title || 'Titolo della notifica'}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                  {body || 'Testo del messaggio…'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wide">Titolo *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Nuovo corso disponibile!"
              maxLength={100}
              required
            />
            <p className="mt-1 text-right text-xs text-slate-400">{title.length}/100</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wide">Messaggio *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Es. Abbiamo aggiunto nuove sessioni di yoga ogni martedì alle 18:30. Prenota subito!"
              rows={4}
              maxLength={500}
              required
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{body.length}/500</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            {result && (
              <span className={`text-sm ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                {result.ok ? '✓ ' : '✗ '}{result.text}
              </span>
            )}
            <Button type="submit" disabled={broadcast.isPending} className="ml-auto">
              {broadcast.isPending ? 'Invio…' : '↗ Invia a tutti'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: '📱', title: 'Push mobile', desc: 'Tramite Firebase Cloud Messaging (FCM) — richiede app installata' },
          { icon: '✉️', title: 'Email', desc: 'Via SendGrid — inviata automaticamente su eventi (benvenuto, abbonamento)' },
          { icon: '🔔', title: 'In-app', desc: 'Notifiche in-app disponibili nella Sessione 7 con aggiornamento app membro' },
        ].map((item) => (
          <Card key={item.title} className="p-4">
            <div className="mb-2 text-2xl">{item.icon}</div>
            <div className="text-sm font-semibold text-slate-700">{item.title}</div>
            <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
