import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { startOfMonth, format } from 'date-fns'
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Wallet, Receipt, CalendarDays, Banknote, Scale } from 'lucide-react'
import { useData } from '../context/DataContext'
import { formatCurrency, formatCompact } from '../lib/format'
import { colorForCategory } from '../lib/constants'
import { totalsByCategory, monthlySeries } from '../lib/stats'
import { sumAmount } from '../lib/filters'
import { iconForAssetType } from '../lib/assetIcon'
import { Card, Button, EmptyState, Spinner } from '../components/ui'
import BudgetBar from '../components/BudgetBar'
import ExpenseTable from '../components/ExpenseTable'
import Modal from '../components/Modal'
import ExpenseForm from '../components/ExpenseForm'
import PropertyForm from '../components/PropertyForm'
import IncomeTable from '../components/IncomeTable'
import IncomeForm from '../components/IncomeForm'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  fontSize: 13,
}

function StatCard({ icon: Icon, label, value, accent = '#C5A059' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${accent}1a`, color: accent }}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[1px] text-slate-500">{label}</div>
          <div className="truncate font-serif text-xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </Card>
  )
}

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    properties,
    expenses,
    income,
    loading,
    propertyNameById,
    updateProperty,
    deleteProperty,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
  } = useData()
  const [expenseModal, setExpenseModal] = useState(null) // null | { editing }
  const [incomeModal, setIncomeModal] = useState(null)
  const [editProperty, setEditProperty] = useState(false)

  const property = useMemo(() => properties.find((p) => p.id === id), [properties, id])
  const items = useMemo(() => expenses.filter((e) => e.property_id === id), [expenses, id])

  const total = useMemo(() => sumAmount(items), [items])
  const thisMonth = useMemo(() => {
    const s = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    return sumAmount(items.filter((e) => (e.date || '') >= s))
  }, [items])
  const byCategory = useMemo(() => totalsByCategory(items), [items])
  const monthly = useMemo(() => monthlySeries(items, 12), [items])
  const incomeItems = useMemo(() => income.filter((e) => e.property_id === id), [income, id])
  const incomeTotal = useMemo(() => sumAmount(incomeItems), [incomeItems])
  const net = incomeTotal - total

  if (loading) return <Spinner />

  if (!property) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={MapPin}
          title="Asset not found"
          subtitle="It may have been deleted."
          action={
            <Link to="/properties" className="btn-primary">
              Back to assets
            </Link>
          }
        />
      </div>
    )
  }

  const AssetIcon = iconForAssetType(property.type)

  const onExpenseSubmit = async (data) => {
    if (expenseModal?.editing) await updateExpense(expenseModal.editing.id, data)
    else await addExpense(data)
    setExpenseModal(null)
  }

  const onIncomeSubmit = async (data) => {
    if (incomeModal?.editing) await updateIncome(incomeModal.editing.id, data)
    else await addIncome(data)
    setIncomeModal(null)
  }

  const onPropertySubmit = async (data) => {
    await updateProperty(property.id, data)
    setEditProperty(false)
  }

  const onDeleteProperty = () => {
    const msg = items.length
      ? `Delete "${property.name}" and its ${items.length} expense(s)? This cannot be undone.`
      : `Delete "${property.name}"?`
    if (window.confirm(msg)) {
      deleteProperty(property.id)
      navigate('/properties')
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> All assets
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
            <AssetIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{property.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              {property.type && <span>{property.type}</span>}
              {property.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {property.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => setEditProperty(true)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="ghost" onClick={onDeleteProperty} className="text-red-600 hover:bg-red-50">
            <Trash2 size={15} /> Delete
          </Button>
          <Button onClick={() => setExpenseModal({})}>
            <Plus size={16} /> Add expense
          </Button>
        </div>
      </div>

      {/* Budget */}
      {property.monthly_budget ? (
        <Card className="p-5">
          <BudgetBar spent={thisMonth} budget={property.monthly_budget} />
        </Card>
      ) : (
        <Card className="flex items-center justify-between p-4 text-sm">
          <span className="text-slate-500">No monthly budget set for this asset.</span>
          <button onClick={() => setEditProperty(true)} className="font-medium text-brand hover:underline">
            Set a budget
          </button>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Banknote} label="Income" value={formatCurrency(incomeTotal)} accent="#2F8F6B" />
        <StatCard icon={Wallet} label="Expenses" value={formatCurrency(total)} accent="#C5A059" />
        <StatCard icon={Scale} label="Net" value={formatCurrency(net)} accent={net >= 0 ? '#2F8F6B' : '#C0492F'} />
        <StatCard icon={CalendarDays} label="Spent this month" value={formatCurrency(thisMonth)} accent="#0A1828" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Spending over the last 12 months</h3>
          {monthly.every((m) => m.total === 0) ? (
            <div className="grid h-64 place-items-center text-sm text-slate-400">No data yet</div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C5A059" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#C5A059" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Spent']} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="total" stroke="#C5A059" strokeWidth={2.5} fill="url(#gd)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Spending by category</h3>
          {byCategory.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-slate-400">No data yet</div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                    {byCategory.map((d) => (
                      <Cell key={d.name} fill={colorForCategory(d.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [formatCurrency(v), n]} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Expenses */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Expenses ({items.length})</h3>
        {items.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses for this property"
            subtitle="Log the first one to start tracking."
            action={
              <Button onClick={() => setExpenseModal({})}>
                <Plus size={16} /> Add expense
              </Button>
            }
          />
        ) : (
          <ExpenseTable
            expenses={items}
            propertyNameById={propertyNameById}
            onEdit={(e) => setExpenseModal({ editing: e })}
            onDelete={deleteExpense}
          />
        )}
      </div>

      {/* Income */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Income ({incomeItems.length})</h3>
          <Button variant="ghost" onClick={() => setIncomeModal({})}>
            <Plus size={15} /> Add income
          </Button>
        </div>
        {incomeItems.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No income for this asset"
            subtitle="Log rent or other income to track net profit."
            action={
              <Button onClick={() => setIncomeModal({})}>
                <Plus size={16} /> Add income
              </Button>
            }
          />
        ) : (
          <IncomeTable
            income={incomeItems}
            propertyNameById={propertyNameById}
            onEdit={(e) => setIncomeModal({ editing: e })}
            onDelete={deleteIncome}
          />
        )}
      </div>

      <Modal
        open={!!expenseModal}
        onClose={() => setExpenseModal(null)}
        title={expenseModal?.editing ? 'Edit expense' : 'Add expense'}
        maxWidth="max-w-3xl"
      >
        {expenseModal && (
          <ExpenseForm
            initial={expenseModal.editing}
            properties={properties}
            defaultPropertyId={property.id}
            onSubmit={onExpenseSubmit}
            onCancel={() => setExpenseModal(null)}
          />
        )}
      </Modal>

      <Modal open={editProperty} onClose={() => setEditProperty(false)} title="Edit asset" maxWidth="max-w-xl">
        {editProperty && <PropertyForm initial={property} onSubmit={onPropertySubmit} onCancel={() => setEditProperty(false)} />}
      </Modal>

      <Modal
        open={!!incomeModal}
        onClose={() => setIncomeModal(null)}
        title={incomeModal?.editing ? 'Edit income' : 'Add income'}
        maxWidth="max-w-3xl"
      >
        {incomeModal && (
          <IncomeForm
            initial={incomeModal.editing}
            properties={properties}
            defaultPropertyId={property.id}
            onSubmit={onIncomeSubmit}
            onCancel={() => setIncomeModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
