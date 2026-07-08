import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Badge } from '../components/ui'

// ── Types ──────────────────────────────────────────────────────────────────────
interface StaffDto {
  id: string; email: string; fullName: string; role: string
  phone: string | null; isActive: boolean; hiredOn: string
  contractType?: string; specializations?: string[]; bio?: string | null
  clientCount?: number; sessionCount?: number; rating?: number
  monthlySalary?: number | null
}
interface CertDto {
  id: string; staffId: string; staffName: string; name: string
  issuer: string; issuedAt: string; expiresAt: string | null; category: string
}
interface ShiftDto { staffId: string; day: number; startHour: number; endHour: number }

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_STAFF: StaffDto[] = [
  { id: 'st1', fullName: 'Carlo Ferrara',   email: 'carlo@fitcore.it',   role: 'GymManager',     phone: '+39 333 1111111', isActive: true,  hiredOn: '2021-03-01', contractType: 'Dipendente',    specializations: ['Management', 'Fitness'],            bio: 'Direttore con 10 anni di esperienza nel settore fitness.',   clientCount: 0,  sessionCount: 0,  rating: 0,   monthlySalary: 2800 },
  { id: 'st2', fullName: 'Laura Bianchi',   email: 'laura@fitcore.it',   role: 'Trainer',         phone: '+39 333 2222222', isActive: true,  hiredOn: '2022-06-15', contractType: 'Dipendente',    specializations: ['Yoga', 'Pilates', 'Zumba'],         bio: 'Istruttrice certificata CONI con specializzazione in yoga.',  clientCount: 18, sessionCount: 24, rating: 4.9, monthlySalary: 1900 },
  { id: 'st3', fullName: 'Marco Verdi',     email: 'marco@fitcore.it',   role: 'Trainer',         phone: '+39 333 3333333', isActive: true,  hiredOn: '2021-09-01', contractType: 'Dipendente',    specializations: ['CrossFit', 'Boxe', 'Functional'],   bio: 'CrossFit L2 Trainer, ex atleta nazionale.',                  clientCount: 22, sessionCount: 31, rating: 4.8, monthlySalary: 2100 },
  { id: 'st4', fullName: 'Sara Esposito',   email: 'sara@fitcore.it',    role: 'Trainer',         phone: '+39 333 4444444', isActive: true,  hiredOn: '2023-01-10', contractType: 'Collaboratore', specializations: ['Spinning', 'Cardio'],                bio: 'Spinning instructor certificata Indoor Cycling Italy.',       clientCount: 15, sessionCount: 20, rating: 4.7, monthlySalary: 1200 },
  { id: 'st5', fullName: 'Fabio De Luca',   email: 'fabio@fitcore.it',   role: 'Trainer',         phone: '+39 333 5555555', isActive: true,  hiredOn: '2022-11-01', contractType: 'Dipendente',    specializations: ['HIIT', 'Functional TRX', 'Forza'],  bio: 'Personal trainer con laurea in Scienze Motorie.',            clientCount: 20, sessionCount: 28, rating: 4.6, monthlySalary: 2000 },
  { id: 'st6', fullName: 'Chiara Lombardi', email: 'chiara@fitcore.it',  role: 'Trainer',         phone: '+39 333 6666666', isActive: true,  hiredOn: '2023-04-01', contractType: 'Collaboratore', specializations: ['Pilates', 'Yoga'],                   bio: 'Insegnante Pilates Method Alliance certificata.',            clientCount: 12, sessionCount: 16, rating: 4.9, monthlySalary: 1100 },
  { id: 'st7', fullName: 'Andrea Russo',    email: 'andrea@fitcore.it',  role: 'Nutritionist',    phone: '+39 333 7777777', isActive: true,  hiredOn: '2022-02-01', contractType: 'Partita IVA',   specializations: ['Nutrizione sportiva', 'Dimagrimento'], bio: 'Biologo nutrizionista specializzato in sport.',            clientCount: 31, sessionCount: 8,  rating: 4.8, monthlySalary: 1800 },
  { id: 'st8', fullName: 'Valentina Greco', email: 'vale@fitcore.it',    role: 'Physiotherapist', phone: '+39 333 8888888', isActive: true,  hiredOn: '2023-06-01', contractType: 'Partita IVA',   specializations: ['Riabilitazione', 'Massoterapia'],   bio: "Fisioterapista iscritta all'Ordine TSRM.",                   clientCount: 14, sessionCount: 12, rating: 4.7, monthlySalary: 1600 },
  { id: 'st9', fullName: 'Roberto Martini', email: 'roberto@fitcore.it', role: 'Receptionist',    phone: '+39 333 9999999', isActive: true,  hiredOn: '2024-01-15', contractType: 'Dipendente',    specializations: ['Accoglienza', 'Amministrazione'],   bio: null,                                                         clientCount: 0,  sessionCount: 0,  rating: 0,   monthlySalary: 1400 },
  { id: 'stX', fullName: 'Giulia Moretti',  email: 'giuliam@fitcore.it', role: 'Receptionist',    phone: '+39 333 0000000', isActive: false, hiredOn: '2023-08-01', contractType: 'Dipendente',    specializations: ['Accoglienza'],                       bio: null,                                                         clientCount: 0,  sessionCount: 0,  rating: 0,   monthlySalary: 1400 },
]

