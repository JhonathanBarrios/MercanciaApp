import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Phone, MapPin, RefreshCw } from 'lucide-react'
import { clientesApi } from '../api/services'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function Clientes() {
  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    try { setClientes(await clientesApi.listar()) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.documento ?? '').includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes registrados</p>
        </div>
        <div className="flex gap-2">
          {loading && <RefreshCw size={16} className="animate-spin text-blue-500 self-center" />}
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cards de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c: any) => {
          const cupoUsado = Number(c.cupoCredito) > 0 ? Math.round((Number(c.saldoDeuda) / Number(c.cupoCredito)) * 100) : 0
          const enMora = Number(c.saldoDeuda) > Number(c.cupoCredito)
          return (
            <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {c.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{c.nombre}</p>
                    <p className="text-xs text-gray-400">{c.documento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={enMora ? 'badge-red' : 'badge-green'}>
                    {enMora ? 'En mora' : 'Al día'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} />
                  {c.telefono}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} />
                  {c.direccion}
                </div>
              </div>

              {Number(c.cupoCredito) > 0 ? (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Cupo utilizado</span>
                    <span className={`font-semibold ${cupoUsado >= 90 ? 'text-red-600' : cupoUsado >= 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {cupoUsado}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full ${cupoUsado >= 90 ? 'bg-red-500' : cupoUsado >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(cupoUsado, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Saldo: <strong className="text-gray-900">{fmt(Number(c.saldoDeuda))}</strong></span>
                    <span className="text-gray-500">Cupo: <strong className="text-gray-900">{fmt(Number(c.cupoCredito))}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <span className="badge-green text-xs">Cliente de contado</span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button className="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
                  <Edit2 size={13} />
                  Editar
                </button>
                <button className="btn-primary text-xs py-1 px-3">
                  Ver cuenta
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card py-12 text-center text-gray-400">
          <p>No se encontraron clientes</p>
        </div>
      )}
    </div>
  )
}
