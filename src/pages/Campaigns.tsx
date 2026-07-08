import { Fragment, useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string; title: string; subject: string; htmlBody: string
  segment: string; status: string
  createdAtUtc: string; sentAtUtc?: string; recipientCount: number
  openRate?: number; clickRate?: number; unsubscribeCount?: number
}

type BlockType = 'header' | 'hero' | 'text' | 'button' | 'divider' | 'spacer' | 'features' | 'image' | 'footer'

interface EmailBlock {
  id: string
  type: BlockType
  props: Record<string, string>
}

// ── Block defaults ───────────────────────────────────────────────────────────────
const BLOCK_DEFAULTS: Record<BlockType, Record<string, string>> = {
  header:   { gymName: '{{palestra}}', icon: '💪', bg: '#1e1b4b', accent: '#7c3aed' },
  hero:     { heading: 'Ciao {{nome}}!', sub: 'Il tuo percorso fitness inizia qui', bg: '#4f46e5', textColor: '#ffffff', align: 'center', emoji: '' },
  text:     { content: 'Scrivi qui il testo della tua email. Puoi usare {{nome}} per personalizzarla.', align: 'left' },
  button:   { text: 'Scopri di più →', url: '#', bg: '#7c3aed', color: '#ffffff', align: 'center' },
  divider:  { color: '#e5e7eb', height: '1' },
  spacer:   { height: '24' },
  features: { item1: '✅ Accesso illimitato alle classi', item2: '✅ App Oplyfit inclusa', item3: '✅ Supporto trainer dedicato', bg: '#f5f3ff', accent: '#7c3aed' },
  image:    { placeholder: '🏋️', label: 'Foto palestra / hero image', bg: '#e0e7ff', height: '160' },
  footer:   { gymName: '{{palestra}}', address: 'Via Roma 1, Milano', color: '#9ca3af', bg: '#f9fafb', accent: '#7c3aed' },
}

const BLOCK_PALETTE: { type: BlockType; icon: string; label: string }[] = [
  { type: 'header',   icon: '🏷️', label: 'Intestazione' },
  { type: 'hero',     icon: '🌟', label: 'Hero / Banner' },
  { type: 'text',     icon: '📝', label: 'Testo' },
  { type: 'button',   icon: '🔘', label: 'Bottone CTA' },
  { type: 'features', icon: '✅', label: 'Lista benefit' },
  { type: 'image',    icon: '🖼️', label: 'Immagine' },
  { type: 'divider',  icon: '➖', label: 'Separatore' },
  { type: 'spacer',   icon: '⬜', label: 'Spazio' },
  { type: 'footer',   icon: '📌', label: 'Footer' },
]

// ── Block renderers ──────────────────────────────────────────────────────────────
function renderBlockHtml(b: EmailBlock): string {
  const p = b.props
  switch (b.type) {
    case 'header':
      return `<tr><td style="background:${p.bg};padding:18px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle;">
      <div style="display:inline-block;width:32px;height:32px;background:${p.accent};border-radius:8px;text-align:center;line-height:32px;font-size:16px;vertical-align:middle;margin-right:10px;">${p.icon}</div>
      <span style="color:#ffffff;font-size:17px;font-weight:700;vertical-align:middle;">${p.gymName}</span>
    </td>
  </tr></table>
</td></tr>`

    case 'hero':
      return `<tr><td style="background:${p.bg};padding:48px 32px;text-align:${p.align||'center'};">
  ${p.emoji ? `<div style="font-size:52px;margin-bottom:16px;">${p.emoji}</div>` : ''}
  <h1 style="color:${p.textColor};font-size:28px;font-weight:800;margin:0 0 12px;line-height:1.25;">${p.heading}</h1>
  <p style="color:${p.textColor};font-size:16px;margin:0;opacity:0.85;line-height:1.6;">${p.sub}</p>
</td></tr>`

    case 'text':
      return `<tr><td style="padding:24px 32px;text-align:${p.align||'left'};">
  <p style="color:#374151;font-size:15px;line-height:1.75;margin:0;">${p.content.replace(/\n/g, '<br>')}</p>
</td></tr>`

    case 'button':
      return `<tr><td style="padding:12px 32px 24px;text-align:${p.align||'center'};">
  <a href="${p.url}" style="display:inline-block;background:${p.bg};color:${p.color};text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">${p.text}</a>
</td></tr>`

    case 'divider':
      return `<tr><td style="padding:4px 32px;"><hr style="border:none;border-top:${p.height}px solid ${p.color};margin:0;"></td></tr>`

    case 'spacer':
      return `<tr><td style="height:${p.height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`

    case 'features':
      return `<tr><td style="padding:8px 32px 24px;">
  <div style="background:${p.bg};border-left:4px solid ${p.accent};padding:20px 24px;border-radius:4px;">
    ${[p.item1, p.item2, p.item3, p.item4, p.item5].filter(Boolean).map(item =>
      `<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 6px;">${item}</p>`
    ).join('')}
  </div>
</td></tr>`

    case 'image':
      return `<tr><td style="padding:0 32px 24px;">
  <div style="background:${p.bg};height:${p.height}px;border-radius:8px;text-align:center;display:flex;align-items:center;justify-content:center;font-size:48px;line-height:${p.height}px;">
    ${p.placeholder}
  </div>
  ${p.caption ? `<p style="color:#9ca3af;font-size:12px;text-align:center;margin:8px 0 0;">${p.caption}</p>` : ''}
