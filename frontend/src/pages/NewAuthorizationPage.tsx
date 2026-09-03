import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { SearchSelect } from '../components/SearchSelect'
import type {
  WizardState, Member, Provider, HealthPlan,
  Site, DiagnosisCode, ProcedureCode
} from '../types'
import { PROGRAMS } from '../types'

const STEPS = [
  { num: 1, label: 'Program' },
  { num: 2, label: 'Provider' },
  { num: 3, label: 'Health Plan' },
  { num: 4, label: 'Member' },
  { num: 5, label: 'Diagnosis & CPT' },
  { num: 6, label: 'Site & Review' },
]

const emptyState = (): WizardState => ({
  program: '',
  provider: null,
  healthPlan: null,
  member: null,
  diagnoses: [],
  primaryDiagnosis: '',
  procedures: [],
  site: null,
  notes: '',
})

export default function NewAuthorizationPage() {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(emptyState())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([])
  const [healthPlansLoaded, setHealthPlansLoaded] = useState(false)
  const navigate = useNavigate()

  // Procedure multi-select search state
  const [procQuery, setProcQuery] = useState('')
  const [procResults, setProcResults] = useState<ProcedureCode[]>([])

  const loadHealthPlans = async () => {
    if (healthPlansLoaded) return
    const data = await api.healthPlans.getAll()
    setHealthPlans(data)
    setHealthPlansLoaded(true)
  }

  const canProceed = (): boolean => {
    if (step === 1) return state.program !== ''
    if (step === 2) return state.provider !== null
    if (step === 3) return state.healthPlan !== null
    if (step === 4) return state.member !== null
    if (step === 5) return state.diagnoses.length > 0 && state.procedures.length > 0 && state.primaryDiagnosis !== ''
    if (step === 6) return state.site !== null
    return false
  }

  const next = () => {
    if (step === 2 && !healthPlansLoaded) loadHealthPlans()
    setStep(s => Math.min(s + 1, STEPS.length))
  }
  const back = () => setStep(s => Math.max(s - 1, 1))

  const removeDiagnosis = (code: string) => {
    setState(s => {
      const remaining = s.diagnoses.filter(d => d.code !== code)
      return {
        ...s,
        diagnoses: remaining,
        primaryDiagnosis: s.primaryDiagnosis === code
          ? (remaining[0]?.code ?? '')
          : s.primaryDiagnosis
      }
    })
  }

  const removeProcedure = (code: string) => {
    setState(s => ({ ...s, procedures: s.procedures.filter(p => p.code !== code) }))
  }

  const searchProcs = async (q: string) => {
    const data = await api.procedureCodes.search(q)
    setProcResults(data)
  }

  const addProcedure = (p: ProcedureCode) => {
    if (state.procedures.find(x => x.code === p.code)) return
    setState(s => ({ ...s, procedures: [...s.procedures, { code: p.code, quantity: 1 }] }))
    setProcQuery('')
    setProcResults([])
  }

  const submit = async () => {
    if (!state.provider || !state.healthPlan || !state.member || !state.site) return
    setSubmitting(true); setError(null)
    try {
      const result = await api.authorizations.create({
        program: state.program || null,
        patientId: state.member.patientId,
        physicianId: state.provider.physicianId,
        healthPlanId: state.healthPlan.healthPlanId,
        siteId: state.site.siteId,
        primaryDiagnosis: state.primaryDiagnosis,
        diagnosisCodes: state.diagnoses.map(d => d.code),
        procedures: state.procedures,
        notes: state.notes || null,
      })
      setSubmitted(result.referenceNumber)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: '48px auto' }}>
        <div className="card-body success-screen">
          <div className="success-icon">✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
            Authorization Submitted
          </h2>
          <p className="text-muted mt-2">Your prior authorization request has been created.</p>
          <div className="success-ref">{submitted}</div>
          <p className="text-sm text-muted">Reference Number</p>
          <div className="flex gap-3 mt-6" style={{ justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => { setState(emptyState()); setStep(1); setSubmitted(null) }}>
              New Request
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Prior Authorization Request</h1>
        <p className="page-sub">Complete all steps to submit the request</p>
      </div>

      {/* Step indicator */}
      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s.num} className="wizard-step">
            <div className={`step-circle ${step > s.num ? 'done' : step === s.num ? 'active' : ''}`}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span className={`step-label ${step === s.num ? 'active' : step > s.num ? 'done' : ''}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`step-connector ${step > s.num ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <div className="card-header">
          <span className="card-title">Step {step}: {STEPS[step - 1].label}</span>
        </div>
        <div className="card-body">
          {error && <div className="error-msg">{error}</div>}

          {/* Step 1 — Program */}
          {step === 1 && (
            <div className="form-group">
              <label className="form-label">Program <span className="required">*</span></label>
              <select
                className="form-select"
                value={state.program}
                onChange={e => setState(s => ({ ...s, program: e.target.value }))}
              >
                <option value="">Select a program…</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {/* Step 2 — Provider */}
          {step === 2 && (
            <SearchSelect<Provider>
              label="Requesting Provider"
              required
              selected={state.provider}
              onSelect={p => setState(s => ({ ...s, provider: p }))}
              onClear={() => setState(s => ({ ...s, provider: null }))}
              renderName={p => p.fullName}
              renderMeta={p => [p.specialty1, p.npi ? `NPI: ${p.npi}` : null, p.city, p.state]
                .filter(Boolean).join(' · ')}
              onSearch={api.providers.search}
              placeholder="Click here to see all providers, or type to search (e.g., 'Anderson', 'Wilson')"
              minChars={0}
            />
          )}
          {step === 2 && (
            <div className="text-muted text-sm mt-1" style={{ fontSize: '12px', color: '#6b7280' }}>
              💡 Tip: Click the search box to see all 5 providers, or search by doctor name
            </div>
          )}

          {/* Step 3 — Health Plan */}
          {step === 3 && (
            <div className="form-group">
              <label className="form-label">Health Plan <span className="required">*</span></label>
              {!healthPlansLoaded ? (
                <div className="text-muted text-sm">Loading plans…</div>
              ) : (
                <div className="search-results" style={{ marginTop: 0 }}>
                  {healthPlans.map(hp => (
                    <div
                      key={hp.healthPlanId}
                      className={`search-result-item ${state.healthPlan?.healthPlanId === hp.healthPlanId ? 'selected' : ''}`}
                      onClick={() => setState(s => ({ ...s, healthPlan: hp }))}
                    >
                      <div className="result-name">{hp.name}</div>
                      <div className="result-meta">
                        {[hp.lineOfBusiness, hp.planType, hp.planCode].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Member */}
          {step === 4 && (
            <SearchSelect<Member>
              label="Member / Patient"
              required
              selected={state.member}
              onSelect={m => setState(s => ({ ...s, member: m }))}
              onClear={() => setState(s => ({ ...s, member: null }))}
              renderName={m => m.fullName}
              renderMeta={m => [
                m.dateOfBirth ? `DOB: ${m.dateOfBirth}` : null,
                m.memberCode ? `Member: ${m.memberCode}` : null,
                m.planCode,
                m.city, m.state
              ].filter(Boolean).join(' · ')}
              onSearch={api.members.search}
              placeholder="Search by member name…"
            />
          )}

          {/* Step 5 — Diagnosis + CPT */}
          {step === 5 && (
            <>
              <SearchSelect<DiagnosisCode>
                label="Diagnosis Codes (ICD-10)"
                required
                selected={null}
                onSelect={d => {
                  if (state.diagnoses.find(x => x.code === d.code)) return
                  setState(s => ({
                    ...s,
                    diagnoses: [...s.diagnoses, d],
                    primaryDiagnosis: s.primaryDiagnosis || d.code
                  }))
                }}
                onClear={() => {}}
                renderName={d => `${d.code} — ${d.description}`}
                renderMeta={() => ''}
                onSearch={api.diagnosisCodes.search}
                placeholder="Click here to see all codes, or type to search (e.g., 'knee', 'diabetes')"
                minChars={0}
              />
              <div className="text-muted text-sm mt-1 mb-3" style={{ fontSize: '12px', color: '#6b7280' }}>
                💡 Tip: Click the search box to see all diagnosis codes, or search by condition name
              </div>
              {state.diagnoses.length > 0 && (
                <div className="mb-4">
                  <div className="tag-list">
                    {state.diagnoses.map(d => (
                      <span key={d.code} className="tag">
                        {d.code}
                        <button className="tag-remove" onClick={() => removeDiagnosis(d.code)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="form-group mt-2">
                    <label className="form-label">
                      Primary Diagnosis <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={state.primaryDiagnosis}
                      onChange={e => setState(s => ({ ...s, primaryDiagnosis: e.target.value }))}
                    >
                      {state.diagnoses.map(d => (
                        <option key={d.code} value={d.code}>{d.code} — {d.description}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="divider" />

              <div className="form-group">
                <label className="form-label">
                  Procedure Codes (CPT) <span className="required">*</span>
                </label>
                <div className="search-box">
                  <span className="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </span>
                  <input
                    className="form-input"
                    value={procQuery}
                    onChange={e => { setProcQuery(e.target.value); searchProcs(e.target.value) }}
                    onFocus={() => { if (procResults.length === 0) searchProcs('') }}
                    placeholder="Click here to see all codes, or type to search (e.g., 'office visit', 'MRI')"
                  />
                </div>
                <div className="text-muted text-sm mt-1" style={{ fontSize: '12px', color: '#6b7280' }}>
                  💡 Tip: Click the search box to see all procedure codes, or search by procedure name
                </div>
                {procResults.length > 0 && (
                  <div className="search-results">
                    {procResults.map(p => (
                      <div key={p.code} className="search-result-item" onMouseDown={() => addProcedure(p)}>
                        <div className="result-name">{p.code}</div>
                        <div className="result-meta">{p.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {state.procedures.length > 0 && (
                <div>
                  {state.procedures.map(p => (
                    <div key={p.code} className="flex items-center gap-3 mb-2">
                      <span className="tag" style={{ flexShrink: 0 }}>{p.code}</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 80 }}
                        min={1}
                        value={p.quantity}
                        onChange={e => setState(s => ({
                          ...s,
                          procedures: s.procedures.map(x =>
                            x.code === p.code ? { ...x, quantity: Number(e.target.value) } : x
                          )
                        }))}
                      />
                      <span className="text-sm text-muted">qty</span>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#dc2626' }}
                        onClick={() => removeProcedure(p.code)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 6 — Site + Review */}
          {step === 6 && (
            <>
              <SearchSelect<Site>
                label="Service Site"
                required
                selected={state.site}
                onSelect={s => setState(st => ({ ...st, site: s }))}
                onClear={() => setState(s => ({ ...s, site: null }))}
                renderName={s => s.name}
                renderMeta={s => [
                  s.specialty1,
                  s.participating ? 'Participating' : 'Non-Participating',
                  s.city, s.state
                ].filter(Boolean).join(' · ')}
                onSearch={api.sites.search}
                placeholder="Click here to see all sites, or type to search (e.g., 'Medical', 'Valley')"
                minChars={0}
              />
              <div className="text-muted text-sm mt-1 mb-3" style={{ fontSize: '12px', color: '#6b7280' }}>
                💡 Tip: Click the search box to see all service sites, or search by facility name
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-textarea"
                  value={state.notes}
                  onChange={e => setState(s => ({ ...s, notes: e.target.value }))}
                  placeholder="Clinical notes, special instructions…"
                />
              </div>

              <div className="divider" />

              {/* Summary */}
              <div style={{ fontSize: 13, color: '#374151' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12, color: '#111827' }}>Request Summary</h4>
                <div className="summary-box">
                  <h4>Program</h4>
                  <p>{state.program || '—'}</p>
                </div>
                <div className="summary-box">
                  <h4>Member</h4>
                  <p>{state.member?.fullName} · {state.member?.memberCode} · {state.member?.planCode}</p>
                </div>
                <div className="summary-box">
                  <h4>Provider</h4>
                  <p>{state.provider?.fullName} · NPI: {state.provider?.npi}</p>
                </div>
                <div className="summary-box">
                  <h4>Health Plan</h4>
                  <p>{state.healthPlan?.name} ({state.healthPlan?.planType})</p>
                </div>
                <div className="summary-box">
                  <h4>Diagnoses</h4>
                  <p>{state.diagnoses.map(d => d.code).join(', ')} · Primary: {state.primaryDiagnosis}</p>
                </div>
                <div className="summary-box">
                  <h4>Procedures (CPT)</h4>
                  <p>{state.procedures.map(p => `${p.code} ×${p.quantity}`).join(', ')}</p>
                </div>
                <div className="summary-box">
                  <h4>Service Site</h4>
                  <p>{state.site?.name} · {state.site?.participating ? '✓ Participating' : '✗ Non-Participating'}</p>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              className="btn btn-secondary"
              onClick={back}
              disabled={step === 1}
            >
              ← Back
            </button>
            {step < STEPS.length ? (
              <button
                className="btn btn-primary"
                onClick={next}
                disabled={!canProceed()}
              >
                Continue →
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={submit}
                disabled={!canProceed() || submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Authorization'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
