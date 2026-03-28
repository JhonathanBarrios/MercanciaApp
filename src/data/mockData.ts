export const productos = [
  { id: 1, codigo: 'ART-001', nombre: 'Samsung Galaxy A15 5G', categoria: 'Celulares', precio: 980000, stock: 12, stockMin: 3, proveedor: 'Tecno Distribuciones' },
  { id: 2, codigo: 'ART-002', nombre: 'iPhone 13 128GB', categoria: 'Celulares', precio: 2850000, stock: 5, stockMin: 2, proveedor: 'Tecno Distribuciones' },
  { id: 3, codigo: 'ART-003', nombre: 'Juego de Cama Queen Algodón 500 hilos', categoria: 'Ropa de Cama', precio: 185000, stock: 20, stockMin: 5, proveedor: 'Textiles del Norte' },
  { id: 4, codigo: 'ART-004', nombre: 'Juego de Cama Doble Microfibra', categoria: 'Ropa de Cama', precio: 120000, stock: 3, stockMin: 5, proveedor: 'Textiles del Norte' },
  { id: 5, codigo: 'ART-005', nombre: 'Sala Esquinera 5 Puestos Gris', categoria: 'Muebles', precio: 1850000, stock: 4, stockMin: 2, proveedor: 'Muebles & Estilos' },
  { id: 6, codigo: 'ART-006', nombre: 'Comedor 4 Puestos Madera', categoria: 'Muebles', precio: 1200000, stock: 3, stockMin: 1, proveedor: 'Muebles & Estilos' },
  { id: 7, codigo: 'ART-007', nombre: 'Lavadora LG 10kg Carga Frontal', categoria: 'Electrodomésticos', precio: 1650000, stock: 6, stockMin: 2, proveedor: 'ElectroHogar S.A.' },
  { id: 8, codigo: 'ART-008', nombre: 'Nevera Samsung 300L No Frost', categoria: 'Electrodomésticos', precio: 2100000, stock: 4, stockMin: 2, proveedor: 'ElectroHogar S.A.' },
  { id: 9, codigo: 'ART-009', nombre: 'Televisor 55" 4K Smart TV', categoria: 'Electrónica', precio: 1980000, stock: 7, stockMin: 2, proveedor: 'Tecno Distribuciones' },
  { id: 10, codigo: 'ART-010', nombre: 'Licuadora Oster 10 velocidades', categoria: 'Electrodomésticos', precio: 185000, stock: 2, stockMin: 5, proveedor: 'ElectroHogar S.A.' },
  { id: 11, codigo: 'ART-011', nombre: 'Cama Doble + Colchón Resortado', categoria: 'Muebles', precio: 980000, stock: 5, stockMin: 2, proveedor: 'Muebles & Estilos' },
  { id: 12, codigo: 'ART-012', nombre: 'Motorola G54 5G 256GB', categoria: 'Celulares', precio: 750000, stock: 8, stockMin: 3, proveedor: 'Tecno Distribuciones' },
]

export const clientes = [
  { id: 1, nombre: 'María García', cedula: '1082345678', telefono: '310-555-0101', direccion: 'Cra 5 #12-34', tipo: 'credito', cupo: 5000000, saldo: 1850000, estado: 'al dia' },
  { id: 2, nombre: 'Juan Rodríguez', cedula: '1093456789', telefono: '320-555-0202', direccion: 'Cl 8 #23-45', tipo: 'credito', cupo: 4000000, saldo: 4200000, estado: 'mora' },
  { id: 3, nombre: 'Ana Martínez', cedula: '1074567890', telefono: '315-555-0303', direccion: 'Cra 12 #5-67', tipo: 'contado', cupo: 0, saldo: 0, estado: 'al dia' },
  { id: 4, nombre: 'Carlos López', cedula: '1065678901', telefono: '312-555-0404', direccion: 'Cl 15 #34-56', tipo: 'credito', cupo: 8000000, saldo: 3750000, estado: 'al dia' },
  { id: 5, nombre: 'Lucía Herrera', cedula: '1056789012', telefono: '318-555-0505', direccion: 'Cra 20 #8-90', tipo: 'credito', cupo: 6000000, saldo: 5800000, estado: 'mora' },
  { id: 6, nombre: 'Pedro Gómez', cedula: '1047890123', telefono: '313-555-0606', direccion: 'Cl 3 #45-12', tipo: 'contado', cupo: 0, saldo: 0, estado: 'al dia' },
]

export const ventas = [
  { id: 'V-0041', fecha: '2026-03-27', cliente: 'María García', tipo: 'credito', total: 1850000, estado: 'despachado', items: 1 },
  { id: 'V-0040', fecha: '2026-03-27', cliente: 'Pedro Gómez', tipo: 'contado', total: 1980000, estado: 'despachado', items: 1 },
  { id: 'V-0039', fecha: '2026-03-26', cliente: 'Carlos López', tipo: 'credito', total: 3750000, estado: 'despachado', items: 2 },
  { id: 'V-0038', fecha: '2026-03-26', cliente: 'Mostrador', tipo: 'contado', total: 980000, estado: 'despachado', items: 1 },
  { id: 'V-0037', fecha: '2026-03-25', cliente: 'Lucía Herrera', tipo: 'credito', total: 2850000, estado: 'pendiente', items: 1 },
  { id: 'V-0036', fecha: '2026-03-25', cliente: 'Ana Martínez', tipo: 'contado', total: 305000, estado: 'despachado', items: 2 },
]

export const cuotas = [
  { id: 1, cliente: 'Juan Rodríguez', venta: 'V-0028', cuota: 1, total: 6, valor: 700000, vencimiento: '2026-03-10', estado: 'vencida', diasMora: 17 },
  { id: 2, cliente: 'Lucía Herrera', venta: 'V-0031', cuota: 2, total: 12, valor: 487500, vencimiento: '2026-03-20', estado: 'vencida', diasMora: 7 },
  { id: 3, cliente: 'María García', venta: 'V-0035', cuota: 1, total: 6, valor: 308333, vencimiento: '2026-03-27', estado: 'por vencer', diasMora: 0 },
  { id: 4, cliente: 'Carlos López', venta: 'V-0039', cuota: 1, total: 12, valor: 312500, vencimiento: '2026-04-10', estado: 'pendiente', diasMora: 0 },
  { id: 5, cliente: 'Lucía Herrera', venta: 'V-0031', cuota: 3, total: 12, valor: 487500, vencimiento: '2026-04-20', estado: 'pendiente', diasMora: 0 },
  { id: 6, cliente: 'María García', venta: 'V-0035', cuota: 2, total: 6, valor: 308333, vencimiento: '2026-04-27', estado: 'pendiente', diasMora: 0 },
]

export const kpis = {
  ventasHoy: 3830000,
  ventasMes: 48250000,
  clientesMora: 2,
  pedidosPendientes: 1,
  stockBajo: 3,
  carteraVencida: 7940000,
}
