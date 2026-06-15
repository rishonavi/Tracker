export const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR'
export const LOCALE = import.meta.env.VITE_LOCALE || 'en-IN'

export const PROPERTY_TYPES = [
  'Apartment / Flat',
  'Villa / House',
  'Commercial',
  'Office',
  'Shop / Retail',
  'Plot / Land',
  'Other',
]

export const CATEGORIES = [
  'Materials',
  'Labor / Contractors',
  'Permits & Legal',
  'Utilities',
  'Property Tax',
  'Maintenance & Repairs',
  'Insurance',
  'Loan / EMI',
  'Brokerage / Marketing',
  'Furnishing',
  'Other',
]

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Cheque',
  'Credit Card',
  'Debit Card',
  'Other',
]

// Stable colour per category for charts/legends.
export const CATEGORY_COLORS = {
  'Materials': '#C5A059',
  'Labor / Contractors': '#3B5A7A',
  'Permits & Legal': '#6D6A8A',
  'Utilities': '#2F6F6B',
  'Property Tax': '#9C5B33',
  'Maintenance & Repairs': '#B5673F',
  'Insurance': '#7C8A5A',
  'Loan / EMI': '#46618A',
  'Brokerage / Marketing': '#A87B2E',
  'Furnishing': '#8A6E4B',
  'Other': '#7A7165',
}

// Muted, luxury palette for charts keyed by index (e.g. per-property bars).
export const CHART_PALETTE = [
  '#C5A059', '#0A1828', '#2F6F6B', '#9C5B33', '#3B5A7A',
  '#A87B2E', '#6D6A8A', '#7C8A5A', '#B5673F', '#46618A',
  '#8A6E4B', '#5A7D7C',
]

export const colorForCategory = (cat, i = 0) =>
  CATEGORY_COLORS[cat] || CHART_PALETTE[i % CHART_PALETTE.length]