</td></tr>`

    case 'footer':
      return `<tr><td style="background:${p.bg};padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
  <p style="color:${p.color};font-size:13px;font-weight:600;margin:0 0 4px;">${p.gymName}</p>
  <p style="color:${p.color};font-size:12px;margin:0 0 8px;">${p.address}</p>
  <p style="font-size:11px;margin:0;color:#d1d5db;">
    <a href="#" style="color:${p.accent};text-decoration:none;">Disiscriviti</a> ·
    <a href="#" style="color:${p.accent};text-decoration:none;">Aggiorna preferenze</a>
  </p>
</td></tr>`

    default:
      return ''
  }
}

function blocksToHtml(blocks: EmailBlock[]): string {
  const rows = blocks.map(renderBlockHtml).join('\n')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;font-family:Arial,sans-serif;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;">
${rows}
</table>
</td></tr></table>`
}

function uid() { return Math.random().toString(36).slice(2, 9) }

function makeBlock(type: BlockType): EmailBlock {
  return { id: uid(), type, props: { ...BLOCK_DEFAULTS[type] } }
}

// ── Visual Templates ─────────────────────────────────────────────────────────────
const VISUAL_TEMPLATES: {
  id: string; icon: string; name: string; desc: string; color: string
  segment: string; subject: string; blocks: EmailBlock[]
}[] = [
  {
    id: 't1', icon: '👋', name: 'Benvenuto', color: '#4f46e5',
    desc: 'Per i nuovi iscritti nei primi 3 giorni',
    segment: 'NewMembers',
    subject: 'Benvenuto in {{palestra}} 🎉',
    blocks: [
      { id: uid(), type: 'header',   props: { ...BLOCK_DEFAULTS.header } },
      { id: uid(), type: 'hero',     props: { ...BLOCK_DEFAULTS.hero, heading: 'Benvenuto, {{nome}}! 🎉', sub: 'Sei parte della nostra community. Il tuo percorso fitness inizia ora.', bg: 'linear-gradient(135deg,#4f46e5,#7c3aed)', emoji: '' } },
      { id: uid(), type: 'text',     props: { content: 'Ciao {{nome}}, siamo felici di averti con noi! Da oggi hai accesso a tutto quello che ti serve per raggiungere i tuoi obiettivi fitness.', align: 'left' } },
      { id: uid(), type: 'features', props: { ...BLOCK_DEFAULTS.features, item1: '✅ Prenota la tua prima classe', item2: '✅ Scarica l\'app Oplyfit', item3: '✅ Completa il tuo profilo', item4: '✅ Incontra il tuo trainer', item5: '' } },
      { id: uid(), type: 'button',   props: { ...BLOCK_DEFAULTS.button, text: 'Inizia subito →' } },
      { id: uid(), type: 'footer',   props: { ...BLOCK_DEFAULTS.footer } },
    ],
  },
  {
    id: 't2', icon: '⏰', name: 'Scadenza abbonamento', color: '#d97706',
    desc: 'Promemoria 7 giorni prima della scadenza',
    segment: 'ExpiringIn30Days',
    subject: 'Il tuo abbonamento scade tra 7 giorni ⚠️',
    blocks: [
      { id: uid(), type: 'header',   props: { ...BLOCK_DEFAULTS.header, bg: '#78350f', accent: '#f59e0b' } },
      { id: uid(), type: 'hero',     props: { ...BLOCK_DEFAULTS.hero, heading: '{{nome}}, rinnova ora!', sub: 'Il tuo abbonamento scade il {{data_scadenza}}. Non perdere l\'accesso.', bg: 'linear-gradient(135deg,#b45309,#d97706)', emoji: '⏰' } },
      { id: uid(), type: 'text',     props: { content: 'Ciao {{nome}},\n\nManca poco alla scadenza del tuo abbonamento. Rinnova subito per continuare ad allenarti senza interruzioni e mantenere i tuoi progressi.', align: 'left' } },
      { id: uid(), type: 'button',   props: { ...BLOCK_DEFAULTS.button, text: '🔄 Rinnova ora', bg: '#f59e0b', color: '#1c1917' } },
      { id: uid(), type: 'divider',  props: { ...BLOCK_DEFAULTS.divider } },
      { id: uid(), type: 'text',     props: { content: 'Hai domande? Contattaci direttamente in palestra o rispondi a questa email.', align: 'center' } },
      { id: uid(), type: 'footer',   props: { ...BLOCK_DEFAULTS.footer, bg: '#fffbeb', accent: '#d97706' } },
    ],
  },
  {
    id: 't3', icon: '🔥', name: 'Win-back', color: '#7c3aed',
    desc: 'Recupero soci inattivi da oltre 30 giorni',
    segment: 'Inactive',
    subject: '{{nome}}, ci manchi! Torna con il 20% di sconto 🔥',
    blocks: [
      { id: uid(), type: 'header',   props: { ...BLOCK_DEFAULTS.header, bg: '#2d1b69', accent: '#a855f7' } },
      { id: uid(), type: 'hero',     props: { ...BLOCK_DEFAULTS.hero, heading: 'Hey {{nome}}, ci manchi!', sub: 'Sono passati un po\' di giorni. È il momento di tornare e riprendere da dove hai lasciato.', bg: 'linear-gradient(135deg,#4c1d95,#7c3aed)', emoji: '🔥' } },
      { id: uid(), type: 'text',     props: { content: 'Sappiamo che la vita può essere frenetica. Ma i tuoi obiettivi ti aspettano! Come benvenuto speciale, ti offriamo il 20% di sconto sul prossimo rinnovo.', align: 'left' } },
      { id: uid(), type: 'features', props: { item1: '🎁 20% di sconto sul rinnovo', item2: '💪 I tuoi progressi sono ancora salvati', item3: '🤝 Il tuo trainer ti aspetta', item4: '', item5: '', bg: '#f3e8ff', accent: '#9333ea' } },
      { id: uid(), type: 'button',   props: { ...BLOCK_DEFAULTS.button, text: '💜 Torna in palestra', bg: '#9333ea' } },
      { id: uid(), type: 'footer',   props: { ...BLOCK_DEFAULTS.footer, bg: '#faf5ff', accent: '#9333ea' } },
    ],
  },
  {
    id: 't4', icon: '🎂', name: 'Compleanno', color: '#db2777',
    desc: 'Regalo automatico nel mese del compleanno',
    segment: 'Birthdays',
    subject: 'Buon compleanno {{nome}}! 🎂 Un regalo da noi',
    blocks: [
      { id: uid(), type: 'header',   props: { ...BLOCK_DEFAULTS.header, bg: '#831843', accent: '#ec4899' } },
      { id: uid(), type: 'hero',     props: { ...BLOCK_DEFAULTS.hero, heading: 'Buon compleanno, {{nome}}! 🎉', sub: 'Che questo anno ti porti salute, forza e tanti successi in palestra!', bg: 'linear-gradient(135deg,#be185d,#ec4899)', emoji: '🎂' } },
      { id: uid(), type: 'text',     props: { content: 'Per festeggiare il tuo giorno speciale, ti facciamo un regalo! Come nostro socio speciale, ti offriamo una settimana extra gratuita sul tuo prossimo abbonamento.', align: 'left' } },
      { id: uid(), type: 'features', props: { item1: '🎁 1 settimana extra gratuita', item2: '🥤 1 frullato proteico omaggio', item3: '📸 Sessione foto fitness gratuita', item4: '', item5: '', bg: '#fdf2f8', accent: '#db2777' } },
      { id: uid(), type: 'button',   props: { ...BLOCK_DEFAULTS.button, text: '🎂 Ritira il tuo regalo', bg: '#db2777' } },
      { id: uid(), type: 'footer',   props: { ...BLOCK_DEFAULTS.footer, bg: '#fdf2f8', accent: '#db2777' } },
    ],
  },
  {
    id: 't5', icon: '⭐', name: 'Upsell Premium', color: '#0369a1',
    desc: 'Proposta upgrade per soci base attivi',
    segment: 'All',
    subject: '{{nome}}, sei pronto per il livello Premium? 🚀',
    blocks: [
      { id: uid(), type: 'header',   props: { ...BLOCK_DEFAULTS.header, bg: '#0c1a2e', accent: '#0ea5e9' } },
      { id: uid(), type: 'hero',     props: { ...BLOCK_DEFAULTS.hero, heading: 'Passa a Premium, {{nome}}', sub: 'Sblocca il tuo potenziale con funzionalità esclusive riservate ai top performer', bg: 'linear-gradient(135deg,#0c1a2e,#0369a1)', emoji: '🚀' } },
      { id: uid(), type: 'text',     props: { content: 'Hai già dimostrato la tua dedizione. Con il piano Premium puoi fare ancora di più. Ecco cosa ottieni:', align: 'left' } },
      { id: uid(), type: 'features', props: { item1: '🏆 Accesso illimitato a tutte le classi', item2: '💆 Zona wellness e sauna inclusa', item3: '🤖 AI Coach personalizzato', item4: '📊 Analisi avanzata delle performance', item5: '🎯 Sessioni PT incluse ogni mese', bg: '#eff6ff', accent: '#0369a1' } },
      { id: uid(), type: 'button',   props: { ...BLOCK_DEFAULTS.button, text: '⭐ Scopri Premium', bg: '#0369a1' } },
      { id: uid(), type: 'footer',   props: { ...BLOCK_DEFAULTS.footer, bg: '#f0f9ff', accent: '#0369a1' } },
    ],
  },
  {
    id: 't6', icon: '📣', name: 'Newsletter mensile', color: '#059669',
    desc: 'Aggiornamenti, novità e promozioni del mese',
    segment: 'All',
    subject: 'Le novità di {{mese}} da {{palestra}} 💪',
    blocks: [
      { id: uid(), type: 'header',   props: { ...BLOCK_DEFAULTS.header, bg: '#064e3b', accent: '#10b981' } },
      { id: uid(), type: 'hero',     props: { ...BLOCK_DEFAULTS.hero, heading: 'Le novità di {{mese}}', sub: 'Tutto quello che devi sapere questo mese dalla tua palestra', bg: 'linear-gradient(135deg,#065f46,#059669)', emoji: '📣' } },
      { id: uid(), type: 'text',     props: { content: 'Ciao {{nome}}! Ecco il riepilogo delle novità di questo mese: nuove classi, promozioni esclusive e aggiornamenti importanti dalla palestra.', align: 'left' } },
      { id: uid(), type: 'divider',  props: { ...BLOCK_DEFAULTS.divider } },
      { id: uid(), type: 'text',     props: { content: '🆕 NOVITÀ DEL MESE\n\nAbbiamo aggiunto nuove classi di functional training ogni mercoledì alle 19:00. Prenota subito il tuo posto!', align: 'left' } },
      { id: uid(), type: 'button',   props: { ...BLOCK_DEFAULTS.button, text: '📅 Prenota una classe', bg: '#059669' } },
      { id: uid(), type: 'footer',   props: { ...BLOCK_DEFAULTS.footer, bg: '#f0fdf4', accent: '#059669' } },
    ],
  },
]

