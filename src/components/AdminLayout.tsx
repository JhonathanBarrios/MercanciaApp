import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  CreditCard, Truck, Store, LogOut, Menu, BarChart2, ShieldCheck
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const ALL_NAV = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, end: true,  seccion: 'dashboard'  },
  { to: '/admin/productos', label: 'Productos',  icon: Package,                      seccion: 'productos'  },
  { to: '/admin/clientes',  label: 'Clientes',   icon: Users,                        seccion: 'clientes'   },
  { to: '/admin/ventas',    label: 'Ventas',     icon: ShoppingCart,                 seccion: 'ventas'     },
  { to: '/admin/cartera',   label: 'Cartera',    icon: CreditCard,                   seccion: 'cartera'    },
  { to: '/admin/despachos', label: 'Despachos',  icon: Truck,                        seccion: 'despachos'  },
  { to: '/admin/garantias', label: 'Garantías',  icon: ShieldCheck,                  seccion: 'garantias'  },
  { to: '/admin/reportes',  label: 'Reportes',   icon: BarChart2,                    seccion: 'reportes'   },
]

const ROL_COLOR: Record<string, string> = {
  admin:    'bg-blue-400 text-white',
  vendedor: 'bg-green-400 text-white',
  cobrador: 'bg-orange-400 text-white',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { usuario, logout, puede } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = ALL_NAV.filter(item => puede(item.seccion))

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-blue-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-800">
          <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
            <Store size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">MercaApp</p>
            <p className="text-blue-300 text-xs">Panel Administrativo</p>
          </div>
        </div>

        {/* Usuario actual */}
        {usuario && (
          <div className="px-4 py-3 border-b border-blue-800 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ROL_COLOR[usuario.rol]}`}>
              {usuario.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuario.nombre}</p>
              <p className="text-xs text-blue-300 capitalize">{usuario.rol}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end, seccion }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800 space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
          >
            <Store size={18} />
            Ver Tienda
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-red-700 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-600" />
          </button>
          <span className="font-bold text-blue-900">MercaApp</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
