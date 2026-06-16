import { useState } from 'react'
import { ASSET_TYPES } from '../lib/constants'
import { currencySymbol } from '../lib/format'
import { Field, Input, Select, Textarea, Button } from './ui'

export default function PropertyForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || ASSET_TYPES[0],
    address: initial?.address || '',
    monthly_budget: initial?.monthly_budget ?? '',
    notes: initial?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Property name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        monthly_budget: form.monthly_budget === '' ? null : Number(form.monthly_budget),
      })
    } catch (err) {
      setError(err?.message || String(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Asset name" required>
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Sea View Apartment · BMW X5 · Sunseeker 60" autoFocus />
      </Field>

      <Field label="Type">
        <Select value={form.type} onChange={set('type')}>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Address">
        <Input value={form.address} onChange={set('address')} placeholder="Street, area, city" />
      </Field>

      <Field label="Monthly budget" hint="Optional — used for budget alerts on this property">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {currencySymbol}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="pl-8"
            value={form.monthly_budget}
            onChange={set('monthly_budget')}
            placeholder="0"
          />
        </div>
      </Field>

      <Field label="Notes">
        <Textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Anything worth remembering" />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-border-light pt-5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {initial ? 'Save changes' : 'Add asset'}
        </Button>
      </div>
    </form>
  )
}
