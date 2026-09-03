import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { AuthorizationDetail } from '../types'
import { STATUS_COLORS, STATUS_BG } from '../types'

export default function AuthorizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [auth, setAuth] = useState<AuthorizationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!id) return
    api.authorizations.getById(Number(id))
      .then(setAuth)
      .catch(() => setError('Failed to load authorization'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    if (!auth) return
    setUpdatingStatus(true)
    try {
      await api.authorizations.updateStatus(auth.authorizationId, newStatus)
      setAuth({ ...auth, status: newStatus })
    } catch {
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) return <div className="loading">Loading…</div>
  if (error) return <div className="card card-body"><div className="error-msg">{error}</div></div>
  if (!auth) return null

  const statuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'DENIED', 'CANCELLED']

  return (
    <>
      <div className="page-header flex justify-between items-center">
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </button>
          <h1 className="page-title">
            Authorization&nbsp;
            <span style={{ fontFamily: 'monospace', color: '#1e40af' }}>
              {auth.referenceNumber}
            </span>
          </h1>
          <p className="page-sub">
            Created {new Date(auth.createdAt).toLocaleString()}
            {auth.program && ` · ${auth.program}`}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span
            className="badge"
            style={{
              color: STATUS_COLORS[auth.status] ?? '#374151',
              background: STATUS_BG[auth.status] ?? '#f3f4f6',
              fontSize: 12,
              padding: '4px 12px'
            }}
          >
            {auth.status}
          </span>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={auth.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={updatingStatus}
          >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="detail-grid">
        {/* Member */}
        <div className="card">
          <div className="card-header"><span className="card-title">Member</span></div>
          <div className="card-body">
            {auth.member ? (
              <>
                <div className="detail-row">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{auth.member.fullName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Patient ID</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {auth.member.patientId}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">DOB</span>
                  <span className="detail-value">{auth.member.dateOfBirth ?? '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{auth.member.phone ?? '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plan Code</span>
                  <span className="detail-value">{auth.member.planCode ?? '—'}</span>
                </div>
              </>
            ) : <p className="text-muted">No member data</p>}
          </div>
        </div>

        {/* Provider */}
        <div className="card">
          <div className="card-header"><span className="card-title">Requesting Provider</span></div>
          <div className="card-body">
            {auth.provider ? (
              <>
                <div className="detail-row">
                  <span className="detail-label">Name</span>
                  <span className="detail-value">{auth.provider.fullName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">NPI</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {auth.provider.npi ?? '—'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Specialty</span>
                  <span className="detail-value">{auth.provider.specialty1 ?? '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">
                    {[auth.provider.city, auth.provider.state].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>
              </>
            ) : <p className="text-muted">No provider data</p>}
          </div>
        </div>

        {/* Health Plan */}
        <div className="card">
          <div className="card-header"><span className="card-title">Health Plan</span></div>
          <div className="card-body">
            {auth.healthPlan ? (
              <>
                <div className="detail-row">
                  <span className="detail-label">Plan Name</span>
                  <span className="detail-value">{auth.healthPlan.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Line of Business</span>
                  <span className="detail-value">{auth.healthPlan.lineOfBusiness ?? '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plan Type</span>
                  <span className="detail-value">{auth.healthPlan.planType ?? '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plan Code</span>
                  <span className="detail-value">{auth.healthPlan.planCode ?? '—'}</span>
                </div>
              </>
            ) : <p className="text-muted">No health plan data</p>}
          </div>
        </div>

        {/* Site */}
        <div className="card">
          <div className="card-header"><span className="card-title">Service Site</span></div>
          <div className="card-body">
            {auth.site ? (
              <>
                <div className="detail-row">
                  <span className="detail-label">Site Name</span>
                  <span className="detail-value">{auth.site.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">NPI</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {auth.site.npi ?? '—'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Specialty</span>
                  <span className="detail-value">{auth.site.specialty1 ?? '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Participating</span>
                  <span className="detail-value">
                    {auth.site.participating
                      ? <span style={{ color: '#16a34a' }}>✓ Yes</span>
                      : <span style={{ color: '#dc2626' }}>✗ No</span>}
                  </span>
                </div>
              </>
            ) : <p className="text-muted">No site data</p>}
          </div>
        </div>
      </div>

      {/* Clinical */}
      <div className="card mt-4">
        <div className="card-header"><span className="card-title">Clinical Information</span></div>
        <div className="card-body">
          <div className="grid-2">
            <div>
              <h4 className="detail-section" style={{ fontSize: 12, fontWeight: 600, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Diagnoses
              </h4>
              {auth.diagnoses.length === 0 ? (
                <p className="text-muted">None</p>
              ) : (
                auth.diagnoses.map(d => (
                  <div key={d.code} className="detail-row">
                    <span className="detail-label" style={{ fontFamily: 'monospace' }}>{d.code}</span>
                    <span className="detail-value">{d.description}</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Procedures (CPT)
              </h4>
              {auth.procedures.length === 0 ? (
                <p className="text-muted">None</p>
              ) : (
                auth.procedures.map(p => (
                  <div key={p.code} className="detail-row">
                    <span className="detail-label" style={{ fontFamily: 'monospace' }}>{p.code}</span>
                    <span className="detail-value">{p.description} × {p.quantity}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          {auth.notes && (
            <>
              <div className="divider" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280',
                  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                  Notes
                </div>
                <p style={{ fontSize: 13, color: '#374151' }}>{auth.notes}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
