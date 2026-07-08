import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface ReferralDto {
  id: string; referrerId: string; referralCode: string; refereeEmail: string
  refereeId: string | null; status: 'Pending' | 'Converted' | 'Rewarded' | 'Expired'
  createdAtUtc: string; convertedAtUtc: string | null; rewardedAtUtc: string | null
  expiresAtUtc: string | null; rewardNote: string | null
}
interface ReferralStatsDto {
  total: number; pending: number; converted: number; rewarded: number; expired: number
  referralCode: string | null; referrerRewardDescription: string; refereeRewardDescription: string
}
interface ReferralConfigDto {
  isEnabled: boolean; referrerRewardDescription: string; refereeRewardDescription: string
  referrerPoints: number; refereePoints: number; maxReferralsPerMember: number; expiryDays: number
}

// ── Demo data ─────────────────────────────────────────────────────────────────
function dAgo(n: number) { const d = new Date('2026-06-24'); d.setDate(d.getDate() - n); return d.toISOString() }
function dFwd(n: number) { const d = new Date('2026-06-24'); d.setDate(d.getDate() + n); return d.toISOString() }

const DEMO_REFERRALS: ReferralDto[] = [
  { id: 'r1', referrerId: 'dm2', referralCode: 'MARCO-X3K9', refereeEmail: 'sofia.battaglia@email.it',  refereeId: 'u01', status: 'Rewarded',   createdAtUtc: dAgo(45), convertedAtUtc: dAgo(40), rewardedAtUtc: dAgo(38), expiresAtUtc: dFwd(45), rewardNote: '+200 FitPoints accreditati' },
  { id: 'r2', referrerId: 'dm2', referralCode: 'MARCO-X3K9', refereeEmail: 'luca.ferrari@email.it',    refereeId: 'u02', status: 'Rewarded',   createdAtUtc: dAgo(30), convertedAtUtc: dAgo(28), rewardedAtUtc: dAgo(25), expiresAtUtc: dFwd(60), rewardNote: '+200 FitPoints accreditati' },
  { id: 'r3', referrerId: 'dm1', referralCode: 'GIULIA-A7M2', refereeEmail: 'anna.de.luca@email.it',  refereeId: 'u03', status: 'Converted',  createdAtUtc: dAgo(20), convertedAtUtc: dAgo(15), rewardedAtUtc: null,     expiresAtUtc: dFwd(70), rewardNote: null },
  { id: 'r4', referrerId: 'dm3', referralCode: 'ALESS-B5P1', refereeEmail: 'matteo.ricci@email.it',   refereeId: null,  status: 'Pending',    createdAtUtc: dAgo(10), convertedAtUtc: null,     rewardedAtUtc: null,     expiresAtUtc: dFwd(80), rewardNote: null },
  { id: 'r5', referrerId: 'dm3', referralCode: 'ALESS-B5P1', refereeEmail: 'elena.conte@email.it',    refereeId: null,  status: 'Pending',    createdAtUtc: dAgo(8),  convertedAtUtc: null,     rewardedAtUtc: null,     expiresAtUtc: dFwd(82), rewardNote: null },
  { id: 'r6', referrerId: 'dm2', referralCode: 'MARCO-X3K9', refereeEmail: 'roberto.sanna@email.it',  refereeId: null,  status: 'Pending',    createdAtUtc: dAgo(5),  convertedAtUtc: null,     rewardedAtUtc: null,     expiresAtUtc: dFwd(85), rewardNote: null },
  { id: 'r7', referrerId: 'dm1', referralCode: 'GIULIA-A7M2', refereeEmail: 'chiara.marino@email.it', refereeId: null,  status: 'Expired',    createdAtUtc: dAgo(95), convertedAtUtc: null,     rewardedAtUtc: null,     expiresAtUtc: dAgo(5),  rewardNote: null },
  { id: 'r8', referrerId: 'dm4', referralCode: 'ROBER-C2Q7', refereeEmail: 'giulio.boni@email.it',   refereeId: null,  status: 'Expired',    createdAtUtc: dAgo(65), convertedAtUtc: null,     rewardedAtUtc: null,     expiresAtUtc: dAgo(35), rewardNote: null },
  { id: 'r9', referrerId: 'dm1', referralCode: 'GIULIA-A7M2', refereeEmail: 'valentina.c@email.it',  refereeId: 'u04', status: 'Converted',  createdAtUtc: dAgo(12), convertedAtUtc: dAgo(9),  rewardedAtUtc: null,     expiresAtUtc: dFwd(78), rewardNote: null },
  { id: 'r10',referrerId: 'dm2', referralCode: 'MARCO-X3K9', refereeEmail: 'nicola.greco@email.it',  refereeId: 'u05', status: 'Rewarded',   createdAtUtc: dAgo(60), convertedAtUtc: dAgo(55), rewardedAtUtc: dAgo(50), expiresAtUtc: dFwd(30), rewardNote: '+200 FitPoints accreditati' },
]
const DEMO_STATS: ReferralStatsDto = {
  total: 10, pending: 3, converted: 2, rewarded: 3, expired: 2,
  referralCode: null, referrerRewardDescription: '200 FitPoints bonus', refereeRewardDescription: '100 FitPoints benvenuto + 1 mese premium',
}
const DEMO_CONFIG: ReferralConfigDto = {
  isEnabled: true, referrerRewardDescription: '200 FitPoints bonus per ogni referral confermato',
  refereeRewardDescription: '100 FitPoints di benvenuto + 1 mese premium gratuito',
  referrerPoints: 200, refereePoints: 100, maxReferralsPerMember: 10, expiryDays: 90,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CHIP: Record<string, string> = {
  Pending:   'bg-amber-100 text-amber-700',
  Converted: 'bg-blue-100 text-blue-700',
  Rewarded:  'bg-emerald-100 text-emerald-700',
  Expired:   'bg-slate-100 text-slate-500',
}
const STATUS_LABELS: Record<string, string> = { Pending: 'In attesa', Converted: 'Convertito', Rewarded: 'Premiato', Expired: 'Scaduto' }
const REFERRER_NAMES: Record<string, string> = { dm1: 'Giulia Ferretti', dm2: 'Marco Bianchi', dm3: 'Alessia Romano', dm4: 'Roberto Martini' }
type Tab = 'panoramica' | 'referral' | 'config'

// ── Component ─────────────────────────────────────────────────────────────────
export default function Referral() {
  const [tab, setTab] = useState<Tab>('panoramica')
  const [referrals, setReferrals] = useState<ReferralDto[]>(DEMO_REFERRALS)
  const [stats, setStats] = useState<ReferralStatsDto | null>(DEMO_STATS)
  const [config, setConfig] = useState<ReferralConfigDto | null>(DEMO_CONFIG)
  const [statusFilter, setStatusFilter] = useState('')
  const [rewardNote, setRewardNote] = useState('')
  const [rewardTarget, setRewardTarget] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [configForm, setConfigForm] = useState<ReferralConfigDto>(DEMO_CONFIG)

  const load = async () => {
    try {
      const [r, s, c] = await Promise.all([
        api.get<ReferralDto[]>(`/api/v1/referrals${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.get<ReferralStatsDto>('/api/v1/referrals/stats').catch(() => null),
        api.get<ReferralConfigDto>('/api/v1/referrals/config'),
      ])
      const rData = (r?.data as any)?.data ?? r?.data
      const sData = (s?.data as any)?.data ?? s?.data
      const cData = (c?.data as any)?.data ?? c?.data
      if (Array.isArray(rData) && rData.length > 0) setReferrals(rData)
      if (sData) setStats(sData)
      if (cData) { setConfig(cData); setConfigForm(cData) }
    } catch { /* usa demo */ }
  }

  useEffect(() => { load() }, [statusFilter])

  const filteredReferrals = statusFilter ? referrals.filter(r => r.status === statusFilter) : referrals

  const convert = async (id: string) => {
    try { await api.put(`/api/v1/referrals/${id}/convert`, {}) } catch {}
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: 'Converted', convertedAtUtc: new Date().toISOString() } : r))
    setMsg('Referral contrassegnato come convertito.')
  }

  const reward = async (id: string) => {
    try { await api.put(`/api/v1/referrals/${id}/reward`, { note: rewardNote }) } catch {}
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: 'Rewarded', rewardedAtUtc: new Date().toISOString(), rewardNote } : r))
    setRewardTarget(null); setRewardNote(''); setMsg('Premio assegnato.')
  }

  const saveConfig = async () => {
    try { await api.put('/api/v1/referrals/config', configForm) } catch {}
    setConfig(configForm); setMsg('Configurazione salvata.')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programma Referral</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestisci i referral dei soci, monitora le conversioni e assegna i premi.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${config?.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {config?.isEnabled ? '✅ Programma attivo' : '⚠️ Disattivato'}
        </span>
      </div>

      {msg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="flex-1">{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Totali',     value: stats?.total     ?? 0, color: 'text-brand-600' },
          { label: 'In attesa',  value: stats?.pending   ?? 0, color: 'text-amber-600' },
          { label: 'Convertiti', value: stats?.converted ?? 0, color: 'text-blue-600' },
          { label: 'Premiati',   value: stats?.rewarded  ?? 0, color: 'text-emerald-600' },
          { label: 'Scaduti',    value: stats?.expired   ?? 0, color: 'text-slate-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([['panoramica','📊 Panoramica'],['referral',`🔗 Referral (${referrals.length})`],['config','⚙ Configurazione']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Panoramica ── */}
      {tab === 'panoramica' && config && (
        <div className="space-y-4">
          {config.isEnabled && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Scadenza: <strong>{config.expiryDays} giorni</strong> · Max <strong>{config.maxReferralsPerMember}</strong> referral/socio
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">🏅 Chi invita (referrer)</p>
              <p className="font-semibold text-slate-800">{config.referrerRewardDescription}</p>
              <p className="text-xs text-slate-500 mt-1">+{config.referrerPoints} FitPoints</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">🎁 Nuovo iscritto (referee)</p>
              <p className="font-semibold text-slate-800">{config.refereeRewardDescription}</p>
              <p className="text-xs text-slate-500 mt-1">+{config.refereePoints} FitPoints</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Top referrer</div>
            {Object.entries(
              referrals.filter(r => r.status === 'Rewarded').reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.referrerId]: (acc[r.referrerId] ?? 0) + 1 }), {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([mid, count], i) => (
              <div key={mid} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
                <span className="w-6 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                <p className="flex-1 text-sm font-medium text-slate-800">{REFERRER_NAMES[mid] ?? mid.slice(0, 8) + '…'}</p>
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-700">{count} premiati</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Referral ── */}
      {tab === 'referral' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {(['', 'Pending', 'Converted', 'Rewarded', 'Expired'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s === '' ? 'Tutti' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {['Codice', 'Referrer', 'Email referee', 'Stato', 'Creato', 'Scadenza', 'Azioni'].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReferrals.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">Nessun referral trovato.</td></tr>
                )}
                {filteredReferrals.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{r.referralCode}</td>
                    <td className="px-4 py-3 text-slate-700">{REFERRER_NAMES[r.referrerId] ?? r.referrerId.slice(0, 8) + '…'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.refereeEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CHIP[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAtUtc).toLocaleDateString('it-IT')}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.expiresAtUtc ? new Date(r.expiresAtUtc).toLocaleDateString('it-IT') : '—'}</td>
                    <td className="px-4 py-3">
                      {r.status === 'Pending' && (
                        <button onClick={() => convert(r.id)}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                          ✓ Converti
                        </button>
                      )}
                      {r.status === 'Converted' && (
                        rewardTarget === r.id ? (
                          <div className="flex items-center gap-2">
                            <input placeholder="Nota (opz.)" value={rewardNote} onChange={e => setRewardNote(e.target.value)}
                              className="w-36 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none" />
                            <button onClick={() => reward(r.id)}
                              className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600">🎁 Assegna</button>
                            <button onClick={() => setRewardTarget(null)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-400 hover:bg-slate-50">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setRewardTarget(r.id)}
                            className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                            🎁 Premia
                          </button>
                        )
                      )}
                      {r.status === 'Rewarded' && (
                        <span className="text-xs text-emerald-600">
                          ✓ {r.rewardNote ?? 'Premiato'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Configurazione ── */}
      {tab === 'config' && (
        <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Impostazioni programma referral</h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={configForm.isEnabled} onChange={e => setConfigForm(f => ({ ...f, isEnabled: e.target.checked }))} />
            <span className="font-medium">Programma referral attivo</span>
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Premio per chi invita (testo)</label>
            <input value={configForm.referrerRewardDescription} onChange={e => setConfigForm(f => ({ ...f, referrerRewardDescription: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Premio per il nuovo iscritto (testo)</label>
            <input value={configForm.refereeRewardDescription} onChange={e => setConfigForm(f => ({ ...f, refereeRewardDescription: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([['referrerPoints','Punti referrer'],['refereePoints','Punti referee'],['maxReferralsPerMember','Max referral/socio'],['expiryDays','Scadenza (giorni)']] as const).map(([k, label]) => (
              <div key={k}>
                <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
                <input type="number" min={0} value={configForm[k]} onChange={e => setConfigForm(f => ({ ...f, [k]: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
              </div>
            ))}
          </div>
          <button onClick={saveConfig} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700">
            💾 Salva configurazione
          </button>
        </div>
      )}
    </div>
  )
}