const DEMO_CERTS: CertDto[] = [
  { id: 'cert1', staffId: 'st2', staffName: 'Laura Bianchi',   name: 'CONI Istruttore Fitness',        issuer: 'CONI',                    issuedAt: '2023-09-01', expiresAt: '2026-09-01', category: 'Fitness'   },
  { id: 'cert2', staffId: 'st2', staffName: 'Laura Bianchi',   name: 'Yoga Alliance RYT-200',          issuer: 'Yoga Alliance',           issuedAt: '2022-04-01', expiresAt: null,         category: 'Yoga'      },
  { id: 'cert3', staffId: 'st3', staffName: 'Marco Verdi',     name: 'CrossFit Level 2 Trainer',       issuer: 'CrossFit Inc.',           issuedAt: '2023-03-01', expiresAt: '2025-03-01', category: 'CrossFit'  },
  { id: 'cert4', staffId: 'st3', staffName: 'Marco Verdi',     name: 'FIPE Istruttore Pesistica',      issuer: 'FIPE',                    issuedAt: '2022-01-01', expiresAt: '2026-01-01', category: 'Fitness'   },
  { id: 'cert5', staffId: 'st4', staffName: 'Sara Esposito',   name: 'Indoor Cycling Instructor',      issuer: 'Indoor Cycling Italy',    issuedAt: '2023-06-01', expiresAt: '2026-06-01', category: 'Spinning'  },
  { id: 'cert6', staffId: 'st5', staffName: 'Fabio De Luca',   name: 'Laurea Scienze Motorie L-22',    issuer: 'Università di Napoli',    issuedAt: '2021-07-01', expiresAt: null,         category: 'Accademia' },
  { id: 'cert7', staffId: 'st5', staffName: 'Fabio De Luca',   name: 'TRX Suspension Training',        issuer: 'TRX Training',            issuedAt: '2024-01-01', expiresAt: '2026-01-01', category: 'Functional'},
  { id: 'cert8', staffId: 'st6', staffName: 'Chiara Lombardi', name: 'Pilates Method Alliance PMA',    issuer: 'Pilates Method Alliance', issuedAt: '2023-02-01', expiresAt: null,         category: 'Pilates'   },
  { id: 'cert9', staffId: 'st7', staffName: 'Andrea Russo',    name: 'Abilitazione Biologo Nutriz.',   issuer: 'Ministero della Salute',  issuedAt: '2022-03-01', expiresAt: '2027-03-01', category: 'Nutrizione'},
  { id: 'certA', staffId: 'st8', staffName: 'Valentina Greco', name: 'Laurea Magistrale Fisioterapia', issuer: 'Università di Milano',    issuedAt: '2022-10-01', expiresAt: null,         category: 'Salute'    },
  { id: 'certB', staffId: 'st8', staffName: 'Valentina Greco', name: 'Iscrizione Albo TSRM-PSTRP',    issuer: 'Ordine TSRM',             issuedAt: '2023-01-01', expiresAt: '2026-01-01', category: 'Salute'    },
]

