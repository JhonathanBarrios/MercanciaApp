import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Ventas from './pages/Ventas'
import Cartera from './pages/Cartera'
import Despachos from './pages/Despachos'
import Garantias from './pages/Garantias'
import Reportes from './pages/Reportes'
import Tienda from './pages/Tienda'
import Login from './pages/Login'

function AdminGuard() {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  return <AdminLayout />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Tienda />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminGuard />}>
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Productos />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="cartera" element={<Cartera />} />
        <Route path="despachos" element={<Despachos />} />
        <Route path="garantias" element={<Garantias />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
