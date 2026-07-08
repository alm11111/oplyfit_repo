export default function OpenApiPortal() {
  const endpoints = [
    { group: 'Auth', method: 'POST', path: '/auth/login', desc: 'Login gym owner — restituisce JWT' },
    { group: 'Auth', method: 'POST', path: '/auth/register', desc: 'Registrazione palestra + primo owner' },
    { group: 'Auth', method: 'POST', path: '/auth/refresh', desc: 'Rinnovo access token' },
    { group: 'Members', method: 'GET', path: '/api/v1/members', desc: 'Lista soci con filtri' },
    { group: 'Members', method: 'POST', path: '/api/v1/members', desc: 'Crea socio' },
    { group: 'Members', method: 'GET', path: '/api/v1/members/{id}', desc: 'Dettaglio socio' },
    { group: 'Scheduling', method: 'GET', path: '/api/v1/scheduling/sessions', desc: 'Sessioni per data' },
    { group: 'Scheduling', method: 'POST', path: '/api/v1/scheduling/sessions', desc: 'Crea sessione classe' },
    { group: 'Machines', method: 'GET', path: '/api/v1/machines', desc: 'Lista attrezzature' },
    { group: 'Machines', method: 'GET', path: '/api/v1/machines/{id}/qr', desc: 'QR payload per macchina' },
    { group: 'Nutrition', method: 'GET', path: '/me/nutrition/diary', desc: 'Diario nutrizionale membro' },
    { group: 'Nutrition', method: 'POST', path: '/me/nutrition/diary', desc: 'Aggiungi entry al diario' },
    { group: 'PostureAI', method: 'POST', path: '/me/posture/analyze', desc: 'Analisi postura da foto (base64)' },
    { group: 'PostureAI', method: 'GET', path: '/me/posture/history', desc: 'Storico analisi posturali' },
    { group: 'SportsPsych', method: 'POST', path: '/me/mindset/log', desc: 'Registra check-in mentale' },
    { group: 'SportsPsych', method: 'GET', path: '/me/mindset/history', desc: 'Storico check-in membro' },
    { group: 'Technogym', method: 'GET', path: '/api/v1/technogym/equipment', desc: 'Attrezzature Mywellness' },
    { group: 'Technogym', method: 'POST', path: '/api/v1/technogym/sync', desc: 'Sincronizza sessioni Technogym' },
    { group: 'LifeFitness', method: 'GET', path: '/api/v1/lifefitness/equipment', desc: 'Attrezzature LFopen' },
    { group: 'LifeFitness', method: 'POST', path: '/api/v1/lifefitness/sync', desc: 'Sincronizza workout Life Fitness' },
    { group: 'Wellness', method: 'GET', path: '/api/v1/wellness/appointments', desc: 'Lista appuntamenti wellness' },
    { group: 'Wellness', method: 'POST', path: '/api/v1/wellness/appointments', desc: 'Prenota appuntamento (anche telehealth)' },
    { group: 'Contracts', method: 'GET', path: '/api/v1/contracts', desc: 'Lista contratti' },
    { group: 'Contracts', method: 'POST', path: '/api/v1/contracts/{id}/send', desc: 'Invia a firma digitale (YouSign)' },
    { group: 'FitChain', method: 'GET', path: '/api/v1/fitchain/tokens/{memberId}', desc: 'Saldo token FitChain membro' },
    { group: 'Merch', method: 'GET', path: '/api/v1/merch/catalogue', desc: 'Catalogo prodotti Printful' },
  ]

  const groups = [...new Set(endpoints.map(e => e.group))]
  const methodColor: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-emerald-100 text-emerald-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
    PATCH: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">OpenAPI Portal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Riferimento rapido degli endpoint pubblici Oplyfit — autenticazione Bearer JWT obbligatoria.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm text-slate-600">
          <strong>Base URL:</strong>{' '}
          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">https://api.fitcore.io</code>
          {' '} · {' '}
          <strong>Header:</strong>{' '}
          <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">Authorization: Bearer &lt;token&gt;</code>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Gli endpoint <code>/me/*</code> richiedono un token membro. Gli endpoint <code>/api/v1/*</code> richiedono un token gym owner (policy <code>GymOwnerPolicy</code>).
        </div>
      </div>

      <div className="space-y-4">
        {groups.map(group => (
          <div key={group} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="font-semibold text-ink">{group}</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {endpoints.filter(e => e.group === group).map((e, i) => (
                <div key={i} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-3">
                  <span className={`shrink-0 self-start rounded-full px-2 py-0.5 text-xs font-bold ${methodColor[e.method] ?? 'bg-slate-100 text-slate-600'}`}>
                    {e.method}
                  </span>
                  <code className="flex-1 text-xs font-mono text-slate-700">{e.path}</code>
                  <span className="text-sm text-slate-500">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