// ── Static demo data ─────────────────────────────────────────────────────────────
const DEMO_CAMPAIGNS: Campaign[] = [
  { id: 'c1', title: 'Win-back Giugno 2026',     subject: 'Ci manchi! Torna con il 20% di sconto',        htmlBody: '', segment: 'Inactive',         status: 'Sent',    createdAtUtc: '2026-06-01', sentAtUtc: '2026-06-03', recipientCount: 47,  openRate: 38.2, clickRate: 12.5, unsubscribeCount: 2 },
  { id: 'c2', title: 'Newsletter Maggio',         subject: 'Le novità di Maggio da Oplyfit',               htmlBody: '', segment: 'All',              status: 'Sent',    createdAtUtc: '2026-05-28', sentAtUtc: '2026-05-29', recipientCount: 118, openRate: 45.7, clickRate: 18.2, unsubscribeCount: 1 },
  { id: 'c3', title: 'Promo Estate 2026',         subject: 'Preparati all\'estate — offerta limitata',     htmlBody: '', segment: 'ActivePremium',    status: 'Sent',    createdAtUtc: '2026-05-15', sentAtUtc: '2026-05-16', recipientCount: 63,  openRate: 52.4, clickRate: 24.1, unsubscribeCount: 0 },
  { id: 'c4', title: 'Benvenuto Nuovi Iscritti',  subject: 'Benvenuto in Oplyfit 🎉',                     htmlBody: '', segment: 'NewMembers',       status: 'Sent',    createdAtUtc: '2026-05-10', sentAtUtc: '2026-05-10', recipientCount: 12,  openRate: 83.3, clickRate: 41.7, unsubscribeCount: 0 },
  { id: 'c5', title: 'Scadenza Abbonamento',      subject: 'Il tuo abbonamento scade tra 7 giorni',        htmlBody: '', segment: 'ExpiringIn30Days', status: 'Sent',    createdAtUtc: '2026-04-20', sentAtUtc: '2026-04-21', recipientCount: 28,  openRate: 71.4, clickRate: 35.7, unsubscribeCount: 1 },
  { id: 'c6', title: 'Promo Compleanno Aprile',   subject: 'Buon compleanno 🎂 Un regalo per te!',         htmlBody: '', segment: 'Birthdays',        status: 'Sent',    createdAtUtc: '2026-04-01', sentAtUtc: '2026-04-01', recipientCount: 9,   openRate: 88.9, clickRate: 55.6, unsubscribeCount: 0 },
  { id: 'c7', title: 'Rinnovo Automatico Avviso', subject: 'Rinnovo in arrivo — verifica i tuoi dati',     htmlBody: '', segment: 'ExpiringIn30Days', status: 'Sending', createdAtUtc: '2026-06-20', recipientCount: 22 },
  { id: 'c8', title: 'Campagna Referral',         subject: 'Porta un amico e guadagna 1 mese gratis!',     htmlBody: '', segment: 'All',              status: 'Draft',   createdAtUtc: '2026-06-22', recipientCount: 0 },
]

