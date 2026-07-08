import { useState, useRef, useEffect } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend,
} from 'recharts'

// ── Dati storici (12 mesi) ────────────────────────────────────────────────────
const MONTHS = ['Lug','Ago','Set','Ott','Nov','Dic','Gen','Feb','Mar','Apr','Mag','Giu']

const HISTORY = [
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

// ── Engine previsionale rule-based ────────────────────────────────────────────
function linearTrend(values: number[]): number {
  const n = values.length
  const sumX = n * (n - 1) / 2
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = values.reduce((s, v, i) => s + i * v, 0)
  const sumX2 = values.reduce((s, _, i) => s + i * i, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

function avgGrowthRate(values: number[]): number {
  const rates = values.slice(1).map((v, i) => (v - values[i]) / values[i])
  return rates.reduce((a, b) => a + b, 0) / rates.length
}

const mrrValues   = HISTORY.map(h => h.mrr)
const costValues  = HISTORY.map(h => h.costs)
const membValues  = HISTORY.map(h => h.members)
const churnValues = HISTORY.map(h => h.churnRate)

const mrrSlope    = linearTrend(mrrValues)
const costSlope   = linearTrend(costValues)
const mrrGrowth   = avgGrowthRate(mrrValues)
const costGrowth  = avgGrowthRate(costValues)
const membGrowth  = avgGrowthRate(membValues)
const churnAvg    = churnValues.slice(-3).reduce((a, b) => a + b, 0) / 3

const lastMRR     = HISTORY[HISTORY.length - 1].mrr
const lastCosts   = HISTORY[HISTORY.length - 1].costs
const lastSalary  = HISTORY[HISTORY.length - 1].salary
const lastMembers = HISTORY[HISTORY.length - 1].members

// Luglio forecast
const nextMRR     = Math.round(lastMRR  * (1 + mrrGrowth))
const nextCosts   = Math.round(lastCosts * (1 + costGrowth * 0.7)) // costi crescono più lento
const nextSalary  = lastSalary  // invariata a breve termine
const nextMembers = Math.round(lastMembers * (1 + membGrowth))
const nextChurn   = Math.max(1.0, churnAvg - 0.15)
const nextMargin  = nextMRR - nextCosts - nextSalary / 4 // salary è mensile già
const currMargin  = lastMRR - lastCosts - lastSalary / 4

const mrrDelta    = ((nextMRR   - lastMRR)   / lastMRR   * 100)
const costsDelta  = ((nextCosts - lastCosts)  / lastCosts * 100)
const membDelta   = ((nextMembers - lastMembers) / lastMembers * 100)

// 3-month forecast series
function buildForecast() {
  const future = ['Lug','Ago','Set']
  return future.map((m, i) => ({
    month: m,
    mrr:     Math.round(lastMRR    * Math.pow(1 + mrrGrowth,  i + 1)),
    costs:   Math.round(lastCosts  * Math.pow(1 + costGrowth * 0.7, i + 1)),
    members: Math.round(lastMembers * Math.pow(1 + membGrowth, i + 1)),
    margin:  0,
    forecast: true,
  })).map(r => ({ ...r, margin: r.mrr - r.costs - Math.round(lastSalary / 4) }))
}
const FORECAST = buildForecast()

const CHART_DATA = [
  ...HISTORY.map(h => ({ ...h, margin: h.mrr - h.costs - Math.round(h.salary / 4), forecast: false })),
  ...FORECAST,
]

// ── Dati Marketplace ─────────────────────────────────────────────────────────
const MARKETPLACE_CUSTOMERS = [
  { name: 'Marco Ferretti',    orders: 12, total: 1240, lastOrder: 'Giu 2026', items: ['Proteine', 'Shaker', 'Guanti'] },
  { name: 'Sara Lombardi',     orders: 9,  total: 890,  lastOrder: 'Giu 2026', items: ['Abbigliamento', 'Tappetino', 'Corda'] },
  { name: 'Luca Bernardi',     orders: 7,  total: 780,  lastOrder: 'Mag 2026', items: ['Integratori', 'Scarpe', 'Borsa'] },
  { name: 'Giulia Mancini',    orders: 11, total: 1050, lastOrder: 'Giu 2026', items: ['Proteine', 'Abbigliamento'] },
  { name: 'Andrea Caruso',     orders: 5,  total: 430,  lastOrder: 'Apr 2026', items: ['Guanti', 'Fascia'] },
  { name: 'Elena Ricci',       orders: 8,  total: 720,  lastOrder: 'Mag 2026', items: ['Tappetino', 'Corda', 'Abbigliamento'] },
  { name: 'Paolo Greco',       orders: 3,  total: 210,  lastOrder: 'Mar 2026', items: ['Shaker'] },
  { name: 'Valentina Russo',   orders: 6,  total: 560,  lastOrder: 'Giu 2026', items: ['Proteine', 'Borsa'] },
]
const MARKETPLACE_PRODUCTS = [
  { name: 'Proteine Whey 1kg',      sold: 87, revenue: 3045, category: 'Integratori' },
  { name: 'T-shirt Oplyfit',        sold: 64, revenue: 1920, category: 'Abbigliamento' },
  { name: 'Shaker Oplyfit 700ml',   sold: 53, revenue: 848,  category: 'Accessori' },
  { name: 'Guanti Palestra Pro',    sold: 41, revenue: 1230, category: 'Accessori' },
  { name: 'Tappetino Yoga 6mm',     sold: 38, revenue: 1140, category: 'Attrezzatura' },
  { name: 'Leggings Compression',   sold: 35, revenue: 1575, category: 'Abbigliamento' },
  { name: 'Corda da Salto Pro',     sold: 29, revenue: 580,  category: 'Attrezzatura' },
  { name: 'Creatina Monoidrato',    sold: 27, revenue: 810,  category: 'Integratori' },
  { name: 'Borsa Palestra 30L',     sold: 22, revenue: 1100, category: 'Accessori' },
  { name: 'Fascia Polso (coppia)',  sold: 18, revenue: 270,  category: 'Accessori' },
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

// ── Dati Fatture ─────────────────────────────────────────────────────────────
const INVOICES_OUT = [
  { id: 'FT-2026-001', member: 'Marco Ferretti',   date: '03/01/2026', amount: 79,  plan: 'Pro Mensile',  status: 'pagata' },
  { id: 'FT-2026-002', member: 'Sara Lombardi',    date: '05/01/2026', amount: 49,  plan: 'Starter',      status: 'pagata' },
  { id: 'FT-2026-003', member: 'Giulia Mancini',   date: '07/01/2026', amount: 199, plan: 'Enterprise',   status: 'pagata' },
  { id: 'FT-2026-041', member: 'Luca Bernardi',    date: '03/02/2026', amount: 79,  plan: 'Pro Mensile',  status: 'pagata' },
  { id: 'FT-2026-089', member: 'Elena Ricci',      date: '15/03/2026', amount: 79,  plan: 'Pro Mensile',  status: 'pagata' },
  { id: 'FT-2026-102', member: 'Andrea Caruso',    date: '02/04/2026', amount: 49,  plan: 'Starter',      status: 'in scadenza' },
  { id: 'FT-2026-138', member: 'Paolo Greco',      date: '10/05/2026', amount: 79,  plan: 'Pro Mensile',  status: 'pagata' },
  { id: 'FT-2026-171', member: 'Valentina Russo',  date: '01/06/2026', amount: 99,  plan: 'Pro Annuale',  status: 'pagata' },
  { id: 'FT-2026-172', member: 'Mario Rossi',      date: '02/06/2026', amount: 49,  plan: 'Starter',      status: 'non pagata' },
  { id: 'FT-2026-188', member: 'Chiara Ferrari',   date: '15/06/2026', amount: 199, plan: 'Enterprise',   status: 'pagata' },
]
const INVOICES_IN = [
  { id: 'ACQ-001', supplier: 'FitSupply Srl',        date: '05/01/2026', amount: 1240, category: 'Prodotti Marketplace', status: 'pagata' },
  { id: 'ACQ-002', supplier: 'Enel Energia',          date: '10/01/2026', amount: 480,  category: 'Utenze',               status: 'pagata' },
  { id: 'ACQ-003', supplier: 'TechGym Manutenzioni',  date: '15/01/2026', amount: 320,  category: 'Manutenzione',          status: 'pagata' },
  { id: 'ACQ-011', supplier: 'FitSupply Srl',         date: '04/02/2026', amount: 980,  category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-012', supplier: 'Enel Energia',          date: '10/02/2026', amount: 510,  category: 'Utenze',               status: 'pagata' },
  { id: 'ACQ-021', supplier: 'Promo Digital Agency',  date: '01/03/2026', amount: 750,  category: 'Marketing',             status: 'pagata' },
  { id: 'ACQ-022', supplier: 'FitSupply Srl',         date: '05/03/2026', amount: 1380, category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-031', supplier: 'Enel Energia',          date: '10/04/2026', amount: 490,  category: 'Utenze',               status: 'pagata' },
  { id: 'ACQ-032', supplier: 'TechGym Manutenzioni',  date: '18/04/2026', amount: 280,  category: 'Manutenzione',          status: 'pagata' },
  { id: 'ACQ-041', supplier: 'FitSupply Srl',         date: '03/05/2026', amount: 1560, category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-042', supplier: 'Promo Digital Agency',  date: '12/05/2026', amount: 600,  category: 'Marketing',             status: 'pagata' },
  { id: 'ACQ-051', supplier: 'FitSupply Srl',         date: '02/06/2026', amount: 1820, category: 'Prodotti Marketplace',  status: 'pagata' },
  { id: 'ACQ-052', supplier: 'Enel Energia',          date: '10/06/2026', amount: 530,  category: 'Utenze',               status: 'in scadenza' },
  { id: 'ACQ-053', supplier: 'Consulenza Legale Bianchi', date: '20/06/2026', amount: 400, category: 'Consulenze',        status: 'non pagata' },
]
const supplierTotals = INVOICES_IN.reduce((acc, inv) => {
  acc[inv.supplier] = (acc[inv.supplier] || 0) + inv.amount
  return acc
}, {} as Record<string, number>)
const topSupplier = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0]
const categoryTotals = INVOICES_IN.reduce((acc, inv) => {
  acc[inv.category] = (acc[inv.category] || 0) + inv.amount
  return acc
}, {} as Record<string, number>)
const unpaidOut = INVOICES_OUT.filter(i => i.status === 'non pagata')
const unpaidIn  = INVOICES_IN.filter(i => i.status === 'non pagata')
const dueSoonIn = INVOICES_IN.filter(i => i.status === 'in scadenza')

// ── Dati Abbonamenti ──────────────────────────────────────────────────────────
const SUBSCRIPTION_PLANS = [
  { name: 'Starter',      price: 49,  active: 41, churn: 3.1, avgMonths: 5.2,  revenue: 2009,  color: '#94a3b8' },
  { name: 'Pro Mensile',  price: 79,  active: 58, churn: 1.4, avgMonths: 9.8,  revenue: 4582,  color: '#2563eb' },
  { name: 'Pro Annuale',  price: 99,  active: 18, churn: 0.6, avgMonths: 14.3, revenue: 1782,  color: '#7c3aed' },
  { name: 'Enterprise',   price: 199, active: 13, churn: 0.3, avgMonths: 18.1, revenue: 2587,  color: '#059669' },
]
const totalActiveSubs = SUBSCRIPTION_PLANS.reduce((s, p) => s + p.active, 0)
const totalSubRevenue = SUBSCRIPTION_PLANS.reduce((s, p) => s + p.revenue, 0)
const bestPlanRevenue = SUBSCRIPTION_PLANS.reduce((a, b) => a.revenue > b.revenue ? a : b)
const bestPlanCount   = SUBSCRIPTION_PLANS.reduce((a, b) => a.active > b.active ? a : b)
const expiringThisMonth = 14 // da CRM

// ── AI Chat engine ─────────────────────────────────────────────────────────────
interface ChatMessage { id: string; role: 'user' | 'ai'; text: string; timestamp: Date }

const fmt = (n: number) => `€${n.toLocaleString('it-IT')}`
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
const sign = (n: number) => n >= 0 ? '📈' : '📉'

// ── Lookup storico ────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, number> = {
  luglio: 0, lug: 0, agosto: 1, ago: 1, settembre: 2, set: 2,
  ottobre: 3, ott: 3, novembre: 4, nov: 4, dicembre: 5, dic: 5,
  gennaio: 6, gen: 6, febbraio: 7, feb: 7, marzo: 8, mar: 8,
  aprile: 9, apr: 9, maggio: 10, mag: 10, giugno: 11, giu: 11,
}
function findMonthInQ(q: string): (typeof HISTORY)[0] | null {
  for (const [key, idx] of Object.entries(MONTH_MAP)) {
    if (q.includes(key)) return HISTORY[idx]
  }
  return null
}
const bestMRR    = HISTORY.reduce((a, b) => a.mrr > b.mrr ? a : b)
const worstMRR   = HISTORY.reduce((a, b) => a.mrr < b.mrr ? a : b)
const bestMembers = HISTORY.reduce((a, b) => a.members > b.members ? a : b)
const totalYearMRR = HISTORY.slice(6).reduce((s, h) => s + h.mrr, 0) // Gen–Giu
const totalYearCosts = HISTORY.slice(6).reduce((s, h) => s + h.costs + Math.round(h.salary / 4), 0)
const totalYearMargin = totalYearMRR - totalYearCosts

const PRESET_QUESTIONS = [
  // Passato
  { label: '💵 Quanto ho guadagnato a giugno?',      q: 'Quanto ho guadagnato a giugno?' },
  { label: '📅 Qual è stato il mese migliore?',       q: 'Qual è stato il mese migliore?' },
  { label: '📊 Totale incassato quest\'anno?',         q: 'Quanto ho incassato in totale quest\'anno?' },
  { label: '📉 Quando ho avuto meno soci?',           q: 'Quando ho avuto il minor numero di soci?' },
  // Futuro
  { label: '💰 Quanto incasso il mese prossimo?',    q: 'Quanto incasso il mese prossimo?' },
  { label: '👥 Quanti soci avrò?',                   q: 'Quanti soci avrò il mese prossimo?' },
  { label: '⚠️ Qualcuno sta per andarsene?',         q: 'Qualcuno sta per disdire?' },
  { label: '🏖️ Come andrà l\'estate?',               q: 'Come andrà la stagione estiva?' },
  { label: '📅 Prossimi 3 mesi?',                    q: 'Cosa succede nei prossimi 3 mesi?' },
  // Situazione attuale
  { label: '✅ Sto guadagnando?',                     q: 'Sto guadagnando o sto perdendo soldi?' },
  { label: '📈 Sto crescendo?',                       q: 'La palestra sta crescendo?' },
  { label: '👔 Quanto spendo in stipendi?',           q: 'Quanto spendo in stipendi?' },
  { label: '💸 Le spese stanno aumentando?',          q: 'Le spese stanno aumentando?' },
  { label: '🎯 Cosa devo fare adesso?',               q: 'Cosa dovrei fare adesso per migliorare?' },
]

function getAIResponse(question: string): string {
  const q = question.toLowerCase().trim()

  // ── SALUTI E SMALL TALK ────────────────────────────────────────────────────
  if (/^(ciao|salve|buongiorno|buonasera|buona sera|ehi|hey|ola|hello|hi)\b/.test(q)) {
    const ora = new Date().getHours()
    const saluto = ora < 12 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'
    return `${saluto}! 👋 Sono qui e pronto ad aiutarti.\n\nPuoi chiedermi qualsiasi cosa sulla tua palestra — com'è andata a marzo, quanto incasserai il mese prossimo, se stai guadagnando, quanti soci hai perso nel tempo...\n\nDimmi pure!`
  }

  if (q.includes('come stai') || q.includes('come va') || q.includes('tutto bene') || q.includes('come te la passi') || q.includes('come stai andando')) {
    return `Sto benissimo, grazie per avermelo chiesto! 😊\n\nSono qui concentrato sui tuoi numeri — e le notizie sono buone: la palestra sta crescendo, le disdette calano, gli incassi salgono.\n\nTu come stai? C'è qualcosa di specifico che vuoi sapere?`
  }

  if (/\b(grazie|grazie mille|perfetto|ottimo|bravo|bene|capito)\b/.test(q) && q.length < 30) {
    return `Prego! 😊 Sono qui se hai altre domande — su numeri passati, previsioni, consigli o qualsiasi altra cosa sulla palestra.`
  }

  if (q.includes('chi sei') || q.includes('cosa sei') || q.includes('cosa fai') || q.includes('come funzioni') || q.includes('che cosa sei')) {
    return `Sono **Oplyfit AI Forecast**, il tuo consulente personale integrato nella piattaforma. 🤖\n\nAnalizzo i dati della tua palestra degli ultimi 12 mesi e rispondo a domande su:\n• **Passato** — com'è andato un mese, quando hai avuto il picco, confronti tra periodi\n• **Presente** — quanti soci hai, quanto spendi, se sei in profitto\n• **Futuro** — previsioni incassi, soci attesi, rischio disdette, stagionalità\n\nNon sono un chatbot generico: conosco i tuoi numeri reali e rispondo di conseguenza.`
  }

  if (q.includes('aiuto') || q.includes('help') || q.includes('non so') || q.includes('cosa posso chiederti') || q.includes('cosa sai') || q.includes('cosa puoi')) {
    return `Ecco cosa puoi chiedermi, in linguaggio normale:\n\n**📅 Sul passato**\n• "Com'è andato febbraio?"\n• "Quanto ho guadagnato a dicembre?"\n• "Quanti soci avevo a ottobre?"\n• "Qual è stato il mese migliore e quello peggiore?"\n• "Quanto ho incassato in totale quest'anno?"\n• "Confronta gennaio con aprile"\n• "Quando ho perso più soci?"\n\n**🔮 Sul futuro**\n• "Dammi una previsione per i mesi successivi"\n• "Come andrà settembre?"\n• "Quanti soci avrò a fine anno?"\n• "Le spese aumenteranno?"\n• "Devo preoccuparmi per l'estate?"\n\n**📊 Sulla situazione attuale**\n• "Sono in profitto?"\n• "La palestra sta crescendo?"\n• "Qualcuno rischia di andarsene?"\n• "Cosa devo fare adesso?"\n• "Qual è la mia media mensile?"\n\nChiedi pure tutto, anche in modo informale!`
  }

  if (q === 'ok' || q === 'ok grazie' || q === 'capito' || q === 'perfetto' || q === 'bene' || q === 'va bene') {
    return `Ottimo! 👌 Se hai altre domande sono qui.`
  }

  // ── STORICO MESE SPECIFICO ────────────────────────────────────────────────
  const hMonth = findMonthInQ(q)
  const hasMonthKeyword = hMonth !== null
  const isAboutPast = hasMonthKeyword && (
    q.includes('guadagn') || q.includes('incass') || q.includes('spes') ||
    q.includes('soci') || q.includes('iscrit') || q.includes('cost') ||
    q.includes('andato') || q.includes('fatto') || q.includes('avevo') ||
    q.includes('era') || q.includes('avuto') || q.includes('ho') ||
    q.includes('com\'è') || q.includes('come e') || q.includes('riepilogo') ||
    q.includes('dimmi') || q.includes('risultat') || q.includes('situazion') ||
    q.includes('dati') || q.includes('numero') || q.includes('bilancio')
  )
  if (isAboutPast && hMonth) {
    const margin = hMonth.mrr - hMonth.costs - Math.round(hMonth.salary / 4)
    const prevIdx = HISTORY.indexOf(hMonth) - 1
    const prev = prevIdx >= 0 ? HISTORY[prevIdx] : null
    const mrrVsPrev = prev ? ((hMonth.mrr - prev.mrr) / prev.mrr * 100) : null
    const emoji = margin > 2000 ? '🟢' : margin > 0 ? '🟡' : '🔴'
    return `📅 **${hMonth.month} — riepilogo completo**\n\n${emoji} Guadagno netto: **${fmt(margin)}**\n💰 Incassato: **${fmt(hMonth.mrr)}**${mrrVsPrev !== null ? ` (${mrrVsPrev >= 0 ? '+' : ''}${mrrVsPrev.toFixed(1)}% vs mese prima)` : ''}\n💸 Spese operative: **${fmt(hMonth.costs)}**\n👔 Stipendi (quota): **~${fmt(Math.round(hMonth.salary / 4))}**\n👥 Soci attivi: **${hMonth.members}**\n📉 Disdette: **${hMonth.churnRate}%**\n\n${margin > 0 ? 'Mese chiuso in positivo.' : 'Mese in perdita — le spese hanno superato gli incassi.'}${hMonth.churnRate > 3.5 ? `\n\n⚠️ Quel mese le disdette erano elevate (${hMonth.churnRate}%) — da allora sono migliorate.` : ''}`
  }

  // ── DOMANDE GENERICHE SU UN MESE (senza altra keyword) ────────────────────
  if (hasMonthKeyword && hMonth) {
    const margin = hMonth.mrr - hMonth.costs - Math.round(hMonth.salary / 4)
    return `📅 **${hMonth.month} — dati principali**\n\n💰 Incassi: **${fmt(hMonth.mrr)}** · 👥 Soci: **${hMonth.members}** · ✅ Guadagno netto: **${fmt(margin)}**\n\nVuoi sapere qualcosa di specifico su quel mese? Incassi, spese, soci, disdette... chiedi pure.`
  }

  // ── MESE MIGLIORE / PEGGIORE ──────────────────────────────────────────────
  if (q.includes('migliore') || q.includes('meglio') || q.includes('più alto') || q.includes('picco') || (q.includes('più') && q.includes('guadagn'))) {
    const margin = bestMRR.mrr - bestMRR.costs - Math.round(bestMRR.salary / 4)
    return `🏆 **Il tuo mese migliore finora è stato ${bestMRR.month}.**\n\nHai incassato **${fmt(bestMRR.mrr)}** con **${bestMRR.members} soci** e un guadagno netto di **${fmt(margin)}**.\n\nLe disdette erano al minimo (${bestMRR.churnRate}%) — un segnale che i soci erano soddisfatti.\n\n📈 Il trend attuale è diretto a superare quel record. Se mantieni la crescita, potresti farlo entro 2-3 mesi.`
  }

  if (q.includes('peggior') || q.includes('difficile') || q.includes('basso') || q.includes('crisi') || (q.includes('meno') && (q.includes('guadagn') || q.includes('soci') || q.includes('incasso')))) {
    const worstM = (q.includes('soci') || q.includes('iscrit')) ? HISTORY.reduce((a, b) => a.members < b.members ? a : b) : worstMRR
    return `📉 **Il mese più difficile è stato ${worstM.month}.**\n\nIncassi: **${fmt(worstM.mrr)}** con solo **${worstM.members} soci** attivi.\n\nNon preoccuparti — quei mesi fanno parte di qualsiasi percorso di crescita. Dal minimo ad oggi hai guadagnato ${lastMembers - worstM.members} soci in più e incassi il ${((lastMRR / worstM.mrr - 1) * 100).toFixed(0)}% in più ogni mese.\n\n💪 Sei in una posizione molto più solida adesso.`
  }

  // ── TOTALE ANNUALE / MEDIA ────────────────────────────────────────────────
  if ((q.includes('totale') || q.includes('complessivo') || q.includes('tutto') || q.includes('sommando') || q.includes('in tutto')) &&
      (q.includes('anno') || q.includes('annuale') || q.includes('quest\'anno') || q.includes('12 mes') || q.includes('anno corso'))) {
    return `📊 **Riepilogo anno in corso (Gen–Giu 2026)**\n\n💰 Totale incassato: **${fmt(totalYearMRR)}**\n💸 Totale spese: **${fmt(totalYearCosts)}**\n✅ Guadagno netto: **${fmt(totalYearMargin)}**\n\nMedia mensile: **${fmt(Math.round(totalYearMRR / 6))}** di entrate · **${fmt(Math.round(totalYearMargin / 6))}** di guadagno.\n\nSe il ritmo continua, a fine anno potresti chiudere con **${fmt(Math.round(totalYearMRR / 6 * 12))}** di incassi totali.`
  }

  if (q.includes('media') && (q.includes('mensile') || q.includes('mese') || q.includes('al mese') || q.includes('ogni mese'))) {
    const avgMRR    = Math.round(totalYearMRR / 6)
    const avgMargin = Math.round(totalYearMargin / 6)
    const avgCosts  = Math.round(totalYearCosts / 6)
    return `📊 **La tua media mensile (ultimi 6 mesi)**\n\n💰 Incassi medi: **${fmt(avgMRR)}**\n💸 Spese medie: **${fmt(avgCosts)}**\n✅ Guadagno medio: **${fmt(avgMargin)}**\n👥 Soci medi: **${Math.round(HISTORY.slice(6).reduce((s, h) => s + h.members, 0) / 6)}**\n\nL'ultimo mese (${HISTORY[HISTORY.length-1].month}) è sopra la media di entrambi — segno che stai migliorando.`
  }

  // ── CONFRONTO TRA DUE MESI ────────────────────────────────────────────────
  if (q.includes('rispetto') || q.includes('confronto') || q.includes('differenza tra') || q.includes(' vs ') || q.includes('rispetto a') || q.includes('paragona') || q.includes('paragonalo')) {
    const foundMonths = Object.keys(MONTH_MAP).filter(k => q.includes(k))
    const [m1, m2] = foundMonths.slice(0, 2).map(k => HISTORY[MONTH_MAP[k]])
    if (m1 && m2 && m1 !== m2) {
      const diff  = m2.mrr - m1.mrr
      const mDiff = m2.members - m1.members
      return `⚖️ **${m1.month} vs ${m2.month}**\n\n| | ${m1.month} | ${m2.month} | Variazione |\n|---|---|---|---|\n| Incassi | ${fmt(m1.mrr)} | ${fmt(m2.mrr)} | ${diff >= 0 ? '+' : ''}${fmt(diff)} |\n| Soci | ${m1.members} | ${m2.members} | ${mDiff >= 0 ? '+' : ''}${mDiff} |\n| Spese | ${fmt(m1.costs)} | ${fmt(m2.costs)} | ${m2.costs >= m1.costs ? '+' : ''}${fmt(m2.costs - m1.costs)} |\n\n${diff > 0 ? `📈 ${m2.month} è andato meglio di ${m1.month}.` : `📉 ${m2.month} ha reso meno rispetto a ${m1.month}.`}`
    }
  }

  // ── RAGGIUNGIMENTO SOGLIE ─────────────────────────────────────────────────
  if ((q.includes('quando') || q.includes('primo')) && (q.includes('100') || q.includes('cento') || q.includes('120') || q.includes('150') || q.includes('soci'))) {
    const numMatch = q.match(/\d+/)
    const target = numMatch ? parseInt(numMatch[0]) : 100
    const hit = HISTORY.find(h => h.members >= target)
    return hit
      ? `🎯 Hai superato i **${target} soci** per la prima volta a **${hit.month}** (${hit.members} soci).\n\nDa allora sei cresciuto ancora — oggi sei a ${lastMembers} soci attivi.`
      : `Non hai ancora raggiunto i ${target} soci nei dati disponibili, ma sei a ${lastMembers} e stai crescendo.`
  }

  // ── ANDAMENTO DISDETTE ────────────────────────────────────────────────────
  if (q.includes('disdett') || q.includes('abbandoni') || q.includes('se ne sono andat') || q.includes('perso soci') || q.includes('ho perso') || (q.includes('quanti') && q.includes('andat'))) {
    const first = HISTORY[0].churnRate
    const last  = HISTORY[HISTORY.length - 1].churnRate
    const calo  = ((1 - last / first) * 100).toFixed(0)
    return `📉 **Andamento disdette (ultimi 12 mesi)**\n\nUn anno fa perdevi il **${first}%** dei soci ogni mese.\nOggi sei al **${last}%** — le disdette sono calate del ${calo}%.\n\nIn pratica: su ${lastMembers} soci, ogni mese se ne va circa **${Math.round(lastMembers * last / 100)} persona**. Un anno fa erano circa ${Math.round(HISTORY[0].members * first / 100)}.\n\n✅ È il miglior segnale possibile: i soci sono soddisfatti e restano.`
  }

  // ── PREVISIONI GENERICHE FUTURA ───────────────────────────────────────────
  if (q.includes('previsione') || q.includes('prevision') || q.includes('mesi successivi') || q.includes('mesi prossimi') || q.includes('futuro') || q.includes('prospettive') || q.includes('andamento futuro') || q.includes('come andrà') && !q.includes('estate')) {
    return `🔮 **Previsione prossimi 3 mesi (Lug–Set 2026)**\n\n**Luglio** — ~${fmt(FORECAST[0].mrr)} incassi · ~${fmt(FORECAST[0].margin)} guadagno · estate tranquilla\n**Agosto** — ~${fmt(FORECAST[1].mrr)} incassi · ~${fmt(FORECAST[1].margin)} guadagno · fisiologicamente più basso\n**Settembre** — ~${fmt(FORECAST[2].mrr)} incassi · ~${fmt(FORECAST[2].margin)} guadagno · rimbalzo forte ✅\n\nIl trend generale è positivo: ogni mese incassi di più rispetto al precedente. L'estate rallenta un po', poi settembre torna su.\n\n👉 Pianifica adesso la campagna di settembre — è il mese d'oro per le nuove iscrizioni.`
  }

  if (q.includes('fine anno') || q.includes('a fine anno') || q.includes('entro dicembre') || q.includes('obiettivo annuale') || q.includes('proiezione annuale')) {
    const projectedAnnual = Math.round(totalYearMRR / 6 * 12 * 1.05)
    const projectedMargin = Math.round(totalYearMargin / 6 * 12 * 1.03)
    return `📅 **Proiezione fine anno 2026**\n\nSe il ritmo attuale continua:\n💰 Incassi annuali stimati: **~${fmt(projectedAnnual)}**\n✅ Guadagno netto stimato: **~${fmt(projectedMargin)}**\n👥 Soci a fine anno: **~${Math.round(lastMembers * Math.pow(1 + membGrowth, 6))}**\n\nSono stime ottimistiche ma realistiche basate sull'andamento attuale. L'estate potrebbe abbassarle un po', settembre le rimonta.\n\n💡 Per superare le stime, punta su settembre — una campagna di riapertura efficace può fare la differenza.`
  }

  // ── INCASSI PROSSIMO MESE ─────────────────────────────────────────────────
  if (q.includes('incasso') || q.includes('entrat') || q.includes('ricav') || q.includes('fattur') || q.includes('mrr') ||
      (q.includes('mese') && q.includes('prossim') && !q.includes('soci') && !q.includes('3')) ||
      q.includes('quanto prendo') || q.includes('quanti soldi')) {
    return `💰 **Il mese prossimo incasserai circa ${fmt(nextMRR)}.**\n\nQuesto mese hai fatto ${fmt(lastMRR)} — siamo su un piccolo aumento, segno che la crescita continua.\n\nPerché sale? Stai acquisendo nuovi soci regolarmente e pochissimi se ne vanno. Il trend è stabile.\n\n👉 Vuoi arrivare a ${fmt(nextMRR + 600)}? Basterebbero 2-3 iscrizioni in più rispetto al solito.`
  }

  // ── SPESE ─────────────────────────────────────────────────────────────────
  if (q.includes('spes') || q.includes('cost') || q.includes('uscit') || q.includes('pago') || q.includes('spendo') || q.includes('esborso')) {
    return `💸 **Le spese sono sotto controllo.**\n\nQuesto mese: **${fmt(lastCosts)}** di costi operativi (utenze, marketing, manutenzione).\nIl mese prossimo potrebbero salire a circa **${fmt(nextCosts)}**.\n\nLa buona notizia: le entrate crescono più in fretta delle spese — quindi il guadagno netto migliora.\n\n👉 L'unica voce da monitorare è il marketing: d'estate tende a sforare. Tienila a occhio.`
  }

  // ── SOCI PROSSIMO MESE ────────────────────────────────────────────────────
  if (q.includes('soci') || q.includes('iscrit') || q.includes('membri') || (q.includes('quanti') && !q.includes('guadagn') && !q.includes('incass'))) {
    const nuovi    = Math.round(lastMembers * (membGrowth + nextChurn / 100))
    const uscite   = Math.round(lastMembers * nextChurn / 100)
    return `👥 **Il mese prossimo avrai circa ${nextMembers} soci attivi.**\n\nOggi sei a ${lastMembers}. Stima:\n• ~${nuovi} nuove iscrizioni previste\n• ~${uscite} disdette attese\n\nLuglio è storicamente tranquillo — qualcuno pausa in estate, è normale. La rimonta arriva a settembre.\n\n👉 Usa questi mesi per fidelizzare chi resta: una sfida estiva o un obiettivo speciale funzionano bene.`
  }

  // ── ESTATE ────────────────────────────────────────────────────────────────
  if (q.includes('estiv') || q.includes('estate') || q.includes('luglio') || q.includes('agosto') || q.includes('stagion') || q.includes('preoccup') || q.includes('devo preoccupar')) {
    return `🏖️ **L'estate rallenta, ma non è un problema.**\n\nStoricamente:\n• Presenze quotidiane: -20% rispetto a primavera\n• Disdette: qualcuna in più, ma sotto la media annuale\n• Nuove iscrizioni: meno frequenti\n\nPrevisione per questa estate:\n• **Luglio** → ~${fmt(nextMRR)}\n• **Agosto** → ~${fmt(Math.round(nextMRR * 0.97))}\n• **Settembre** → ~${fmt(Math.round(nextMRR * 1.06))} (rimbalzo forte)\n\n👉 Considera un'offerta estiva — anche solo un abbonamento mensile ridotto tiene i soci agganciati e li ritrovi a settembre.`
  }

  // ── RISCHIO SOCI ──────────────────────────────────────────────────────────
  if (q.includes('disdic') || q.includes('andarsene') || q.includes('rischio') || q.includes('se ne va') || q.includes('se ne vanno') || q.includes('perd') || q.includes('inattiv')) {
    return `⚠️ **Ci sono alcuni soci da tenere d'occhio.**\n\n• **8 soci** non vengono da più di 3 settimane — a rischio abbandono\n• **14 abbonamenti** scadono entro 30 giorni — potrebbero non rinnovare\n• **5 soci** hanno uno score di rischio alto nel Churn Predictor\n\nLa buona notizia: negli ultimi 12 mesi le disdette sono calate del 57%.\n\n👉 Contatta adesso i 14 in scadenza. Un messaggio personale vale più di qualsiasi automatismo — e spesso basta per tenerli.`
  }

  // ── STIPENDI ─────────────────────────────────────────────────────────────
  if (q.includes('stipendi') || q.includes('salari') || q.includes('personale') || q.includes('dipendenti') || q.includes('collaboratori') || q.includes('paghe') || q.includes('risorse umane')) {
    return `👔 **Ogni mese spendi ${fmt(lastSalary)} per il tuo team.**\n\n• 6 dipendenti fissi: ~${fmt(11600)}/mese\n• 2 collaboratori: ~${fmt(2300)}/mese\n• 2 professionisti P.IVA: ~${fmt(3400)}/mese\n\nNei prossimi mesi questa cifra rimarrà stabile — nessun rinnovo in vista prima di ottobre.\n\n👉 In autunno potrebbe esserci un adeguamento di circa ${fmt(290)}/mese per i dipendenti fissi, ma è ancora da definire.`
  }

  // ── 3 MESI / TRIMESTRE ────────────────────────────────────────────────────
  if (q.includes('3 mes') || q.includes('tre mes') || q.includes('trimest') || q.includes('prossimi mesi') || q.includes('mesi success')) {
    return `📅 **Previsione prossimi 3 mesi**\n\n**Luglio** — Entrate **${fmt(FORECAST[0].mrr)}** · Spese ${fmt(FORECAST[0].costs)} · Guadagno **${fmt(FORECAST[0].margin)}**\n**Agosto** — Entrate **${fmt(FORECAST[1].mrr)}** · Spese ${fmt(FORECAST[1].costs)} · Guadagno **${fmt(FORECAST[1].margin)}**\n**Settembre** — Entrate **${fmt(FORECAST[2].mrr)}** · Spese ${fmt(FORECAST[2].costs)} · Guadagno **${fmt(FORECAST[2].margin)}** 🚀\n\nEstate tranquilla, poi settembre torna a pieno regime. Il guadagno netto cresce ogni mese.\n\n👉 Pianifica adesso la campagna di settembre — arriverai pronto al momento migliore dell'anno.`
  }

  // ── SEI IN PROFITTO? ──────────────────────────────────────────────────────
  if (q.includes('profitt') || q.includes('in positivo') || q.includes('in perdita') || q.includes('guadagno netto') || q.includes('utile') || q.includes('margine') || (q.includes('guadagn') && !hasMonthKeyword) || q.includes('perd') && !hasMonthKeyword) {
    const annualMargin = Math.round((lastMRR - lastCosts - lastSalary / 4) * 12)
    return `✅ **Sì, stai guadagnando.**\n\nOgni mese, dopo stipendi, utenze e tutte le spese, ti restano in mano circa **${fmt(Math.round(nextMargin))}**.\n\nSu base annuale, la proiezione è **~${fmt(annualMargin)}** di guadagno netto.\n\nNon è un numero enorme, ma la direzione è giusta — e il margine migliora ogni mese.\n\n👉 Ogni nuovo socio che aggiungi costa pochissimo in più: è la leva più potente che hai per aumentare il guadagno.`
  }

  // ── CRESCITA ──────────────────────────────────────────────────────────────
  if (q.includes('crescen') || q.includes('crescita') || q.includes('sta crescen') || q.includes('miglior') || q.includes('progredendo') || q.includes('andando bene') || q.includes('va bene la')) {
    return `📈 **Sì, la palestra sta crescendo bene.**\n\nNegli ultimi 12 mesi:\n• Soci: da **89** a **${lastMembers}** (+${lastMembers - 89} soci, +${((lastMembers/89-1)*100).toFixed(0)}%)\n• Entrate mensili: da **${fmt(HISTORY[0].mrr)}** a **${fmt(lastMRR)}** (+${((lastMRR/HISTORY[0].mrr-1)*100).toFixed(0)}%)\n• Disdette: dimezzate\n\nNon è un picco isolato — è una crescita costante e solida.\n\n👉 Il prossimo traguardo è **${Math.ceil(lastMembers / 25) * 25} soci**. Da lì i margini migliorano ancora di più.`
  }

  // ── CONSIGLI ──────────────────────────────────────────────────────────────
  if ((q.includes('cosa') || q.includes('cosa posso') || q.includes('come posso')) && (q.includes('fare') || q.includes('devo') || q.includes('dovr') || q.includes('miglior') || q.includes('aumentar'))) {
    return `🎯 **Le 3 cose più utili che puoi fare adesso:**\n\n**1. Contatta i 14 soci in scadenza**\nUn messaggio diretto vale più di qualsiasi campagna automatica. Offri il rinnovo con un piccolo vantaggio.\n\n**2. Prepara la campagna di settembre adesso**\nSettembre è il mese d'oro. Se la campagna parte in anticipo, arrivi prima della concorrenza.\n\n**3. Ricontatta gli 8 soci inattivi**\nNon vengono da 3 settimane. Un messaggio personale oggi può evitare una disdetta domani.\n\nSono azioni concrete, a costo zero, con impatto diretto sulle entrate.`
  }

  // ── SITUAZIONE ATTUALE GENERICA ───────────────────────────────────────────
  if (q.includes('situazione') || q.includes('come sto') || q.includes('com\'è messa') || q.includes('panoramica') || q.includes('resoconto') || q.includes('riassumi') || q.includes('dimmi tutto') || q.includes('aggiornamento')) {
    const annualMargin = Math.round((lastMRR - lastCosts - lastSalary / 4) * 12)
    return `📊 **Situazione attuale — snapshot rapido**\n\n💰 Incassi mensili: **${fmt(lastMRR)}** (in crescita)\n👥 Soci attivi: **${lastMembers}** (record storico)\n💸 Spese operative: **${fmt(lastCosts)}**\n✅ Guadagno netto mensile: **~${fmt(Math.round(nextMargin))}**\n📉 Disdette: **1.8%** (minimo storico)\n\nSu base annuale stai proiettando **~${fmt(annualMargin)}** di guadagno netto.\n\nLa palestra cresce, i soci restano, le spese sono sotto controllo. È la combinazione migliore.\n\n👉 Vuoi un approfondimento su qualcosa di specifico?`
  }

  // ── CONCORRENZA ───────────────────────────────────────────────────────────
  if (q.includes('concorren') || q.includes('altre palestr') || q.includes('competitor') || q.includes('mercato')) {
    return `🏆 **Rispetto ai competitor, come te la cavi?**\n\nI dati di settore (palestre italiane medie):\n• Churn medio: **3.5–5%/mese** → tu sei al **1.8%** ✅\n• Crescita media iscritti: **1–2%/mese** → tu sei al **~${(membGrowth * 100).toFixed(1)}%** ✅\n• MRR medio per palestra piccola: **€5.000–7.000** → tu sei a **${fmt(lastMRR)}** ✅\n\nSei sopra la media su tutti e tre gli indicatori chiave. Il lavoro di fidelizzazione si vede nei numeri.`
  }

  // ── MARKETPLACE ───────────────────────────────────────────────────────────
  if (q.includes('marketplace') || q.includes('shop') || q.includes('negozio') || q.includes('prodott') || q.includes('articol') || q.includes('vendite') || q.includes('venduto') || q.includes('ordini') || q.includes('acquistat') && !q.includes('fattura')) {

    if (q.includes('miglior client') || q.includes('cliente migliore') || q.includes('chi compra di più') || q.includes('chi ha speso di più') || q.includes('top client')) {
      const top3 = [...MARKETPLACE_CUSTOMERS].sort((a, b) => b.total - a.total).slice(0, 3)
      return `🏆 **Miglior cliente del Marketplace**\n\n🥇 **${bestCustomer.name}** — ${fmt(bestCustomer.total)} totale · ${bestCustomer.orders} ordini · ultimo acquisto ${bestCustomer.lastOrder}\nArticoli preferiti: ${bestCustomer.items.join(', ')}\n\n**Top 3 clienti per valore:**\n${top3.map((c, i) => `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${c.name}: ${fmt(c.total)} (${c.orders} ordini)`).join('\n')}\n\n👉 ${bestCustomer.name} è un cliente fidelizzato — considera un programma loyalty dedicato o uno sconto riservato.`
    }

    if (q.includes('prodotto più venduto') || q.includes('articolo più venduto') || q.includes('vende di più') || q.includes('bestseller') || q.includes('top prodott')) {
      const top5 = [...MARKETPLACE_PRODUCTS].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
      return `🛍️ **Prodotti più venduti (ultimi 6 mesi)**\n\n💰 Per fatturato:\n${top5.map((p, i) => `${i + 1}. **${p.name}** — ${fmt(p.revenue)} · ${p.sold} pezzi`).join('\n')}\n\n📦 Per quantità: **${bestProductVol.name}** (${bestProductVol.sold} pezzi)\n\n👉 Gli integratori e l'abbigliamento trainano le vendite. Considera di aumentare lo stock di "${bestProduct.name}" — è il prodotto più redditizio.`
    }

    if (q.includes('categoria') || q.includes('categorie') || q.includes('tipo di prodott')) {
      const catTotals = MARKETPLACE_PRODUCTS.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + p.revenue
        return acc
      }, {} as Record<string, number>)
      const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
      return `📦 **Vendite per categoria (ultimi 6 mesi)**\n\n${sorted.map(([cat, rev], i) => `${i + 1}. **${cat}**: ${fmt(rev)}`).join('\n')}\n\nLa categoria più redditizia è **${sorted[0][0]}** con ${fmt(sorted[0][1])} di fatturato.\n\n👉 Integratori e abbigliamento dominano — sono le due categorie su cui conviene investire in stock e promozione.`
    }

    // Generico marketplace
    const lastMonth = MARKETPLACE_MONTHS[MARKETPLACE_MONTHS.length - 1]
    const prevMonth = MARKETPLACE_MONTHS[MARKETPLACE_MONTHS.length - 2]
    const revGrowth = ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
    return `🛍️ **Marketplace — riepilogo (Gen–Giu 2026)**\n\n💰 Fatturato totale: **${fmt(totalMktRevenue)}**\n📦 Ordini totali: **${totalMktOrders}**\n📅 Ultimo mese (${lastMonth.month}): **${fmt(lastMonth.revenue)}** · ${lastMonth.orders} ordini (+${revGrowth}% vs mese prima)\n\n🏆 Cliente top: **${bestCustomer.name}** (${fmt(bestCustomer.total)} · ${bestCustomer.orders} ordini)\n🥇 Prodotto top: **${bestProduct.name}** (${fmt(bestProduct.revenue)} · ${bestProduct.sold} pezzi)\n\n👉 Il marketplace cresce ogni mese — considera di ampliare il catalogo integratori, che è la categoria più venduta.`
  }

  // ── FATTURE EMESSE / AI RICERCA FATTURA ───────────────────────────────────
  if (q.includes('fattura') && !q.includes('acquisto') && !q.includes('fornitore') && !q.includes('acq-')) {

    // Ricerca per numero fattura
    const ftMatch = q.match(/ft[\-\s]?2026[\-\s]?(\d+)/i)
    if (ftMatch) {
      const id = `FT-2026-${ftMatch[1].padStart(3, '0')}`
      const inv = INVOICES_OUT.find(i => i.id === id)
      return inv
        ? `🧾 **Fattura ${inv.id}**\n\n👤 Intestata a: **${inv.member}**\n📅 Data emissione: ${inv.date}\n💰 Importo: **${fmt(inv.amount)}**\n📋 Piano: ${inv.plan}\n✅ Stato: **${inv.status}**`
        : `❌ Nessuna fattura trovata con il numero **${id}**. Verifica il numero e riprova.`
    }

    // Ricerca per nome cliente
    const customerMatch = INVOICES_OUT.find(i => q.includes(i.member.toLowerCase().split(' ')[0]) || q.includes(i.member.toLowerCase().split(' ')[1]))
    if (customerMatch) {
      const all = INVOICES_OUT.filter(i => i.member === customerMatch.member)
      const totale = all.reduce((s, i) => s + i.amount, 0)
      return `🧾 **Fatture di ${customerMatch.member}**\n\n${all.map(i => `• ${i.id} — ${i.date} — **${fmt(i.amount)}** (${i.plan}) — ${i.status}`).join('\n')}\n\n💰 Totale fatturato: **${fmt(totale)}**`
    }

    if (q.includes('non pagate') || q.includes('non pagata') || q.includes('insolut') || q.includes('scadut') || q.includes('mancanti')) {
      return `⚠️ **Fatture non pagate o in scadenza**\n\n${unpaidOut.length > 0 ? unpaidOut.map(i => `🔴 ${i.id} — ${i.member} — ${fmt(i.amount)} — ${i.date}`).join('\n') : '✅ Nessuna fattura non pagata'}\n\n${INVOICES_OUT.filter(i => i.status === 'in scadenza').map(i => `🟡 ${i.id} — ${i.member} — ${fmt(i.amount)} (in scadenza)`).join('\n') || ''}\n\n👉 Contatta ${unpaidOut.map(i => i.member).join(', ')} per il pagamento.`
    }

    // Generico fatture
    const totaleEmesso = INVOICES_OUT.reduce((s, i) => s + i.amount, 0)
    return `🧾 **Riepilogo fatture emesse**\n\n📋 Totale fatture: **${INVOICES_OUT.length}** · Importo totale: **${fmt(totaleEmesso)}**\n✅ Pagate: ${INVOICES_OUT.filter(i => i.status === 'pagata').length}\n🟡 In scadenza: ${INVOICES_OUT.filter(i => i.status === 'in scadenza').length}\n🔴 Non pagate: ${INVOICES_OUT.filter(i => i.status === 'non pagata').length}\n\n**Ultime fatture emesse:**\n${INVOICES_OUT.slice(-4).reverse().map(i => `• ${i.id} — ${i.member} — ${fmt(i.amount)} — ${i.status}`).join('\n')}\n\n👉 Hai **${unpaidOut.length} fattura non pagata** — considera un promemoria automatico.`
  }

  // ── FATTURE DI ACQUISTO / FORNITORI ───────────────────────────────────────
  if (q.includes('fattura di acquisto') || q.includes('fatture di acquisto') || q.includes('fornitore') || q.includes('fornitori') || q.includes('acquisto') || q.includes('acq-') || q.includes('spese fornitori') || q.includes('costi acquisto')) {

    // Ricerca per numero
    const acqMatch = q.match(/acq[\-\s]?(\d+)/i)
    if (acqMatch) {
      const id = `ACQ-${acqMatch[1].padStart(3, '0')}`
      const inv = INVOICES_IN.find(i => i.id === id)
      return inv
        ? `📥 **Fattura acquisto ${inv.id}**\n\n🏭 Fornitore: **${inv.supplier}**\n📅 Data: ${inv.date}\n💰 Importo: **${fmt(inv.amount)}**\n📋 Categoria: ${inv.category}\n✅ Stato: **${inv.status}**`
        : `❌ Nessuna fattura di acquisto trovata con il numero **${id}**.`
    }

    // Analisi fornitori
    if (q.includes('analisi fornitore') || q.includes('top fornitore') || q.includes('fornitore principale') || q.includes('chi pago di più') || q.includes('spendo di più')) {
      const sorted = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])
      return `🏭 **Analisi fornitori (Gen–Giu 2026)**\n\n${sorted.map(([sup, tot], i) => `${i + 1}. **${sup}**: ${fmt(tot)}`).join('\n')}\n\n💰 Fornitore principale: **${topSupplier[0]}** (${fmt(topSupplier[1])} in 6 mesi)\n\n👉 FitSupply Srl da solo rappresenta la maggior parte della spesa per il Marketplace. Valuta di negoziare un accordo quadro annuale per ottenere uno sconto sul volume.`
    }

    // Analisi per categoria
    if (q.includes('categoria') || q.includes('tipo di spesa') || q.includes('dove spendo')) {
      const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
      return `📊 **Spese per categoria (Gen–Giu 2026)**\n\n${sorted.map(([cat, tot], i) => `${i + 1}. **${cat}**: ${fmt(tot)}`).join('\n')}\n\n👉 La voce principale è il riassortimento prodotti per il Marketplace. Le utenze sono stabili. Il marketing aumenta in vista di settembre.`
    }

    // Da pagare
    if (q.includes('non pagate') || q.includes('da pagare') || q.includes('in scadenza') || q.includes('arretrat')) {
      const toPay = [...unpaidIn, ...dueSoonIn]
      const totDaPagare = toPay.reduce((s, i) => s + i.amount, 0)
      return `⚠️ **Fatture fornitori da pagare**\n\n${unpaidIn.map(i => `🔴 ${i.id} — ${i.supplier} — ${fmt(i.amount)} — NON PAGATA`).join('\n')}\n${dueSoonIn.map(i => `🟡 ${i.id} — ${i.supplier} — ${fmt(i.amount)} — IN SCADENZA`).join('\n')}\n\n💰 Totale da saldare: **${fmt(totDaPagare)}**\n\n👉 Priorità: salda prima la fattura non pagata di ${unpaidIn[0]?.supplier ?? '—'}.`
    }

    // Generico acquisti
    const totaleAcquisti = INVOICES_IN.reduce((s, i) => s + i.amount, 0)
    return `📥 **Riepilogo acquisti e fornitori (Gen–Giu 2026)**\n\n💸 Totale speso: **${fmt(totaleAcquisti)}**\n📋 Fatture ricevute: **${INVOICES_IN.length}**\n🔴 Non pagate: ${unpaidIn.length} (${fmt(unpaidIn.reduce((s, i) => s + i.amount, 0))})\n🟡 In scadenza: ${dueSoonIn.length} (${fmt(dueSoonIn.reduce((s, i) => s + i.amount, 0))})\n\n🏭 Fornitore principale: **${topSupplier[0]}** (${fmt(topSupplier[1])})\n📦 Categoria principale: **${Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1])[0][0]}** (${fmt(Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1])[0][1])})\n\n👉 Hai fatture in sospeso per ${fmt(unpaidIn.reduce((s,i)=>s+i.amount,0) + dueSoonIn.reduce((s,i)=>s+i.amount,0))} — tienile d'occhio.`
  }

  // ── ABBONAMENTI ───────────────────────────────────────────────────────────
  if (q.includes('abbonament') || q.includes('piano') && (q.includes('soci') || q.includes('iscritti') || q.includes('quanti') || q.includes('abbonati')) || q.includes('subscription') || q.includes('piani') || q.includes('rinnov')) {

    if (q.includes('quanti') && (q.includes('abbonament') || q.includes('piano') || q.includes('iscritti') || q.includes('abbonati'))) {
      return `📋 **Abbonamenti attivi per piano**\n\n${SUBSCRIPTION_PLANS.map(p => `• **${p.name}** (${fmt(p.price)}/mese): **${p.active} soci** → ${fmt(p.revenue)}/mese · churn ${p.churnRate}% · durata media ${p.avgMonths} mesi`).join('\n')}\n\n📊 Totale: **${totalActiveSubs} abbonamenti attivi** · **${fmt(totalSubRevenue)}/mese** di MRR da abbonamenti\n\n👉 Il piano **${bestPlanCount.name}** ha più soci; il piano **${bestPlanRevenue.name}** genera più fatturato. Enterprise ha il churn più basso (${SUBSCRIPTION_PLANS.find(p=>p.name==='Enterprise')?.churnRate}%) — i clienti Enterprise restano di più.`
    }

    if (q.includes('miglior piano') || q.includes('piano migliore') || q.includes('più redditizio') || q.includes('rende di più')) {
      return `💎 **Piano più redditizio: ${bestPlanRevenue.name}**\n\n${SUBSCRIPTION_PLANS.sort((a,b)=>b.revenue-a.revenue).map((p, i) => `${i+1}. **${p.name}** — ${fmt(p.revenue)}/mese · ${p.active} soci · churn ${p.churnRate}%`).join('\n')}\n\nIl piano **${bestPlanRevenue.name}** genera **${fmt(bestPlanRevenue.revenue)}/mese** — il più alto in assoluto.\n\nAttenzione però: il piano con il churn più basso è **Enterprise** (${SUBSCRIPTION_PLANS.find(p=>p.name==='Enterprise')?.churnRate}%) — quei soci restano mediamente ${SUBSCRIPTION_PLANS.find(p=>p.name==='Enterprise')?.avgMonths} mesi.\n\n👉 Valuta incentivi per far salire i soci Pro Mensile a Pro Annuale — la fidelizzazione è molto più alta.`
    }

    if (q.includes('scadono') || q.includes('in scadenza') || q.includes('rinnovano') || q.includes('rinnovi') || q.includes('da rinnovare')) {
      return `🔔 **Abbonamenti in scadenza**\n\nQuesto mese scadono **${expiringThisMonth} abbonamenti**.\n\nStima per piano:\n• Starter: ~5 in scadenza\n• Pro Mensile: ~7 in scadenza\n• Pro Annuale: ~2 in scadenza\n\nTasso di rinnovo atteso: ~82% (basato sullo storico).\nPrevisti non rinnovi: ~3 soci.\n\n👉 Contatta i 14 in scadenza adesso, in ordine di priorità: prima i Pro Mensile (più alto impatto sul MRR), poi gli Starter.`
    }

    if (q.includes('churn') || q.includes('disdett') || q.includes('abbandoni') && q.includes('piano')) {
      return `📉 **Churn per piano abbonamento**\n\n${SUBSCRIPTION_PLANS.map(p => `• **${p.name}**: ${p.churnRate}% al mese · durata media ${p.avgMonths} mesi`).join('\n')}\n\nIl piano con più disdette è **Starter** (${SUBSCRIPTION_PLANS[0].churnRate}%/mese) — soci meno fidelizzati.\nIl piano più stabile è **Enterprise** (${SUBSCRIPTION_PLANS[3].churnRate}%/mese).\n\n👉 Un'idea efficace: proporre agli Starter un upgrade a Pro Mensile con il primo mese scontato. Riduce il churn e aumenta il MRR.`
    }

    // Generico abbonamenti
    return `📋 **Abbonamenti — situazione attuale**\n\n${SUBSCRIPTION_PLANS.map(p => `• **${p.name}** — ${p.active} soci · ${fmt(p.revenue)}/mese`).join('\n')}\n\n📊 Totale attivi: **${totalActiveSubs} soci** · MRR da abbonamenti: **${fmt(totalSubRevenue)}**\n🔔 In scadenza questo mese: **${expiringThisMonth}**\n\nPiano più popoloso: **${bestPlanCount.name}** (${bestPlanCount.active} soci)\nPiano più redditizio: **${bestPlanRevenue.name}** (${fmt(bestPlanRevenue.revenue)}/mese)\n\n👉 Vuoi sapere quali scadono, il churn per piano, o quale piano rende di più?`
  }

  // ── ARTICOLI / STOCK ──────────────────────────────────────────────────────
  if (q.includes('stock') || q.includes('magazzino') || q.includes('giacenza') || q.includes('riassortiment')) {
    const lowStock = MARKETPLACE_PRODUCTS.filter(p => p.sold > 50)
    return `📦 **Articoli ad alto turnover (da riassortire)**\n\n${lowStock.map(p => `• **${p.name}** — ${p.sold} pezzi venduti in 6 mesi · ~${Math.round(p.sold/6)} al mese`).join('\n')}\n\n👉 Questi articoli vanno esauriti più in fretta. Tieni uno stock minimo di 2 mesi per ciascuno per evitare rotture di magazzino.`
  }

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  return `🤖 Non ho capito bene, ma posso aiutarti! Prova a chiedermi:\n\n• "Com'è andato marzo?" / "Quanto ho guadagnato a dicembre?"\n• "Dammi una previsione per i prossimi mesi"\n• "Chi è il mio miglior cliente del marketplace?"\n• "Cerca la fattura FT-2026-171"\n• "Analisi fornitori" / "Fatture di acquisto non pagate"\n• "Quanti soci sono abbonati al piano Pro?"\n• "Qual è il prodotto più venduto?"\n\nPuoi scrivere in modo completamente informale!`
}

// ── Chart tooltip ──────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const isForecast = payload[0]?.payload?.forecast
  return (
    <div className={`rounded-xl border bg-white p-3 shadow-lg text-xs ${isForecast ? 'border-brand-300' : 'border-slate-200'}`}>
      <p className="font-bold text-slate-700 mb-1">{label} {isForecast ? '(stima)' : ''}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: €{p.value?.toLocaleString('it-IT')}
        </p>
      ))}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Forecast() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0', role: 'ai', timestamp: new Date(),
    text: `👋 Sono **Oplyfit AI Forecast**, il tuo consulente personale.\n\nPuoi chiedermi qualsiasi cosa sulla tua palestra:\n\n📅 **Storico** — "com'è andato marzo?", "quando ho avuto più soci?"\n🔮 **Previsioni** — "come andrà l'estate?", "quanto incasso il mese prossimo?"\n🛍️ **Marketplace** — "chi è il mio miglior cliente?", "prodotto più venduto?"\n🧾 **Fatture** — "cerca la fattura FT-2026-171", "fatture non pagate"\n🏭 **Fornitori** — "analisi fornitori", "cosa ho acquistato di più?"\n📋 **Abbonamenti** — "quanti soci hanno il piano Pro?", "quali scadono?"\n\nScrivi pure in modo informale — capisco il linguaggio naturale!`,
  }])
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chartTab, setChartTab] = useState<'mrr' | 'margin' | 'members'>('mrr')
  const chatEndRef              = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function sendMessage(text: string) {
    if (!text.trim()) return
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: getAIResponse(text), timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 700 + Math.random() * 400)
  }

  function renderText(text: string) {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return <p key={i} className={`${line.startsWith('•') ? 'ml-3' : ''} leading-relaxed`} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />
    })
  }

  const mrgPct  = (nextMargin / nextMRR * 100)
  const isProfit = nextMargin > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Previsioni & AI Forecast</h1>
        <p className="mt-0.5 text-sm text-slate-500">Analisi predittiva basata su 12 mesi di dati storici — MRR, costi, iscritti, margine.</p>
      </div>

      {/* KPI forecast cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'MRR Luglio (stima)',
            value: fmt(nextMRR),
            sub: `${sign(mrrDelta)} ${pct(mrrDelta)} vs Giugno`,
            color: mrrDelta >= 0 ? 'text-emerald-600' : 'text-red-500',
            bg: mrrDelta >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50',
            icon: '💰',
          },
          {
            label: 'Costi operativi (stima)',
            value: fmt(nextCosts),
            sub: `${sign(costsDelta)} ${pct(costsDelta)} vs Giugno`,
            color: costsDelta <= 2 ? 'text-amber-600' : 'text-red-500',
            bg: 'border-amber-200 bg-amber-50',
            icon: '💸',
          },
          {
            label: 'Iscritti previsti',
            value: `~${nextMembers}`,
            sub: `${sign(membDelta)} ${pct(membDelta)} · churn ~${nextChurn.toFixed(1)}%`,
            color: membDelta >= 0 ? 'text-brand-600' : 'text-red-500',
            bg: 'border-brand-200 bg-brand-50',
            icon: '👥',
          },
          {
            label: 'Margine operativo',
            value: fmt(Math.round(nextMargin)),
            sub: `${mrgPct.toFixed(1)}% del MRR`,
            color: isProfit ? 'text-emerald-600' : 'text-red-500',
            bg: isProfit ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50',
            icon: isProfit ? '✅' : '⚠️',
          },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{k.icon}</span>
              <p className="text-xs font-medium text-slate-500">{k.label}</p>
            </div>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Chat layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* ── Chart panel ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Storico + Previsione 3 mesi</p>
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {([['mrr','MRR'],['margin','Margine'],['members','Iscritti']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setChartTab(key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${chartTab === key ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Forecast boundary */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-slate-200" /> Storico</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-brand-300 border border-dashed border-brand-400" /> Stima</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            {chartTab === 'mrr' ? (
              <AreaChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="Giu" stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '▶ Oggi', position: 'top', fontSize: 10, fill: '#94a3b8' }} />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#2563eb" fill="url(#mrrGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="costs" name="Costi" stroke="#f59e0b" fill="url(#costGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : chartTab === 'margin' ? (
              <BarChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="Giu" stroke="#94a3b8" strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />
                <Bar dataKey="margin" name="Margine" fill="#10b981" radius={[3, 3, 0, 0]}
                  label={false}
                  className="transition-all" />
              </BarChart>
            ) : (
              <LineChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine x="Giu" stroke="#94a3b8" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="members" name="Iscritti" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>

          {/* 3-month table */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-brand-50 text-left text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                  <th className="px-4 py-2">Mese</th><th className="px-3 py-2 text-right">MRR</th>
                  <th className="px-3 py-2 text-right">Costi</th><th className="px-3 py-2 text-right">Margine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {FORECAST.map(f => (
                  <tr key={f.month} className="hover:bg-brand-50/30">
                    <td className="px-4 py-2 font-semibold text-slate-700">{f.month} <span className="text-[10px] text-brand-400 font-normal">stima</span></td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-700">{fmt(f.mrr)}</td>
                    <td className="px-3 py-2 text-right text-amber-600">{fmt(f.costs)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${f.margin > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(f.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── AI Chat panel ── */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ minHeight: 520 }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg">🤖</div>
            <div>
              <p className="text-sm font-bold text-slate-800">Oplyfit AI Forecast</p>
              <p className="text-xs text-emerald-500 font-medium">● Online · analisi in tempo reale</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm mt-0.5">🤖</div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm space-y-0.5 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-slate-50 text-slate-700 rounded-tl-sm border border-slate-100'
                }`}>
                  {renderText(msg.text)}
                  <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-brand-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm">🤖</div>
                <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Preset questions */}
          <div className="border-t border-slate-100 px-4 py-3 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Domande rapide</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUESTIONS.map(q => (
                <button key={q.label} onClick={() => sendMessage(q.q)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-all">
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 px-4 py-3 shrink-0">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Scrivi una domanda sui tuoi dati…"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:bg-white transition-all" />
              <button type="submit" disabled={!input.trim() || isTyping}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
