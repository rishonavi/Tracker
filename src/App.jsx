import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { Spinner } from './components/ui'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Properties = lazy(() => import('./pages/Properties'))
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'))
const AssetFormPage = lazy(() => import('./pages/AssetFormPage'))
const Expenses = lazy(() => import('./pages/Expenses'))
const ExpenseFormPage = lazy(() => import('./pages/ExpenseFormPage'))
const Income = lazy(() => import('./pages/Income'))
const IncomeFormPage = lazy(() => import('./pages/IncomeFormPage'))
const Bills = lazy(() => import('./pages/Bills'))
const ImportBills = lazy(() => import('./pages/ImportBills'))
const Reports = lazy(() => import('./pages/Reports'))

export default function App() {
  const { isCloud } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isCloud ? (
            <Suspense fallback={<FullScreen />}>
              <Login />
            </Suspense>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout />
            </DataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="properties/new" element={<AssetFormPage />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="properties/:id/edit" element={<AssetFormPage />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/new" element={<ExpenseFormPage />} />
        <Route path="expenses/:id/edit" element={<ExpenseFormPage />} />
        <Route path="income" element={<Income />} />
        <Route path="income/new" element={<IncomeFormPage />} />
        <Route path="income/:id/edit" element={<IncomeFormPage />} />
        <Route path="bills" element={<Bills />} />
        <Route path="import" element={<ImportBills />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function FullScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner />
    </div>
  )
}
