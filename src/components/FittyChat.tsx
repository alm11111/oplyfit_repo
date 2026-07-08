import { useState, useRef, useEffect } from 'react'
import { getAIResponse, FITTY_WELCOME } from '../lib/fittyAI'
import type { ChatMessage } from '../lib/fittyAI'

// Icona Fitty — manubrio con scintilla AI
function FittyIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Peso sinistro — disco esterno */}
      <rect x="1.5" y="7.5" width="3.5" height="9" rx="1.8" fill="white" fillOpacity="0.95"/>
      {/* Peso sinistro — manicotto interno */}
      <rect x="5" y="9.5" width="2" height="5" rx="1" fill="white" fillOpacity="0.8"/>
      {/* Barra centrale */}
      <rect x="7" y="11" width="10" height="2" rx="1" fill="white" fillOpacity="0.9"/>
      {/* Peso destro — manicotto interno */}
      <rect x="17" y="9.5" width="2" height="5" rx="1" fill="white" fillOpacity="0.8"/>
      {/* Peso destro — disco esterno */}
      <rect x="19" y="7.5" width="3.5" height="9" rx="1.8" fill="white" fillOpacity="0.95"/>
      {/* Scintilla AI in alto a destra */}
      <path d="M19.5 1.5 L20.1 3.2 L21.8 3.8 L20.1 4.4 L19.5 6.1 L18.9 4.4 L17.2 3.8 L18.9 3.2Z"
        fill="white" fillOpacity="0.9"/>
      {/* Punto luce piccolo */}
      <circle cx="15.5" cy="2.5" r="1" fill="white" fillOpacity="0.55"/>
    </svg>
  )
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    return (
      <p key={i} className={`leading-snug text-[13px] ${line.startsWith('•') ? 'ml-2' : ''}`}
        dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
    )
  })
}

const QUICK = [
  { label: '📊 Situazione attuale',      q: 'Dimmi la situazione attuale della palestra' },
  { label: '💰 Quanto incasso?',          q: 'Quanto incasso il mese prossimo?' },
  { label: '📅 Prossimi 3 mesi',         q: 'Cosa succede nei prossimi 3 mesi?' },
  { label: '⚠️ Soci a rischio',          q: 'Qualcuno sta per andarsene?' },
  { label: '🛍️ Come va il marketplace?', q: 'Come va il marketplace?' },
  { label: '🏆 Miglior cliente',         q: 'Chi è il mio miglior cliente del marketplace?' },
  { label: '📋 Abbonamenti attivi',      q: 'Quanti soci sono abbonati e a quale piano?' },
  { label: '🧾 Fatture non pagate',      q: 'Ci sono fatture non pagate?' },
  { label: '🏭 Analisi fornitori',       q: 'Analisi fornitori' },
  { label: '📈 Sto crescendo?',          q: 'La palestra sta crescendo?' },
  { label: '✅ Sono in profitto?',        q: 'Sto guadagnando o sto perdendo soldi?' },
  { label: '🎯 Cosa fare adesso?',       q: 'Cosa dovrei fare adesso per migliorare?' },
  { label: '🏖️ Come andrà l\'estate?',  q: 'Come andrà la stagione estiva?' },
  { label: '💵 Giugno in sintesi',       q: 'Com\'è andato giugno?' },
  { label: '🏆 Mese migliore?',         q: 'Qual è stato il mese migliore?' },
]

export default function FittyChat() {
  const [open, setOpen]         = useState(false)
  const [hidden, setHidden]     = useState(false)
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'ai', timestamp: new Date(), text: FITTY_WELCOME },
  ])
  const [pulse, setPulse]   = useState(true)
  const chatEndRef          = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)
  const quickRef            = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120)
      setPulse(false)
    }
  }, [open])

  // Chiudi il dropdown se si clicca fuori
  useEffect(() => {
    if (!showQuick) return
    function handler(e: MouseEvent) {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setShowQuick(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showQuick])

  function sendMessage(text: string) {
    if (!text.trim()) return
    setShowQuick(false)
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'ai', timestamp: new Date(),
        text: getAIResponse(text),
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 600 + Math.random() * 350)
  }

  if (hidden) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

      {/* ── Chat panel ── */}
      {open && (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          style={{ width: 360, height: 540 }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shrink-0">
              <FittyIcon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Fitty</p>
              <p className="text-[11px] text-white/70 mt-0.5">● Online · AI Oplyfit</p>
            </div>
            <button onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80 hover:bg-white/25 transition-colors text-sm"
              aria-label="Minimizza">─</button>
            <button onClick={() => { setOpen(false); setHidden(true) }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/80 hover:bg-white/25 transition-colors text-sm"
              aria-label="Chiudi">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                    <FittyIcon size={15} />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 space-y-0.5 ${
                  msg.role === 'user'
                    ? 'rounded-tr-sm text-white'
                    : 'rounded-tl-sm bg-white border border-slate-100 text-slate-700'
                }`} style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #2563eb, #7c3aed)' } : {}}>
                  {renderText(msg.text)}
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                  <FittyIcon size={15} />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-3 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input + quick dropdown */}
          <div className="px-3 py-3 border-t border-slate-100 bg-white shrink-0">
            <div className="relative" ref={quickRef}>

              {/* Dropdown domande veloci */}
              {showQuick && (
                <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-10">
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    Domande veloci
                  </p>
                  <div className="max-h-52 overflow-y-auto">
                    {QUICK.map(item => (
                      <button key={item.label}
                        onClick={() => sendMessage(item.q)}
                        className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50 last:border-0">
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-2 items-center">
                {/* Bottone domande veloci */}
                <button type="button"
                  onClick={() => setShowQuick(v => !v)}
                  title="Domande veloci"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                    showQuick
                      ? 'border-blue-400 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300 hover:text-blue-500'
                  }`}>
                  ⚡
                </button>

                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Scrivi a Fitty..."
                  onFocus={() => setShowQuick(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" />

                <button type="submit" disabled={!input.trim() || isTyping}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14.5 1.5L1 6l5 2.5L8.5 15z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating button ── */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Apri Fitty AI"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
          {pulse && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-40"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }} />
          )}
          <FittyIcon size={28} />
          <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            Chiedi a Fitty
          </span>
          {messages.length > 1 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {Math.min(messages.filter(m => m.role === 'ai').length - 1, 9)}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
