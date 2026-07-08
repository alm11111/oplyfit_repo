import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface FitWalletDto {
  id: string; memberId: string; tokenBalance: number
  totalEarned: number; totalSpent: number; lastTxHash: string | null; updatedAtUtc: string
}
interface FitTransactionDto {
  id: string; type: 'Earn' | 'Spend' | 'Convert' | 'Mint'
  amount: number; description: string; hash: string; previousHash: string | null; createdAtUtc: string
}
interface FitNftDto {
  id: string; tokenId: string; name: string; description: string
  imageEmoji: string | null; rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  category: string; mintedAtUtc: string
}
interface FitChainConfigDto {
  tokenName: string; tokenSymbol: string
  pointsToTokenRate: number; isEnabled: boolean; nftsEnabled: boolean
}

// ── Demo data ─────────────────────────────────────────────────────────────────
function dAgo(n: number) { const d = new Date('2026-06-24'); d.setDate(d.getDate() - n); return d.toISOString() }

const DEMO_MEMBERS = [
  { id: 'dm1', name: 'Giulia Ferretti' },
  { id: 'dm2', name: 'Marco Bianchi'   },
  { id: 'dm3', name: 'Alessia Romano'  },
  { id: 'dm4', name: 'Roberto Martini' },
]
const DEMO_WALLETS: FitWalletDto[] = [
  { id: 'w1', memberId: 'dm2', tokenBalance: 520.25, totalEarned: 620.25, totalSpent: 100.00, lastTxHash: 'a1b2c3d4e5f6', updatedAtUtc: dAgo(1) },
  { id: 'w2', memberId: 'dm1', tokenBalance: 284.50, totalEarned: 384.50, totalSpent: 100.00, lastTxHash: 'b2c3d4e5f6a1', updatedAtUtc: dAgo(2) },
  { id: 'w3', memberId: 'dm3', tokenBalance: 198.00, totalEarned: 248.00, totalSpent:  50.00, lastTxHash: 'c3d4e5f6a1b2', updatedAtUtc: dAgo(3) },
  { id: 'w4', memberId: 'dm4', tokenBalance:  45.75, totalEarned:  45.75, totalSpent:   0.00, lastTxHash: null,             updatedAtUtc: dAgo(10) },
]
const DEMO_TXNS: Record<string, FitTransactionDto[]> = {
  dm2: [
    { id: 't1', type: 'Earn',  amount: 50.00, description: 'Streak 22 giorni bonus',       hash: 'a1b2c3d4', previousHash: null,     createdAtUtc: dAgo(1)  },
    { id: 't2', type: 'Spend', amount: 25.00, description: 'Riscatto maglia Oplyfit',      hash: 'b2c3d4e5', previousHash: 'a1b2c3d4', createdAtUtc: dAgo(3) },
    { id: 't3', type: 'Earn',  amount: 100.0, description: 'Sfida 30 squat completata',    hash: 'c3d4e5f6', previousHash: 'b2c3d4e5', createdAtUtc: dAgo(8) },
    { id: 't4', type: 'Mint',  amount: 0,     description: 'NFT Campione mintato',          hash: 'd4e5f6a1', previousHash: 'c3d4e5f6', createdAtUtc: dAgo(15) },
    { id: 't5', type: 'Earn',  amount: 75.00, description: 'Referral premiato',             hash: 'e5f6a1b2', previousHash: 'd4e5f6a1', createdAtUtc: dAgo(20) },
  ],
  dm1: [
    { id: 't6', type: 'Earn',  amount: 50.00, description: 'Check-in bonus settimana',      hash: 'f6a1b2c3', previousHash: null,      createdAtUtc: dAgo(2) },
    { id: 't7', type: 'Spend', amount: 75.00, description: 'Seduta PT riscattata',          hash: 'a1b2c3d5', previousHash: 'f6a1b2c3', createdAtUtc: dAgo(7) },
    { id: 't8', type: 'Earn',  amount: 200.0, description: 'Sfida 30 squat completata',     hash: 'b2c3d4e6', previousHash: 'a1b2c3d5', createdAtUtc: dAgo(12) },
  ],
  dm3: [
    { id: 't9', type: 'Earn',  amount: 50.00, description: 'Streak 25 giorni bonus',        hash: 'c3d4e5f7', previousHash: null,       createdAtUtc: dAgo(3) },
    { id: 't10',type: 'Convert',amount: 100.0, description: 'Conversione FitPoints→FIT',   hash: 'd4e5f6a2', previousHash: 'c3d4e5f7', createdAtUtc: dAgo(14) },
  ],
  dm4: [
    { id: 't11',type: 'Earn',  amount: 45.75, description: 'Premio iscrizione programma',   hash: 'e5f6a1b3', previousHash: null,       createdAtUtc: dAgo(10) },
  ],
}
const DEMO_NFTS: FitNftDto[] = [
  { id: 'n1', tokenId: 'FIT-001', name: 'Campione Squat',       description: 'Completato il challenge 30 giorni di squat.', imageEmoji: '🏆', rarity: 'Epic',      category: 'Achievement', mintedAtUtc: dAgo(15) },
  { id: 'n2', tokenId: 'FIT-002', name: 'Streak Legend',        description: 'Streak di 22 giorni consecutivi.',             imageEmoji: '🔥', rarity: 'Rare',      category: 'Streak',      mintedAtUtc: dAgo(20) },
  { id: 'n3', tokenId: 'FIT-003', name: 'Primo Referral',       description: 'Hai portato il tuo primo amico.',              imageEmoji: '🌟', rarity: 'Common',    category: 'Referral',    mintedAtUtc: dAgo(45) },
  { id: 'n4', tokenId: 'FIT-004', name: 'Platino Elite',        description: 'Raggiunto il tier Platino fedeltà.',           imageEmoji: '💎', rarity: 'Legendary', category: 'Loyalty',     mintedAtUtc: dAgo(30) },
  { id: 'n5', tokenId: 'FIT-005', name: 'Runner Estremo',       description: 'Completato 50 km nel mese.',                  imageEmoji: '🏃', rarity: 'Epic',      category: 'Achievement', mintedAtUtc: dAgo(10) },
  { id: 'n6', tokenId: 'FIT-006', name: 'Guru della Flessibilità', description: 'Completato 21 giorni di stretching.',     imageEmoji: '🤸', rarity: 'Rare',      category: 'Achievement', mintedAtUtc: dAgo(5)  },
  { id: 'n7', tokenId: 'FIT-007', name: 'Social Star',          description: 'Tre referral premiati in un mese.',           imageEmoji: '⭐', rarity: 'Common',    category: 'Referral',    mintedAtUtc: dAgo(25) },
  { id: 'n8', tokenId: 'FIT-008', name: 'Centurion',            description: '100 sessioni in palestra completate.',         imageEmoji: '🛡️', rarity: 'Legendary', category: 'Milestone',   mintedAtUtc: dAgo(2)  },
]
const DEMO_CONFIG: FitChainConfigDto = { tokenName: 'FitCoin', tokenSymbol: 'FIT', pointsToTokenRate: 10, isEnabled: true, nftsEnabled: true }