const TREND_DATA = [
  { mese: 'Gen', destinatari: 180 }, { mese: 'Feb', destinatari: 110 },
  { mese: 'Mar', destinatari: 290 }, { mese: 'Apr', destinatari: 145 },
  { mese: 'Mag', destinatari: 201 }, { mese: 'Giu', destinatari: 187 },
]

const SEGMENTS = [
  { value: 'All',              label: 'Tutti i soci attivi',  count: 120, desc: 'Tutti con abbonamento attivo' },
  { value: 'NewMembers',       label: 'Nuovi iscritti',       count: 12,  desc: 'Iscritti negli ultimi 14 giorni' },
  { value: 'Inactive',         label: 'Inattivi (win-back)',  count: 47,  desc: 'Nessun accesso da >30 giorni' },
  { value: 'ExpiringIn30Days', label: 'Scadenza imminente',   count: 22,  desc: 'Abbonamento scade entro 30 gg' },
  { value: 'ActivePremium',    label: 'Premium attivi',       count: 63,  desc: 'Solo piano Premium o Top' },
  { value: 'Birthdays',        label: 'Compleanni del mese',  count: 9,   desc: 'Nati nel mese corrente' },
  { value: 'LongAbsent',       label: 'Assenti >90 giorni',   count: 18,  desc: 'Candidati al recupero intensivo' },
]

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  Draft:   { label: 'Bozza',           cls: 'bg-slate-100 text-slate-600' },
  Sending: { label: 'Invio in corso',  cls: 'bg-amber-100 text-amber-700' },
  Sent:    { label: 'Inviata',         cls: 'bg-emerald-100 text-emerald-700' },
  Failed:  { label: 'Errore',          cls: 'bg-red-100 text-red-700' },
}

