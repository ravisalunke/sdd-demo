import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { AuthorizationSummary } from '../types'
import { STATUS_COLORS, STATUS_BG } from '../types'

export default function DashboardPage() {
  const [authorizations, setAuthorizations] = useState<AuthorizationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.authorizations.getAll(statusFilter || undefined)
      setAuthorizations(data)
    } catch {
      setError('Failed to load authorizations. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const statuses = ['', 'PENDING', 'IN_REVIEW', 'APPROVED', 'DENIED', 'CANCELLED']

  return (
    <>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Prior Authorization Requests</h1>
          <p className="page-sub">Review and manage all authorization requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>
          + New Request
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            All Requests {authorizations.length > 0 && `(${authorizations.length})`}
          </span>
          <div className="flex gap-2">
            <select
              className="form-select"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s || 'All Statuses'}</option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
          </div>
        </div>

        {error && <div className="card-body"><div className="error-msg">{error}</div></div>}

        {loading ? (
          <div className="loading">Loading…</div>
        ) : authorizations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No authorizations found</h3>
            <p>
              {statusFilter
                ? `No ${statusFilter} requests.`
                : 'Create your first prior authorization request to get started.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference #</th>
                  <th>Member</th>
                  <th>Provider</th>
                  <th>Health Plan</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {authorizations.map(a => (
                  <tr
                    key={a.authorizationId}
                    className="row-link"
                    onClick={() => navigate(`/authorization/${a.authorizationId}`)}
                  >
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e40af' }}>
                        {a.referenceNumber}
                      </span>
                    </td>
                    <td>{a.memberName ?? '—'}</td>
                    <td>{a.providerName ?? '—'}</td>
                    <td>{a.healthPlanName ?? '—'}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {a.primaryDiagnosis ?? '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          color: STATUS_COLORS[a.status] ?? '#374151',
                          background: STATUS_BG[a.status] ?? '#f3f4f6',
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