// ── Helpers ───────────────────────────────────────────────────────────────────
const RARITY_CHIP: Record<string, string> = {
  Common:    'bg-slate-100 text-slate-600 border-slate-200',
  Rare:      'bg-blue-100 text-blue-700 border-blue-200',
  Epic:      'bg-violet-100 text-violet-700 border-violet-200',
  Legendary: 'bg-amber-100 text-amber-700 border-amber-300',
}
const TX_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  Earn:    { icon: '⬆', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  Spend:   { icon: '⬇', color: 'text-red-600',     bg: 'bg-red-50'     },
  Convert: { icon: '⇄', color: 'text-blue-600',    bg: 'bg-blue-50'    },
  Mint:    { icon: '✦', color: 'text-violet-600',  bg: 'bg-violet-50'  },
}
const AVATAR_COLORS = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500']

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

// ── Component ─────────────────────────────────────────────────────────────────
type Tab = 'wallets' | 'nfts' | 'config'
export default function FitChain() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('wallets')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const debouncedSearch = useDebounce(memberSearch, 180)
  const [earnForm, setEarnForm] = useState({ amount: '10', description: '' })
  const [spendForm, setSpendForm] = useState({ amount: '5', description: '' })
  const [nftForm, setNftForm] = useState({ name: '', description: '', imageEmoji: '🏆', rarity: 'Common', category: 'Fitness' })
  const [action, setAction] = useState<'earn' | 'spend' | 'nft' | null>(null)
  const [configForm, setConfigForm] = useState<FitChainConfigDto>(DEMO_CONFIG)
  const [msg, setMsg] = useState('')

  const { data: configData } = useQuery({ queryKey: ['fitchain-config'], queryFn: () => api.get<FitChainConfigDto>('/api/v1/fitchain/config'), retry: false })
  const { data: walletsData } = useQuery({ queryKey: ['fitchain-wallets'], queryFn: () => api.get<FitWalletDto[]>('/api/v1/fitchain/wallets?page=1&pageSize=50'), enabled: tab === 'wallets', retry: false })
  const { data: nftsData }   = useQuery({ queryKey: ['fitchain-nfts'],   queryFn: () => api.get<FitNftDto[]>('/api/v1/fitchain/nfts?page=1&pageSize=50'), enabled: tab === 'nfts', retry: false })

  const rawCfg    = (configData?.data  as any)?.data ?? configData?.data  ?? null
  const rawWallets= (walletsData?.data as any)?.data ?? walletsData?.data ?? []
  const rawNfts   = (nftsData?.data    as any)?.data ?? nftsData?.data    ?? []

  const cfg     = (rawCfg ?? DEMO_CONFIG) as FitChainConfigDto
  const wallets = (Array.isArray(rawWallets) && rawWallets.length > 0 ? rawWallets : DEMO_WALLETS) as FitWalletDto[]
  const nfts    = (Array.isArray(rawNfts)    && rawNfts.length    > 0 ? rawNfts    : DEMO_NFTS)   as FitNftDto[]

  useEffect(() => { if (rawCfg) setConfigForm(rawCfg) }, [rawCfg])

  const isDemoMember = selectedMember?.id.startsWith('dm') ?? false
  const demoWallet   = selectedMember ? DEMO_WALLETS.find(w => w.memberId === selectedMember.id) ?? null : null
  const demoTxns     = selectedMember ? (DEMO_TXNS[selectedMember.id] ?? []) : []

  const { data: memberWalletData } = useQuery({
    queryKey: ['fitchain-member-wallet', selectedMember?.id],
    queryFn: () => api.get<FitWalletDto>(`/api/v1/fitchain/members/${selectedMember!.id}/wallet`),
    enabled: !!selectedMember && !isDemoMember, retry: false,
  })
  const activeWallet = isDemoMember ? demoWallet : ((memberWalletData?.data as any)?.data ?? memberWalletData?.data ?? null)

  const earnMutation = useMutation({ mutationFn: () => api.post(`/api/v1/fitchain/members/${selectedMember?.id}/earn`, { amount: Number(earnForm.amount), description: earnForm.description }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['fitchain-wallets'] }); setMsg('Token accreditati.'); setAction(null) } })
  const spendMutation = useMutation({ mutationFn: () => api.post(`/api/v1/fitchain/members/${selectedMember?.id}/spend`, { amount: Number(spendForm.amount), description: spendForm.description }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['fitchain-wallets'] }); setMsg('Token addebitati.'); setAction(null) } })
  const mintMutation  = useMutation({ mutationFn: () => api.post(`/api/v1/fitchain/members/${selectedMember?.id}/nft`, nftForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['fitchain-nfts'] }); setMsg('NFT mintato.'); setAction(null) } })
  const saveCfgMutation = useMutation({ mutationFn: () => api.put('/api/v1/fitchain/config', configForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['fitchain-config'] }); setMsg('Configurazione salvata.') } })

  const symbol = cfg.tokenSymbol

  const filteredSuggestions = DEMO_MEMBERS.filter(m =>
    debouncedSearch.length > 0 && m.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">⛓ FitChain Wallet</h1>
          <p className="mt-0.5 text-sm text-slate-500">Wallet tokenizzato, ledger hash-chained e NFT achievement per i tuoi soci.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${cfg.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {cfg.isEnabled ? `✅ ${cfg.tokenName} (${symbol})` : '⚠️ FitChain disattivato'}
        </span>
      </div>

      {msg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="flex-1">{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: '💰', label: 'Wallet totali', value: wallets.length, sub: 'soci con wallet', color: 'text-slate-800' },
          { icon: '⬆', label: 'FIT guadagnati', value: wallets.reduce((s,w)=>s+w.totalEarned,0).toFixed(0), sub: symbol, color: 'text-emerald-600' },
          { icon: '⬇', label: 'FIT spesi',      value: wallets.reduce((s,w)=>s+w.totalSpent, 0).toFixed(0), sub: symbol, color: 'text-red-500' },
          { icon: '🎴', label: 'NFT mintati',   value: nfts.length,    sub: 'achievement digitali',           color: 'text-violet-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl">{k.icon}</p>
            <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {([['wallets','💰 Wallets'],['nfts','🎴 NFT Gallery'],['config','⚙ Config']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Wallets ── */}
      {tab === 'wallets' && (
        <div className="space-y-4">
          {/* Member selector */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Gestisci wallet membro</p>
            <div className="relative w-72">
              <input
                value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                placeholder="Cerca socio per nome…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              {showDropdown && filteredSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filteredSuggestions.map((m, i) => (
                    <button key={m.id} onMouseDown={() => { setSelectedMember(m); setMemberSearch(m.name); setShowDropdown(false); setAction(null) }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{m.name[0]}</span>
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMember && activeWallet && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="rounded-xl border-2 border-brand-100 bg-brand-50 px-5 py-3 text-center">
                    <p className="text-xl font-black text-brand-700">{activeWallet.tokenBalance.toFixed(2)} {symbol}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Saldo</p>
                  </div>
                  <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
                    <p className="text-lg font-bold text-emerald-600">{activeWallet.totalEarned.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">Guadagnato</p>
                  </div>
                  <div className="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-center">
                    <p className="text-lg font-bold text-red-500">{activeWallet.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">Speso</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(['earn','spend','nft'] as const).map(a => (
                      <button key={a} onClick={() => setAction(action === a ? null : a)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${action === a ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                        {a === 'earn' ? '⬆ Accredita' : a === 'spend' ? '⬇ Addebita' : '✦ Minta NFT'}
                      </button>
                    ))}
                  </div>
                </div>

                {action === 'earn' && !isDemoMember && (
                  <div className="flex flex-wrap items-end gap-3 rounded-lg bg-emerald-50 p-3">
                    <div><label className="mb-1 block text-xs font-medium text-slate-500">Importo ({symbol})</label><input type="number" min="0.01" step="0.01" value={earnForm.amount} onChange={e => setEarnForm(f=>({...f,amount:e.target.value}))} className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none" /></div>
                    <div className="flex-1 min-w-40"><label className="mb-1 block text-xs font-medium text-slate-500">Descrizione</label><input value={earnForm.description} onChange={e => setEarnForm(f=>({...f,description:e.target.value}))} placeholder="Es. Premio allenamento…" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none" /></div>
                    <button onClick={() => earnMutation.mutate()} disabled={earnMutation.isPending} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Conferma</button>
                  </div>
                )}
                {action === 'earn' && isDemoMember && <p className="text-xs text-slate-400 rounded-lg bg-slate-50 p-3">Demo: accredita non disponibile su dati demo.</p>}

                {action === 'spend' && !isDemoMember && (
                  <div className="flex flex-wrap items-end gap-3 rounded-lg bg-red-50 p-3">
                    <div><label className="mb-1 block text-xs font-medium text-slate-500">Importo ({symbol})</label><input type="number" min="0.01" step="0.01" value={spendForm.amount} onChange={e => setSpendForm(f=>({...f,amount:e.target.value}))} className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none" /></div>
                    <div className="flex-1 min-w-40"><label className="mb-1 block text-xs font-medium text-slate-500">Descrizione</label><input value={spendForm.description} onChange={e => setSpendForm(f=>({...f,description:e.target.value}))} placeholder="Es. Riscatto merchandising…" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none" /></div>
                    <button onClick={() => spendMutation.mutate()} disabled={spendMutation.isPending} className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">Conferma</button>
                  </div>
                )}
                {action === 'spend' && isDemoMember && <p className="text-xs text-slate-400 rounded-lg bg-slate-50 p-3">Demo: addebita non disponibile su dati demo.</p>}

                {action === 'nft' && !isDemoMember && (
                  <div className="flex flex-wrap items-end gap-3 rounded-lg bg-violet-50 p-3">
                    <div><label className="mb-1 block text-xs font-medium text-slate-500">Nome NFT</label><input value={nftForm.name} onChange={e => setNftForm(f=>({...f,name:e.target.value}))} className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none" /></div>
                    <div><label className="mb-1 block text-xs font-medium text-slate-500">Emoji</label><input value={nftForm.imageEmoji} onChange={e => setNftForm(f=>({...f,imageEmoji:e.target.value}))} className="w-14 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-center focus:outline-none text-lg" /></div>
                    <div><label className="mb-1 block text-xs font-medium text-slate-500">Rarità</label><select value={nftForm.rarity} onChange={e => setNftForm(f=>({...f,rarity:e.target.value}))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none">{['Common','Rare','Epic','Legendary'].map(r=><option key={r}>{r}</option>)}</select></div>
                    <div className="flex-1 min-w-32"><label className="mb-1 block text-xs font-medium text-slate-500">Descrizione</label><input value={nftForm.description} onChange={e => setNftForm(f=>({...f,description:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none" /></div>
                    <button onClick={() => mintMutation.mutate()} disabled={mintMutation.isPending} className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">✦ Minta</button>
                  </div>
                )}
                {action === 'nft' && isDemoMember && <p className="text-xs text-slate-400 rounded-lg bg-slate-50 p-3">Demo: mint non disponibile su dati demo.</p>}

                {/* Storico transazioni */}
                {demoTxns.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ultime transazioni</p>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      {demoTxns.map(tx => {
                        const s = TX_STYLE[tx.type]
                        return (
                          <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.bg} ${s.color}`}>{s.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 truncate">{tx.description}</p>
                              <p className="text-xs text-slate-400">{new Date(tx.createdAtUtc).toLocaleDateString('it-IT')}</p>
                            </div>
                            {tx.amount > 0 && <span className={`text-sm font-bold flex-shrink-0 ${s.color}`}>{tx.type === 'Spend' ? '-' : '+'}{tx.amount.toFixed(2)} {symbol}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wallet list */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tutti i wallet</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="px-4 py-2.5 text-left font-medium">Membro</th>
                  <th className="px-4 py-2.5 text-left font-medium">Saldo</th>
                  <th className="px-4 py-2.5 text-left font-medium">Guadagnato</th>
                  <th className="px-4 py-2.5 text-left font-medium">Speso</th>
                  <th className="px-4 py-2.5 text-left font-medium">Agg.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {wallets.map(w => {
                  const demoM = DEMO_MEMBERS.find(m => m.id === w.memberId)
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => { if (demoM) { setSelectedMember(demoM); setMemberSearch(demoM.name) } }}>
                      <td className="px-4 py-3 text-slate-700 font-medium">{demoM?.name ?? w.memberId.slice(0, 8) + '…'}</td>
                      <td className="px-4 py-3 font-black text-brand-600">{w.tokenBalance.toFixed(2)} {symbol}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{w.totalEarned.toFixed(2)}</td>
                      <td className="px-4 py-3 text-red-500">{w.totalSpent.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(w.updatedAtUtc).toLocaleDateString('it-IT')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NFT Gallery ── */}
      {tab === 'nfts' && (
        <div>
          {nfts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center">
              <p className="text-5xl">🎴</p>
              <p className="mt-3 font-semibold text-slate-700">Nessun NFT mintato</p>
              <p className="text-sm text-slate-400 mt-1">Vai alla tab Wallets e premi "✦ Minta NFT" per il primo.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {nfts.map(n => (
                <div key={n.id} className={`rounded-2xl border-2 bg-white p-5 flex flex-col items-center gap-2 ${RARITY_CHIP[n.rarity].includes('amber') ? 'border-amber-300' : RARITY_CHIP[n.rarity].includes('violet') ? 'border-violet-200' : RARITY_CHIP[n.rarity].includes('blue') ? 'border-blue-200' : 'border-slate-200'}`}>
                  <span className="text-5xl">{n.imageEmoji ?? '🏅'}</span>
                  <p className="font-bold text-slate-800 text-center text-sm leading-tight">{n.name}</p>
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${RARITY_CHIP[n.rarity]}`}>{n.rarity}</span>
                  <p className="text-xs text-slate-400 text-center">{n.category}</p>
                  <p className="font-mono text-xs text-slate-300">{n.tokenId}</p>
                  <p className="text-xs text-slate-400">{new Date(n.mintedAtUtc).toLocaleDateString('it-IT')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Config ── */}
      {tab === 'config' && (
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-slate-800">Configurazione FitChain</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={configForm.isEnabled} onChange={e => setConfigForm(f => ({ ...f, isEnabled: e.target.checked }))} />
              <span className="font-medium">FitChain attivo</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={configForm.nftsEnabled} onChange={e => setConfigForm(f => ({ ...f, nftsEnabled: e.target.checked }))} />
              <span className="font-medium">NFT abilitati</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Nome token</label><input value={configForm.tokenName} onChange={e => setConfigForm(f => ({ ...f, tokenName: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-600">Simbolo</label><input value={configForm.tokenSymbol} onChange={e => setConfigForm(f => ({ ...f, tokenSymbol: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" /></div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">FitPoints per 1 {configForm.tokenSymbol}</label>
            <input type="number" min="1" step="0.01" value={configForm.pointsToTokenRate} onChange={e => setConfigForm(f => ({ ...f, pointsToTokenRate: +e.target.value }))}
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
            <span className="ml-2 text-xs text-slate-400">pts → 1 {configForm.tokenSymbol}</span>
          </div>
          <button onClick={() => saveCfgMutation.mutate()} disabled={saveCfgMutation.isPending}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {saveCfgMutation.isPending ? 'Salvataggio…' : '💾 Salva'}
          </button>
        </div>
      )}
    </div>
  )
}