function pct(n?: number) { return n !== undefined ? `${n.toFixed(1)}%` : '—' }
function fmtDate(s?: string) { return s ? new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—' }

function RateBar({ value, color }: { value?: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-slate-100">
        {value !== undefined && <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />}
      </div>
      <span className="text-xs font-mono text-slate-500">{pct(value)}</span>
    </div>
  )
}

// ── Block editor panel ───────────────────────────────────────────────────────────
const BLOCK_FIELDS: Record<BlockType, { key: string; label: string; type?: 'color' | 'select' | 'textarea' | 'number'; options?: string[] }[]> = {
  header:   [
    { key: 'gymName', label: 'Nome palestra' },
    { key: 'icon',    label: 'Emoji logo' },
    { key: 'bg',      label: 'Sfondo', type: 'color' },
    { key: 'accent',  label: 'Colore accento', type: 'color' },
  ],
  hero: [
    { key: 'heading',   label: 'Titolo principale' },
    { key: 'sub',       label: 'Sottotitolo', type: 'textarea' },
    { key: 'emoji',     label: 'Emoji decorativa (opzionale)' },
    { key: 'bg',        label: 'Sfondo (colore o gradient CSS)', type: 'textarea' },
    { key: 'textColor', label: 'Colore testo', type: 'color' },
    { key: 'align',     label: 'Allineamento', type: 'select', options: ['center', 'left', 'right'] },
  ],
  text: [
    { key: 'content', label: 'Contenuto', type: 'textarea' },
    { key: 'align',   label: 'Allineamento', type: 'select', options: ['left', 'center', 'right'] },
  ],
  button: [
    { key: 'text',  label: 'Testo bottone' },
    { key: 'url',   label: 'URL link' },
    { key: 'bg',    label: 'Sfondo bottone', type: 'color' },
    { key: 'color', label: 'Colore testo', type: 'color' },
    { key: 'align', label: 'Posizione', type: 'select', options: ['center', 'left', 'right'] },
  ],
  divider: [
    { key: 'color',  label: 'Colore', type: 'color' },
    { key: 'height', label: 'Spessore (px)', type: 'number' },
  ],
  spacer: [
    { key: 'height', label: 'Altezza (px)', type: 'number' },
  ],
  features: [
    { key: 'item1',  label: 'Elemento 1' },
    { key: 'item2',  label: 'Elemento 2' },
    { key: 'item3',  label: 'Elemento 3' },
    { key: 'item4',  label: 'Elemento 4 (opzionale)' },
    { key: 'item5',  label: 'Elemento 5 (opzionale)' },
    { key: 'bg',     label: 'Sfondo', type: 'color' },
    { key: 'accent', label: 'Colore bordo', type: 'color' },
  ],
  image: [
    { key: 'placeholder', label: 'Emoji placeholder' },
    { key: 'label',       label: 'Etichetta (non visibile nell\'email)' },
    { key: 'caption',     label: 'Didascalia (opzionale)' },
    { key: 'bg',          label: 'Sfondo placeholder', type: 'color' },
    { key: 'height',      label: 'Altezza (px)', type: 'number' },
  ],
  footer: [
    { key: 'gymName', label: 'Nome palestra' },
    { key: 'address', label: 'Indirizzo' },
    { key: 'bg',      label: 'Sfondo', type: 'color' },
    { key: 'color',   label: 'Colore testo', type: 'color' },
    { key: 'accent',  label: 'Colore link', type: 'color' },
  ],
}

function BlockPropsEditor({ block, onChange }: { block: EmailBlock; onChange: (props: Record<string, string>) => void }) {
  const fields = BLOCK_FIELDS[block.type] ?? []
  return (
    <div className="space-y-3">
      {fields.map(f => (
        <div key={f.key}>
          <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea
              value={block.props[f.key] ?? ''}
              onChange={e => onChange({ ...block.props, [f.key]: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          ) : f.type === 'color' ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={block.props[f.key]?.startsWith('#') ? block.props[f.key] : '#7c3aed'}
                onChange={e => onChange({ ...block.props, [f.key]: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-slate-200"
              />
              <input
                value={block.props[f.key] ?? ''}
                onChange={e => onChange({ ...block.props, [f.key]: e.target.value })}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 font-mono"
              />
            </div>
          ) : f.type === 'select' ? (
            <select
              value={block.props[f.key] ?? ''}
              onChange={e => onChange({ ...block.props, [f.key]: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={f.type === 'number' ? 'number' : 'text'}
              value={block.props[f.key] ?? ''}
              onChange={e => onChange({ ...block.props, [f.key]: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Email Builder ────────────────────────────────────────────────────────────────
function EmailBuilder({
  blocks, selectedId, onSelect, onAdd, onMove, onDelete, onUpdateProps,
}: {
  blocks: EmailBlock[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (type: BlockType) => void
  onMove: (id: string, dir: 'up' | 'down') => void
  onDelete: (id: string) => void
  onUpdateProps: (id: string, props: Record<string, string>) => void
}) {
  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null

  const BLOCK_ICONS: Record<BlockType, string> = {
    header: '🏷️', hero: '🌟', text: '📝', button: '🔘', divider: '➖',
    spacer: '⬜', features: '✅', image: '🖼️', footer: '📌',
  }
  const BLOCK_LABELS: Record<BlockType, string> = {
    header: 'Intestazione', hero: 'Hero', text: 'Testo', button: 'Bottone',
    divider: 'Separatore', spacer: 'Spazio', features: 'Lista benefit', image: 'Immagine', footer: 'Footer',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_260px] gap-4 h-full">
      {/* ── Palette ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 self-start">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Blocchi</p>
        {BLOCK_PALETTE.map(b => (
          <button key={b.type} onClick={() => onAdd(b.type)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors">
            <span>{b.icon}</span>
            {b.label}
          </button>
        ))}
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 text-center">
          Clicca per aggiungere
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Canvas email</p>
        {blocks.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <p className="text-2xl mb-2">✉️</p>
            <p className="text-sm font-medium text-slate-400">Email vuota</p>
            <p className="text-xs text-slate-300 mt-1">Aggiungi blocchi dalla palette a sinistra</p>
          </div>
        )}
        {blocks.map((block, i) => {
          const isSelected = block.id === selectedId
          return (
            <div key={block.id} onClick={() => onSelect(isSelected ? null : block.id)}
              className={`group relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected ? 'border-brand-400 shadow-md shadow-brand-100' : 'border-slate-200 hover:border-slate-300'}`}>
              {/* Block mini preview */}
              <div style={{ height: '90px', overflow: 'hidden', position: 'relative' }}>
                <div className="pointer-events-none select-none" style={{ position: 'absolute', top: 0, left: 0, transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
                  <div dangerouslySetInnerHTML={{ __html: `<table width="600" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;width:600px;">${renderBlockHtml(block)}</table>` }} />
                </div>
              </div>
              {/* Controls overlay */}
              <div className={`absolute top-1.5 right-1.5 flex gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button onClick={e => { e.stopPropagation(); onMove(block.id, 'up') }} disabled={i === 0}
                  className="h-6 w-6 rounded bg-white border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30 shadow-sm">▲</button>
                <button onClick={e => { e.stopPropagation(); onMove(block.id, 'down') }} disabled={i === blocks.length - 1}
                  className="h-6 w-6 rounded bg-white border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30 shadow-sm">▼</button>
                <button onClick={e => { e.stopPropagation(); onDelete(block.id) }}
                  className="h-6 w-6 rounded bg-white border border-red-200 text-xs text-red-400 hover:bg-red-50 shadow-sm">✕</button>
              </div>
              {/* Type badge */}
              <div className={`absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                style={{ background: 'rgba(255,255,255,0.9)' }}>
                <span>{BLOCK_ICONS[block.type]}</span>
                <span className="font-medium text-slate-600">{BLOCK_LABELS[block.type]}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Properties ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 self-start">
        {selectedBlock ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{BLOCK_ICONS[selectedBlock.type]}</span>
              <p className="text-sm font-semibold text-slate-800">{BLOCK_LABELS[selectedBlock.type]}</p>
            </div>
            <BlockPropsEditor
              block={selectedBlock}
              onChange={props => onUpdateProps(selectedBlock.id, props)}
            />
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">👆</p>
            <p className="text-xs font-medium text-slate-400">Seleziona un blocco<br />per modificarne le proprietà</p>
          </div>
        )}

        {/* Variables tip */}
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Variabili disponibili</p>
          {[['{{nome}}', 'Nome'], ['{{cognome}}', 'Cognome'], ['{{palestra}}', 'Palestra'], ['{{data_scadenza}}', 'Scadenza'], ['{{mese}}', 'Mese']].map(([k, v]) => (
            <p key={k}><code className="bg-amber-100 px-1 rounded font-mono">{k}</code> {v}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Email preview modal ──────────────────────────────────────────────────────────
function EmailPreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-slate-800 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <p className="text-xs text-slate-400 font-medium">Anteprima email</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm transition-colors">✕ Chiudi</button>
        </div>
        <div className="overflow-auto bg-slate-100 flex-1">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────────
export default function Campaigns() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'lista' | 'analytics' | 'templates' | 'nuova'>('lista')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Builder state
  const [form, setForm] = useState({ title: '', subject: '', segment: 'All' })
  const [blocks, setBlocks] = useState<EmailBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const { data: remoteData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<any>('/api/v1/campaigns/'),
    retry: false,
  })

  const createCampaign = useMutation({
    mutationFn: () => api.post('/api/v1/campaigns/', { ...form, htmlBody: blocksToHtml(blocks) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      setTab('lista')
      setForm({ title: '', subject: '', segment: 'All' })
      setBlocks([])
    },
  })

  const sendCampaign = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/campaigns/${id}/send`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const campaigns: Campaign[] = useMemo(() => {
    const remote = (remoteData?.data as any)?.data ?? []
    return remote.length > 0 ? remote : DEMO_CAMPAIGNS
  }, [remoteData])

  const filtered = useMemo(() =>
    statusFilter ? campaigns.filter(c => c.status === statusFilter) : campaigns
  , [campaigns, statusFilter])

  const sent = campaigns.filter(c => c.status === 'Sent')
  const avgOpen  = sent.length ? sent.reduce((a, c) => a + (c.openRate ?? 0), 0) / sent.length : 0
  const avgClick = sent.length ? sent.reduce((a, c) => a + (c.clickRate ?? 0), 0) / sent.length : 0
  const totDest  = sent.reduce((a, c) => a + c.recipientCount, 0)

  // Builder handlers
  const handleAddBlock = useCallback((type: BlockType) => {
    const block = makeBlock(type)
    setBlocks(prev => [...prev, block])
    setSelectedBlockId(block.id)
  }, [])

  const handleMoveBlock = useCallback((id: string, dir: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }, [])

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    setSelectedBlockId(prev => prev === id ? null : prev)
  }, [])

  const handleUpdateProps = useCallback((id: string, props: Record<string, string>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, props } : b))
  }, [])

  function loadTemplate(tpl: typeof VISUAL_TEMPLATES[0]) {
    setForm({ title: tpl.name, subject: tpl.subject, segment: tpl.segment })
    setBlocks(tpl.blocks.map(b => ({ ...b, id: uid(), props: { ...b.props } })))
    setSelectedBlockId(null)
    setTab('nuova')
  }

  function duplicateCampaign(c: Campaign) {
    setForm({ title: `Copia — ${c.title}`, subject: c.subject, segment: c.segment })
    setBlocks([])
    setTab('nuova')
  }

  const currentHtml = useMemo(() => blocksToHtml(blocks), [blocks])
  const canSubmit = form.title && form.subject && blocks.length > 0

  return (
    <div className="space-y-5">
      {previewOpen && <EmailPreviewModal html={currentHtml} onClose={() => setPreviewOpen(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Marketing</h1>
          <p className="mt-0.5 text-sm text-slate-500">Campagne email segmentate · {campaigns.length} campagne totali</p>
        </div>
        <button onClick={() => { setBlocks([]); setForm({ title: '', subject: '', segment: 'All' }); setTab('nuova') }}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors">
          + Nuova campagna
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Campagne inviate',   value: String(sent.length),            sub: `${campaigns.filter(c=>c.status==='Draft').length} bozze`, color: 'text-slate-800' },
          { label: 'Tasso apertura',     value: `${avgOpen.toFixed(1)}%`,        sub: 'Media campagne inviate',  color: avgOpen > 40 ? 'text-emerald-600' : 'text-amber-600' },
          { label: 'Click rate',         value: `${avgClick.toFixed(1)}%`,       sub: 'Media campagne inviate',  color: 'text-violet-600' },
          { label: 'Destinatari totali', value: totDest.toLocaleString('it-IT'), sub: 'Soci raggiunti',          color: 'text-blue-600' },
          { label: 'Miglior campagna',   value: `${Math.max(...sent.map(c=>c.openRate??0)).toFixed(1)}%`, sub: 'Tasso apertura massimo', color: 'text-brand-600' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          ['lista',     '📋 Lista'],
          ['analytics', '📊 Analytics'],
          ['templates', '✨ Template'],
          ['nuova',     '🛠️ Builder'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === key
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LISTA ── */}
      {tab === 'lista' && (
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {['', 'Draft', 'Sending', 'Sent', 'Failed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s
                  ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {s === '' ? 'Tutte' : STATUS_UI[s]?.label ?? s}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 text-left">Campagna</th>
                  <th className="px-4 py-3 text-left">Segmento</th>
                  <th className="px-4 py-3 text-left">Stato</th>
                  <th className="px-4 py-3 text-right">Dest.</th>
                  <th className="px-4 py-3">Aperture</th>
                  <th className="px-4 py-3">Click</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => {
                  const st     = STATUS_UI[c.status] ?? { label: c.status, cls: 'bg-slate-100 text-slate-500' }
                  const seg    = SEGMENTS.find(s => s.value === c.segment)
                  const isOpen = expandedId === c.id
                  const toggle = () => setExpandedId(isOpen ? null : c.id)
                  return (
                    <Fragment key={c.id}>
                      <tr onClick={toggle}
                        className={`cursor-pointer transition-colors ${isOpen ? 'bg-brand-50/40' : 'hover:bg-slate-50/60'}`}>
                        <td className="px-5 py-3.5 max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                            <div>
                              <p className="font-medium text-slate-800 truncate">{c.title}</p>
                              <p className="text-xs text-slate-400 truncate">{c.subject}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{seg?.label ?? c.segment}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600">{c.recipientCount || '—'}</td>
                        <td className="px-4 py-3.5"><RateBar value={c.openRate}  color="bg-emerald-400" /></td>
                        <td className="px-4 py-3.5"><RateBar value={c.clickRate} color="bg-violet-400" /></td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">{fmtDate(c.sentAtUtc ?? c.createdAtUtc)}</td>
                        <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          {(c.status === 'Draft' || c.status === 'Failed') && (
                            <button onClick={() => sendCampaign.mutate(c.id)} disabled={sendCampaign.isPending}
                              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
                              Invia
                            </button>
                          )}
                          {c.status === 'Sending' && <span className="text-xs text-amber-600 animate-pulse">In invio…</span>}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-brand-50/20">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                              <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Statistiche</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { label: 'Destinatari',   value: c.recipientCount ? String(c.recipientCount) : '—', color: 'text-slate-700' },
                                    { label: 'Aperture',      value: pct(c.openRate),   color: 'text-emerald-600' },
                                    { label: 'Click',         value: pct(c.clickRate),  color: 'text-violet-600' },
                                    { label: 'Disiscrizioni', value: c.unsubscribeCount !== undefined ? String(c.unsubscribeCount) : '—', color: 'text-red-500' },
                                  ].map(s => (
                                    <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                      <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                                      <p className="text-xs text-slate-400">{s.label}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {(c.status === 'Draft' || c.status === 'Failed') && (
                                    <button onClick={() => sendCampaign.mutate(c.id)} disabled={sendCampaign.isPending}
                                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
                                      📤 Invia ora
                                    </button>
                                  )}
                                  <button onClick={() => duplicateCampaign(c)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    📋 Duplica
                                  </button>
                                  <button onClick={toggle}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50 transition-colors">
                                    Chiudi ▲
                                  </button>
                                </div>
                              </div>
                              <div className="lg:col-span-2 space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Oggetto email</p>
                                <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800">{c.subject}</div>
                                {c.htmlBody ? (
                                  <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm max-h-48 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: c.htmlBody }} />
                                ) : (
                                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
                                    Nessun corpo HTML salvato.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Nessuna campagna trovata.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Destinatari raggiunti per mese (2026)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="destFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mese" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="destinatari" name="Destinatari" stroke="#7c3aed" fill="url(#destFill)" strokeWidth={2.5} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Aperture vs Click — ultime campagne</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sent.slice(-6).map(c => ({ name: c.title.slice(0,18), aperture: c.openRate, click: c.clickRate }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                <Bar dataKey="aperture" name="Aperture" fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="click"    name="Click"    fill="#7c3aed" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Top performer — per tasso apertura</p>
            <div className="space-y-2">
              {[...sent].sort((a,b) => (b.openRate??0)-(a.openRate??0)).slice(0,5).map((c,i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-slate-400">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">{fmtDate(c.sentAtUtc)} · {c.recipientCount} destinatari</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center"><p className="text-sm font-bold text-emerald-600">{pct(c.openRate)}</p><p className="text-xs text-slate-400">aperture</p></div>
                    <div className="text-center"><p className="text-sm font-bold text-violet-600">{pct(c.clickRate)}</p><p className="text-xs text-slate-400">click</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Scegli un template grafico per iniziare — ogni template è completamente personalizzabile nel builder.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VISUAL_TEMPLATES.map(t => {
              const previewHtml = blocksToHtml(t.blocks)
              return (
                <div key={t.id} className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all flex flex-col">
                  {/* Visual preview */}
                  <div className="relative overflow-hidden bg-slate-100" style={{ height: '200px' }}>
                    <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: '263%', pointerEvents: 'none' }}>
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                    {/* Overlay gradient at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
                    {/* Color accent bar at top */}
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: t.color }} />
                  </div>
                  {/* Info */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl text-xl flex-shrink-0"
                        style={{ background: `${t.color}18` }}>
                        {t.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400 truncate">{t.desc}</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Oggetto: </span>{t.subject}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {SEGMENTS.find(s=>s.value===t.segment)?.label ?? t.segment}
                      </span>
                      <button onClick={() => loadTemplate(t)}
                        className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-colors"
                        style={{ background: t.color }}>
                        Usa template →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── BUILDER ── */}
      {tab === 'nuova' && (
        <div className="space-y-4">
          {/* Form header */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Titolo interno</label>
                <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                  placeholder="es. Promo Settembre 2026"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Oggetto email</label>
                <input value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))}
                  placeholder="es. Torna con il 20% di sconto!"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Segmento</label>
                <select value={form.segment} onChange={e => setForm(p => ({...p, segment: e.target.value}))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label} ({s.count})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Block builder */}
          <EmailBuilder
            blocks={blocks}
            selectedId={selectedBlockId}
            onSelect={setSelectedBlockId}
            onAdd={handleAddBlock}
            onMove={handleMoveBlock}
            onDelete={handleDeleteBlock}
            onUpdateProps={handleUpdateProps}
          />

          {/* Footer bar */}
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-600">{blocks.length}</span> blocchi
              {blocks.length > 0 && (
                <span>· <button onClick={() => setBlocks([])} className="text-red-400 hover:text-red-600 transition-colors">Svuota canvas</button></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {blocks.length > 0 && (
                <button onClick={() => setPreviewOpen(true)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  👁 Anteprima
                </button>
              )}
              <button onClick={() => setTab('templates')}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
                Template
              </button>
              <button
                onClick={() => createCampaign.mutate()}
                disabled={createCampaign.isPending || !canSubmit}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {createCampaign.isPending ? 'Salvataggio…' : '💾 Salva bozza'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
