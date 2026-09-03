import { useState, useCallback, useRef, useEffect } from 'react'

interface SearchSelectProps<T> {
  label: string
  required?: boolean
  selected: T | null
  onSelect: (item: T) => void
  onClear: () => void
  renderName: (item: T) => string
  renderMeta: (item: T) => string
  onSearch: (q: string) => Promise<T[]>
  placeholder?: string
  minChars?: number
}

export function SearchSelect<T>({
  label, required, selected, onSelect, onClear,
  renderName, renderMeta, onSearch, placeholder = 'Type to search...', minChars = 2
}: SearchSelectProps<T>) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(async (q: string) => {
    if (q.length < minChars && minChars > 0) { setResults([]); setOpen(false); return }
    setLoading(true); setError(null)
    try {
      const data = await onSearch(q)
      setResults(data)
      setOpen(true)
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }, [onSearch, minChars])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => runSearch(q), 300)
  }

  const pick = (item: T) => {
    onSelect(item)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="form-group" ref={containerRef}>
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>

      {selected ? (
        <div className="selected-chip">
          <div className="chip-info">
            <div className="chip-name">{renderName(selected)}</div>
            <div className="chip-meta">{renderMeta(selected)}</div>
          </div>
          <button className="chip-clear" onClick={onClear} title="Remove">✕</button>
        </div>
      ) : (
        <>
          <div className="search-box">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="form-input"
              value={query}
              onChange={handleChange}
              onFocus={() => { if (minChars === 0 && results.length === 0) runSearch('') }}
              placeholder={placeholder}
            />
          </div>
          {loading && <div className="text-sm text-muted mt-2">Searching…</div>}
          {error && <div className="text-sm" style={{ color: '#dc2626', marginTop: 4 }}>{error}</div>}
          {open && results.length > 0 && (
            <div className="search-results">
              {results.map((item, i) => (
                <div
                  key={i}
                  className="search-result-item"
                  onMouseDown={() => pick(item)}
                >
                  <div className="result-name">{renderName(item)}</div>
                  <div className="result-meta">{renderMeta(item)}</div>
                </div>
              ))}
            </div>
          )}
          {open && results.length === 0 && !loading && (
            <div className="text-sm text-muted mt-2">No results found</div>
          )}
        </>
      )}
    </div>
  )
}
