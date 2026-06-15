import { hasSupabase } from '../supabaseClient'
import * as local from './local'
import * as remote from './supabase'

// `db` exposes one stable interface regardless of backend:
//   auth:      getCurrentUser, onAuthStateChange, signIn, signUp, signOut
//   data:      getProperties / addProperty / updateProperty / deleteProperty
//              getExpenses   / addExpense   / updateExpense   / deleteExpense
//   receipts:  uploadReceipt(file) -> stored string, getReceiptUrl(stored) -> url
//
// VITE_OPEN_ACCESS=true → skip login entirely and run on local browser storage,
// so anyone can open the site and use it with no credentials. The login code
// stays intact; remove the flag to require login again once the Supabase
// Google/Apple setup is finished.
const openAccess = String(import.meta.env.VITE_OPEN_ACCESS || '').toLowerCase() === 'true'

export const isCloud = hasSupabase && !openAccess
export const db = isCloud ? remote : local
