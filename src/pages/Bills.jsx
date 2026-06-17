import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Paperclip, Search, X, ExternalLink } from 'lucide-react'
import { useData } from '../context/DataContext'
import { formatCurrency, formatDate } from '../lib/format'
import { colorForCategory, colorForSource } from '../lib/constants'
import { iconForAssetType } from '../lib/assetIcon'
import { Card, EmptyState, Spinner, Badge } from '../components/ui'
import PageHeader from '../components/PageHeader'
import ReceiptViewer from '../components/ReceiptViewer'

export default function Bills() {
  const { expenses, income, properties, loading, propertyNameById } = useData()
  const [assetId, setAssetId] = useState('')
  const [q, setQ] = useState('')
  const [viewing, setViewing] = useState(null)

  const bills = useMemo(() => {
    const ex = expenses
      .filter((e) => e.receipt_url)
      .map((e) => ({ ...e, kind: 'expense', label: e.category, party: e.vendor }))
    const inc = income
      .filter((e) => e.receipt_url)
      .map((e) => ({ ...e, kind: 'income', label: e.source, party: e.payer }))
    let all = [...ex, ...inc]
    if (assetId) all = all.filter((b) => b.property_id === assetId)
    const s = q.trim().toLowerCase()
    if (s) {
      all = all.filter((b) =>
        `${b.label || ''} ${b.party || ''} ${propertyNameById(b.property_id) || ''}`.toLowerCase().includes(s),
      )
    }
    return all
  }, [expenses, income, assetId, q, propertyNameById])

  const groups = useMemo(() => {
    const m = new Map()
    for (const b of bills) {
      if (!m.has(b.property_id)) m.set(b.property_id, [])
      m.get(b.property_id).push(b)
    }
    return [...m.entries()]
      .map(([pid, list]) => ({
        pid,
        name: propertyNameById(pid) || 'Unknown asset',
        type: properties.find((p) => p.id === pid)?.type,
        list: list.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [bills, properties, propertyNameById])

  if (loading) return <Spinner />

  const active = assetId || q

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Bills"
        subtitle={`${bills.length} receipt${bills.length === 1 ? '' : 's'} attached, grouped by asset`}
      />

      <Card className="p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="field-input pl-9"
              placeholder="Search vendor, category, asset…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="field-input" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            <option value="">All assets</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {active && (
          <button
            onClick={() => {
              setAssetId('')
              setQ('')
            }}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <X size={13} /> Clear filters
          </button>
        )}
      </Card>

      {groups.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No bills yet"
          subtitle="Attach a receipt or bill photo when adding an expense or income, and it'll show up here grouped by asset."
          action={
            <Link to="/expenses/new" className="btn-primary">
              Add expense
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const Icon = iconForAssetType(g.type)
            return (
              <Card key={g.pid} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                  <Link to={`/properties/${g.pid}`} className="flex items-center gap-2 font-semibold text-slate-800 hover:text-brand">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-light text-brand">
                      <Icon size={16} />
                    </span>
                    {g.name}
                  </Link>
                  <span className="text-xs text-slate-400">
                    {g.list.length} bill{g.list.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {g.list.map((b) => (
                    <button
                      key={`${b.kind}-${b.id}`}
                      onClick={() => setViewing(b.receipt_url)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50/70"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                        <Paperclip size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge color={b.kind === 'income' ? colorForSource(b.label) : colorForCategory(b.label)}>
                            {b.label || (b.kind === 'income' ? 'Income' : 'Expense')}
                          </Badge>
                          <span className="text-xs text-slate-400">{formatDate(b.date)}</span>
                        </div>
                        <div className="mt-0.5 truncate text-sm text-slate-600">
                          {b.party || '—'} ·{' '}
                          <span className={b.kind === 'income' ? 'font-medium text-emerald-700' : 'font-medium text-slate-800'}>
                            {b.kind === 'income' ? '+' : ''}
                            {formatCurrency(b.amount)}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={15} className="shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {viewing && <ReceiptViewer stored={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
