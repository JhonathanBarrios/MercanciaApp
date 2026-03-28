import { Truck, CheckCircle, Clock } from 'lucide-react'

const despachos = [
  { id: 'D-0019', venta: 'V-0037', cliente: 'Lucía Herrera', direccion: 'Cra 20 #8-90', fecha: '2026-03-25', estado: 'pendiente', items: 4 },
  { id: 'D-0018', venta: 'V-0036', cliente: 'Ana Martínez', direccion: 'Cra 12 #5-67', fecha: '2026-03-25', estado: 'despachado', items: 3 },
  { id: 'D-0017', venta: 'V-0035', cliente: 'María García', direccion: 'Cra 5 #12-34', fecha: '2026-03-24', estado: 'despachado', items: 2 },
  { id: 'D-0016', venta: 'V-0034', cliente: 'Carlos López', direccion: 'Cl 15 #34-56', fecha: '2026-03-24', estado: 'despachado', items: 5 },
]

export default function Despachos() {
  const pendientes = despachos.filter(d => d.estado === 'pendiente')
  const despachados = despachos.filter(d => d.estado === 'despachado')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Despachos</h1>
        <p className="text-gray-500 text-sm mt-1">Control de entrega de pedidos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{pendientes.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Despachados hoy</p>
              <p className="text-2xl font-bold text-green-600">{despachados.length}</p>
            </div>
          </div>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={16} className="text-yellow-500" />
            <h2 className="font-semibold text-gray-900">Pedidos por Despachar</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pendientes.map(d => (
              <div key={d.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900">{d.cliente}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d.direccion}</p>
                  <p className="text-xs text-gray-400">{d.venta} · {d.items} productos · {d.fecha}</p>
                </div>
                <button className="btn-primary flex items-center gap-2 text-sm">
                  <Truck size={15} />
                  Marcar Despachado
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Historial de Despachos</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {despachados.map(d => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{d.cliente}</p>
                <p className="text-xs text-gray-500">{d.direccion}</p>
                <p className="text-xs text-gray-400">{d.venta} · {d.items} productos</p>
              </div>
              <div className="text-right">
                <span className="badge-green">Despachado</span>
                <p className="text-xs text-gray-400 mt-1">{d.fecha}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
