import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronRight, FiMail, FiSave, FiSearch, FiSend } from 'react-icons/fi'
import {
  apiAdminMailTemplates,
  apiPreviewAdminMailTemplate,
  apiTestAdminMailTemplate,
  apiUpdateAdminMailTemplates,
  type ApiMailTemplateRecord,
  type ApiMailTemplatesState,
} from '../api'
import { applyMailPlaceholders, buildMailPlaceholderMap } from '../mailPlaceholders'

type TemplateDraft = {
  enabled: boolean
  subject: string
  bodyHtml: string
}

function toDraftMap(templates: ApiMailTemplateRecord[]) {
  return Object.fromEntries(
    templates.map((template) => [
      template.id,
      {
        enabled: template.enabled,
        subject: template.subject,
        bodyHtml: template.bodyHtml ?? '',
      },
    ]),
  ) as Record<string, TemplateDraft>
}

function audienceGroupLabel(audience: ApiMailTemplateRecord['audience']) {
  if (audience === 'admin') return 'Beheerder'
  if (audience === 'account') return 'Account'
  return 'Klant'
}

function MailTemplateAccordion({
  template,
  draft,
  token,
  open,
  onToggle,
  onDraftChange,
  onSave,
  onTest,
  isSaving,
  isTesting,
  testRecipient,
  onTestRecipientChange,
}: {
  template: ApiMailTemplateRecord
  draft: TemplateDraft
  token: string
  open: boolean
  onToggle: () => void
  onDraftChange: (next: TemplateDraft) => void
  onSave: () => void
  onTest: () => void
  isSaving: boolean
  isTesting: boolean
  testRecipient: string
  onTestRecipientChange: (value: string) => void
}) {
  const placeholders = useMemo(() => buildMailPlaceholderMap(), [])
  const previewSubject = useMemo(
    () => applyMailPlaceholders(draft.subject || template.defaultSubject, placeholders),
    [draft.subject, placeholders, template.defaultSubject],
  )
  const previewBodySnippet = useMemo(
    () => applyMailPlaceholders(draft.bodyHtml || template.defaultBodyHtml || '<p>Geen inhoud</p>', placeholders),
    [draft.bodyHtml, placeholders, template.defaultBodyHtml],
  )
  const [previewHtml, setPreviewHtml] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsPreviewLoading(true)
      void apiPreviewAdminMailTemplate(token, template.id, {
        subject: draft.subject,
        bodyHtml: draft.bodyHtml,
      })
        .then((result) => {
          if (!cancelled) {
            setPreviewHtml(result.html)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPreviewHtml(previewBodySnippet)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsPreviewLoading(false)
          }
        })
    }, 320)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [draft.bodyHtml, draft.subject, open, previewBodySnippet, template.id, token])

  const insertPlaceholder = (placeholder: string) => {
    onDraftChange({
      ...draft,
      bodyHtml: `${draft.bodyHtml}${draft.bodyHtml ? '\n' : ''}${placeholder}`,
    })
  }

  return (
    <div
      style={{
        border: '1px solid rgba(90,70,58,0.14)',
        borderRadius: 4,
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          border: 'none',
          background: open ? 'rgba(254,246,235,0.65)' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: '#2b1f1a',
        }}
      >
        <FiChevronRight
          aria-hidden
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        <FiMail aria-hidden style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block' }}>{template.label}</strong>
          <span className="admin-muted" style={{ fontSize: 13 }}>
            {template.triggerLabel} · {template.audienceLabel}
          </span>
        </div>
        <span className={draft.enabled ? 'success-badge' : 'success-badge is-warning'}>
          {draft.enabled ? 'Actief' : 'Uit'}
        </span>
      </button>

      {open ? (
        <div style={{ padding: '16px 18px 18px', borderTop: '1px solid rgba(90,70,58,0.1)' }}>
          <div className="admin-mail-editor-grid">
            <div style={{ display: 'grid', gap: 14 }}>
              <p className="admin-muted" style={{ margin: 0 }}>
                {template.description}
              </p>

              <label className="product-admin-checkbox">
                <span>Deze mail versturen</span>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) => onDraftChange({ ...draft, enabled: event.target.checked })}
                />
              </label>

              <label className="form-field-wide">
                Onderwerp
                <input
                  value={draft.subject}
                  onChange={(event) => onDraftChange({ ...draft, subject: event.target.value })}
                  placeholder={template.defaultSubject}
                />
              </label>

              <label className="form-field-wide admin-mail-html-field">
                HTML inhoud
                <textarea
                  rows={14}
                  value={draft.bodyHtml}
                  onChange={(event) => onDraftChange({ ...draft, bodyHtml: event.target.value })}
                  placeholder={template.defaultBodyHtml || '<p>Gebruik HTML met shortcodes zoals {customer_name}</p>'}
                  spellCheck={false}
                />
              </label>

              <div className="admin-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onDraftChange({ ...draft, bodyHtml: template.defaultBodyHtml ?? '' })}
                >
                  Standaard HTML laden
                </button>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(43,31,26,0.5)' }}>
                  Shortcodes
                </span>
                <div className="admin-mail-placeholder-list">
                  {template.placeholders.map((placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      className="admin-mail-placeholder-chip"
                      onClick={() => insertPlaceholder(placeholder)}
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>
              </div>

              {template.audience === 'customer' || template.audience === 'account' ? (
                <label className="form-field-wide">
                  Testmail naar
                  <input
                    value={testRecipient}
                    onChange={(event) => onTestRecipientChange(event.target.value)}
                    placeholder="jouw@email.nl"
                  />
                </label>
              ) : (
                <p className="admin-muted" style={{ margin: 0, fontSize: 13 }}>
                  Adminmails gaan naar de ontvangers die je bij Integraties → Mailrelay hebt ingesteld.
                </p>
              )}

              <div className="admin-actions-row">
                <button type="button" className="btn btn-primary" disabled={isSaving} onClick={onSave}>
                  <FiSave aria-hidden="true" />
                  {isSaving ? 'Opslaan...' : 'Template opslaan'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isTesting || ((template.audience === 'customer' || template.audience === 'account') && !testRecipient.trim())}
                  onClick={onTest}
                >
                  <FiSend aria-hidden="true" />
                  {isTesting ? 'Versturen...' : 'Testmail sturen'}
                </button>
              </div>
            </div>

            <aside className="admin-mail-preview-panel" aria-live="polite">
              <div>
                <p className="product-label" style={{ margin: 0 }}>
                  Live preview
                </p>
                <span className="admin-muted" style={{ fontSize: 13 }}>
                  Shortcodes worden ingevuld met voorbeelddata.
                </span>
              </div>
              <p className="admin-mail-preview-subject">{previewSubject}</p>
              {isPreviewLoading ? <p className="admin-muted">Preview laden...</p> : null}
              <iframe
                title={`Preview ${template.label}`}
                className="admin-mail-preview-frame"
                sandbox=""
                srcDoc={previewHtml || previewBodySnippet}
              />
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AdminMailTemplatesScreen({ token }: { token: string }) {
  const [state, setState] = useState<ApiMailTemplatesState | null>(null)
  const [drafts, setDrafts] = useState<Record<string, TemplateDraft>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [testRecipient, setTestRecipient] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void apiAdminMailTemplates(token)
      .then((result) => {
        if (cancelled) {
          return
        }

        setState(result)
        setDrafts(toDraftMap(result.templates))
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Mailtemplates konden niet worden geladen.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!state || !query) {
      return state?.templates ?? []
    }

    return state.templates.filter((template) =>
      [template.label, template.description, template.triggerLabel, template.audienceLabel, template.subject]
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [search, state])

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ApiMailTemplateRecord[]> = {
      Klant: [],
      Beheerder: [],
      Account: [],
    }

    for (const template of filteredTemplates) {
      groups[audienceGroupLabel(template.audience)].push(template)
    }

    return groups
  }, [filteredTemplates])

  const handleSave = async (templateId: string) => {
    const draft = drafts[templateId]
    if (!draft) {
      return
    }

    setSavingId(templateId)
    setError('')
    setMessage('')

    try {
      const result = await apiUpdateAdminMailTemplates(token, {
        [templateId]: {
          enabled: draft.enabled,
          subject: draft.subject.trim() || undefined,
          bodyHtml: draft.bodyHtml.trim() || undefined,
        },
      })
      setState(result)
      setDrafts(toDraftMap(result.templates))
      setMessage('Mailtemplate opgeslagen.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Opslaan mislukt.')
    } finally {
      setSavingId(null)
    }
  }

  const handleTest = async (templateId: string) => {
    setTestingId(templateId)
    setError('')
    setMessage('')

    try {
      const result = await apiTestAdminMailTemplate(token, templateId, testRecipient.trim())
      setMessage(`Testmail verstuurd naar ${result.recipient}.`)
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Testmail kon niet worden verstuurd.')
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="admin-page-grid">
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="product-label">E-mails</p>
            <h2>Automatische mails per status — net als WooCommerce templates.</h2>
          </div>
        </div>

        <p className="admin-muted">
          Zet per trigger aan of uit welke mail wordt verstuurd. Pas het onderwerp aan met shortcodes. SMTP-instellingen blijven onder{' '}
          <Link to="/admin/integrations">Integraties → Mailrelay</Link>.
        </p>

        <div
          style={{
            display: 'grid',
            gap: 10,
            marginTop: 16,
            padding: '14px 16px',
            borderRadius: 4,
            border: '1px solid rgba(90,70,58,0.12)',
            background: 'rgba(254,246,235,0.45)',
          }}
        >
          <strong>Mailrelay status</strong>
          <span className="admin-muted">
            {state?.mailRelayEnabled
              ? state.mailRelayLastTestAt
                ? `Laatste test ${new Date(state.mailRelayLastTestAt).toLocaleString('nl-NL')} · ${state.mailRelayLastStatus === 'success' ? 'Werkend' : 'Controleer instellingen'}`
                : 'Actief, maar nog niet getest'
              : 'Mailrelay staat uit — mails worden pas verstuurd na configuratie onder Integraties.'}
          </span>
        </div>

        <label className="admin-search-field" style={{ marginTop: 16 }}>
          <FiSearch aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op template, trigger of onderwerp" />
        </label>

        {error ? <div className="payment-feedback payment-feedback-error">{error}</div> : null}
        {message ? <div className="payment-feedback payment-feedback-success">{message}</div> : null}
        {isLoading ? <p className="admin-muted">Mailtemplates laden...</p> : null}

        {!isLoading && state ? (
          <div style={{ display: 'grid', gap: 24, marginTop: 18 }}>
            {Object.entries(groupedTemplates).map(([groupLabel, templates]) =>
              templates.length ? (
                <div key={groupLabel} style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <p className="product-label">{groupLabel}</p>
                    <h3 style={{ margin: '4px 0 0' }}>
                      {groupLabel === 'Klant'
                        ? 'Order- en betaalupdates naar klanten'
                        : groupLabel === 'Beheerder'
                          ? 'Interne meldingen voor de winkel'
                          : 'Account en wachtwoord'}
                    </h3>
                  </div>

                  {templates.map((template) => (
                    <MailTemplateAccordion
                      key={template.id}
                      template={template}
                      token={token}
                      draft={drafts[template.id] ?? { enabled: template.enabled, subject: template.subject, bodyHtml: template.bodyHtml ?? '' }}
                      open={openId === template.id}
                      onToggle={() => setOpenId((current) => (current === template.id ? null : template.id))}
                      onDraftChange={(next) =>
                        setDrafts((current) => ({
                          ...current,
                          [template.id]: next,
                        }))
                      }
                      onSave={() => void handleSave(template.id)}
                      onTest={() => void handleTest(template.id)}
                      isSaving={savingId === template.id}
                      isTesting={testingId === template.id}
                      testRecipient={testRecipient}
                      onTestRecipientChange={setTestRecipient}
                    />
                  ))}
                </div>
              ) : null,
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}
