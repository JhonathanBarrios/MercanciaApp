import { useState, useEffect } from 'react'
import { Plus, Search, Eye, CheckCircle, X, Calendar, Download, RefreshCw } from 'lucide-react'
import { ventasApi, clientesApi, productosApi, garantiasApi } from '../api/services'
import { generarFacturaPDF, DatosFactura } from '../utils/generarFacturaPDF'

type CuotaGenerada = { numero: number; valor: number; fecha: string }
type LineaVenta = { productoId: string; nombre: string; precio: number; cantidad: number }

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const generarFechasCuotas = (totalVal: number, numCuotas: number): CuotaGenerada[] => {
  const hoy = new Date()
  return Array.from({ length: numCuotas }, (_, i) => {
    const fecha = new Date(hoy)
    fecha.setMonth(fecha.getMonth() + i + 1)
    return { numero: i + 1, valor: Math.round(totalVal / numCuotas), fecha: fecha.toISOString().split('T')[0] }
  })
}

export default function Ventas() {
  const [listaVentas, setListaVentas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tipoVenta, setTipoVenta] = useState<'contado' | 'credito'>('contado')
  const [clienteId, setClienteId] = useState('')
  const [lineas, setLineas] = useState<LineaVenta[]>([])
  const [productoSel, setProductoSel] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [numCuotas, setNumCuotas] = useState(3)
  const [cuotasModal, setCuotasModal] = useState<CuotaGenerada[] | null>(null)
  const [ventaConfirmada, setVentaConfirmada] = useState(false)
  const [ultimaVenta, setUltimaVenta] = useState<DatosFactura | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [ventaCreada, setVentaCreada] = useState<any | null>(null)
  const [garantiasStep, setGarantiasStep] = useState(false)
  const [serialesForm, setSerialesForm] = useState<Record<string, { serial: string; meses: string }>>({})
  const [guardandoGarantias, setGuardandoGarantias] = useState(false)

  const CATS_CON_GARANTIA = ['Celulares', 'Electrodomésticos', 'Electrónica', 'Computadores']

  const itemsConGarantia = (venta: any) =>
    (venta?.items ?? []).filter((item: any) => {
      const prod = productos.find((p: any) => p.id === item.productoId)
      return prod && CATS_CON_GARANTIA.includes(prod.categoria?.nombre ?? '')
    })

  const guardarGarantias = async () => {
    if (!ventaCreada) return
    setGuardandoGarantias(true)
    try {
      const items = itemsConGarantia(ventaCreada)
      const promises = items
        .filter((item: any) => serialesForm[item.productoId]?.serial?.trim())
        .map((item: any) =>
          garantiasApi.crear({
            ventaItemId: item.id,
            productoId: item.productoId,
            clienteId: ventaCreada.clienteId || undefined,
            serial: serialesForm[item.productoId].serial.trim(),
            fechaVenta: new Date().toISOString().split('T')[0],
            meses: parseInt(serialesForm[item.productoId]?.meses ?? '12'),
          })
        )
      await Promise.all(promises)
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al registrar garantías')
    } finally {
      setGuardandoGarantias(false)
      cerrarExito()
    }
  }

  const cerrarExito = () => {
    setCuotasModal(null)
    setVentaConfirmada(false)
    setGarantiasStep(false)
    setVentaCreada(null)
    setSerialesForm({})
    setShowForm(false)
    setLineas([])
    setClienteId('')
    setTipoVenta('contado')
    setNumCuotas(3)
  }

  const cargarDatos = async () => {
    setLoadingData(true)
    try {
      const [v, c, p] = await Promise.all([ventasApi.listar(), clientesApi.listar(), productosApi.listar()])
      setListaVentas(v)
      setClientes(c)
      setProductos(p)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const total = lineas.reduce((sum, l) => sum + l.precio * l.cantidad, 0)

  const agregarLinea = () => {
    const prod = productos.find((p: any) => p.id === productoSel)
    if (!prod) return
    setLineas(prev => {
      const exist = prev.find(l => l.productoId === prod.id)
      if (exist) return prev.map(l => l.productoId === prod.id ? { ...l, cantidad: l.cantidad + cantidad } : l)
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: Number(prod.precio), cantidad }]
    })
    setProductoSel('')
    setCantidad(1)
  }

  const clienteSeleccionado = clientes.find((c: any) => c.id === clienteId)
  const cupoDisponible = clienteSeleccionado
    ? Number(clienteSeleccionado.cupoCredito) - Number(clienteSeleccionado.saldoDeuda)
    : 0

  const handleGuardar = () => {
    if (tipoVenta === 'credito') {
      setCuotasModal(generarFechasCuotas(total, numCuotas))
    } else {
      setCuotasModal([])
      confirmarVenta()
    }
  }

  const confirmarVenta = async () => {
    setGuardando(true)
    try {
      const creada = await ventasApi.crear({
        clienteId: clienteId || undefined,
        tipo: tipoVenta,
        numCuotas: tipoVenta === 'credito' ? numCuotas : undefined,
        items: lineas.map(l => ({ productoId: l.productoId, cantidad: l.cantidad })),
      })
      const datosFactura: DatosFactura = {
        numero: creada.numero,
        fecha: new Date().toISOString().split('T')[0],
        cliente: clienteSeleccionado?.nombre ?? 'Mostrador',
        tipo: tipoVenta,
        estado: creada.estado,
        lineas: lineas.map(l => ({ nombre: l.nombre, cantidad: l.cantidad, precio: l.precio })),
        cuotas: tipoVenta === 'credito' ? generarFechasCuotas(total, numCuotas) : [],
      }
      setVentaCreada(creada)
      setUltimaVenta(datosFactura)
      setVentaConfirmada(true)
      await cargarDatos()
      const conGarantia = itemsConGarantia(creada)
      if (conGarantia.length > 0) {
        const init: Record<string, { serial: string; meses: string }> = {}
        conGarantia.forEach((item: any) => { init[item.productoId] = { serial: '', meses: '12' } })
        setSerialesForm(init)
      }
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al guardar la venta')
      setGuardando(false)
    }
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-500 text-sm mt-1">{listaVentas.length} ventas registradas</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          Nueva Venta
        </button>
      </div>

      {/* Formulario nueva venta */}
      {showForm && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Registrar Nueva Venta</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de venta</label>
              <div className="flex gap-2">
                {(['contado', 'credito'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTipoVenta(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      tipoVenta === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
              <select
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Mostrador / Sin cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {tipoVenta === 'credito' && clienteSeleccionado && (
                <p className={`text-xs mt-1 ${cupoDisponible > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Cupo disponible: {fmt(cupoDisponible)}
                </p>
              )}
            </div>
          </div>

          {/* Agregar producto */}
          <div className="flex gap-2 mb-4">
            <select
              value={productoSel}
              onChange={e => setProductoSel(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — {fmt(p.precio)}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={e => setCantidad(parseInt(e.target.value) || 1)}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={agregarLinea} className="btn-primary" disabled={!productoSel}>
              Agregar
            </button>
          </div>

          {/* Líneas */}
          {lineas.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">Producto</th>
                    <th className="text-center px-4 py-2 text-xs text-gray-500">Cant.</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500">Precio</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineas.map(l => (
                    <tr key={l.productoId}>
                      <td className="px-4 py-2 text-gray-800">{l.nombre}</td>
                      <td className="px-4 py-2 text-center">{l.cantidad}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{fmt(l.precio)}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(l.precio * l.cantidad)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-bold text-gray-700">Total</td>
                    <td className="px-4 py-2 text-right font-bold text-blue-600 text-base">{fmt(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {tipoVenta === 'credito' && lineas.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Número de cuotas</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 6, 12].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumCuotas(n)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      numCuotas === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {n}x
                    <span className="block text-xs font-normal opacity-80">{fmt(total / n)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => { setShowForm(false); setLineas([]) }}>Cancelar</button>
            <button className="btn-primary" disabled={lineas.length === 0} onClick={handleGuardar}>
              Guardar Venta
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">Historial de Ventas</h2>
          <div className="relative ml-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Buscar venta..."
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N°</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingData && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400"><RefreshCw size={18} className="animate-spin inline" /></td></tr>
              )}
              {!loadingData && listaVentas.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{v.numero}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(v.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{v.cliente?.nombre ?? 'Mostrador'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={v.tipo === 'credito' ? 'badge-blue' : 'badge-green'}>{v.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{v.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(Number(v.total))}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={v.estado === 'despachado' ? 'badge-green' : 'badge-yellow'}>{v.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalle">
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => generarFacturaPDF({
                          numero: v.numero,
                          fecha: new Date(v.fecha).toISOString().split('T')[0],
                          cliente: v.cliente?.nombre ?? 'Mostrador',
                          tipo: v.tipo as 'contado' | 'credito',
                          estado: v.estado,
                          lineas: (v.items ?? []).map((i: any) => ({ nombre: i.nombreSnap, cantidad: i.cantidad, precio: Number(i.precioSnap) })),
                        })}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Descargar PDF"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Modal cuotas automáticas */}
      {cuotasModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-blue-600" />
                <h2 className="font-bold text-gray-900">Plan de Cuotas Generado</h2>
              </div>
              {!ventaConfirmada && (
                <button onClick={() => setCuotasModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              )}
            </div>

            {ventaConfirmada ? (
              garantiasStep ? (
                /* ── Paso 2: Registrar garantías ── */
                <div className="px-6 py-5">
                  <p className="text-sm font-medium text-gray-700 mb-1">Registra los seriales de los productos con garantía</p>
                  <p className="text-xs text-gray-400 mb-4">Los campos en blanco se omitirán.</p>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {itemsConGarantia(ventaCreada).map((item: any) => {
                      const prod = productos.find((p: any) => p.id === item.productoId)
                      return (
                        <div key={item.productoId} className="border border-gray-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-800 mb-2">{item.nombreSnap}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Serial / IMEI</label>
                              <input
                                type="text"
                                placeholder="Ej: SAM-2025-00123"
                                value={serialesForm[item.productoId]?.serial ?? ''}
                                onChange={e => setSerialesForm(f => ({ ...f, [item.productoId]: { ...f[item.productoId], serial: e.target.value } }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Meses garantía</label>
                              <select
                                value={serialesForm[item.productoId]?.meses ?? '12'}
                                onChange={e => setSerialesForm(f => ({ ...f, [item.productoId]: { ...f[item.productoId], meses: e.target.value } }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {[3,6,12,18,24,36].map(m => <option key={m} value={m}>{m} meses</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-3 justify-end mt-5">
                    <button onClick={cerrarExito} className="btn-secondary text-sm" disabled={guardandoGarantias}>Omitir</button>
                    <button onClick={guardarGarantias} disabled={guardandoGarantias} className="btn-primary text-sm flex items-center gap-2">
                      <CheckCircle size={14} />
                      {guardandoGarantias ? 'Guardando...' : 'Registrar garantías'}
                    </button>
                  </div>
                </div>
              ) : (
              /* ── Paso 1: Éxito ── */
              <div className="flex flex-col items-center py-8 text-center px-6">
                <CheckCircle size={52} className="text-green-500 mb-3" />
                <p className="font-bold text-gray-900">¡Venta registrada!</p>
                <p className="text-sm text-gray-500 mt-1">
                  {tipoVenta === 'credito' ? `${numCuotas} cuotas generadas automáticamente` : 'Venta de contado registrada'}
                </p>
                <div className="flex flex-col gap-2 mt-5 w-full max-w-xs">
                  {ultimaVenta && (
                    <button
                      onClick={() => generarFacturaPDF(ultimaVenta!)}
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} />
                      Descargar Factura PDF
                    </button>
                  )}
                  {ventaCreada && itemsConGarantia(ventaCreada).length > 0 && (
                    <button
                      onClick={() => setGarantiasStep(true)}
                      className="flex items-center justify-center gap-2 border border-blue-300 text-blue-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                      <CheckCircle size={16} />
                      Registrar garantías ({itemsConGarantia(ventaCreada).length} producto{itemsConGarantia(ventaCreada).length > 1 ? 's' : ''})
                    </button>
                  )}
                  <button onClick={cerrarExito} className="text-xs text-gray-400 hover:text-gray-600 pt-1">Cerrar</button>
                </div>
              </div>
              )
            ) : (
              <>
                <div className="px-6 py-4">
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total venta:</span>
                      <span className="font-bold text-blue-700">{fmt(total)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Cuotas:</span>
                      <span className="font-semibold">{numCuotas} × {fmt(total / numCuotas)}</span>
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-2">
                    {cuotasModal!.map(c => (
                      <div key={c.numero} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">{c.numero}</span>
                          <span className="text-sm text-gray-600">{c.fecha}</span>
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{fmt(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200">
                  <button onClick={() => setCuotasModal(null)} className="btn-secondary">Cancelar</button>
                  <button onClick={() => confirmarVenta()} disabled={guardando} className="btn-primary flex items-center gap-2">
                    <CheckCircle size={15} />
                    Confirmar Venta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
