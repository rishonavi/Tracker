import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Banknote, Building2, Search, X } from 'lucide-react'
import { useData } from '../context/DataContext'
import { sumAmount } from '../lib/filters'
import { formatCurrency } from '../lib/format'
import { Button, Card, EmptyState, Spinner } from '../components/ui'
import PageHeader from '../components/PageHeader'
import IncomeTable from '../components/IncomeTable'
import Modal from '../components/Modal'
import IncomeForm from '../components/IncomeForm'

const EMPTY = { propertyId: '', from: '', to: '', q: '' }

export default function Income() {
  const { income, properties, loading, addIncome, updateIncome, deleteIncome, propertyNameById } = useData()
  const [filters, setFilters] = useState(EMPTY)
  const [modal, setModal] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      if (properties.length > 0) setModal({})
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, properties.length, setSearchParams])

  const filtered = useMemo(
    () =>
      income.filter((e) => {
        if (filters.propertyId && e.property_id !== filters.propertyId) return false
        if (filters.from && (e.date || '') < filters.from) return false
        if (filters.to && (e.date || '') > filters.to) return false
        if (filters.q) {
          const hay = `${e.source || ''} ${e.payer || ''} ${e.description || ''}`.toLowerCase()
          if (!hay.includes(filters.q.trim().toLowerCase())) return false
        }
        return true
      }),
    [income, filters],
  )
  const total = useMemo(() => sumAmount(filtered), [filtered])
  const active = filters.propertyId || filters.from || filters.to || filters.q
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (data) => {
    if (modal?.editing) await updateIncome(modal.editing.id, data)
    else await addIncome(data)
    setModal(null)
  }

  if (loading) return <Spinner />
  const noProperties = properties.length === 0

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="Income"
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}${active ? ' (filtered)' : ''} · ${formatCurrency(total)} received`}
        actions={
          <Button onClick={() => setModal({})} disabled={noProperties}>
            <Plus size={16} /> Add income
          </Button>
        }
      />

      {noProperties ? (
        <EmptyState
          icon={Building2}
          title="Add an asset first"
          subtitle="Income is tracked per asset, so create one before logging rent."
          action={
            <Link to="/properties" className="btn-primary">
              <Plus size={16} /> Add asset
            </Link>
          }
        />
      ) : (
        <>
          <Card className="p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12">
              <div className="relative lg:col-span-4">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="field-input pl-9" placeholder="Search source, payer, note…" value={filters.q} onChange={set('q')} />
              </div>
              <select className="field-input lg:col-span-4" value={filters.propertyId} onChange={set('propertyId')}>
                <option value="">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input type="date" className="field-input lg:col-span-2" value={filters.from} onChange={set('from')} title="From date" />
              <input type="date" className="field-input lg:col-span-2" value={filters.to} onChange={set('to')} title="To date" />
            </div>
            {active && (
              <button onClick={() => setFilters(EMPTY)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
                <X size={13} /> Clear filters
              </button>
            )}
          </Card>

          {income.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title="No income yet"
              subtitle="Log rent or other income to see it here."
              action={
                <Button onClick={() => setModal({})}>
                  <Plus size={16} /> Add income
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-sm text-slate-500">No income matches these filters.</Card>
          ) : (
            <IncomeTable income={filtered} propertyNameById={propertyNameById} onEdit={(e) => setModal({ editing: e })} onDelete={deleteIncome} />
          )}
        </>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.editing ? 'Edit income' : 'Add income'} maxWidth="max-w-3xl">
        {modal && (
          <IncomeForm
            initial={modal.editing}
            properties={properties}
            defaultPropertyId={filters.propertyId}
            onSubmit={onSubmit}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
