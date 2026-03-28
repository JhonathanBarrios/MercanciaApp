import { useState, useEffect } from 'react'
import { DollarSign, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { reportesApi, pagosApi } from '../api/services'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export default function Cartera() {
  const [filtro, setFiltro] = useState<'todas' | 'vencida' | 'parcial' | 'pendiente'>('todas')
  const [cuotas, setCuotas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagoModal, setPagoModal] = useState<any | null>(null)
  const [pagoValor, setPagoValor] = useState('')
  const [pagoMetodo, setPagoMetodo] = useState('efectivo')
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try { setCuotas(await reportesApi.carteraActiva()) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const cuotasFiltradas = filtro === 'todas' ? cuotas : cuotas.filter((c: any) => c.estado === filtro)

  const totalVencido = cuotas.filter((c: any) => c.estado === 'vencida').reduce((s: number, c: any) => s + Number(c.saldo), 0)
  const totalPendiente = cuotas.filter((c: any) => c.estado !== 'vencida').reduce((s: number, c: any) => s + Number(c.saldo), 0)
  const clientesMora = new Set(cuotas.filter((c: any) => Number(c.dias_mora) > 0).map((c: any) => c.cliente_nombre)).size

  const registrarPago = async () => {
    if (!pagoModal || !pagoValor) return
    setGuardando(true)
    try {
      await pagosApi.registrar({
        cuotaId: pagoModal.cuota_id,
        valor: Number(pagoValor),
        metodo: pagoMetodo,
      })
      setPagoModal(null)
      setPagoValor('')
      await cargar()
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al registrar el pago')
    } finally {
      setGuardando(false)
    }
  }

  const estadoColor: Record<string, string> = {
    vencida: 'badge-red',
    parcial: 'badge-yellow',
    pendiente: 'badge-blue',
    pagada: 'badge-green',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cartera</h1>
        <p className="text-gray-500 text-sm mt-1">Control de créditos y cuotas</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Cartera Vencida</p>
              <p className="text-xl font-bold text-red-600">{fmt(totalVencido)}</p>
              <p className="text-xs text-gray-400">{clientesMora} clientes en mora</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Por Cobrar</p>
              <p className="text-xl font-bold text-blue-600">{fmt(totalPendiente)}</p>
              <p className="text-xs text-gray-400">Próximas cuotas</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Cartera</p>
              <p className="text-xl font-bold text-green-600">{fmt(totalVencido + totalPendiente)}</p>
              <p className="text-xs text-gray-400">{cuotas.length} cuotas activas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['todas', 'vencida', 'parcial', 'pendiente'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filtro === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f === 'todas' ? 'Todas' : f}
            {f !== 'todas' && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                {cuotas.filter((c: any) => c.estado === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla de cuotas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Venta</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cuota</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vencimiento</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400"><RefreshCw size={18} className="animate-spin inline" /></td></tr>
              )}
              {!loading && cuotasFiltradas.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin cuotas en este filtro</td></tr>
              )}
              {cuotasFiltradas.map((c: any) => (
                <tr key={c.cuota_id} className={`hover:bg-gray-50 ${c.estado === 'vencida' ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.cliente_nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.venta_numero}</td>
                  <td className="px-4 py-3 text-center text-gray-600">#{c.numero}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(Number(c.saldo))}</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    <span>{new Date(c.fecha_vence).toLocaleDateString('es-CO')}</span>
                    {Number(c.dias_mora) > 0 && (
                      <span className="ml-1.5 badge-red">{Number(c.dias_mora)}d mora</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={estadoColor[c.estado] || 'badge-blue'}>{c.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.estado !== 'pagada' && (
                      <button
                        onClick={() => { setPagoModal(c); setPagoValor(String(c.saldo)) }}
                        className="btn-primary text-xs py-1 px-3"
                      >
                        Registrar Pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pago */}
      {pagoModal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Registrar Pago</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-medium">{pagoModal.cliente_nombre}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Venta / Cuota:</span>
                  <span className="font-medium">{pagoModal.venta_numero} · #{pagoModal.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saldo pendiente:</span>
                  <span className="font-bold text-blue-600">{fmt(Number(pagoModal.saldo))}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor a abonar</label>
                <input type="number" value={pagoValor} onChange={e => setPagoValor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Método de pago</label>
                <select value={pagoMetodo} onChange={e => setPagoMetodo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['efectivo','transferencia','nequi','daviplata','tarjeta'].map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button className="btn-secondary" onClick={() => setPagoModal(null)} disabled={guardando}>Cancelar</button>
                <button className="btn-primary" onClick={registrarPago} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
