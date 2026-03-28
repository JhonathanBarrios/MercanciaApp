import { useEffect, useState } from 'react'
import { TrendingUp, Users, AlertTriangle, Clock, Package, DollarSign, RefreshCw } from 'lucide-react'
import { reportesApi, ventasApi } from '../api/services'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

function KpiCard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [resumen, setResumen] = useState<any>(null)
  const [ventasRecientes, setVentasRecientes] = useState<any[]>([])
  const [cartera, setCartera] = useState<any[]>([])
  const [stockBajo, setStockBajo] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [r, v, c, s] = await Promise.all([
        reportesApi.resumen(),
        ventasApi.listar(),
        reportesApi.carteraActiva(),
        reportesApi.alertasStock(),
      ])
      setResumen(r)
      setVentasRecientes(v.slice(0, 5))
      setCartera(c.filter((x: any) => x.dias_mora > 0).slice(0, 5))
      setStockBajo(s.slice(0, 5))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen del negocio — {hoy}</p>
        </div>
        <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total ventas" value={fmt(Number(resumen?.totalVentas ?? 0))} icon={TrendingUp} color="bg-blue-500" sub={`${resumen?.numVentas ?? 0} transacciones`} />
        <KpiCard label="Cartera pendiente" value={fmt(Number(resumen?.carteraPendiente ?? 0))} icon={DollarSign} color="bg-green-500" sub={`${resumen?.cuotasPendientes ?? 0} cuotas activas`} />
        <KpiCard label="Cuotas vencidas" value={String(cartera.length)} icon={AlertTriangle} color="bg-red-500" sub="Con días de mora" />
        <KpiCard label="Clientes activos" value={String(resumen?.totalClientes ?? 0)} icon={Users} color="bg-purple-500" sub="Registrados en el sistema" />
        <KpiCard label="Productos activos" value={String(resumen?.totalProductos ?? 0)} icon={Package} color="bg-orange-500" sub="En inventario" />
        <KpiCard label="Stock bajo" value={String(stockBajo.length)} icon={Clock} color="bg-yellow-500" sub="Productos por reponer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas ventas */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Últimas Ventas</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {ventasRecientes.length === 0 && (
              <p className="text-sm text-gray-400 px-5 py-4">Sin ventas registradas</p>
            )}
            {ventasRecientes.map(v => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.cliente?.nombre ?? 'Mostrador'}</p>
                  <p className="text-xs text-gray-400">{v.numero} · {new Date(v.fecha).toLocaleDateString('es-CO')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{fmt(Number(v.total))}</p>
                  <span className={v.tipo === 'credito' ? 'badge-blue' : 'badge-green'}>{v.tipo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cuotas vencidas + Stock bajo */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Cuotas Vencidas</h2>
            <span className="badge-red">{cartera.length} vencidas</span>
          </div>
          <div className="divide-y divide-gray-50">
            {cartera.length === 0 && (
              <p className="text-sm text-gray-400 px-5 py-4">Sin cuotas vencidas 🎉</p>
            )}
            {cartera.map((c: any) => (
              <div key={c.cuota_id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.cliente_nombre}</p>
                  <p className="text-xs text-gray-400">{c.venta_numero} · cuota {c.numero}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{fmt(Number(c.saldo))}</p>
                  <span className="badge-red">{Number(c.dias_mora)} días mora</span>
                </div>
              </div>
            ))}
          </div>

          {stockBajo.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stock Bajo</p>
              <div className="space-y-2">
                {stockBajo.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">{p.nombre}</p>
                    <span className="badge-red">{p.stock} uds</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
