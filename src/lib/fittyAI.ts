// ── Dati storici (12 mesi) ────────────────────────────────────────────────────
export const HISTORY = [
  { month: 'Lug', mrr: 5820, costs: 3100, salary: 15300, members: 89,  churnRate: 4.2 },
  { month: 'Ago', mrr: 5640, costs: 2980, salary: 15300, members: 85,  churnRate: 5.1 },
  { month: 'Set', mrr: 6210, costs: 3250, salary: 15300, members: 96,  churnRate: 3.8 },
  { month: 'Ott', mrr: 6780, costs: 3400, salary: 15800, members: 104, churnRate: 3.2 },
  { month: 'Nov', mrr: 7100, costs: 3550, salary: 15800, members: 110, churnRate: 2.9 },
  { month: 'Dic', mrr: 6950, costs: 3900, salary: 15800, members: 107, churnRate: 3.5 },
  { month: 'Gen', mrr: 7480, costs: 3200, salary: 16300, members: 115, churnRate: 2.8 },
  { month: 'Feb', mrr: 7620, costs: 3300, salary: 16300, members: 118, churnRate: 2.5 },
  { month: 'Mar', mrr: 7740, costs: 3450, salary: 16300, members: 120, churnRate: 2.3 },
  { month: 'Apr', mrr: 7900, costs: 3500, salary: 16300, members: 123, churnRate: 2.1 },
  { month: 'Mag', mrr: 8150, costs: 3600, salary: 16300, members: 127, churnRate: 1.9 },
  { month: 'Giu', mrr: 8340, costs: 3700, salary: 16300, members: 130, churnRate: 1.8 },
]

// ── Engine previsionale ───────────────────────────────────────────────────────
function avgGrowthRate(values: number[]): number {
  const rates = values.slice(1).map((v, i) => (v - values[i]) / values[i])
  return rates.reduce((a, b) => a + b, 0) / rates.length
}

const mrrGrowth  = avgGrowthRate(HISTORY.map(h => h.mrr))
const costGrowth = avgGrowthRate(HISTORY.map(h => h.costs))
const membGrowth = avgGrowthRate(HISTORY.map(h => h.members))
const churnAvg   = HISTORY.slice(-3).reduce((s, h) => s + h.churnRate, 0) / 3

export const lastMRR     = HISTORY[HISTORY.length - 1].mrr
export const lastCosts   = HISTORY[HISTORY.length - 1].costs
export const lastSalary  = HISTORY[HISTORY.length - 1].salary
export const lastMembers = HISTORY[HISTORY.length - 1].members

export const nextMRR     = Math.round(lastMRR  * (1 + mrrGrowth))
export const nextCosts   = Math.round(lastCosts * (1 + costGrowth * 0.7))
export const nextMembers = Math.round(lastMembers * (1 + membGrowth))
export const nextChurn   = Math.max(1.0, churnAvg - 0.15)
export const nextMargin  = nextMRR - nextCosts - lastSalary / 4

export const mrrDelta   = ((nextMRR   - lastMRR)   / lastMRR   * 100)
export const costsDelta = ((nextCosts - lastCosts)  / lastCosts * 100)
export const membDelta  = ((nextMembers - lastMembers) / lastMembers * 100)

export const FORECAST = ['Lug', 'Ago', 'Set'].map((m, i) => {
  const mrr    = Math.round(lastMRR   * Math.pow(1 + mrrGrowth,  i + 1))
  const costs  = Math.round(lastCosts * Math.pow(1 + costGrowth * 0.7, i + 1))
  const margin = mrr - costs - Math.round(lastSalary / 4)
  return { month: m, mrr, costs, members: Math.round(lastMembers * Math.pow(1 + membGrowth, i + 1)), margin, forecast: true }
})

// ── Dati Marketplace ──────────────────────────────────────────────────────────
const MARKETPLACE_CUSTOMERS = [
  { name: 'Marco Ferretti',   orders: 12, total: 1240, lastOrder: 'Giu 2026', items: ['Proteine', 'Shaker', 'Guanti'] },
  { name: 'Sara Lombardi',    orders: 9,  total: 890,  lastOrder: 'Giu 2026', items: ['Abbigliamento', 'Tappetino', 'Corda'] },
  { name: 'Luca Bernardi',    orders: 7,  total: 780,  lastOrder: 'Mag 2026', items: ['Integratori', 'Scarpe', 'Borsa'] },
  { name: 'Giulia Mancini',   orders: 11, total: 1050, lastOrder: 'Giu 2026', items: ['Proteine', 'Abbigliamento'] },
  { name: 'Andrea Caruso',    orders: 5,  total: 430,  lastOrder: 'Apr 2026', items: ['Guanti', 'Fascia'] },
  { name: 'Elena Ricci',      orders: 8,  total: 720,  lastOrder: 'Mag 2026', items: ['Tappetino', 'Corda', 'Abbigliamento'] },
  { name: 'Paolo Greco',      orders: 3,  total: 210,  lastOrder: 'Mar 2026', items: ['Shaker'] },
  { name: 'Valentina Russo',  orders: 6,  total: 560,  lastOrder: 'Giu 2026', items: ['Proteine', 'Borsa'] },
]
const MARKETPLACE_PRODUCTS = [
  { name: 'Proteine Whey 1kg',     sold: 87, revenue: 3045, category: 'Integratori' },
  { name: 'T-shirt Oplyfit',       sold: 64, revenue: 1920, category: 'Abbigliamento' },
  { name: 'Shaker Oplyfit 700ml',  sold: 53, revenue: 848,  category: 'Accessori' },
  { name: 'Guanti Palestra Pro',   sold: 41, revenue: 1230, category: 'Accessori' },
  { name: 'Tappetino Yoga 6mm',    sold: 38, revenue: 1140, category: 'Attrezzatura' },
  { name: 'Leggings Compression',  sold: 35, revenue: 1575, category: 'Abbigliamento' },
  { name: 'Corda da Salto Pro',    sold: 29, revenue: 580,  category: 'Attrezzatura' },
  { name: 'Creatina Monoidrato',   sold: 27, revenue: 810,  category: 'Integratori' },
  { name: 'Borsa Palestra 30L',    sold: 22, revenue: 1100, category: 'Accessori' },
  { name: 'Fascia Polso (coppia)', sold: 18, revenue: 270,  category: 'Accessori' },
]
const MARKETPLACE_MONTHS = [
  { month: 'Gen', orders: 38, revenue: 2100 },
  { month: 'Feb', orders: 44, revenue: 2450 },
  { month: 'Mar', orders: 51, revenue: 2890 },
  { month: 'Apr', orders: 48, revenue: 2720 },
  { month: 'Mag', orders: 62, revenue: 3410 },
  { month: 'Giu', orders: 71, revenue: 3900 },
]
const totalMktRevenue = MARKETPLACE_MONTHS.reduce((s, m) => s + m.revenue, 0)
const totalMktOrders  = MARKETPLACE_MONTHS.reduce((s, m) => s + m.orders, 0)
const bestCustomer    = MARKETPLACE_CUSTOMERS.reduce((a, b) => a.total > b.total ? a : b)
const bestProduct     = MARKETPLACE_PRODUCTS.reduce((a, b) => a.revenue > b.revenue ? a : b)
const bestProductVol  = MARKETPLACE_PRODUCTS.reduce((a, b) => a.sold > b.sold ? a : b)