const DEMO_SHIFTS: ShiftDto[] = [
  { staffId: 'st1', day: 0, startHour: 9,  endHour: 18 }, { staffId: 'st1', day: 1, startHour: 9,  endHour: 18 },
  { staffId: 'st1', day: 2, startHour: 9,  endHour: 18 }, { staffId: 'st1', day: 3, startHour: 9,  endHour: 18 },
  { staffId: 'st1', day: 4, startHour: 9,  endHour: 18 },
  { staffId: 'st2', day: 0, startHour: 8,  endHour: 14 }, { staffId: 'st2', day: 2, startHour: 8,  endHour: 14 },
  { staffId: 'st2', day: 4, startHour: 8,  endHour: 14 }, { staffId: 'st2', day: 5, startHour: 9,  endHour: 13 },
  { staffId: 'st3', day: 0, startHour: 7,  endHour: 13 }, { staffId: 'st3', day: 1, startHour: 7,  endHour: 13 },
  { staffId: 'st3', day: 3, startHour: 7,  endHour: 13 }, { staffId: 'st3', day: 4, startHour: 15, endHour: 21 },
  { staffId: 'st3', day: 5, startHour: 9,  endHour: 12 },
  { staffId: 'st4', day: 0, startHour: 10, endHour: 14 }, { staffId: 'st4', day: 2, startHour: 10, endHour: 14 },
  { staffId: 'st4', day: 4, startHour: 15, endHour: 19 }, { staffId: 'st4', day: 5, startHour: 10, endHour: 12 },
  { staffId: 'st5', day: 0, startHour: 15, endHour: 21 }, { staffId: 'st5', day: 1, startHour: 15, endHour: 21 },
  { staffId: 'st5', day: 3, startHour: 15, endHour: 21 }, { staffId: 'st5', day: 4, startHour: 7,  endHour: 10 },
  { staffId: 'st6', day: 1, startHour: 9,  endHour: 13 }, { staffId: 'st6', day: 3, startHour: 9,  endHour: 13 },
  { staffId: 'st6', day: 5, startHour: 9,  endHour: 12 },
  { staffId: 'st7', day: 1, startHour: 9,  endHour: 17 }, { staffId: 'st7', day: 4, startHour: 9,  endHour: 17 },
  { staffId: 'st8', day: 2, startHour: 9,  endHour: 17 }, { staffId: 'st8', day: 5, startHour: 9,  endHour: 13 },
  { staffId: 'st9', day: 0, startHour: 8,  endHour: 16 }, { staffId: 'st9', day: 1, startHour: 8,  endHour: 16 },
  { staffId: 'st9', day: 2, startHour: 8,  endHour: 16 }, { staffId: 'st9', day: 3, startHour: 8,  endHour: 16 },
  { staffId: 'st9', day: 4, startHour: 8,  endHour: 16 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_UI: Record<string, { label: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'slate'; icon: string }> = {
  GymManager:      { label: 'Direttore',     tone: 'red',   icon: '👔' },
  Trainer:         { label: 'Istruttore',    tone: 'blue',  icon: '💪' },
  Nutritionist:    { label: 'Nutrizionista', tone: 'green', icon: '🥗' },
  Physiotherapist: { label: 'Fisioterapista',tone: 'amber', icon: '🩺' },
  Receptionist:    { label: 'Reception',     tone: 'slate', icon: '📋' },
}
const CONTRACT_COLOR: Record<string, string> = {
  Dipendente:    'bg-emerald-100 text-emerald-700',
  Collaboratore: 'bg-blue-100 text-blue-700',
  'Partita IVA': 'bg-violet-100 text-violet-700',
}
const CERT_COLORS: Record<string, string> = {
  Fitness: 'bg-blue-50 border-blue-200', CrossFit: 'bg-orange-50 border-orange-200',
  Yoga: 'bg-violet-50 border-violet-200', Pilates: 'bg-pink-50 border-pink-200',
  Spinning: 'bg-cyan-50 border-cyan-200', Nutrizione: 'bg-green-50 border-green-200',
  Salute: 'bg-red-50 border-red-200', Accademia: 'bg-amber-50 border-amber-200',
  Functional: 'bg-teal-50 border-teal-200',
}
const GIORNI_BREVI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const SHIFT_COLORS = ['bg-brand-400','bg-violet-400','bg-emerald-400','bg-orange-400',
  'bg-pink-400','bg-amber-400','bg-teal-400','bg-red-400','bg-blue-400','bg-slate-400']

function certDaysLeft(expiresAt: string | null) {
  if (!expiresAt) return null
  return Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
}
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const palette = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-red-100 text-red-700','bg-teal-100 text-teal-700']
  const color = palette[name.charCodeAt(0) % palette.length]
  const sz = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  return <div className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${sz} ${color}`}>{initials}</div>
}

// ── Modal backdrop ─────────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── Staff detail modal ────────────────────────────────────────────────────────
function StaffDetailModal({ staff, onClose, onEdit }: { staff: StaffDto; onClose: () => void; onEdit: () => void }) {
  const role = ROLE_UI[staff.role] ?? { label: staff.role, tone: 'slate' as const, icon: '👤' }
  const certs = DEMO_CERTS.filter(c => c.staffId === staff.id)
  const shifts = DEMO_SHIFTS.filter(s => s.staffId === staff.id)
  const workDays = [...new Set(shifts.map(s => s.day))].sort()
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className={`h-2 rounded-t-2xl ${role.tone === 'red' ? 'bg-red-500' : role.tone === 'blue' ? 'bg-brand-500' : role.tone === 'green' ? 'bg-emerald-500' : role.tone === 'amber' ? 'bg-amber-500' : 'bg-slate-300'}`} />
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-4">
            <Avatar name={staff.fullName} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{staff.fullName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge tone={role.tone}>{role.icon} {role.label}</Badge>
                {staff.contractType && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONTRACT_COLOR[staff.contractType] ?? 'bg-slate-100 text-slate-500'}`}>
                    {staff.contractType}
                  </span>
                )}
                {!staff.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Inattivo</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">
          {/* Contatti */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400 mb-0.5">Email</p>
              <p className="font-medium text-slate-700 break-all">{staff.email}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400 mb-0.5">Telefono</p>
              <p className="font-medium text-slate-700">{staff.phone ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400 mb-0.5">Assunto il</p>
              <p className="font-medium text-slate-700">{new Date(staff.hiredOn).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400 mb-0.5">Compenso mensile</p>
              <p className="font-medium text-slate-700">{staff.monthlySalary ? `€${staff.monthlySalary.toLocaleString('it-IT')}` : '—'}</p>
            </div>
          </div>
          {/* Bio */}
          {staff.bio && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Biografia</p>
              <p className="text-sm text-slate-600 leading-relaxed">{staff.bio}</p>
            </div>
          )}
          {/* Specializzazioni */}
          {(staff.specializations ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Specializzazioni</p>
              <div className="flex flex-wrap gap-1.5">
                {(staff.specializations ?? []).map(sp => (
                  <span key={sp} className="rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-medium">{sp}</span>
                ))}
              </div>
            </div>
          )}
          {/* Stats */}
          {((staff.clientCount ?? 0) > 0 || (staff.sessionCount ?? 0) > 0) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Statistiche</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Clienti', value: staff.clientCount },
                  { label: 'Sessioni/mese', value: staff.sessionCount },
                  { label: 'Rating', value: (staff.rating ?? 0) > 0 ? `⭐ ${staff.rating}` : '—' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-sm font-bold text-slate-700">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Turni */}
          {workDays.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Turni settimanali</p>
              <div className="flex gap-1">
                {GIORNI_BREVI.map((g, i) => {
                  const dayShifts = shifts.filter(s => s.day === i)
                  return (
                    <div key={g} className="flex-1 text-center">
                      <div className={`rounded-md text-[10px] font-bold py-0.5 mb-0.5 ${workDays.includes(i) ? 'bg-brand-100 text-brand-700' : 'bg-slate-50 text-slate-300'}`}>{g}</div>
                      {dayShifts.map((sh, j) => (
                        <div key={j} className="text-[9px] text-slate-500">{sh.startHour}–{sh.endHour}</div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Certificazioni */}
          {certs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Certificazioni ({certs.length})</p>
              <div className="space-y-1.5">
                {certs.map(c => {
                  const days = certDaysLeft(c.expiresAt)
                  const expired = days !== null && days < 0
                  const expiring = days !== null && days >= 0 && days <= 60
                  return (
                    <div key={c.id} className={`rounded-lg border px-3 py-2 flex items-center justify-between ${CERT_COLORS[c.category] ?? 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.issuer}</p>
                      </div>
                      <div className="text-right">
                        {c.expiresAt
                          ? <p className={`text-xs font-medium ${expired ? 'text-red-600' : expiring ? 'text-amber-600' : 'text-slate-500'}`}>
                              {new Date(c.expiresAt).toLocaleDateString('it-IT')}
                              {expiring && days !== null && <span> ({days}gg)</span>}
                            </p>
                          : <p className="text-xs text-emerald-600 font-medium">Permanente</p>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Chiudi</button>
          <button onClick={() => { onClose(); onEdit() }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Modifica
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Edit staff modal ──────────────────────────────────────────────────────────
function EditStaffModal({ staff, onClose, onSave }: {
  staff: StaffDto; onClose: () => void; onSave: (updated: StaffDto) => void
}) {
  const [fullName, setFullName] = useState(staff.fullName)
  const [email, setEmail] = useState(staff.email)
  const [phone, setPhone] = useState(staff.phone ?? '')
  const [role, setRole] = useState(staff.role)
  const [contractType, setContractType] = useState(staff.contractType ?? 'Dipendente')
  const [specializations, setSpecializations] = useState((staff.specializations ?? []).join(', '))
  const [bio, setBio] = useState(staff.bio ?? '')
  const [isActive, setIsActive] = useState(staff.isActive)
  const [monthlySalary, setMonthlySalary] = useState(staff.monthlySalary !== null && staff.monthlySalary !== undefined ? String(staff.monthlySalary) : '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...staff,
      fullName, email, phone: phone || null, role, contractType,
      specializations: specializations.split(',').map(s => s.trim()).filter(Boolean),
      bio: bio || null, isActive,
      monthlySalary: monthlySalary ? parseFloat(monthlySalary) : null,
    })
  }

  const cls = 'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="font-semibold text-slate-800">Modifica — {staff.fullName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
              <input className={cls} value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input type="email" className={cls} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Telefono</label>
              <input className={cls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 333 0000000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ruolo</label>
              <select className={cls} value={role} onChange={e => setRole(e.target.value)}>
                {Object.entries(ROLE_UI).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo contratto</label>
              <select className={cls} value={contractType} onChange={e => setContractType(e.target.value)}>
                {['Dipendente', 'Collaboratore', 'Partita IVA'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Compenso mensile (€)</label>
              <input type="number" min="0" step="50" className={cls} value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="es. 1800" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Specializzazioni (separate da virgola)</label>
            <input className={cls} value={specializations} onChange={e => setSpecializations(e.target.value)} placeholder="Yoga, Pilates, Forza" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Biografia</label>
            <textarea className={cls + ' resize-none'} rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Descrizione breve…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
            <span className="text-sm text-slate-700">Membro attivo</span>
          </label>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annulla</button>
          <button onClick={handleSubmit as any} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Salva modifiche</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete confirm ─────────────────────────────────────────────────────────────
function DeleteStaffModal({ staff, onClose, onConfirm }: { staff: StaffDto; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-500">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">Rimuovi membro staff</h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Stai per rimuovere <span className="font-semibold text-slate-700">{staff.fullName}</span> dallo staff. Questa azione è irreversibile.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annulla</button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">Rimuovi</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Card actions menu ─────────────────────────────────────────────────────────
function CardMenu({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5">
          <button onClick={() => { setOpen(false); onView() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
              <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z" clipRule="evenodd" />
            </svg>
            Visualizza
          </button>
          <button onClick={() => { setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-400">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            </svg>
            Modifica
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
            Rimuovi
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const EMPTY_FORM = { fullName: '', email: '', role: 'Trainer', phone: '', contractType: 'Dipendente', specializations: '' }

export default function Staff() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'team' | 'orari' | 'certificazioni'>('team')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  // modals
  const [viewing, setViewing] = useState<StaffDto | null>(null)
  const [editing, setEditing] = useState<StaffDto | null>(null)
  const [deleting, setDeleting] = useState<StaffDto | null>(null)

  const { data: staffData } = useQuery({
    queryKey: ['staff'], queryFn: () => api.get<StaffDto[]>('/api/v1/staff'), retry: false,
  })

  // local mutable copy so demo edits/deletes work immediately
  const [localStaff, setLocalStaff] = useState<StaffDto[] | null>(null)
  const staff: StaffDto[] = localStaff ?? staffData?.data ?? DEMO_STAFF

  // sync from API when it loads (only once)
  useEffect(() => {
    if (staffData?.data && localStaff === null) setLocalStaff(staffData.data)
  }, [staffData])

  const create = useMutation({
    mutationFn: () => api.post<StaffDto>('/api/v1/staff', {
      email: form.email, fullName: form.fullName, role: form.role,
      hiredOn: new Date().toISOString().slice(0, 10), phone: form.phone || null,
    }),
    onSuccess: (res) => {
      setLocalStaff(prev => [res.data, ...(prev ?? staff)])
      setForm({ ...EMPTY_FORM }); setFormError(null); setShowForm(false)
    },
    onError: (e) => {
      // fallback: add locally when API not available
      const newMember: StaffDto = {
        id: `local-${Date.now()}`, email: form.email, fullName: form.fullName,
        role: form.role, phone: form.phone || null, isActive: true,
        hiredOn: new Date().toISOString().slice(0, 10),
        contractType: form.contractType,
        specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()) : [],
      }
      setLocalStaff(prev => [newMember, ...(prev ?? staff)])
      setForm({ ...EMPTY_FORM }); setFormError(null); setShowForm(false)
    },
  })

  const handleSave = (updated: StaffDto) => {
    setLocalStaff(prev => (prev ?? staff).map(s => s.id === updated.id ? updated : s))
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    setLocalStaff(prev => (prev ?? staff).filter(s => s.id !== id))
    setDeleting(null)
  }

  const active   = staff.filter(s => s.isActive)
  const trainers = active.filter(s => s.role === 'Trainer').length
  const expCerts = DEMO_CERTS.filter(c => { const d = certDaysLeft(c.expiresAt); return d !== null && d <= 60 })

  const filtered = staff.filter(s => {
    const matchRole   = !roleFilter || s.role === roleFilter
    const matchSearch = !search || s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="space-y-6">
      {/* Modals */}
      {viewing && <StaffDetailModal staff={viewing} onClose={() => setViewing(null)} onEdit={() => setEditing(viewing)} />}
      {editing && <EditStaffModal staff={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      {deleting && <DeleteStaffModal staff={deleting} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting.id)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="mt-0.5 text-sm text-slate-500">{active.length} membri attivi · {staff.length} totali</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          {showForm ? '✕ Annulla' : '+ Aggiungi membro'}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Staff attivo',      value: active.length,                                                color: 'text-slate-800' },
          { label: 'Istruttori',        value: trainers,                                                     color: 'text-brand-600' },
          { label: 'Nutrizionisti',     value: active.filter(s => s.role === 'Nutritionist').length,         color: 'text-emerald-600' },
          { label: 'Fisioterapisti',    value: active.filter(s => s.role === 'Physiotherapist').length,      color: 'text-amber-600'   },
          { label: 'Cert. in scadenza', value: expCerts.length, color: expCerts.length > 0 ? 'text-red-600' : 'text-slate-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Form aggiungi membro */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Aggiungi membro dello staff</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Nome completo *', key: 'fullName' as const, placeholder: 'Mario Rossi', type: 'text' },
              { label: 'Email *', key: 'email' as const, placeholder: 'mario@fitcore.it', type: 'email' },
              { label: 'Telefono', key: 'phone' as const, placeholder: '+39 333 0000000', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ruolo</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                {Object.entries(ROLE_UI).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo contratto</label>
              <select value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                {['Dipendente', 'Collaboratore', 'Partita IVA'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Specializzazioni (virgola)</label>
              <input value={form.specializations} onChange={e => setForm(f => ({ ...f, specializations: e.target.value }))}
                placeholder="Yoga, Pilates"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <div className="mt-4 flex justify-end">
            <button disabled={!form.fullName || !form.email || create.isPending} onClick={() => create.mutate()}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
              {create.isPending ? 'Salvataggio…' : 'Aggiungi'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['team', 'orari', 'certificazioni'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t
              ? 'border-b-2 border-brand-500 text-brand-600'
              : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'team' ? `👥 Team (${active.length})`
              : t === 'orari' ? '🗓 Turni settimanali'
              : `🏅 Certificazioni (${DEMO_CERTS.length})`}
          </button>
        ))}
      </div>

      {/* ── TEAM ── */}
      {tab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Cerca nome o email…"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-200" />
            <div className="flex gap-1 flex-wrap">
              {['', ...Object.keys(ROLE_UI)].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${roleFilter === r
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {r === '' ? 'Tutti' : ROLE_UI[r]?.icon + ' ' + ROLE_UI[r]?.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const role   = ROLE_UI[s.role] ?? { label: s.role, tone: 'slate' as const, icon: '👤' }
              const shifts = DEMO_SHIFTS.filter(sh => sh.staffId === s.id)
              const workDays = [...new Set(shifts.map(sh => sh.day))].sort()
              return (
                <div key={s.id} className={`rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md ${!s.isActive ? 'opacity-60' : 'border-slate-200'}`}>
                  <div className={`h-1.5 ${role.tone === 'red' ? 'bg-red-500' : role.tone === 'blue' ? 'bg-brand-500' : role.tone === 'green' ? 'bg-emerald-500' : role.tone === 'amber' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={s.fullName} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-slate-800 truncate">{s.fullName}</h3>
                          <CardMenu
                            onView={() => setViewing(s)}
                            onEdit={() => setEditing(s)}
                            onDelete={() => setDeleting(s)}
                          />
                        </div>
                        <p className="text-xs text-slate-400">{s.email}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <Badge tone={role.tone}>{role.icon} {role.label}</Badge>
                          {s.contractType && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONTRACT_COLOR[s.contractType] ?? 'bg-slate-100 text-slate-500'}`}>
                              {s.contractType}
                            </span>
                          )}
                          {!s.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">Inattivo</span>}
                        </div>
                      </div>
                    </div>

                    {s.bio && <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">{s.bio}</p>}

                    {(s.specializations ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(s.specializations ?? []).map(sp => (
                          <span key={sp} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{sp}</span>
                        ))}
                      </div>
                    )}

                    {((s.clientCount ?? 0) > 0 || (s.sessionCount ?? 0) > 0) && (
                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3">
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">{s.clientCount}</p>
                          <p className="text-xs text-slate-400">Clienti</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">{s.sessionCount}</p>
                          <p className="text-xs text-slate-400">Sessioni/mese</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">{(s.rating ?? 0) > 0 ? `⭐ ${s.rating}` : '—'}</p>
                          <p className="text-xs text-slate-400">Rating</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{s.phone ? `📞 ${s.phone}` : ''}</span>
                      <div className="flex items-center gap-3">
                        {s.monthlySalary && <span className="font-medium text-slate-600">€{s.monthlySalary.toLocaleString('it-IT')}/mese</span>}
                        <span>Dal {new Date(s.hiredOn).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {workDays.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {GIORNI_BREVI.map((g, i) => (
                          <div key={g} className={`h-5 w-5 rounded-sm text-[9px] font-bold flex items-center justify-center ${workDays.includes(i) ? 'bg-brand-100 text-brand-700' : 'bg-slate-50 text-slate-300'}`}>
                            {g[0]}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="mt-3 flex gap-2 pt-3 border-t border-slate-100">
                      <button onClick={() => setViewing(s)} className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                        👁 Dettaglio
                      </button>
                      <button onClick={() => setEditing(s)} className="flex-1 rounded-lg border border-brand-200 bg-brand-50 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors">
                        ✏ Modifica
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ORARI ── */}
      {tab === 'orari' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid border-b border-slate-100 bg-slate-50" style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}>
              <div className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Staff</div>
              {GIORNI_BREVI.map(g => (
                <div key={g} className="px-2 py-3 text-center text-xs font-semibold text-slate-500">{g}</div>
              ))}
            </div>
            {active.map((s, idx) => {
              const shifts = DEMO_SHIFTS.filter(sh => sh.staffId === s.id)
              const role = ROLE_UI[s.role]
              const shiftColor = SHIFT_COLORS[idx % SHIFT_COLORS.length]
              return (
                <div key={s.id} className="grid border-b border-slate-50 hover:bg-slate-50/50 transition-colors" style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Avatar name={s.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{s.fullName.split(' ')[0]}</p>
                      <p className="text-xs text-slate-400">{role?.icon} {role?.label}</p>
                    </div>
                  </div>
                  {GIORNI_BREVI.map((_, dayIdx) => {
                    const dayShifts = shifts.filter(sh => sh.day === dayIdx)
                    return (
                      <div key={dayIdx} className="px-1.5 py-2 flex flex-col gap-1">
                        {dayShifts.map((sh, i) => (
                          <div key={i} className={`rounded px-1.5 py-1 text-center text-xs text-white font-medium ${shiftColor}`}>
                            {sh.startHour}:00–{sh.endHour}:00
                          </div>
                        ))}
                        {dayShifts.length === 0 && <div className="h-6 rounded bg-slate-50 border border-dashed border-slate-200" />}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CERTIFICAZIONI ── */}
      {tab === 'certificazioni' && (
        <div className="space-y-3">
          {expCerts.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-700">{expCerts.length} certificazioni in scadenza nei prossimi 60 giorni</p>
                <p className="text-sm text-amber-600 mt-0.5">Contatta i membri dello staff per il rinnovo prima della scadenza.</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-4 py-3">Certificazione</th>
                  <th className="px-4 py-3">Ente</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Rilasciato</th>
                  <th className="px-4 py-3">Scadenza</th>
                  <th className="px-4 py-3">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {DEMO_CERTS.sort((a, b) => {
                  const da = certDaysLeft(a.expiresAt) ?? 99999
                  const db = certDaysLeft(b.expiresAt) ?? 99999
                  return da - db
                }).map(cert => {
                  const days = certDaysLeft(cert.expiresAt)
                  const expired  = days !== null && days < 0
                  const expiring = days !== null && days >= 0 && days <= 60
                  const catColor = CERT_COLORS[cert.category] ?? 'bg-slate-50 border-slate-200'
                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={cert.staffName} size="sm" />
                          <span className="font-medium text-slate-700">{cert.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{cert.name}</td>
                      <td className="px-4 py-3 text-slate-500">{cert.issuer}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${catColor}`}>{cert.category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(cert.issuedAt).toLocaleDateString('it-IT')}</td>
                      <td className="px-4 py-3 text-xs">
                        {cert.expiresAt
                          ? <span className={expired ? 'text-red-600 font-semibold' : expiring ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                              {new Date(cert.expiresAt).toLocaleDateString('it-IT')}
                              {expiring && days !== null && <span className="ml-1">({days}gg)</span>}
                            </span>
                          : <span className="text-emerald-600 font-medium">Permanente</span>}
                      </td>
                      <td className="px-4 py-3">
                        {cert.expiresAt === null
                          ? <Badge tone="green">Permanente</Badge>
                          : expired  ? <Badge tone="red">Scaduta</Badge>
                          : expiring ? <Badge tone="amber">In scadenza</Badge>
                          : <Badge tone="green">Valida</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
