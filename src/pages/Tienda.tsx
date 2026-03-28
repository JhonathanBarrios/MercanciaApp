import { useState, useEffect } from 'react'
import { ShoppingCart, Search, Store, X, Plus, Minus, CheckCircle, RefreshCw } from 'lucide-react'
import { productosApi } from '../api/services'
import { Link } from 'react-router-dom'

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const EMOJI: Record<string, string> = {
  Celulares: '📱', 'Ropa de Cama': '🛏️', Muebles: '🛋️',
  Electrodomésticos: '🏠', Electrónica: '📺',
}

type CartItem = { id: string; nombre: string; precio: number; cantidad: number }

export default function Tienda() {
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [cat, setCat]             = useState('Todas')
  const [cart, setCart]           = useState<CartItem[]>([])
  const [cartOpen, setCartOpen]   = useState(false)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  useEffect(() => {
    productosApi.listar()
      .then(setProductos)
      .finally(() => setLoading(false))
  }, [])

  const categorias = ['Todas', ...Array.from(new Set(productos.map((p: any) => p.categoria?.nombre ?? 'Otros')))]
  const filtered = productos.filter((p: any) => {
    const catNombre = p.categoria?.nombre ?? 'Otros'
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCat = cat === 'Todas' || catNombre === cat
    return matchSearch && matchCat && p.stock > 0
  })

  const addToCart = (prod: any) => {
    setCart(prev => {
      const exist = prev.find(c => c.id === prod.id)
      if (exist) return prev.map(c => c.id === prod.id ? { ...c, cantidad: c.cantidad + 1 } : c)
      return [...prev, { id: prod.id, nombre: prod.nombre, precio: Number(prod.precio), cantidad: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, cantidad: Math.max(1, c.cantidad + delta) } : c)
         .filter(c => c.cantidad > 0)
    )
  }

  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.id !== id))
  const total      = cart.reduce((s, c) => s + c.precio * c.cantidad, 0)
  const totalItems = cart.reduce((s, c) => s + c.cantidad, 0)

  const enviarPedido = () => {
    setPedidoEnviado(true)
    setCart([])
    setTimeout(() => { setPedidoEnviado(false); setCartOpen(false) }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
              <Store size={18} />
            </div>
            <div>
              <p className="font-bold">MercaApp</p>
              <p className="text-blue-300 text-xs">Tienda Online</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-blue-200 hover:text-white text-sm transition-colors hidden sm:block">
              Panel Admin
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ShoppingCart size={18} />
              <span className="text-sm font-medium hidden sm:block">Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">Catálogo de Productos</h1>
          <p className="text-blue-200 mb-6">Solicita el despacho de tus productos favoritos</p>
          <div className="relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                cat === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw size={28} className="animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">{filtered.length} productos disponibles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p: any) => {
                const catNombre = p.categoria?.nombre ?? 'Otros'
                const enCarrito = cart.find(c => c.id === p.id)
                return (
                  <div key={p.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 h-36 flex items-center justify-center">
                      <div className="text-4xl">{EMOJI[catNombre] ?? '�'}</div>
                    </div>
                    <div className="p-4">
                      <span className="badge-blue text-xs mb-2 inline-block">{catNombre}</span>
                      <h3 className="font-medium text-gray-900 text-sm mb-1 leading-snug">{p.nombre}</h3>
                      <p className="text-blue-600 font-bold text-lg mb-3">{fmt(Number(p.precio))}</p>
                      {enCarrito ? (
                        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-1.5">
                          <button onClick={() => updateQty(p.id, -1)} className="text-blue-600 hover:text-blue-800">
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold text-blue-700">{enCarrito.cantidad}</span>
                          <button onClick={() => updateQty(p.id, 1)} className="text-blue-600 hover:text-blue-800">
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={15} />
                          Agregar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Panel carrito */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white w-full max-w-sm shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Tu Carrito</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {pedidoEnviado ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <CheckCircle size={56} className="text-green-500 mb-4" />
                <h3 className="font-bold text-gray-900 text-lg mb-2">¡Pedido enviado!</h3>
                <p className="text-gray-500 text-sm">Tu solicitud de despacho fue recibida. Te contactaremos pronto.</p>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                <ShoppingCart size={48} className="opacity-20 mb-3" />
                <p className="text-sm">Tu carrito está vacío</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-500">{fmt(item.precio)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 w-20 text-right">{fmt(item.precio * item.cantidad)}</p>
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 ml-1">
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 p-5 space-y-3">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-600 text-lg">{fmt(total)}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tu nombre</label>
                    <input
                      type="text"
                      placeholder="Ej: María García"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dirección de entrega</label>
                    <input
                      type="text"
                      placeholder="Calle, barrio, ciudad"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={enviarPedido} className="w-full btn-primary py-3 text-sm font-semibold">
                    Solicitar Despacho
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
