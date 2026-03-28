import { useState, useRef, ChangeEvent, useEffect } from 'react'
import { Search, Plus, AlertTriangle, Edit2, Trash2, Upload, Download, X, CheckCircle, FileSpreadsheet, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { productosApi } from '../api/services'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

type Producto = any

type ImportRow = {
  codigo: string
  nombre: string
  categoria: string
  precio: number
  stock: number
  stockMin: number
  proveedor: string
  _valido: boolean
  _error: string
}

const COLUMNAS_REQUERIDAS = ['codigo', 'nombre', 'categoria', 'precio', 'stock', 'stockMin', 'proveedor']

function validarFila(row: Record<string, unknown>, idx: number): ImportRow {
  const codigo = String(row['codigo'] ?? row['Código'] ?? row['CODIGO'] ?? '').trim()
  const nombre = String(row['nombre'] ?? row['Nombre'] ?? row['NOMBRE'] ?? '').trim()
  const categoria = String(row['categoria'] ?? row['Categoría'] ?? row['CATEGORIA'] ?? '').trim()
  const precio = Number(row['precio'] ?? row['Precio'] ?? row['PRECIO'] ?? 0)
  const stock = Number(row['stock'] ?? row['Stock'] ?? row['STOCK'] ?? 0)
  const stockMin = Number(row['stockMin'] ?? row['Stock Mínimo'] ?? row['STOCK_MIN'] ?? 0)
  const proveedor = String(row['proveedor'] ?? row['Proveedor'] ?? row['PROVEEDOR'] ?? '').trim()

  const errores: string[] = []
  if (!codigo) errores.push('Código vacío')
  if (!nombre) errores.push('Nombre vacío')
  if (!categoria) errores.push('Categoría vacía')
  if (isNaN(precio) || precio <= 0) errores.push('Precio inválido')
  if (isNaN(stock) || stock < 0) errores.push('Stock inválido')

  return { codigo, nombre, categoria, precio, stock, stockMin, proveedor, _valido: errores.length === 0, _error: errores.join(', ') }
}

type EditForm = { nombre: string; codigo: string; precio: string; stock: string; stockMinimo: string }

export default function Productos() {
  const [lista, setLista] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')
  const [modalImport, setModalImport] = useState(false)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [importDone, setImportDone] = useState(false)
  const [archivoNombre, setArchivoNombre] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [editProducto, setEditProducto] = useState<any | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ nombre: '', codigo: '', precio: '', stock: '', stockMinimo: '' })
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState<any | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const abrirEditar = (p: any) => {
    setEditProducto(p)
    setEditForm({
      nombre: p.nombre,
      codigo: p.codigo,
      precio: String(p.precio),
      stock: String(p.stock),
      stockMinimo: String(p.stockMinimo),
    })
  }

  const guardarEdicion = async () => {
    if (!editProducto) return
    setGuardandoEdit(true)
    try {
      const actualizado = await productosApi.actualizar(editProducto.id, {
        nombre: editForm.nombre,
        codigo: editForm.codigo,
        precio: Number(editForm.precio),
        stock: Number(editForm.stock),
        stockMinimo: Number(editForm.stockMinimo),
      })
      setLista(prev => prev.map(x => x.id === actualizado.id ? { ...x, ...actualizado } : x))
      setEditProducto(null)
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al guardar')
    } finally { setGuardandoEdit(false) }
  }

  const ejecutarEliminar = async () => {
    if (!confirmarEliminar) return
    setEliminando(true)
    try {
      await productosApi.eliminar(confirmarEliminar.id)
      setLista(prev => prev.filter(x => x.id !== confirmarEliminar.id))
      setConfirmarEliminar(null)
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'No se pudo eliminar')
    } finally { setEliminando(false) }
  }

  const cargar = async () => {
    setLoading(true)
    try { setLista(await productosApi.listar()) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const categorias = ['Todas', ...Array.from(new Set(lista.map((p: any) => p.categoria?.nombre ?? 'Sin categoría')))]

  const filtered = lista.filter((p: any) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'Todas' || (p.categoria?.nombre ?? '') === catFilter
    return matchSearch && matchCat
  })

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivoNombre(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
      setImportRows(rows.map((r, i) => validarFila(r, i)))
      setImportDone(false)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const confirmarImport = () => {
    const validos = importRows.filter(r => r._valido)
    const nuevos: Producto[] = validos.map((r, i) => ({
      id: lista.length + i + 1,
      codigo: r.codigo,
      nombre: r.nombre,
      categoria: r.categoria,
      precio: r.precio,
      stock: r.stock,
      stockMin: r.stockMin,
      proveedor: r.proveedor,
    }))
    setLista(prev => [...prev, ...nuevos])
    setImportDone(true)
  }

  const cerrarModal = () => {
    setModalImport(false)
    setImportRows([])
    setImportDone(false)
    setArchivoNombre('')
  }

  const descargarPlantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['codigo', 'nombre', 'categoria', 'precio', 'stock', 'stockMin', 'proveedor'],
      ['ART-013', 'Ejemplo Producto', 'Celulares', 850000, 10, 3, 'Mi Proveedor'],
      ['ART-014', 'Otro Producto', 'Muebles', 1200000, 5, 2, 'Otro Proveedor'],
    ])
    ws['!cols'] = [10, 30, 20, 12, 8, 10, 25].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
    XLSX.writeFile(wb, 'plantilla_productos.xlsx')
  }

  const validCount = importRows.filter(r => r._valido).length
  const errorCount = importRows.filter(r => !r._valido).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">{lista.length} productos registrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={descargarPlantilla}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Plantilla Excel
          </button>
          <button
            onClick={() => setModalImport(true)}
            className="btn-secondary flex items-center gap-2 text-sm border-green-300 text-green-700 hover:bg-green-50"
          >
            <Upload size={16} />
            Importar Excel
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />
            Nuevo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                catFilter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400"><RefreshCw size={18} className="animate-spin inline" /></td></tr>
              )}
              {!loading && filtered.map((p: any) => {
                const stockBajo = p.stock <= p.stockMinimo
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.nombre}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-blue">{p.categoria?.nombre ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(Number(p.precio))}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {stockBajo && <AlertTriangle size={14} className="text-red-500" />}
                        <span className={`font-semibold ${stockBajo ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</span>
                        <span className="text-gray-400 text-xs">/ mín {p.stockMinimo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.proveedor?.nombre ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEditar(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmarEliminar(p)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Resumen stock */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total productos', value: lista.length, color: 'text-gray-900' },
          { label: 'Stock bajo', value: lista.filter((p: any) => p.stock <= p.stockMinimo).length, color: 'text-red-600' },
          { label: 'Categorías', value: categorias.length - 1, color: 'text-blue-600' },
        ].map(item => (
          <div key={item.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Modal Importar Excel */}
      {modalImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Importar desde Excel</h2>
                  <p className="text-xs text-gray-500">Columnas requeridas: {COLUMNAS_REQUERIDAS.join(', ')}</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {importDone ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle size={56} className="text-green-500 mb-4" />
                  <h3 className="font-bold text-gray-900 text-lg mb-1">¡Importación exitosa!</h3>
                  <p className="text-gray-500 text-sm">{validCount} productos agregados al inventario.</p>
                  <button onClick={cerrarModal} className="btn-primary mt-6">Cerrar</button>
                </div>
              ) : (
                <>
                  {/* Zona de carga */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                    {archivoNombre ? (
                      <p className="font-medium text-green-700">{archivoNombre}</p>
                    ) : (
                      <>
                        <p className="font-medium text-gray-700">Haz clic para seleccionar el archivo</p>
                        <p className="text-xs text-gray-400 mt-1">Acepta .xlsx y .xls</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
                  </div>

                  {/* Resumen de filas */}
                  {importRows.length > 0 && (
                    <>
                      <div className="flex gap-3">
                        <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-green-600">{validCount}</p>
                          <p className="text-xs text-green-700">Filas válidas</p>
                        </div>
                        {errorCount > 0 && (
                          <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                            <p className="text-xs text-red-700">Con errores (se omitirán)</p>
                          </div>
                        )}
                      </div>

                      {/* Tabla preview */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-gray-500 font-semibold"></th>
                                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Código</th>
                                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Nombre</th>
                                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Categoría</th>
                                <th className="px-3 py-2 text-right text-gray-500 font-semibold">Precio</th>
                                <th className="px-3 py-2 text-center text-gray-500 font-semibold">Stock</th>
                                <th className="px-3 py-2 text-left text-gray-500 font-semibold">Proveedor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {importRows.map((r, i) => (
                                <tr key={i} className={r._valido ? 'hover:bg-gray-50' : 'bg-red-50'}>
                                  <td className="px-3 py-2">
                                    {r._valido
                                      ? <CheckCircle size={13} className="text-green-500" />
                                      : <span title={r._error}><AlertTriangle size={13} className="text-red-500" /></span>}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-gray-500">{r.codigo}</td>
                                  <td className="px-3 py-2 text-gray-900 max-w-[160px] truncate">{r.nombre}</td>
                                  <td className="px-3 py-2 text-gray-600">{r.categoria}</td>
                                  <td className="px-3 py-2 text-right">{fmt(r.precio)}</td>
                                  <td className="px-3 py-2 text-center">{r.stock}</td>
                                  <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{r.proveedor}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!importDone && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <button onClick={descargarPlantilla} className="btn-secondary flex items-center gap-2 text-sm">
                  <Download size={15} />
                  Descargar plantilla
                </button>
                <div className="flex gap-3">
                  <button onClick={cerrarModal} className="btn-secondary">Cancelar</button>
                  <button
                    onClick={confirmarImport}
                    disabled={validCount === 0}
                    className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Upload size={15} />
                    Importar {validCount > 0 ? `(${validCount})` : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Editar Producto */}
      {editProducto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit2 size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Editar Producto</h2>
                  <p className="text-xs text-gray-500 font-mono">{editProducto.codigo}</p>
                </div>
              </div>
              <button onClick={() => setEditProducto(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del producto *</label>
                  <input
                    type="text"
                    value={editForm.nombre}
                    onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                  <input
                    type="text"
                    value={editForm.codigo}
                    onChange={e => setEditForm(f => ({ ...f, codigo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio (COP)</label>
                  <input
                    type="number"
                    value={editForm.precio}
                    onChange={e => setEditForm(f => ({ ...f, precio: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock actual</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={e => setEditForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock mínimo</label>
                  <input
                    type="number"
                    value={editForm.stockMinimo}
                    onChange={e => setEditForm(f => ({ ...f, stockMinimo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                Categoría y proveedor se gestionan desde la configuración del sistema.
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200">
              <button onClick={() => setEditProducto(null)} className="btn-secondary" disabled={guardandoEdit}>Cancelar</button>
              <button
                onClick={guardarEdicion}
                disabled={guardandoEdit || !editForm.nombre}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle size={15} />
                {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">¿Eliminar producto?</h2>
                <p className="text-sm text-gray-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-5 text-sm">
              <p className="font-medium text-gray-800">{confirmarEliminar.nombre}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{confirmarEliminar.codigo}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmarEliminar(null)} className="btn-secondary" disabled={eliminando}>Cancelar</button>
              <button
                onClick={ejecutarEliminar}
                disabled={eliminando}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                <Trash2 size={15} />
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
