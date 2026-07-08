export default function ArVrClasses() {
  const features = [
    {
      icon: '🥽',
      title: 'Classi in VR immersive',
      desc: 'Partecipa a sessioni di group fitness in ambienti virtuali con altri soci — anche da casa.',
      tech: 'Meta Quest 3 / Apple Vision Pro',
      status: 'Roadmap Q4 2027',
    },
    {
      icon: '📱',
      title: 'AR Form Correction',
      desc: 'Overlay in realtà aumentata sul corpo del trainer per correggere la postura in tempo reale.',
      tech: 'ARKit / ARCore',
      status: 'Roadmap Q2 2027',
    },
    {
      icon: '🏃',
      title: 'Virtual Running Routes',
      desc: 'Corra lungo percorsi reali in tutto il mondo proiettati sul tapis roulant tramite VR.',
      tech: 'Unity 3D + FTMS BLE',
      status: 'Roadmap Q3 2027',
    },
    {
      icon: '🤝',
      title: 'Avatar Social Training',
      desc: 'Allenarti con l\'avatar di un amico in tempo reale, anche a distanza.',
      tech: 'WebXR + FitChain identity',
      status: 'Roadmap 2028',
    },
  ]

  const prerequisites = [
    { done: true, label: 'FTMS BLE macchinari collegati' },
    { done: true, label: 'Streaming live (Agora.io) attivo' },
    { done: true, label: 'AI Coach per personalizzazione' },
    { done: false, label: 'Partnership hardware XR (Meta/Apple)' },
    { done: false, label: 'Unity SDK integrazione' },
    { done: false, label: 'Network latency < 20ms garantita' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">AR/VR Classi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Roadmap per l'integrazione di realtà aumentata e virtuale nelle sessioni fitness.
        </p>
      </div>

      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="font-medium text-purple-800">🚀 Funzionalità in roadmap — mese 24+</div>
        <div className="text-sm text-purple-600 mt-1">
          Le funzionalità AR/VR richiedono partnership hardware e un ecosistema maturo.
          La piattaforma Oplyfit è già progettata per supportarle.
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {features.map(f => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="font-semibold text-ink">{f.title}</div>
            <div className="text-sm text-slate-500 mt-1">{f.desc}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">{f.tech}</span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                {f.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Prerequisiti */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink mb-4">Prerequisiti tecnici</h2>
        <div className="space-y-2">
          {prerequisites.map(p => (
            <div key={p.label} className="flex items-center gap-3">
              <span className={`text-lg ${p.done ? 'text-emerald-500' : 'text-slate-300'}`}>
                {p.done ? '✓' : '○'}
              </span>
              <span className={`text-sm ${p.done ? 'text-slate-700' : 'text-slate-400'}`}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-slate-500">
          {prerequisites.filter(p => p.done).length}/{prerequisites.length} prerequisiti completati
        </div>
      </div>

      {/* Architettura */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink mb-3">Architettura pianificata</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="font-mono text-xs text-brand-600 shrink-0">01.</span>
            App mobile rileva dispositivo XR via Bluetooth
          </div>
          <div className="flex gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="font-mono text-xs text-brand-600 shrink-0">02.</span>
            Streaming sessione live (Agora.io) → headset VR
          </div>
          <div className="flex gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="font-mono text-xs text-brand-600 shrink-0">03.</span>
            Dati FTMS macchinario inviati in real-time → overlay VR
          </div>
          <div className="flex gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="font-mono text-xs text-brand-600 shrink-0">04.</span>
            AI Coach analizza postura tramite Azure CV → correzioni AR
          </div>
          <div className="flex gap-2 p-3 bg-slate-50 rounded-lg">
            <span className="font-mono text-xs text-brand-600 shrink-0">05.</span>
            Sessione registrata nel profilo membro come WorkoutSession
          </div>
        </div>
      </div>
    </div>
  )
}
