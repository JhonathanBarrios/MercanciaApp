import { api } from './client'

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  perfil: () => api.get('/auth/perfil').then(r => r.data),
}

// ─── Productos ───────────────────────────────────────────────
export const productosApi = {
  listar: (params?: { search?: string; categoriaId?: number }) =>
    api.get('/productos', { params }).then(r => r.data),
  obtener: (id: string) => api.get(`/productos/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/productos', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.patch(`/productos/${id}`, data).then(r => r.data),
  eliminar: (id: string) => api.delete(`/productos/${id}`).then(r => r.data),
  alertasStock: () => api.get('/productos/alertas-stock').then(r => r.data),
  ajustarStock: (id: string, data: any) => api.post(`/productos/${id}/ajustar-stock`, data).then(r => r.data),
}

// ─── Clientes ────────────────────────────────────────────────
export const clientesApi = {
  listar: (search?: string) =>
    api.get('/clientes', { params: search ? { search } : {} }).then(r => r.data),
  obtener: (id: string) => api.get(`/clientes/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/clientes', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.patch(`/clientes/${id}`, data).then(r => r.data),
  eliminar: (id: string) => api.delete(`/clientes/${id}`).then(r => r.data),
}

// ─── Ventas ──────────────────────────────────────────────────
export const ventasApi = {
  listar: (params?: { tipo?: string; estado?: string; clienteId?: string }) =>
    api.get('/ventas', { params }).then(r => r.data),
  obtener: (id: string) => api.get(`/ventas/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/ventas', data).then(r => r.data),
  anular: (id: string) => api.patch(`/ventas/${id}/anular`).then(r => r.data),
  despachar: (id: string) => api.patch(`/ventas/${id}/despachar`).then(r => r.data),
}

// ─── Pagos ───────────────────────────────────────────────────
export const pagosApi = {
  porCuota: (cuotaId: string) => api.get(`/pagos/cuota/${cuotaId}`).then(r => r.data),
  registrar: (data: any) => api.post('/pagos', data).then(r => r.data),
}

// ─── Garantías ───────────────────────────────────────────────
export const garantiasApi = {
  listar: (params?: { estado?: string; clienteId?: string }) =>
    api.get('/garantias', { params }).then(r => r.data),
  crear: (data: any) => api.post('/garantias', data).then(r => r.data),
  actualizarEstado: (id: string, estado: string) =>
    api.patch(`/garantias/${id}/estado`, { estado }).then(r => r.data),
  actualizarEstados: () => api.post('/garantias/actualizar-estados').then(r => r.data),
}

// ─── Despachos ───────────────────────────────────────────────
export const despachosApi = {
  listar: (estado?: string) =>
    api.get('/despachos', { params: estado ? { estado } : {} }).then(r => r.data),
  obtener: (id: string) => api.get(`/despachos/${id}`).then(r => r.data),
  actualizar: (id: string, data: any) => api.patch(`/despachos/${id}`, data).then(r => r.data),
  crear: (data: any) => api.post('/despachos/crear', data).then(r => r.data),
}

// ─── Reportes ────────────────────────────────────────────────
export const reportesApi = {
  resumen: () => api.get('/reportes/resumen').then(r => r.data),
  ventasPorMes: () => api.get('/reportes/ventas-por-mes').then(r => r.data),
  topProductos: (limit = 10) => api.get('/reportes/top-productos', { params: { limit } }).then(r => r.data),
  topClientes: (limit = 10) => api.get('/reportes/top-clientes', { params: { limit } }).then(r => r.data),
  alertasStock: () => api.get('/reportes/alertas-stock').then(r => r.data),
  carteraActiva: () => api.get('/reportes/cartera-activa').then(r => r.data),
}
