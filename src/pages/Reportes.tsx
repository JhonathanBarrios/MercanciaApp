import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Users, RefreshCw } from 'lucide-react'
import { reportesApi } from '../api/services'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Reportes() {
  const [ventasMes, setVentasMes]     = useState<any[]>([])
  const [topProd, setTopProd]         = useState<any[]>([])
  const [topCli, setTopCli]           = useState<any[]>([])
  const [resumen, setResumen]         = useState<any>(null)
  const [loading, setLoading]         = useState(true)

  const cargar = async () => {
    setLoading(true)
    try {
      const [vm, tp, tc, r] = await Promise.all([
        reportesApi.ventasPorMes(),
        reportesApi.topProductos(6),
        reportesApi.topClientes(5),
        reportesApi.resumen(),
      ])
      setVentasMes(vm)
      setTopProd(tp)
      setTopCli(tc)
      setResumen(r)
    } finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const totalContado = ventasMes.reduce((s: number, d: any) => s + Number(d.contado ?? 0), 0)
  const totalCredito = ventasMes.reduce((s: number, d: any) => s + Number(d.credito ?? 0), 0)
  const totalGeneral = totalContado + totalCredito
  const maxBarra     = Math.max(...ventasMes.map((d: any) => Number(d.contado ?? 0) + Number(d.credito ?? 0)), 1)
  const maxProd      = topProd[0] ? Number(topProd[0].total) : 1

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Análisis de ventas y desempeño</p>
        </div>
        <button onClick={cargar} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas totales',   value: fmt(Number(resumen?.totalVentas ?? 0)), icon: DollarSign,  color: 'bg-blue-500' },
          { label: 'Ventas contado',   value: fmt(totalContado),                      icon: ShoppingCart, color: 'bg-green-500' },
          { label: 'Ventas crédito',   value: fmt(totalCredito),                      icon: TrendingUp,  color: 'bg-purple-500' },
          { label: 'Clientes activos', value: String(resumen?.totalClientes ?? 0),    icon: Users,        color: 'bg-orange-500' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="card p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${k.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">{k.label}</p>
                  <p className="font-bold text-gray-900 text-sm truncate">{k.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas mensuales */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Ventas Mensuales</h2>
          {ventasMes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos de ventas mensuales</p>
          ) : (
            <div className="space-y-3">
              {ventasMes.map((d: any) => {
                const contado = Number(d.contado ?? 0)
                const credito = Number(d.credito ?? 0)
                const total = contado + credito
                const mes = MESES_ABREV[Number(d.mes) - 1] ?? d.mes
                return (
                  <div key={d.mes} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8 flex-shrink-0">{mes}</span>
                    <div className="flex-1 flex gap-1 h-6">
                      <div className="bg-blue-500 rounded-l h-full transition-all" style={{ width: `${(contado / maxBarra) * 100}%` }} title={`Contado: ${fmt(contado)}`} />
                      <div className="bg-blue-200 rounded-r h-full transition-all" style={{ width: `${(credito / maxBarra) * 100}%` }} title={`Crédito: ${fmt(credito)}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-24 text-right flex-shrink-0">{fmt(total)}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Contado</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-blue-200 inline-block" /> Crédito</div>
          </div>
        </div>

        {/* Top productos */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Productos Más Vendidos</h2>
          {topProd.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos de ventas</p>
          ) : (
            <div className="space-y-3">
              {topProd.map((p: any, i: number) => (
                <div key={p.productoId ?? i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">#{i + 1}</span>
                      <p className="text-xs font-medium text-gray-800 truncate">{p.nombre}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-bold text-gray-900">{fmt(Number(p.total))}</p>
                      <p className="text-xs text-gray-400">{p.unidades} uds</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: `${(Number(p.total) / maxProd) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top clientes */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Clientes Top</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Compras</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Participación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topCli.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin datos</td></tr>
              )}
              {topCli.map((c: any, i: number) => {
                const pct = totalGeneral > 0 ? ((Number(c.total) / totalGeneral) * 100).toFixed(1) : '0.0'
                return (
                  <tr key={c.clienteId ?? i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 font-bold text-xs">#{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{c.nombre}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{c.compras}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(Number(c.total))}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