// ── Dati Fatture ──────────────────────────────────────────────────────────────
const INVOICES_OUT = [
  { id: 'FT-2026-001', member: 'Marco Ferretti',  date: '03/01/2026', amount: 79,  plan: 'Pro Mensile', status: 'pagata' },
  { id: 'FT-2026-002', member: 'Sara Lombardi',   date: '05/01/2026', amount: 49,  plan: 'Starter',     status: 'pagata' },
  { id: 'FT-2026-003', member: 'Giulia Mancini',  date: '07/01/2026', amount: 199, plan: 'Enterprise',  status: 'pagata' },
  { id: 'FT-2026-041', member: 'Luca Bernardi',   date: '03/02/2026', amount: 79,  plan: 'Pro Mensile', status: 'pagata' },
  { id: 'FT-2026-089', member: 'Elena Ricci',     date: '15/03/2026', amount: 79,  plan: 'Pro Mensile', status: 'pagata' },
  { id: 'FT-2026-102', member: 'Andrea Caruso',   date: '02/04/2026', amount: 49,  plan: 'Starter',     status: 'in scadenza' },
  { id: 'FT-2026-138', member: 'Paolo Greco',     date: '10/05/2026', amount: 79,  plan: 'Pro Mensile', status: 'pagata' },
  { id: 'FT-2026-171', member: 'Valentina Russo', date: '01/06/2026', amount: 99,  plan: 'Pro Annuale', status: 'pagata' },
  { id: 'FT-2026-172', member: 'Mario Rossi',     date: '02/06/2026', amount: 49,  plan: 'Starter',     status: 'non pagata' },
  { id: 'FT-2026-188', member: 'Chiara Ferrari',  date: '15/06/2026', amount: 199, plan: 'Enterprise',  status: 'pagata' },
]
const INVOICES_IN = [
  { id: 'ACQ-001', supplier: 'FitSupply Srl',            date: '05/01/2026', amount: 1240, category: 'Prodotti Marketplace', status: 'pagata' },
  { id: 'ACQ-002', supplier: 'Enel Energia',              date: '10/01/2026', amount: 480,  category: 'Utenze',               status: 'pagata' },
  { id: 'ACQ-003', supplier: 'TechGym Manutenzioni',      date: '15/01/2026', amount: 320,  category: 'Manutenzione',          status: 'pagata' },
  { id: 'ACQ-011', supplier: 'FitSupply Srl',             date: '04/02/2026', amount: 980,  category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-012', supplier: 'Enel Energia',              date: '10/02/2026', amount: 510,  category: 'Utenze',               status: 'pagata' },
  { id: 'ACQ-021', supplier: 'Promo Digital Agency',      date: '01/03/2026', amount: 750,  category: 'Marketing',             status: 'pagata' },
  { id: 'ACQ-022', supplier: 'FitSupply Srl',             date: '05/03/2026', amount: 1380, category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-031', supplier: 'Enel Energia',              date: '10/04/2026', amount: 490,  category: 'Utenze',               status: 'pagata' },
  { id: 'ACQ-032', supplier: 'TechGym Manutenzioni',      date: '18/04/2026', amount: 280,  category: 'Manutenzione',          status: 'pagata' },
  { id: 'ACQ-041', supplier: 'FitSupply Srl',             date: '03/05/2026', amount: 1560, category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-042', supplier: 'Promo Digital Agency',      date: '12/05/2026', amount: 600,  category: 'Marketing',             status: 'pagata' },
  { id: 'ACQ-051', supplier: 'FitSupply Srl',             date: '02/06/2026', amount: 1820, category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-052', supplier: 'Enel Energia',              date: '10/06/2026', amount: 530,  category: 'Utenze',               status: 'in scadenza' },
  { id: 'ACQ-053', supplier: 'Consulenza Legale Bianchi', date: '20/06/2026', amount: 400,  category: 'Consulenze',            status: 'non pagata' },
]
const supplierTotals = INVOICES_IN.reduce((acc, inv) => {
  acc[inv.supplier] = (acc[inv.supplier] || 0) + inv.amount; return acc
}, {} as Record<string, number>)
const topSupplier   = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0]
const categoryTotals = INVOICES_IN.reduce((acc, inv) => {
  acc[inv.category] = (acc[inv.category] || 0) + inv.amount; return acc
}, {} as Record<string, number>)
const unpaidOut  = INVOICES_OUT.filter(i => i.status === 'non pagata')
const unpaidIn   = INVOICES_IN.filter(i => i.status === 'non pagata')
const dueSoonIn  = INVOICES_IN.filter(i => i.status === 'in scadenza')

// ── Dati Abbonamenti ──────────────────────────────────────────────────────────
const SUBSCRIPTION_PLANS = [
  { name: 'Starter',     price: 49,  active: 41, churn: 3.1, avgMonths: 5.2,  revenue: 2009 },
  { name: 'Pro Mensile', price: 79,  active: 58, churn: 1.4, avgMonths: 9.8,  revenue: 4582 },
  { name: 'Pro Annuale', price: 99,  active: 18, churn: 0.6, avgMonths: 14.3, revenue: 1782 },
  { name: 'Enterprise',  price: 199, active: 13, churn: 0.3, avgMonths: 18.1, revenue: 2587 },
]
const totalActiveSubs = SUBSCRIPTION_PLANS.reduce((s, p) => s + p.active, 0)
const totalSubRevenue = SUBSCRIPTION_PLANS.reduce((s, p) => s + p.revenue, 0)
const bestPlanRevenue = SUBSCRIPTION_PLANS.reduce((a, b) => a.revenue > b.revenue ? a : b)
const bestPlanCount   = SUBSCRIPTION_PLANS.reduce((a, b) => a.active > b.active ? a : b)
const expiringThisMonth = 14

// ── Aggregati storici ──────────────────────────────────────────────────────────
const bestMRR    = HISTORY.reduce((a, b) => a.mrr > b.mrr ? a : b)
const worstMRR   = HISTORY.reduce((a, b) => a.mrr < b.mrr ? a : b)
const totalYearMRR    = HISTORY.slice(6).reduce((s, h) => s + h.mrr, 0)
const totalYearCosts  = HISTORY.slice(6).reduce((s, h) => s + h.costs + Math.round(h.salary / 4), 0)
const totalYearMargin = totalYearMRR - totalYearCosts

// ── Helpers ────────────────────────────────────────────────────────────────────
export interface ChatMessage { id: string; role: 'user' | 'ai'; text: string; timestamp: Date }

const fmt  = (n: number) => `€${n.toLocaleString('it-IT')}`

const MONTH_MAP: Record<string, number> = {
  luglio: 0, lug: 0, agosto: 1, ago: 1, settembre: 2, set: 2,
  ottobre: 3, ott: 3, novembre: 4, nov: 4, dicembre: 5, dic: 5,
  gennaio: 6, gen: 6, febbraio: 7, feb: 7, marzo: 8, mar: 8,
  aprile: 9, apr: 9, maggio: 10, mag: 10, giugno: 11, giu: 11,
}
function findMonthInQ(q: string): (typeof HISTORY)[0] | null {
  for (const [key, idx] of Object.entries(MONTH_MAP)) {
    if (new RegExp(`\\b${key}\\b`).test(q)) return HISTORY[idx]
  }
  return null
}

// ── Normalizzatore: rimuove accenti, punteggiatura, doppie lettere eccessive ───
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // accenti: è→e, à→a
    .replace(/[''`]/g, "'")
    .replace(/[!?.,;:()\-_]/g, ' ')
    .replace(/(.)\1{2,}/g, '$1$1')                       // tripleee → triple
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Topic scorer — soglia bassa, pattern larghi, gestisce typo e frasi storpiate ──
function detectTopic(n: string): string | null {
  const score: Record<string, number> = {
    incassi: 0, spese: 0, soci: 0, previsioni: 0,
    marketplace: 0, fatture: 0, fornitori: 0, abbonamenti: 0,
    situazione: 0, disdette: 0, crescita: 0, consigli: 0,
    stipendi: 0, classi: 0, macchinari: 0, accessi: 0, marketing: 0
  }

  // incassi — cattura anche "guadagnato", "soldi", "euro", "cash", "quanto faccio"
  if (/incass|entrat|ricav|fatturato|mrr|guadagn|soldi|euro|cash|faccio|quanto pren|ricevo/.test(n)) score.incassi += 3
  if (/quant/.test(n) && /mes|ann|pros/.test(n)) score.incassi += 2
  if (/\\bfatt\\b/.test(n) && !/forni|acquis/.test(n)) score.incassi += 1

  // spese — "bollette", "affitto", "costi fissi", "quanto spendo", "uscite"
  if (/spes|costi|uscit|pago|spendo|bollette|affitto|costo fiss|overhead|fissi/.test(n)) score.spese += 3

  // soci — "iscritti", "clienti", "gente", "persone", "membri", "abbonati"
  if (/soci|iscrit|membri|client|gente|person|abbonati|quanti siam|quanti ci son/.test(n)) score.soci += 3

  // previsioni — "futuro", "stima", "andrà", "prevedere", "luglio agosto set"
  if (/previs|futuro|prossim|luglio|agosto|settembre|andra|prospett|stima|preved/.test(n)) score.previsioni += 2
  if (/mes/.test(n) && /prossim|success|futur/.test(n)) score.previsioni += 2

  // marketplace — "shop", "negozio", "prodotto", "ordini", "acquistato", "vendu"
  if (/market|shop|negozi|prodott|articol|vendit|ordin|acquist|compr|bestsell|vendu/.test(n)) score.marketplace += 3
  if (/client/.test(n) && /miglior|top|principal|piu/.test(n)) score.marketplace += 2

  // fatture — "FT", "fattura", "bolletta clienti", "pagata", "insoluta"
  if (/fattur|\\bft[- ]?20|ricevut|bolletta/.test(n) && !/forni|acquis/.test(n)) score.fatture += 3
  if (/pagat|saldat|insolut|non pag|da incass/.test(n) && !/forni|acquis/.test(n)) score.fatture += 2

  // fornitori — "fornitore", "ACQ", "ho comprato", "da chi acquisto"
  if (/fornitor|acq[- ]|comprat|da chi|spese estern|chi pago|ho acquist/.test(n)) score.fornitori += 3
  if (/analiz|elenc|lista/.test(n) && /fornit|acquist/.test(n)) score.fornitori += 2

  // abbonamenti — "piano", "rinnovo", "abbonamento", "subscription"
  if (/abbonament|subscript|piani|rinnov|abbonati|\\bpiano\\b/.test(n)) score.abbonamenti += 3
  if (/scadon|da rinnov|in scadenz/.test(n)) score.abbonamenti += 2

  // situazione — "come sto", "riepilogo", "panoramica", "dimmi tutto", "snap"
  if (/situazion|panoramic|riassum|dimmi tutto|come sto|aggiornament|snap|overview|riepilo/.test(n)) score.situazione += 3

  // disdette — "churn", "abbandoni", "se ne vanno", "cancellazion"
  if (/disdett|abbandoni|perso|churn|se ne van|annullat|cancelat|lasciano|smesso/.test(n)) score.disdette += 3

  // crescita — "crescendo", "migliorando", "trend", "va bene"
  if (/crescit|cresc|migliorand|trend|va bene|progress|stiamo andando|positiv/.test(n)) score.crescita += 3

  // consigli — "cosa fare", "aiutami", "suggerimento", "strategia", "consiglio"
  if (/consig|cosa fare|cosa devo|come miglior|aiutat?mi|suggeri|idea|strategi|dimmi cosa/.test(n)) score.consigli += 3

  // stipendi — "personale", "dipendenti", "paghe", "salari"
  if (/stipend|salari|dipend|personale|paghe|staff|team/.test(n)) score.stipendi += 3

  // classi — "lezioni", "corsi", "palinsesto", "timetable"
  if (/class|lezion|cors|palinsest|timetable|orari|sessioni|prenot/.test(n)) score.classi += 3

  // macchinari — "attrezzatura", "macchine", "manutenzione"
  if (/macchinar|attrezz|equipment|manutenzione|guasto|rotto/.test(n)) score.macchinari += 3

  // accessi — "presenze", "check-in", "quante persone"
  if (/access|presenz|check.in|affollam|affluenz|quante person/.test(n)) score.accessi += 3

  // marketing — "campagna", "email", "social", "promo"
  if (/marketin|campagna|email|newsletter|social|promo|pubblicita|offerta/.test(n)) score.marketing += 3

  const best = Object.entries(score).sort((a, b) => b[1] - a[1])
  return best[0][1] >= 1 ? best[0][0] : null   // soglia 1: basta un singolo segnale
}

// ── Engine risposta ────────────────────────────────────────────────────────────
export function getAIResponse(question: string): string {
  const q = question.toLowerCase().trim()
  const n = normalize(question)                          // versione normalizzata senza accenti

  // ── SALUTI E SMALL TALK ───────────────────────────────────────────────────
  if (/^(ciao|salve|buongiorno|buonasera|buona sera|ehi|hey|ola|hello|hi)\b/.test(q)) {
    const h = new Date().getHours()
    const s = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
    return `${s}! 👋 Sono **Fitty**, il tuo assistente personale Oplyfit.\n\nChiedimi qualsiasi cosa sulla tua palestra — storico, previsioni, marketplace, fatture, abbonamenti... Dimmi pure!`
  }
  const TOPIC_WORDS = ['marketplace', 'shop', 'negozio', 'abbonament', 'fattura', 'fatture', 'fornitor', 'soci', 'incass', 'guadagn', 'spese', 'palestra', 'prodott', 'previsione', 'estate', 'mese', 'anno', 'entrat', 'vendite', 'ricav', 'saldo', 'conto', 'acquist', 'fornitore', 'client']
  const hasTopicWord = TOPIC_WORDS.some(w => q.includes(w) || n.includes(w))
  if ((q.includes('come stai') || q.includes('tutto bene') || q.includes('come te la passi') ||
      (q.includes('come va') && !hasTopicWord && q.split(' ').length <= 4))) {
    return `Sto benissimo, grazie! 😊\n\nSono qui a monitorare i tuoi numeri — e le notizie sono buone: la palestra cresce, le disdette calano, gli incassi salgono.\n\nTu come stai? Dimmi cosa vuoi sapere!`
  }
  if (/\b(grazie|grazie mille|perfetto|ottimo|bravo|bene|capito)\b/.test(q) && q.length < 30) {
    return `Prego! 😊 Sono qui se hai altre domande.`
  }
  if (q === 'ok' || q === 'ok grazie' || q === 'capito' || q === 'perfetto' || q === 'bene' || q === 'va bene') {
    return `Ottimo! 👌 Se hai altre domande sono qui.`
  }
  if (q.includes('chi sei') || q.includes('cosa sei') || q.includes('cosa fai') || q.includes('come funzioni')) {
    return `Sono **Fitty** 🤖 — l'assistente AI integrato in Oplyfit.\n\nConosco i tuoi dati reali e rispondo a domande su:\n• 📅 Storico mensile — "com'è andato marzo?"\n• 🔮 Previsioni — "quanto incasso il mese prossimo?"\n• 🛍️ Marketplace — "chi compra di più?"\n• 🧾 Fatture — "cerca FT-2026-171"\n• 🏭 Fornitori — "analisi acquisti"\n• 📋 Abbonamenti — "quanti sul piano Pro?"\n\nChiedi pure in modo informale!`
  }
  if (q.includes('aiuto') || q.includes('help') || q.includes('cosa posso chiederti') || q.includes('cosa sai')) {
    return `Ecco alcune cose che puoi chiedermi:\n\n**Sul passato:** "Com'è andato febbraio?", "Qual è stato il mese migliore?", "Quanto ho incassato quest'anno?"\n\n**Sul futuro:** "Dammi una previsione per i mesi successivi", "Come andrà l'estate?", "Quanti soci avrò?"\n\n**Su finanze:** "Sono in profitto?", "Le spese aumentano?", "Quanto spendo in stipendi?"\n\n**Su marketplace:** "Chi è il mio miglior cliente?", "Prodotto più venduto?"\n\n**Su fatture:** "Cerca FT-2026-171", "Fatture non pagate", "Analisi fornitori"\n\n**Su abbonamenti:** "Quanti sul piano Pro?", "Quali scadono?"`
  }

  // ── STORICO MESE SPECIFICO ────────────────────────────────────────────────
  const hMonth = findMonthInQ(q)
  const hasMonth = hMonth !== null
  const isAboutPast = hasMonth && (
    q.includes('guadagn') || q.includes('incass') || q.includes('spes') || q.includes('soci') ||
    q.includes('iscrit') || q.includes('cost') || q.includes('andato') || q.includes('fatto') ||
    q.includes('avevo') || q.includes('era') || q.includes('avuto') || q.includes('ho') ||
    q.includes('com\'è') || q.includes('riepilogo') || q.includes('dimmi') || q.includes('dati') ||
    q.includes('bilancio') || q.includes('risultat') || q.includes('situazion') || q.includes('numero')
  )
  if (isAboutPast && hMonth) {
    const margin = hMonth.mrr - hMonth.costs - Math.round(hMonth.salary / 4)
    const prevIdx = HISTORY.indexOf(hMonth) - 1
    const prev = prevIdx >= 0 ? HISTORY[prevIdx] : null
    const vsPrev = prev ? ((hMonth.mrr - prev.mrr) / prev.mrr * 100) : null
    const emoji = margin > 2000 ? '🟢' : margin > 0 ? '🟡' : '🔴'
    return `📅 **${hMonth.month} — riepilogo**\n\n${emoji} Guadagno netto: **${fmt(margin)}**\n💰 Incassato: **${fmt(hMonth.mrr)}**${vsPrev !== null ? ` (${vsPrev >= 0 ? '+' : ''}${vsPrev.toFixed(1)}% vs mese prima)` : ''}\n💸 Spese operative: **${fmt(hMonth.costs)}**\n👔 Stipendi (quota): ~${fmt(Math.round(hMonth.salary / 4))}\n👥 Soci: **${hMonth.members}**\n📉 Disdette: ${hMonth.churnRate}%\n\n${margin > 0 ? 'Mese chiuso in positivo.' : 'Mese in perdita — le spese hanno pesato.'}${hMonth.churnRate > 3.5 ? `\n⚠️ Disdette elevate quel mese — poi sono calate.` : ''}`
  }
  if (hasMonth && hMonth) {
    const margin = hMonth.mrr - hMonth.costs - Math.round(hMonth.salary / 4)
    return `📅 **${hMonth.month}** — Incassi: **${fmt(hMonth.mrr)}** · Soci: **${hMonth.members}** · Guadagno: **${fmt(margin)}**\n\nVuoi un dettaglio su incassi, spese, soci o disdette di quel mese?`
  }

  // ── MESE MIGLIORE / PEGGIORE ──────────────────────────────────────────────
  if ((q.includes('migliore') || n.includes('migliore')) || q.includes('meglio') || q.includes('picco') || ((q.includes('più') || n.includes('piu')) && q.includes('guadagn'))) {
    const margin = bestMRR.mrr - bestMRR.costs - Math.round(bestMRR.salary / 4)
    return `🏆 **Mese migliore: ${bestMRR.month}**\n\nIncassato: **${fmt(bestMRR.mrr)}** · Soci: **${bestMRR.members}** · Guadagno netto: **${fmt(margin)}**\n\nIl trend attuale punta a superare quel record entro 2-3 mesi.`
  }
  if (q.includes('peggior') || q.includes('difficile') || (q.includes('meno') && (q.includes('guadagn') || q.includes('soci') || q.includes('incasso')))) {
    const worstM = (q.includes('soci') || q.includes('iscrit')) ? HISTORY.reduce((a, b) => a.members < b.members ? a : b) : worstMRR
    return `📉 **Mese più difficile: ${worstM.month}**\n\nIncassi: **${fmt(worstM.mrr)}** · Soci: **${worstM.members}**\n\nDal minimo ad oggi: +${lastMembers - worstM.members} soci, +${((lastMRR / worstM.mrr - 1) * 100).toFixed(0)}% di incassi. Sei cresciuto molto.`
  }

  // ── TOTALE ANNUALE / MEDIA ────────────────────────────────────────────────
  if ((q.includes('totale') || q.includes('complessivo') || q.includes('tutto') || q.includes('in tutto')) &&
      (q.includes('anno') || q.includes('annuale') || q.includes('quest\'anno') || q.includes('12 mes'))) {
    return `📊 **Anno in corso (Gen–Giu 2026)**\n\n💰 Totale incassato: **${fmt(totalYearMRR)}**\n💸 Totale spese: **${fmt(totalYearCosts)}**\n✅ Guadagno netto: **${fmt(totalYearMargin)}**\n\nMedia mensile: **${fmt(Math.round(totalYearMRR / 6))}** entrate · **${fmt(Math.round(totalYearMargin / 6))}** guadagno.`
  }
  if (q.includes('media') && (q.includes('mensile') || q.includes('mese') || q.includes('al mese'))) {
    return `📊 **Media mensile (ultimi 6 mesi)**\n\n💰 Incassi: **${fmt(Math.round(totalYearMRR / 6))}**\n💸 Spese: **${fmt(Math.round(totalYearCosts / 6))}**\n✅ Guadagno: **${fmt(Math.round(totalYearMargin / 6))}**\n👥 Soci: **${Math.round(HISTORY.slice(6).reduce((s, h) => s + h.members, 0) / 6)}**`
  }

  // ── CONFRONTO TRA DUE MESI ────────────────────────────────────────────────
  if (q.includes('rispetto') || q.includes('confronto') || q.includes('differenza tra') || q.includes(' vs ') || q.includes('paragona')) {
    const found = Object.keys(MONTH_MAP).filter(k => q.includes(k)).slice(0, 2).map(k => HISTORY[MONTH_MAP[k]])
    if (found[0] && found[1] && found[0] !== found[1]) {
      const [m1, m2] = found
      const diff = m2.mrr - m1.mrr
      return `⚖️ **${m1.month} vs ${m2.month}**\n\nIncassi: ${fmt(m1.mrr)} → **${fmt(m2.mrr)}** (${diff >= 0 ? '+' : ''}${fmt(diff)})\nSoci: ${m1.members} → **${m2.members}**\nSpese: ${fmt(m1.costs)} → **${fmt(m2.costs)}**\n\n${diff > 0 ? `📈 ${m2.month} è andato meglio.` : `📉 ${m2.month} ha reso meno.`}`
    }
  }

  // ── DISDETTE ─────────────────────────────────────────────────────────────
  if (q.includes('disdett') || n.includes('disdett') || q.includes('abbandoni') || q.includes('perso soci') || q.includes('ho perso') || q.includes('churn') || (q.includes('quanti') && q.includes('andat')) || (n.includes('chi') && n.includes('se ne va')) || n.includes('annullat')) {
    const first = HISTORY[0].churnRate
    const last  = HISTORY[HISTORY.length - 1].churnRate
    return `📉 **Andamento disdette (12 mesi)**\n\nUn anno fa: **${first}%**/mese → Oggi: **${last}%**/mese (−${((1 - last / first) * 100).toFixed(0)}%)\n\nOgni mese se ne va circa **${Math.round(lastMembers * last / 100)} socio** — un anno fa erano il doppio.\n\n✅ I soci sono soddisfatti e restano.`
  }

  // ── PREVISIONI GENERICHE ──────────────────────────────────────────────────
  if (q.includes('previsione') || q.includes('mesi successivi') || q.includes('mesi prossimi') || q.includes('futuro') || q.includes('prospettive') || (q.includes('come andrà') && !q.includes('estate'))) {
    return `🔮 **Prossimi 3 mesi (Lug–Set 2026)**\n\n**Luglio** → ~${fmt(FORECAST[0].mrr)} · guadagno ~${fmt(FORECAST[0].margin)}\n**Agosto** → ~${fmt(FORECAST[1].mrr)} · guadagno ~${fmt(FORECAST[1].margin)}\n**Settembre** → ~${fmt(FORECAST[2].mrr)} · guadagno ~${fmt(FORECAST[2].margin)} 🚀\n\nEstate tranquilla, poi settembre rimbalza forte.`
  }
  if (q.includes('fine anno') || q.includes('entro dicembre') || q.includes('proiezione annuale')) {
    return `📅 **Proiezione fine anno 2026**\n\nIncassi annuali: **~${fmt(Math.round(totalYearMRR / 6 * 12 * 1.05))}**\nGuadagno netto: **~${fmt(Math.round(totalYearMargin / 6 * 12 * 1.03))}**\nSoci a fine anno: **~${Math.round(lastMembers * Math.pow(1 + membGrowth, 6))}**`
  }

  // ── DISPATCHER "come va/vanno X" ─────────────────────────────────────────
  const isComeva = q.includes('come va') || q.includes('come vanno') || q.includes('com\'è') ||
    q.includes('come sta andando') || q.includes('come stanno andando') || q.includes('come stiamo') ||
    q.includes('come sto andando') || q.includes('andamento') || q.includes('trend') ||
    q.includes('situazione') || q.includes('stato') || q.includes('come sono')
  if (isComeva) {
    if (q.includes('incass') || q.includes('entrat') || q.includes('ricav') || q.includes('fatturato') || q.includes('guadagn') || q.includes('soldi')) {
      const delta = lastMRR - HISTORY[HISTORY.length - 2].mrr
      return `💰 **Incassi — andamento attuale**\n\n📅 Questo mese: **${fmt(lastMRR)}** (${delta >= 0 ? '+' : ''}${fmt(delta)} vs mese scorso)\n🔮 Prossimo mese: ~**${fmt(nextMRR)}** (+${mrrDelta.toFixed(1)}%)\n📈 Trend 12 mesi: da ${fmt(HISTORY[0].mrr)} → **${fmt(lastMRR)}** (+${((lastMRR / HISTORY[0].mrr - 1) * 100).toFixed(0)}%)\n\n✅ Gli incassi crescono in modo costante ogni mese.`
    }
    if (q.includes('spes') || q.includes('cost') || q.includes('uscit')) {
      return `💸 **Spese — andamento attuale**\n\nQuesto mese: **${fmt(lastCosts)}**\nProssimo mese: ~**${fmt(nextCosts)}** (+${costsDelta.toFixed(1)}%)\n\nLe spese crescono più lentamente degli incassi (+${mrrDelta.toFixed(1)}%) — il margine migliora ogni mese.`
    }
    if (q.includes('soci') || q.includes('iscrit') || q.includes('membri')) {
      return `👥 **Soci — andamento attuale**\n\nOggi: **${lastMembers}** iscritti (record storico)\nProssimo mese: ~**${nextMembers}**\nTrend 12 mesi: 89 → **${lastMembers}** (+${((lastMembers / 89 - 1) * 100).toFixed(0)}%)\nDisdette: **${lastMRR ? HISTORY[HISTORY.length-1].churnRate : '?'}%** (minimo storico)\n\n📈 Crescita solida e costante.`
    }
    if (q.includes('marketplace') || q.includes('shop') || q.includes('vendite') || q.includes('prodott')) {
      const last = MARKETPLACE_MONTHS[MARKETPLACE_MONTHS.length - 1]
      const prev = MARKETPLACE_MONTHS[MARKETPLACE_MONTHS.length - 2]
      const g = ((last.revenue - prev.revenue) / prev.revenue * 100).toFixed(1)
      return `🛍️ **Marketplace — andamento attuale**\n\n📅 Giugno: **${fmt(last.revenue)}** · ${last.orders} ordini (+${g}% vs maggio)\n💰 Anno: **${fmt(totalMktRevenue)}** · ${totalMktOrders} ordini totali\n📈 Trend: crescita mese su mese da gennaio\n\n🥇 Cliente top: **${bestCustomer.name}** · Prodotto top: **${bestProduct.name}**`
    }
    if (q.includes('abbonament') || q.includes('piani') || q.includes('rinnov')) {
      return `📋 **Abbonamenti — andamento**\n\n👥 Attivi: **${totalActiveSubs}** soci · MRR: **${fmt(totalSubRevenue)}**\n🔔 In scadenza: **${expiringThisMonth}** questo mese\n📉 Churn medio: **${(SUBSCRIPTION_PLANS.reduce((s,p)=>s+p.churnRate,0)/SUBSCRIPTION_PLANS.length).toFixed(1)}%**\n\n💎 Piano più scelto: **${bestPlanCount.name}** · Piano più redditizio: **${bestPlanRevenue.name}**`
    }
    if (q.includes('palestra') || q.includes('business') || q.includes('azienda') || q.includes('attività') || !hasTopicWord) {
      return `📊 **Palestra — situazione attuale**\n\n💰 Incassi: **${fmt(lastMRR)}** · trend +${mrrDelta.toFixed(1)}%/mese\n👥 Soci: **${lastMembers}** (record) · disdette: **1.8%** (minimo)\n✅ Guadagno netto: **~${fmt(Math.round(nextMargin))}/mese**\n🛍️ Marketplace: **${fmt(MARKETPLACE_MONTHS[MARKETPLACE_MONTHS.length-1].revenue)}**/mese\n\nTutto in crescita. Vuoi approfondire qualcosa?`
    }
  }

  // ── INCASSI ───────────────────────────────────────────────────────────────
  if (q.includes('incass') || n.includes('incass') || q.includes('entrat') || q.includes('ricav') ||
      q.includes('fatturato') || q.includes('mrr') ||
      n.includes('quanto prendo') || n.includes('quanti soldi') || n.includes('quanto guadagno') ||
      n.includes('quant incasso') || n.includes('quant faccio') ||
      (q.includes('mese') && q.includes('prossim') && !q.includes('soci') && !q.includes('3'))) {
    const delta = lastMRR - HISTORY[HISTORY.length - 2].mrr
    return `💰 **Incassi — questo mese: ${fmt(lastMRR)}**\n\nVariazione: ${delta >= 0 ? '+' : ''}${fmt(delta)} vs mese scorso\n🔮 Prossimo mese: ~**${fmt(nextMRR)}**\n\n👉 Per arrivare a ${fmt(nextMRR + 600)} basterebbero 2-3 iscrizioni in più.`
  }

  // ── SPESE ─────────────────────────────────────────────────────────────────
  if (q.includes('spes') || q.includes('uscit') || q.includes('pago') || q.includes('spendo') || (q.includes('cost') && !q.includes('fornitore') && !q.includes('acquisto'))) {
    return `💸 **Spese sotto controllo.**\n\nQuesto mese: **${fmt(lastCosts)}** operativi.\nIl mese prossimo: ~**${fmt(nextCosts)}**.\n\nLe entrate crescono più in fretta delle spese — il guadagno migliora ogni mese.`
  }

  // ── SOCI ──────────────────────────────────────────────────────────────────
  if (q.includes('soci') || n.includes('soci') || q.includes('iscrit') || n.includes('iscrit') ||
      q.includes('membri') || n.includes('quante persone') || n.includes('quanti siamo') ||
      n.includes('quanti clienti') || n.includes('quanti iscritti') ||
      (q.includes('quanti') && !q.includes('guadagn') && !q.includes('incass') && !q.includes('abbonament'))) {
    const nuovi  = Math.round(lastMembers * (membGrowth + nextChurn / 100))
    const uscite = Math.round(lastMembers * nextChurn / 100)
    return `👥 **Il mese prossimo: ~${nextMembers} soci.**\n\nOggi: ${lastMembers} · ~${nuovi} nuove iscrizioni · ~${uscite} disdette attese.\n\nLuglio è tranquillo per natura — la rimonta è a settembre.`
  }

  // ── ESTATE ────────────────────────────────────────────────────────────────
  if (q.includes('estiv') || q.includes('estate') || q.includes('stagion') || q.includes('preoccup')) {
    return `🏖️ **Estate tranquilla, non preoccuparti.**\n\n• Luglio: ~${fmt(nextMRR)}\n• Agosto: ~${fmt(Math.round(nextMRR * 0.97))}\n• Settembre: ~${fmt(Math.round(nextMRR * 1.06))} (rimbalzo forte)\n\n👉 Un'offerta estiva tiene i soci legati e li ritrovi a settembre.`
  }

  // ── RISCHIO SOCI ──────────────────────────────────────────────────────────
  if (q.includes('disdic') || q.includes('andarsene') || q.includes('rischio') || q.includes('se ne va') || q.includes('inattiv')) {
    return `⚠️ **Soci a rischio:**\n\n• 8 soci inattivi da >3 settimane\n• 14 abbonamenti in scadenza entro 30 giorni\n• 5 soci con score churn alto\n\n👉 Contatta i 14 in scadenza adesso — un messaggio personale basta.`
  }

  // ── STIPENDI ─────────────────────────────────────────────────────────────
  if (q.includes('stipendi') || n.includes('stipendi') || q.includes('salari') || n.includes('salari') || q.includes('personale') || q.includes('dipendenti') || q.includes('paghe') || n.includes('quanto pago il personale') || n.includes('quanto costano i dipendenti')) {
    return `👔 **Spesa mensile team: ${fmt(lastSalary)}**\n\n• 6 dipendenti: ~€11.600\n• 2 collaboratori: ~€2.300\n• 2 P.IVA: ~€3.400\n\nStabile fino a ottobre — possibile adeguamento ~€290/mese in autunno.`
  }

  // ── 3 MESI ────────────────────────────────────────────────────────────────
  if (q.includes('3 mes') || q.includes('tre mes') || q.includes('trimest') || q.includes('prossimi mesi') || q.includes('mesi success')) {
    return `📅 **Previsione prossimi 3 mesi**\n\n**Luglio** → ${fmt(FORECAST[0].mrr)} entrate · ${fmt(FORECAST[0].margin)} guadagno\n**Agosto** → ${fmt(FORECAST[1].mrr)} entrate · ${fmt(FORECAST[1].margin)} guadagno\n**Settembre** → ${fmt(FORECAST[2].mrr)} entrate · ${fmt(FORECAST[2].margin)} guadagno 🚀\n\n👉 Pianifica la campagna settembre adesso.`
  }

  // ── PROFITTO ─────────────────────────────────────────────────────────────
  if (q.includes('profitt') || q.includes('in positivo') || q.includes('in perdita') || q.includes('guadagno netto') || q.includes('utile') || q.includes('margine') || (q.includes('guadagn') && !hasMonth)) {
    return `✅ **Sì, stai guadagnando.**\n\nOgni mese ti restano in mano circa **${fmt(Math.round(nextMargin))}** dopo tutte le spese.\n\nSu base annuale: **~${fmt(Math.round((lastMRR - lastCosts - lastSalary / 4) * 12))}** di guadagno netto.`
  }

  // ── CRESCITA ──────────────────────────────────────────────────────────────
  if (q.includes('crescen') || q.includes('crescita') || q.includes('andando bene') || q.includes('va bene la') ||
      (q.includes('miglior') && !q.includes('client') && !q.includes('prodott') && !q.includes('fornitore') && !q.includes('piano') && !q.includes('mese') && !q.includes('articol'))) {
    return `📈 **Sì, stai crescendo bene.**\n\n• Soci: 89 → **${lastMembers}** (+${((lastMembers/89-1)*100).toFixed(0)}%)\n• Entrate: ${fmt(HISTORY[0].mrr)} → **${fmt(lastMRR)}** (+${((lastMRR/HISTORY[0].mrr-1)*100).toFixed(0)}%)\n• Disdette: dimezzate\n\nCrescita costante, non un picco isolato.`
  }

  // ── CONSIGLI ──────────────────────────────────────────────────────────────
  if ((q.includes('cosa') || q.includes('come posso')) && (q.includes('fare') || q.includes('devo') || q.includes('miglior') || q.includes('aumentar'))) {
    return `🎯 **3 azioni concrete adesso:**\n\n**1.** Contatta i 14 soci con abbonamento in scadenza\n**2.** Prepara la campagna di settembre (è il mese migliore)\n**3.** Ricontatta gli 8 soci inattivi\n\nTutte gratuite, impatto diretto sulle entrate.`
  }

  // ── SITUAZIONE GENERALE ───────────────────────────────────────────────────
  if (q.includes('situazione') || q.includes('come sto') || q.includes('panoramica') || q.includes('riassumi') || q.includes('dimmi tutto') || q.includes('aggiornamento')) {
    return `📊 **Snapshot palestra — giugno 2026**\n\n💰 Incassi: **${fmt(lastMRR)}** (in crescita)\n👥 Soci: **${lastMembers}** (record)\n✅ Guadagno netto: **~${fmt(Math.round(nextMargin))}/mese**\n📉 Disdette: **1.8%** (minimo storico)\n\nTutto positivo. Vuoi approfondire qualcosa?`
  }

  // ── CONCORRENZA ───────────────────────────────────────────────────────────
  if (q.includes('concorren') || q.includes('altre palestr') || q.includes('competitor') || q.includes('mercato')) {
    return `🏆 **Tu vs media settore:**\n\n• Churn: media 3.5–5% → tu **1.8%** ✅\n• Crescita iscritti: media 1–2%/mese → tu **~${(membGrowth * 100).toFixed(1)}%** ✅\n• MRR: media €5–7k → tu **${fmt(lastMRR)}** ✅\n\nSopra la media su tutti e tre gli indicatori.`
  }

  // ── MARKETPLACE ───────────────────────────────────────────────────────────
  if (q.includes('marketplace') || q.includes('shop') || q.includes('negozio') ||
      q.includes('prodott') || q.includes('articol') || q.includes('vendite') || q.includes('venduto') ||
      (q.includes('ordini') && !q.includes('fattura')) ||
      q.includes('miglior client') || q.includes('migliore client') || q.includes('top client') ||
      q.includes('chi compra') || q.includes('chi ha speso') || q.includes('chi acquista') ||
      (q.includes('client') && (q.includes('miglior') || q.includes('top') || q.includes('più') || q.includes('principale') || q.includes('fedele') || q.includes('importante'))) ||
      (q.includes('bestseller') || q.includes('best seller') || q.includes('più venduto') || q.includes('vende di più'))) {
    if (q.includes('miglior client') || q.includes('cliente migliore') || q.includes('chi compra di più') || q.includes('chi ha speso') || q.includes('top client')) {
      const top3 = [...MARKETPLACE_CUSTOMERS].sort((a, b) => b.total - a.total).slice(0, 3)
      return `🏆 **Top clienti marketplace**\n\n🥇 **${bestCustomer.name}** — ${fmt(bestCustomer.total)} · ${bestCustomer.orders} ordini · ${bestCustomer.lastOrder}\n🥈 ${top3[1].name} — ${fmt(top3[1].total)} · ${top3[1].orders} ordini\n🥉 ${top3[2].name} — ${fmt(top3[2].total)} · ${top3[2].orders} ordini\n\n👉 ${bestCustomer.name} è fidelizzato — considera una ricompensa riservata.`
    }
    if (q.includes('prodotto più venduto') || q.includes('bestseller') || q.includes('top prodott') || q.includes('vende di più')) {
      const top5 = [...MARKETPLACE_PRODUCTS].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
      return `🛍️ **Top prodotti (Gen–Giu 2026)**\n\n${top5.map((p, i) => `${i + 1}. **${p.name}** — ${fmt(p.revenue)} · ${p.sold} pezzi`).join('\n')}\n\n📦 Per quantità: **${bestProductVol.name}** (${bestProductVol.sold} pz)`
    }
    if (q.includes('categoria') || q.includes('tipo di prodott')) {
      const cats = MARKETPLACE_PRODUCTS.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + p.revenue; return acc }, {} as Record<string, number>)
      return `📦 **Vendite per categoria**\n\n${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,r],i)=>`${i+1}. **${c}**: ${fmt(r)}`).join('\n')}`
    }
    const last = MARKETPLACE_MONTHS[MARKETPLACE_MONTHS.length - 1]
    const prev = MARKETPLACE_MONTHS[MARKETPLACE_MONTHS.length - 2]
    const g = ((last.revenue - prev.revenue) / prev.revenue * 100).toFixed(1)
    return `🛍️ **Marketplace (Gen–Giu 2026)**\n\n💰 Fatturato: **${fmt(totalMktRevenue)}** · ${totalMktOrders} ordini\n📅 ${last.month}: **${fmt(last.revenue)}** (+${g}% vs mese prima)\n\n🥇 Cliente top: **${bestCustomer.name}** (${fmt(bestCustomer.total)})\n🥇 Prodotto top: **${bestProduct.name}** (${fmt(bestProduct.revenue)})`
  }

  // ── HELPER: è una domanda su fatture lato clienti (non fornitori)? ──────────
  const isAboutOutInvoice = (
    q.includes('fattura') || q.includes('fatture') || q.includes('ft-2026') || q.includes('ft 2026')
  ) && !(
    q.includes('acquisto') || q.includes('acq-') || q.includes('acq ') ||
    q.includes('fornitore') || q.includes('fornitori')
  )

  // ── FATTURE DA PAGARE (entrambe le parti) — priorità alta ────────────────
  const isPaymentRequest = q.includes('da pagare') || q.includes('devono essere pagate') ||
    q.includes('devo pagare') || q.includes('da saldare') || q.includes('da incassare') ||
    q.includes('insolut') || q.includes('arretrat') || q.includes('in sospeso') ||
    q.includes('non saldat') || q.includes('rimaste aperte') || q.includes('aperte') ||
    (q.includes('non pag') && (q.includes('fattur') || q.includes('client') || q.includes('soci'))) ||
    q.includes('scadut') || q.includes('in scadenza') || q.includes('prossima scadenza')

  if (isPaymentRequest) {
    const totOut = [...unpaidOut, ...INVOICES_OUT.filter(i => i.status === 'in scadenza')]
    const totIn  = [...unpaidIn, ...dueSoonIn]
    const totOutAmt = totOut.reduce((s, i) => s + i.amount, 0)
    const totInAmt  = totIn.reduce((s, i) => s + i.amount, 0)
    return `⚠️ **Pagamenti in sospeso — riepilogo completo**\n\n` +
      `**🧾 Clienti che devono pagarti:**\n` +
      (totOut.length
        ? totOut.map(i => `${i.status === 'non pagata' ? '🔴' : '🟡'} ${i.id} — ${i.member} — **${fmt(i.amount)}** (${i.status})`).join('\n')
        : '✅ Nessuna fattura in sospeso dai clienti') +
      (totOut.length ? `\n💰 Totale da incassare: **${fmt(totOutAmt)}**` : '') +
      `\n\n**🏭 Fatture da pagare ai fornitori:**\n` +
      (totIn.length
        ? totIn.map(i => `${i.status === 'non pagata' ? '🔴' : '🟡'} ${i.id} — ${i.supplier} — **${fmt(i.amount)}** (${i.status})`).join('\n')
        : '✅ Nessuna fattura fornitore in sospeso') +
      (totIn.length ? `\n💸 Totale da pagare: **${fmt(totInAmt)}**` : '')
  }

  // ── FATTURE EMESSE (verso clienti) ───────────────────────────────────────
  if (isAboutOutInvoice) {
    const fmtRow = (i: typeof INVOICES_OUT[0]) =>
      `${i.status === 'pagata' ? '✅' : i.status === 'in scadenza' ? '🟡' : '🔴'} **${i.id}** — ${i.member} — **${fmt(i.amount)}** — ${i.plan} — ${i.date} — _${i.status}_`

    // Cerca per codice FT
    const ftMatch = q.match(/ft[\-\s]?2026[\-\s]?(\d+)/i)
    if (ftMatch) {
      const id  = `FT-2026-${ftMatch[1].padStart(3, '0')}`
      const inv = INVOICES_OUT.find(i => i.id === id)
      return inv
        ? `🧾 **${inv.id} — Dettaglio**\n\n👤 Cliente: **${inv.member}**\n📅 Data: ${inv.date}\n💰 Importo: **${fmt(inv.amount)}**\n📋 Piano: ${inv.plan}\n✅ Stato: **${inv.status}**`
        : `❌ Fattura **${id}** non trovata.\n\nFatture disponibili: ${INVOICES_OUT.map(i => i.id).join(', ')}`
    }
    // Cerca per nome cliente
    const nameMatch = INVOICES_OUT.find(i =>
      q.includes(i.member.toLowerCase().split(' ')[0]) ||
      q.includes(i.member.toLowerCase().split(' ')[1])
    )
    if (nameMatch && nameMatch.member.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w))) {
      const all = INVOICES_OUT.filter(i => i.member === nameMatch.member)
      return `🧾 **Fatture di ${nameMatch.member}** (${all.length})\n\n${all.map(fmtRow).join('\n')}\n\n💰 Totale: **${fmt(all.reduce((s, i) => s + i.amount, 0))}**`
    }
    // Fatture pagate — con dettaglio lista
    if (q.includes('pagat') || (q.includes('paga') && !isPaymentRequest)) {
      const paid = INVOICES_OUT.filter(i => i.status === 'pagata')
      return `✅ **Fatture pagate (${paid.length})**\n\n${paid.map(fmtRow).join('\n')}\n\n💰 Totale incassato: **${fmt(paid.reduce((s, i) => s + i.amount, 0))}**`
    }
    // Fatture per piano
    if (q.includes('starter')) {
      const f = INVOICES_OUT.filter(i => i.plan.toLowerCase().includes('starter'))
      return `📋 **Fatture piano Starter** (${f.length})\n\n${f.map(fmtRow).join('\n')}\n\n💰 Totale: **${fmt(f.reduce((s,i)=>s+i.amount,0))}**`
    }
    if (q.includes('enterprise')) {
      const f = INVOICES_OUT.filter(i => i.plan.toLowerCase().includes('enterprise'))
      return `📋 **Fatture piano Enterprise** (${f.length})\n\n${f.map(fmtRow).join('\n')}\n\n💰 Totale: **${fmt(f.reduce((s,i)=>s+i.amount,0))}**`
    }
    if (q.includes('pro')) {
      const f = INVOICES_OUT.filter(i => i.plan.toLowerCase().includes('pro'))
      return `📋 **Fatture piano Pro** (${f.length})\n\n${f.map(fmtRow).join('\n')}\n\n💰 Totale: **${fmt(f.reduce((s,i)=>s+i.amount,0))}**`
    }
    // Lista completa / dettaglio / tutte
    if (q.includes('tutte') || q.includes('lista') || q.includes('elenco') || q.includes('dettaglio') ||
        q.includes('mostrami') || q.includes('elenca') || q.includes('storico') || q.includes('completo')) {
      const tot = INVOICES_OUT.reduce((s, i) => s + i.amount, 0)
      return `🧾 **Tutte le fatture emesse (${INVOICES_OUT.length})**\n\n${INVOICES_OUT.map(fmtRow).join('\n')}\n\n💰 Totale: **${fmt(tot)}**`
    }
    // Riepilogo con dettaglio per stato
    const tot   = INVOICES_OUT.reduce((s, i) => s + i.amount, 0)
    const paid  = INVOICES_OUT.filter(i => i.status === 'pagata')
    const due   = INVOICES_OUT.filter(i => i.status === 'in scadenza')
    const unpaid = INVOICES_OUT.filter(i => i.status === 'non pagata')
    return `🧾 **Fatture emesse ai clienti — riepilogo**\n\n` +
      `✅ Pagate (${paid.length}): **${fmt(paid.reduce((s,i)=>s+i.amount,0))}**\n` +
      paid.map(i => `   • ${i.id} — ${i.member} — ${fmt(i.amount)}`).join('\n') +
      (due.length ? `\n\n🟡 In scadenza (${due.length}): **${fmt(due.reduce((s,i)=>s+i.amount,0))}**\n` +
        due.map(i => `   • ${i.id} — ${i.member} — ${fmt(i.amount)}`).join('\n') : '') +
      (unpaid.length ? `\n\n🔴 Non pagate (${unpaid.length}): **${fmt(unpaid.reduce((s,i)=>s+i.amount,0))}**\n` +
        unpaid.map(i => `   • ${i.id} — ${i.member} — ${fmt(i.amount)}`).join('\n') : '') +
      `\n\n📋 Totale emesso: **${fmt(tot)}**`
  }

  // ── ACQUISTI / FORNITORI ──────────────────────────────────────────────────
  const isAboutSupplier =
    q.includes('fornitore') || q.includes('fornitori') ||
    q.includes('fattura di acquisto') || q.includes('fatture di acquisto') ||
    q.includes('fatture acquisto') || q.includes('fattura acquisto') ||
    q.includes('acquisti') || q.includes('acquisto') || q.includes('acq-') ||
    q.includes('spese fornitori') || q.includes('spese esterne') || q.includes('costi esterni') ||
    q.includes('ho comprato') || q.includes('ho acquistato') || q.includes('cosa ho pagato') ||
    q.includes('quanto ho speso') || q.includes('cosa compro') || q.includes('cosa acquisto') ||
    q.includes('cosa acquisto') || q.includes('miei acquisti') || q.includes('le mie spese') ||
    q.includes('da chi compro') || q.includes('da chi acquisto') || q.includes('con chi lavoro')

  if (isAboutSupplier) {
    // Cerca per codice ACQ
    const acqMatch = q.match(/acq[\-\s]?(\d+)/i)
    if (acqMatch) {
      const id  = `ACQ-${acqMatch[1].padStart(3, '0')}`
      const inv = INVOICES_IN.find(i => i.id === id)
      return inv
        ? `📥 **${inv.id}**\n\n🏭 ${inv.supplier}\n📅 ${inv.date}\n💰 **${fmt(inv.amount)}** — ${inv.category}\n✅ Stato: **${inv.status}**`
        : `❌ Fattura **${id}** non trovata.`
    }
    // Cerca per nome fornitore
    const supMatch = INVOICES_IN.find(i =>
      i.supplier.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w.toLowerCase()))
    )
    if (supMatch && !q.includes('tutti') && !q.includes('tutti i') && !q.includes('analisi') && !q.includes('riepilog')) {
      const all = INVOICES_IN.filter(i => i.supplier === supMatch.supplier)
      const tot = all.reduce((s, i) => s + i.amount, 0)
      const unpaidS = all.filter(i => i.status !== 'pagata')
      return `🏭 **${supMatch.supplier}** — ${all.length} fatture\n\n${all.map(i => `${i.status === 'pagata' ? '✅' : i.status === 'in scadenza' ? '🟡' : '🔴'} ${i.id} — ${i.date} — **${fmt(i.amount)}** — ${i.category} — ${i.status}`).join('\n')}\n\n💸 Totale speso: **${fmt(tot)}**${unpaidS.length ? `\n⚠️ Da pagare: **${fmt(unpaidS.reduce((s,i)=>s+i.amount,0))}**` : '\n✅ Tutto saldato'}`
    }
    // Miglior/peggior fornitore (per costo)
    const isTopSupplierQ = q.includes('migliore') || q.includes('miglior') || q.includes('principale') ||
      q.includes('top fornitore') || q.includes('chi pago di più') || q.includes('chi mi costa di più') ||
      q.includes('chi costa di più') || q.includes('più grande') || q.includes('maggiore')
    if (isTopSupplierQ) {
      const sorted = Object.entries(supplierTotals).sort((a,b)=>b[1]-a[1])
      return `🏆 **Fornitore principale: ${sorted[0][0]}**\n\nClassifica per spesa totale (Gen–Giu 2026):\n\n${sorted.map(([s,t],i)=>`${i+1}. **${s}**: ${fmt(t)}`).join('\n')}\n\n👉 **${sorted[0][0]}** rappresenta il ${((sorted[0][1]/sorted.reduce((s,[,t])=>s+t,0))*100).toFixed(0)}% della spesa totale. Valuta un accordo annuale.`
    }
    // Analisi generale / riepilogo
    const isAnalysisQ = q.includes('analisi') || q.includes('analizza') || q.includes('dimmi') ||
      q.includes('riepilogo') || q.includes('mostrami') || q.includes('elenca') || q.includes('lista') ||
      q.includes('tutti') || q.includes('tutte') || q.includes('dettaglio')
    if (isAnalysisQ) {
      const sorted = Object.entries(supplierTotals).sort((a,b)=>b[1]-a[1])
      const tot = INVOICES_IN.reduce((s,i)=>s+i.amount,0)
      return `🏭 **Analisi completa fornitori (Gen–Giu 2026)**\n\n**Spesa per fornitore:**\n${sorted.map(([s,t],i)=>`${i+1}. **${s}**: ${fmt(t)} (${((t/tot)*100).toFixed(0)}%)`).join('\n')}\n\n**Spesa per categoria:**\n${Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1]).map(([c,t])=>`• **${c}**: ${fmt(t)}`).join('\n')}\n\n💸 Totale acquistato: **${fmt(tot)}**\n🔴 Da pagare: **${fmt([...unpaidIn,...dueSoonIn].reduce((s,i)=>s+i.amount,0))}**`
    }
    // Categoria spese
    if (q.includes('categoria') || q.includes('dove spendo') || q.includes('tipo di spesa') || q.includes('categorie') || q.includes('come spendo')) {
      const sorted = Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1])
      const tot = sorted.reduce((s,[,t])=>s+t,0)
      return `📊 **Spese per categoria (Gen–Giu 2026)**\n\n${sorted.map(([c,t],i)=>`${i+1}. **${c}**: ${fmt(t)} (${((t/tot)*100).toFixed(0)}%)`).join('\n')}\n\n💸 Totale: **${fmt(tot)}**\n\n👉 La voce più alta è **${sorted[0][0]}** — ${((sorted[0][1]/tot)*100).toFixed(0)}% della spesa.`
    }
    // Tutte le fatture acquisto in lista
    if (q.includes('elenca') || q.includes('lista') || q.includes('tutte le fatture') || q.includes('tutte le') || q.includes('mostrami tutte') || q.includes('storico acquisti')) {
      const tot = INVOICES_IN.reduce((s,i)=>s+i.amount,0)
      return `📥 **Tutte le fatture acquisto (${INVOICES_IN.length})**\n\n${INVOICES_IN.map(i=>`${i.status==='pagata'?'✅':i.status==='in scadenza'?'🟡':'🔴'} **${i.id}** — ${i.supplier} — ${fmt(i.amount)} — ${i.date}`).join('\n')}\n\n💸 Totale: **${fmt(tot)}**`
    }
    // Default: riepilogo fornitori
    const tot = INVOICES_IN.reduce((s,i)=>s+i.amount,0)
    const paid = INVOICES_IN.filter(i=>i.status==='pagata')
    return `📥 **Acquisti da fornitori (Gen–Giu 2026)**\n\n💸 Totale: **${fmt(tot)}** · ${INVOICES_IN.length} fatture\n✅ Pagate: **${paid.length}**\n🟡 In scadenza: **${dueSoonIn.length}** (${fmt(dueSoonIn.reduce((s,i)=>s+i.amount,0))})\n🔴 Non pagate: **${unpaidIn.length}** (${fmt(unpaidIn.reduce((s,i)=>s+i.amount,0))})\n\n🏭 Fornitore principale: **${topSupplier[0]}** (${fmt(topSupplier[1])})\n📊 Categoria principale: **${Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1])[0][0]}**`
  }

  // ── ABBONAMENTI ───────────────────────────────────────────────────────────
  if (q.includes('abbonament') || q.includes('subscription') || q.includes('piani') || q.includes('rinnov') ||
      q.includes('abbonati') || q.includes('iscritti ai piani') ||
      (q.includes('piano') && (q.includes('soci') || q.includes('iscritti') || q.includes('quanti') || q.includes('abbonati')))) {
    if (q.includes('starter')) {
      const p = SUBSCRIPTION_PLANS.find(x => x.name === 'Starter')!
      return `📋 **Piano Starter** — €${p.price}/mese\n\n👥 Soci attivi: **${p.active}**\n💰 Entrata mensile: **${fmt(p.revenue)}**\n📉 Churn: **${p.churnRate}%**\n⏱️ Durata media: ${p.avgMonths} mesi`
    }
    if (q.includes('pro annuale') || q.includes('annuale')) {
      const p = SUBSCRIPTION_PLANS.find(x => x.name === 'Pro Annuale')!
      return `📋 **Piano Pro Annuale** — €${p.price}/mese\n\n👥 Soci attivi: **${p.active}**\n💰 Entrata mensile: **${fmt(p.revenue)}**\n📉 Churn: **${p.churnRate}%** (basso)\n⏱️ Durata media: ${p.avgMonths} mesi — i più fedeli.`
    }
    if (q.includes('enterprise')) {
      const p = SUBSCRIPTION_PLANS.find(x => x.name === 'Enterprise')!
      return `📋 **Piano Enterprise** — €${p.price}/mese\n\n👥 Soci attivi: **${p.active}**\n💰 Entrata mensile: **${fmt(p.revenue)}**\n📉 Churn: **${p.churnRate}%** (minimo storico)\n⏱️ Durata media: ${p.avgMonths} mesi`
    }
    if (q.includes('pro mensile') || (q.includes('pro') && !q.includes('annuale'))) {
      const p = SUBSCRIPTION_PLANS.find(x => x.name === 'Pro Mensile')!
      return `📋 **Piano Pro Mensile** — €${p.price}/mese\n\n👥 Soci attivi: **${p.active}** (il più scelto)\n💰 Entrata mensile: **${fmt(p.revenue)}**\n📉 Churn: **${p.churnRate}%**\n⏱️ Durata media: ${p.avgMonths} mesi`
    }
    if (q.includes('miglior piano') || q.includes('più redditizio') || q.includes('rende di più') || q.includes('quale piano')) {
      const sorted = [...SUBSCRIPTION_PLANS].sort((a,b)=>b.revenue-a.revenue)
      return `💎 **Piani per redditività**\n\n${sorted.map((p,i)=>`${i+1}. **${p.name}** — ${fmt(p.revenue)}/mese · ${p.active} soci · churn ${p.churnRate}%`).join('\n')}\n\n👉 **${bestPlanRevenue.name}** genera più entrate. **Enterprise** ha il churn più basso (${SUBSCRIPTION_PLANS.find(p=>p.name==='Enterprise')?.churnRate}%).`
    }
    if (q.includes('scadono') || q.includes('rinnovi') || q.includes('da rinnovare') || q.includes('scadenza')) {
      return `🔔 **Abbonamenti in scadenza questo mese: ${expiringThisMonth}**\n\n• ~5 Starter · ~7 Pro Mensile · ~2 Pro Annuale\n\nTasso rinnovo atteso: ~82%. Previste ~3 disdette.\n\n👉 Contatta prima i Pro Mensile — impatto MRR maggiore.`
    }
    return `📋 **Abbonamenti attivi — situazione completa**\n\n${SUBSCRIPTION_PLANS.map(p=>`• **${p.name}** (€${p.price}/mese): **${p.active} soci** · ${fmt(p.revenue)}/mese · churn ${p.churnRate}%`).join('\n')}\n\n📊 Totale: **${totalActiveSubs} soci attivi** · MRR: **${fmt(totalSubRevenue)}**\n🔔 In scadenza questo mese: **${expiringThisMonth}**\n💎 Piano più diffuso: **${bestPlanCount.name}** (${bestPlanCount.active} soci)`
  }

  // ── STAFF / TEAM ──────────────────────────────────────────────────────────
  if (n.includes('staff') || n.includes('team') || n.includes('trainer') || n.includes('istruttore') ||
      n.includes('dipendent') || n.includes('chi lavora') || n.includes('collaborator')) {
    return `👥 **Il tuo team**\n\n• 3 Trainer certificati (full-time)\n• 2 Receptionist\n• 1 Responsabile (part-time)\n• 2 Collaboratori esterni\n• 2 Nutrizionisti (P.IVA)\n\n📅 Turni: mattina 7–13 · pomeriggio 14–22\n💸 Costo mensile: **${fmt(lastSalary)}** (stabile)\n\n👉 Il team è completo per il volume attuale di soci.`
  }

  // ── CLASSI / PROGRAMMAZIONE ───────────────────────────────────────────────
  if (n.includes('class') || n.includes('lezioni') || n.includes('corsi') ||
      n.includes('programmazione') || n.includes('palinsesto') || n.includes('orari') ||
      n.includes('sessioni') || n.includes('prenotazion') || n.includes('timetable')) {
    return `🗓️ **Classi & Sessioni**\n\n• 24 classi settimanali in programma\n• Media partecipanti: **12 per sessione** (capienza 15)\n• Classi più prenotate: CrossFit WOD, Spinning, HIIT\n• Tasso riempimento: **80%** (ottimo)\n• Lista d'attesa attiva: 3 classi\n\n👉 Considera di aggiungere 1 sessione di CrossFit serale — c'è domanda.`
  }

  // ── MACCHINARI / ATTREZZATURA ─────────────────────────────────────────────
  if (n.includes('macchinar') || n.includes('attrezzatur') || n.includes('attrezz') ||
      n.includes('manutenzione') || n.includes('equipment') || n.includes('rotto') ||
      n.includes('guasto') || n.includes('riparazion')) {
    return `🏋️ **Macchinari — stato attuale**\n\n✅ Funzionanti: **23** su 25\n⚠️ In manutenzione: 2 (tapis roulant sala cardio)\n🔧 Ultima manutenzione: 15 giugno 2026\n📅 Prossima revisione: 15 settembre 2026\n\n🔥 Macchinari più usati: Leg Press, Smith Machine, Spin Bike\n📊 Heatmap: picco utilizzo ore 18–20`
  }

  // ── ACCESSI / PRESENZE ────────────────────────────────────────────────────
  if (n.includes('access') || n.includes('presenz') || n.includes('entrat') && n.includes('palestra') ||
      n.includes('quante persone') || n.includes('affollamento') || n.includes('check-in') ||
      n.includes('visitatori') || n.includes('affluenza')) {
    return `🚪 **Accessi — questo mese**\n\n📊 Totale: **1.247 check-in**\n📅 Media giornaliera: **42 accessi/giorno**\n🔥 Giorno più affollato: Martedì (67 accessi)\n😴 Giorno più tranquillo: Domenica (18 accessi)\n⏰ Orario di punta: **18:30–20:00**\n\n👉 Considera personale aggiuntivo nel picco serale.`
  }

  // ── MARKETING / CAMPAGNE ──────────────────────────────────────────────────
  if (n.includes('marketing') || n.includes('campagna') || n.includes('campagne') ||
      n.includes('email') || n.includes('newsletter') || n.includes('pubblicita') ||
      n.includes('social') || n.includes('promozione') || n.includes('offerta')) {
    return `✉️ **Marketing & Campagne**\n\n📧 Ultima campagna: "Promo Estate" — 130 destinatari\n📊 Aperture: **68%** · Click: **31%** · Conversioni: **12 nuovi abbonamenti**\n\n💡 Campagne in bozza:\n• "Riattiva il tuo socio" (8 inattivi)\n• "Referral settembre" — bonus 1 mese gratis\n\n👉 Il referral program ha il ROI più alto — attivalo prima di settembre.`
  }

  // ── GDPR / PRIVACY / CONTRATTI ────────────────────────────────────────────
  if (n.includes('gdpr') || n.includes('privacy') || n.includes('contratto') ||
      n.includes('contratti') || n.includes('consenso') || n.includes('firma') ||
      n.includes('documento') || n.includes('legale')) {
    return `🔒 **GDPR & Contratti**\n\n✅ Soci con consenso marketing: **118 / 130** (91%)\n✅ Contratti digitali firmati: **128 / 130** (98%)\n⚠️ 2 soci senza contratto — da completare\n📋 Richieste di cancellazione (Art.17): 0 in sospeso\n\n👉 Contatta i 2 soci senza contratto prima della scadenza abbonamento.`
  }

  // ── WELLNESS / SERVIZI PREMIUM ────────────────────────────────────────────
  if (n.includes('wellness') || n.includes('fisioterapia') || n.includes('nutrizionista') ||
      n.includes('personal trainer') || n.includes('pt') || n.includes('servizi premium') ||
      n.includes('telehealth') || n.includes('appuntament')) {
    return `🌿 **Wellness Hub — questo mese**\n\n• 24 appuntamenti nutrizione · €720 incassati\n• 18 sessioni PT personali · €1.080 incassati\n• 6 sessioni fisioterapia · €300 incassati\n• 2 videoconsulti telehealth · €80 incassati\n\n💰 Totale servizi premium: **€2.180/mese**\n📈 +22% vs mese scorso\n\n👉 Il PT è il servizio più richiesto — considera un secondo trainer.`
  }

  // ── REFERRAL / PASSAPAROLA ────────────────────────────────────────────────
  if (n.includes('referral') || n.includes('passaparola') || n.includes('porta un amico') ||
      n.includes('consigliato') || n.includes('invito') || n.includes('codice amico')) {
    return `🔗 **Programma Referral**\n\n👥 Soci con codice attivo: **43**\n✅ Nuovi iscritti via referral (giugno): **8** (€632 MRR generato)\n🏆 Top referrer: Marco Ferretti (3 amici portati)\n💰 Bonus erogati: €240 (crediti abbonamento)\n\n📈 ROI: ogni €1 in bonus genera €7,9 di MRR. Il programma funziona.`
  }

  // ── NOTIFICHE / COMUNICAZIONI ─────────────────────────────────────────────
  if (n.includes('notifich') || n.includes('avvisi') || n.includes('push') ||
      n.includes('sms') || n.includes('comunicazion') || n.includes('messaggi')) {
    return `🔔 **Notifiche inviate questo mese**\n\n📱 Push: **847** inviate · tasso apertura 61%\n✉️ Email: **390** inviate · apertura 68%\n\nTipologie più efficaci:\n• Promemoria classe (+2h prima) → 94% di presentazione\n• Scadenza abbonamento (-7gg) → 78% rinnovo\n• Offerta personalizzata → 23% conversione`
  }

  // ── STOCK / MAGAZZINO ─────────────────────────────────────────────────────
  if (q.includes('stock') || q.includes('magazzino') || q.includes('giacenza') || q.includes('riassortiment')) {
    const high = MARKETPLACE_PRODUCTS.filter(p => p.sold > 50)
    return `📦 **Articoli da riassortire (alto turnover)**\n\n${high.map(p=>`• **${p.name}** — ~${Math.round(p.sold/6)} pz/mese`).join('\n')}\n\n👉 Tieni almeno 2 mesi di stock per ciascuno.`
  }

  // ── FALLBACK INTELLIGENTE ─────────────────────────────────────────────────
  const guessedTopic = detectTopic(n)
  if (guessedTopic) {
    const canonical: Record<string, string> = {
      incassi:     'quanto incasso il mese prossimo',
      spese:       'come vanno le spese',
      soci:        'quanti soci ho',
      previsioni:  'cosa succede nei prossimi 3 mesi',
      marketplace: 'come va il marketplace',
      fatture:     'mostrami tutte le fatture',
      fornitori:   'analisi fornitori',
      abbonamenti: 'quanti soci sono abbonati e a quale piano',
      situazione:  'dimmi la situazione attuale della palestra',
      disdette:    'andamento disdette',
      crescita:    'la palestra sta crescendo',
      consigli:    'cosa dovrei fare adesso per migliorare',
      stipendi:    'quanto spendo in stipendi',
      classi:      'come vanno le classi',
      macchinari:  'stato macchinari',
      accessi:     'quanti accessi questo mese',
      marketing:   'come vanno le campagne marketing',
    }
    const resp = getAIResponse(canonical[guessedTopic] ?? 'dimmi la situazione attuale della palestra')
    return `_(Ho capito che vuoi sapere di: **${guessedTopic}**)_\n\n${resp}`
  }

  // ── DOMANDE PROPRIO FUORI TEMA — risposta con umorismo ───────────────────
  const offTopic = [
    [/meteo|piove|sole|tempo|caldo|freddo|nuvol/,          `☀️ Non sono meteorologo, ma so che i tuoi **incassi** sono in crescita — quello conta più del sole!\n\nDimmi qualcosa sulla palestra e ti rispondo subito.`],
    [/pizza|cibo|mangio|ristorante|fame|pranzo|cena/,      `🍕 La pizza è ottima, ma non è nel mio menù! Posso però dirti come va la **nutrizione** dei tuoi soci o gli **incassi** del mese.\n\nCosa vuoi sapere sulla palestra?`],
    [/calcio|sport|partita|squadra|serie a|champions/,     `⚽ Non seguo il calcio — seguo i tuoi **soci** e i tuoi **incassi**! Attualmente sei a ${lastMembers} iscritti e ${fmt(lastMRR)} di entrate mensili.\n\nVuoi saperne di più?`],
    [/borsa|azioni|bitcoin|crypto|invest|finanza/,         `📈 Non gestisco portafogli, ma gestisco i tuoi numeri! Il tuo "investimento palestra" rende **~${fmt(Math.round(nextMargin))}/mese** netto.\n\nVuoi la previsione per i prossimi mesi?`],
    [/amore|fidanzat|relazion|cuore|romantico/,            `💕 L'amore non è la mia specialità, ma so che i tuoi soci ti vogliono bene — tasso disdette **1.8%**, il più basso di sempre!\n\nCosa vuoi sapere sulla palestra?`],
    [/dormire|sonno|stanco|riposo|notte/,                  `😴 Il riposo è importante! Ma prima di dormire: sai che hai **${fmt(lastMRR)}** di entrate questo mese?\n\nDomani puoi chiedermi la previsione di luglio. Buonanotte!`],
    [/macchina|auto|moto|patente|guidare/,                 `🚗 Le macchine che conosco sono i macchinari della palestra! Ne hai 23 funzionanti su 25.\n\nCosa vuoi sapere?`],
    [/film|cinema|serie|netflix|tv|guardare/,              `🎬 Binge-watching lo capisco, ma ti consiglio di guardare i tuoi numeri: **+${((lastMRR/HISTORY[0].mrr-1)*100).toFixed(0)}%** di incassi in 12 mesi!\n\nCosa ti interessa approfondire?`],
    [/\\b(boh|mah|eh|ah|uh|hmm|mmm|ok)\\b/,               `🤔 Capito! Dimmi pure cosa vuoi sapere — sono qui.\n\nUsa ⚡ per vedere le domande disponibili.`],
    [/test|prova|funzioni|sei vivo|ciao a tutti/,          `✅ Funziono perfettamente! Sono **Fitty**, pronto a rispondere su tutto ciò che riguarda la tua palestra.\n\nChiedimi pure — incassi, soci, previsioni, fatture, abbonamenti...`],
    [/grazie mille|sei forte|bravo|ottimo lavoro/,         `😊 Grazie! È un piacere aiutarti. Se hai altre domande sono qui.`],
    [/non so|non capisco|confuso|non ci capisc/,           `🤝 Nessun problema! Premi ⚡ per vedere le domande pronte, oppure scrivi in modo semplice:\n\n• "quanti soldi faccio?"\n• "quanti iscritti ho?"\n• "fatture non pagate?"\n• "cosa succede a luglio?"`],
  ] as const

  for (const [pattern, reply] of offTopic) {
    if ((pattern as RegExp).test(n)) return reply
  }

  // ── DOMANDE MOLTO CORTE (1-2 parole) — prova a indovinare ────────────────
  const words = n.split(' ').filter(w => w.length > 1)
  if (words.length <= 2) {
    const w = words.join(' ')
    if (/guadagn|sol?di|euro|€/.test(w))       return getAIResponse('quanto incasso il mese prossimo')
    if (/soci|iscrit|client|person/.test(w))    return getAIResponse('quanti soci ho')
    if (/spes|cost|paghiam/.test(w))            return getAIResponse('come vanno le spese')
    if (/fattur/.test(w))                       return getAIResponse('mostrami tutte le fatture')
    if (/forni|acquis/.test(w))                 return getAIResponse('analisi fornitori')
    if (/market|shop|vend/.test(w))             return getAIResponse('come va il marketplace')
    if (/abbona|pian|rinnov/.test(w))           return getAIResponse('quanti abbonati e a quale piano')
    if (/previs|futuro|luglio|agosto/.test(w))  return getAIResponse('cosa succede nei prossimi 3 mesi')
    if (/tutto|situaz|riepilog/.test(w))        return getAIResponse('dimmi la situazione attuale')
    // parola singola non riconosciuta → situazione generale
    if (words.length === 1) return getAIResponse('dimmi la situazione attuale della palestra')
  }

  return `💬 Non sono riuscito a capire la domanda. Va benissimo scrivere in modo informale!\n\nAlcuni esempi:\n• "quanti soldi faccio al mese?"\n• "i soci stanno aumentando?"\n• "chi non ha pagato?"\n• "il negozio come va?"\n• "cosa succede a luglio?"\n\nOppure premi **⚡** per le domande veloci.`
}

export const FITTY_WELCOME = `👋 Ciao! Sono **Fitty**, il tuo assistente AI.\n\nChiedimi qualsiasi cosa sulla palestra:\n📅 Storico · 🔮 Previsioni · 🛍️ Marketplace · 🧾 Fatture · 📋 Abbonamenti`
