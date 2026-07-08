import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card } from '../components/ui'

interface IntegrationStatus {
  stripe: { configured: boolean; live: boolean }
  sendGrid: { configured: boolean; enabled: boolean }
  fcm: { configured: boolean; enabled: boolean }
  azureBlob: { configured: boolean }
  appInsights: { configured: boolean }
  keyVault: { configured: boolean }
  agora: { configured: boolean; enabled: boolean }
  youSign: { configured: boolean; enabled: boolean }
  technogym: { configured: boolean; enabled: boolean }
  lifeFitness: { configured: boolean; enabled: boolean }
  azureCv: { configured: boolean; enabled: boolean }
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'
    }`}>
      {ok ? '✓' : '!'} {label}
    </span>
  )
}

function SecretRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
      <div>
        <div className="text-xs font-mono font-semibold text-slate-700">{name}</div>
        <div className="mt-0.5 text-xs text-slate-400">{value}</div>
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(name)}
        className="ml-4 shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
        title="Copia nome segreto"
      >
        Copia
      </button>
    </div>
  )
}

interface IntegrationCardProps {
  title: string
  icon: string
  ok: boolean
  statusLabel: string
  description: string
  secrets: { name: string; value: string }[]
  docsUrl?: string
  extraBadge?: React.ReactNode
}

function IntegrationCard({ title, icon, ok, statusLabel, description, secrets, docsUrl, extraBadge }: IntegrationCardProps) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge ok={ok} label={statusLabel} />
          {extraBadge}
        </div>
      </div>

      {secrets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Segreti Key Vault</p>
          {secrets.map((s) => <SecretRow key={s.name} name={s.name} value={s.value} />)}
        </div>
      )}

      {docsUrl && (
        <a href={docsUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
          Documentazione ↗
        </a>
      )}
    </Card>
  )
}

export default function CredentialChecklist() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-integrations'],
    queryFn: () => api.get<IntegrationStatus>('/api/v1/admin/integrations'),
    retry: false,
  })
  const s = data?.data

  const configuredCount = s
    ? [s.stripe.configured, s.sendGrid.configured, s.fcm.configured,
       s.azureBlob.configured, s.appInsights.configured, s.keyVault.configured,
       s.agora.configured, s.youSign.configured,
       s.technogym?.configured, s.lifeFitness?.configured, s.azureCv?.configured,
      ].filter(Boolean).length
    : 0
  const totalIntegrations = 11

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Integrazioni &amp; Credenziali</h1>
        <p className="text-sm text-slate-500">Stato delle integrazioni esterne e guida alla configurazione in produzione.</p>
      </div>

      {/* Summary bar */}
      {!isLoading && s && (
        <div className={`flex items-center gap-4 rounded-xl p-4 ${configuredCount === totalIntegrations ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <span className="text-2xl">{configuredCount === totalIntegrations ? '🎉' : '⚙️'}</span>
          <div>
            <div className={`font-semibold ${configuredCount === totalIntegrations ? 'text-emerald-700' : 'text-amber-700'}`}>
              {configuredCount}/{totalIntegrations} integrazioni configurate
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {configuredCount === totalIntegrations
                ? 'Tutto configurato — pronto per la produzione.'
                : 'Completa le integrazioni per abilitare tutte le funzionalità.'}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Caricamento…</div>
      ) : (
        <div className="space-y-4">

          {/* Key Vault */}
          <IntegrationCard
            title="Azure Key Vault"
            icon="🔐"
            ok={s?.keyVault.configured ?? false}
            statusLabel={s?.keyVault.configured ? 'Configurato' : 'Non configurato'}
            description="Centralizza tutti i segreti di produzione. Richiesto prima degli altri."
            secrets={[{ name: 'KeyVault--Uri', value: 'Valore: https://<nome>.vault.azure.net/' }]}
            docsUrl="https://learn.microsoft.com/azure/key-vault/"
          />

          {/* Stripe */}
          <IntegrationCard
            title="Stripe — Pagamenti"
            icon="💳"
            ok={s?.stripe.configured ?? false}
            statusLabel={s?.stripe.configured ? (s.stripe.live ? 'Live' : 'Test') : 'Non configurato'}
            description="Checkout abbonamenti e prodotti marketplace."
            extraBadge={s?.stripe.configured && !s.stripe.live
              ? <span className="text-xs text-amber-600 font-medium">⚠ Usa chiavi live in produzione</span>
              : null}
            secrets={[
              { name: 'Stripe--SecretKey', value: 'sk_live_...' },
              { name: 'Stripe--WebhookSecret', value: 'whsec_...' },
              { name: 'Stripe--PublishableKey', value: 'pk_live_...' },
              { name: 'Stripe--SuccessUrl', value: 'https://admin.fitcore.io/marketplace?payment=success' },
              { name: 'Stripe--CancelUrl', value: 'https://admin.fitcore.io/marketplace?payment=cancelled' },
            ]}
            docsUrl="https://dashboard.stripe.com/apikeys"
          />

          {/* SendGrid */}
          <IntegrationCard
            title="SendGrid — Email"
            icon="📧"
            ok={s?.sendGrid.configured ?? false}
            statusLabel={s?.sendGrid.configured ? (s.sendGrid.enabled ? 'Attivo' : 'Configurato (disabilitato)') : 'Non configurato'}
            description="Email di benvenuto, notifiche abbonamento e documenti."
            extraBadge={s?.sendGrid.configured && !s.sendGrid.enabled
              ? <span className="text-xs text-amber-600 font-medium">⚠ Impostare Enabled: true</span>
              : null}
            secrets={[
              { name: 'Notifications--SendGrid--ApiKey', value: 'SG.xxx...' },
              { name: 'Notifications--SendGrid--FromEmail', value: 'noreply@tuapalestra.it' },
              { name: 'Notifications--SendGrid--Enabled', value: 'true' },
            ]}
            docsUrl="https://app.sendgrid.com/settings/api_keys"
          />

          {/* FCM */}
          <IntegrationCard
            title="Firebase — Push Notification"
            icon="🔔"
            ok={s?.fcm.configured ?? false}
            statusLabel={s?.fcm.configured ? (s.fcm.enabled ? 'Attivo' : 'Configurato (disabilitato)') : 'Non configurato'}
            description="Notifiche push sull'app membro e app staff."
            extraBadge={s?.fcm.configured && !s.fcm.enabled
              ? <span className="text-xs text-amber-600 font-medium">⚠ Impostare Enabled: true</span>
              : null}
            secrets={[
              { name: 'Notifications--Fcm--ServerKey', value: 'Dalla console Firebase → Project settings → Cloud Messaging' },
              { name: 'Notifications--Fcm--Enabled', value: 'true' },
            ]}
            docsUrl="https://console.firebase.google.com/"
          />

          {/* Azure Blob */}
          <IntegrationCard
            title="Azure Blob Storage — Media"
            icon="🗄️"
            ok={s?.azureBlob.configured ?? false}
            statusLabel={s?.azureBlob.configured ? 'Configurato' : 'Non configurato (locale)'}
            description="Foto soci, loghi palestra. In sviluppo usa storage locale."
            secrets={[
              { name: 'Storage--BlobConnectionString', value: 'DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net' },
              { name: 'Storage--BlobContainerName', value: 'fitcore-media' },
            ]}
            docsUrl="https://portal.azure.com/"
          />

          {/* Application Insights */}
          <IntegrationCard
            title="Application Insights — Telemetria"
            icon="📊"
            ok={s?.appInsights.configured ?? false}
            statusLabel={s?.appInsights.configured ? 'Configurato' : 'Non configurato'}
            description="Monitoraggio errori, performance e utilizzo in produzione."
            secrets={[
              { name: 'ApplicationInsights--ConnectionString', value: 'InstrumentationKey=xxx;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/' },
            ]}
            docsUrl="https://portal.azure.com/"
          />

          {/* Agora */}
          <IntegrationCard
            title="Agora.io — Live Streaming"
            icon="🔴"
            ok={s?.agora.configured ?? false}
            statusLabel={s?.agora.configured ? (s.agora.enabled ? 'Attivo' : 'Configurato (disabilitato)') : 'Non configurato'}
            description="Streaming live delle sessioni di gruppo verso i soci da remoto."
            extraBadge={s?.agora.configured && !s.agora.enabled
              ? <span className="text-xs text-amber-600 font-medium">⚠ Impostare Enabled: true</span>
              : null}
            secrets={[
              { name: 'Streaming--Agora--AppId', value: 'Dalla console Agora → Project Management → App ID' },
              { name: 'Streaming--Agora--AppCertificate', value: 'Dalla console Agora → Project Management → App Certificate' },
              { name: 'Streaming--Agora--Enabled', value: 'true' },
            ]}
            docsUrl="https://console.agora.io/"
          />

          {/* YouSign */}
          <IntegrationCard
            title="YouSign v3 — Firma Digitale"
            icon="✍️"
            ok={s?.youSign.configured ?? false}
            statusLabel={s?.youSign.configured ? (s.youSign.enabled ? 'Attivo' : 'Configurato (disabilitato)') : 'Non configurato'}
            description="Contratti digitali con firma elettronica qualificata (QES/AES) per i soci."
            extraBadge={s?.youSign.configured && !s.youSign.enabled
              ? <span className="text-xs text-amber-600 font-medium">⚠ Impostare Enabled: true</span>
              : null}
            secrets={[
              { name: 'Contracts--YouSign--ApiKey', value: 'Dalla dashboard YouSign → API Keys' },
              { name: 'Contracts--YouSign--BaseUrl', value: 'https://api.yousign.app/v3 (staging: https://api-staging.yousign.app/v3)' },
              { name: 'Contracts--YouSign--Enabled', value: 'true' },
            ]}
            docsUrl="https://developers.yousign.com/docs/quick-start"
          />

          {/* Technogym */}
          <IntegrationCard
            title="Technogym Mywellness"
            icon="🏋️"
            ok={s?.technogym?.configured ?? false}
            statusLabel={s?.technogym?.configured ? (s.technogym.enabled ? 'Attivo' : 'Configurato (disabilitato)') : 'Non configurato'}
            description="Sincronizzazione attrezzature e sessioni dall'ecosistema Mywellness (OAuth2)."
            secrets={[
              { name: 'Technogym--Mywellness--ClientId', value: 'Dal portale Technogym Developer' },
              { name: 'Technogym--Mywellness--ClientSecret', value: 'Dal portale Technogym Developer' },
              { name: 'Technogym--Mywellness--GymId', value: 'ID palestra nell\'ecosistema Mywellness' },
              { name: 'Technogym--Mywellness--Enabled', value: 'true' },
            ]}
          />

          {/* Life Fitness */}
          <IntegrationCard
            title="Life Fitness LFopen"
            icon="🚴"
            ok={s?.lifeFitness?.configured ?? false}
            statusLabel={s?.lifeFitness?.configured ? (s.lifeFitness.enabled ? 'Attivo' : 'Configurato (disabilitato)') : 'Non configurato'}
            description="Sincronizzazione attrezzature Life Fitness tramite API Key LFopen."
            secrets={[
              { name: 'LifeFitness--LFopen--ApiKey', value: 'Dal portale Life Fitness Developer' },
              { name: 'LifeFitness--LFopen--GymId', value: 'ID palestra nel sistema LFopen' },
              { name: 'LifeFitness--LFopen--Enabled', value: 'true' },
            ]}
          />

          {/* Azure Computer Vision */}
          <IntegrationCard
            title="Azure Computer Vision — Analisi Postura"
            icon="🧠"
            ok={s?.azureCv?.configured ?? false}
            statusLabel={s?.azureCv?.configured ? (s.azureCv.enabled ? 'Attivo' : 'Configurato (disabilitato)') : 'Non configurato'}
            description="Analisi posturale AI da foto tramite Azure CV 4.0 people detection."
            secrets={[
              { name: 'ComputerVision--Azure--Endpoint', value: 'https://<nome>.cognitiveservices.azure.com/' },
              { name: 'ComputerVision--Azure--ApiKey', value: 'Dal portale Azure → risorsa Computer Vision → Keys' },
              { name: 'ComputerVision--Azure--Enabled', value: 'true' },
            ]}
            docsUrl="https://portal.azure.com/"
          />
        </div>
      )}

      {/* Key Vault naming convention reminder */}
      <Card className="p-5 bg-slate-50 border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">📋 Convenzione nomi Key Vault</h3>
        <p className="text-xs text-slate-500 mb-3">
          Key Vault non supporta i due punti (<code>:</code>) nei nomi dei segreti.
          Oplyfit usa il doppio trattino (<code>--</code>) come separatore, che ASP.NET Core converte automaticamente.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="rounded bg-red-50 px-3 py-2 text-red-600">Stripe:SecretKey ✗</div>
          <div className="rounded bg-emerald-50 px-3 py-2 text-emerald-700">Stripe--SecretKey ✓</div>
        </div>
      </Card>
    </div>
  )
}
