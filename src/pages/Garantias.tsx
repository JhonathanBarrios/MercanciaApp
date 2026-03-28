import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, X, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { garantiasApi, productosApi, clientesApi } from '../api/services'

const fmt = (f: string) => new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

type Garantia = {
  id: number
  productoNombre: string
  categoria: string
  clienteNombre: string
  serial: string
  fechaVenta: string
  meses: number
  fechaVence: string
  estado: 'activa' | 'por vencer' | 'vencida'
}

const calcEstado = (fechaVence: string): Garantia['estado'] => {
  const hoy = new Date()
  const vence = new Date(fechaVence)
  const dias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (dias < 0) return 'vencida'
  if (dias <= 30) return 'por vencer'
  return 'activa'
}

const addMeses = (fecha: string, meses: number) => {
  const d = new Date(fecha)
  d.setMonth(d.getMonth() + meses)
  return d.toISOString().split('T')[0]
}

const estadoConfig: Record<string, { label: string; cls: string; icon: any; iconCls: string }> = {
  activa:      { label: 'Activa',      cls: 'badge-green',  icon: CheckCircle,   iconCls: 'text-green-500' },
  por_vencer:  { label: 'Por vencer',  cls: 'badge-yellow', icon: Clock,         iconCls: 'text-yellow-500' },
  vencida:     { label: 'Vencida',     cls: 'badge-red',    icon: AlertTriangle, iconCls: 'text-red-500' },
}

export default function Garantias() {
  const [lista, setLista]       = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [clientes, setClientes]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro]       = useState('todas')
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState({ productoId: '', clienteId: '', serial: '', fechaVenta: new Date().toISOString().split('T')[0], meses: '12' })

  const cargar = async () => {
    setLoading(true)
    try {
      const [g, p, c] = await Promise.all([garantiasApi.listar(), productosApi.listar(), clientesApi.listar()])
      setLista(g)
      setProductos(p)
      setClientes(c)
    } finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const filtradas = filtro === 'todas' ? lista : lista.filter((g: any) => g.estado === filtro)

  const registrar = async () => {
    if (!form.productoId || !form.serial || !form.fechaVenta) return
    setGuardando(true)
    try {
      await garantiasApi.crear({
        productoId: form.productoId,
        clienteId: form.clienteId || undefined,
        serial: form.serial,
        fechaVenta: form.fechaVenta,
        meses: parseInt(form.meses),
      })
      setModal(false)
      setForm({ productoId: '', clienteId: '', serial: '', fechaVenta: new Date().toISOString().split('T')[0], meses: '12' })
      await cargar()
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al registrar')
    } finally { setGuardando(false) }
  }

  const activas   = lista.filter((g: any) => g.estado === 'activa').length
  const porVencer = lista.filter((g: any) => g.estado === 'por_vencer').length
  const vencidas  = lista.filter((g: any) => g.estado === 'vencida').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Garantías</h1>
          <p className="text-gray-500 text-sm mt-1">Control de garantías por producto vendido</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          Registrar Garantía
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Activas',     value: activas,   color: 'text-green-600',  border: 'border-green-500' },
          { label: 'Por vencer',  value: porVencer, color: 'text-yellow-600', border: 'border-yellow-500' },
          { label: 'Vencidas',    value: vencidas,  color: 'text-red-600',    border: 'border-red-500' },
        ].map(r => (
          <div key={r.label} className={`card p-5 border-l-4 ${r.border}`}>
            <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
            <p className="text-xs text-gray-500 mt-1">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['todas', 'activa', 'por_vencer', 'vencida'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filtro === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f === 'todas' ? 'Todas' : f === 'por_vencer' ? 'Por vencer' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Serial</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Venta</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Meses</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vence</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400"><RefreshCw size={18} className="animate-spin inline" /></td></tr>
              )}
              {!loading && filtradas.map((g: any) => {
                const cfg = estadoConfig[g.estado] ?? estadoConfig['activa']
                const Icon = cfg.icon
                return (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{g.producto?.nombre}</p>
                      <p className="text-xs text-gray-400">{g.producto?.categoria?.nombre}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{g.cliente?.nombre ?? 'Sin cliente'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{g.serial}</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{fmt(g.fechaVenta)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{g.meses} m</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">{fmt(g.fechaVence)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Icon size={13} className={cfg.iconCls} />
                        <span className={cfg.cls}>{cfg.label}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtradas.length === 0 && (
          <div className="py-10 text-center text-gray-400 text-sm">No hay garantías en este estado</div>
        )}
      </div>

      {/* Modal registrar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-blue-600" />
                <h2 className="font-bold text-gray-900">Registrar Garantía</h2>
              </div>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Producto *</label>
                <select
                  value={form.productoId}
                  onChange={e => setForm(f => ({ ...f, productoId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
                <select
                  value={form.clienteId}
                  onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin cliente / Mostrador</option>
                  {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número de serial *</label>
                <input
                  type="text"
                  placeholder="Ej: SAM-2025-00123"
                  value={form.serial}
                  onChange={e => setForm(f => ({ ...f, serial: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de venta *</label>
                  <input
                    type="date"
                    value={form.fechaVenta}
                    onChange={e => setForm(f => ({ ...f, fechaVenta: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meses de garantía *</label>
                  <select
                    value={form.meses}
                    onChange={e => setForm(f => ({ ...f, meses: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[3, 6, 12, 18, 24, 36].map(m => <option key={m} value={m}>{m} meses</option>)}
                  </select>
                </div>
              </div>
              {form.productoId && form.fechaVenta && (
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                  Vence el: <strong>{fmt(addMeses(form.fechaVenta, parseInt(form.meses)))}</strong>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200">
              <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button
                onClick={registrar}
                disabled={!form.productoId || !form.serial || !form.fechaVenta || guardando}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ShieldCheck size={15} />
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
