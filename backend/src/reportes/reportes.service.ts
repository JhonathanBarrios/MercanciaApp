import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async resumenGeneral() {
    const [totalVentas, totalClientes, totalProductos, cuotasPendientes] = await Promise.all([
      this.prisma.venta.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { estado: { not: 'anulado' } },
      }),
      this.prisma.cliente.count({ where: { activo: true } }),
      this.prisma.producto.count({ where: { activo: true } }),
      this.prisma.cuota.aggregate({
        _sum: { saldo: true },
        _count: { id: true },
        where: { estado: { in: ['pendiente', 'vencida', 'parcial'] } },
      }),
    ]);

    return {
      totalVentas: totalVentas._sum.total ?? 0,
      numVentas: totalVentas._count.id,
      totalClientes,
      totalProductos,
      carteraPendiente: cuotasPendientes._sum.saldo ?? 0,
      cuotasPendientes: cuotasPendientes._count.id,
    };
  }

  async ventasPorMes() {
    const ventas = await this.prisma.venta.findMany({
      where: {
        estado: { not: 'anulado' },
        fecha: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
      },
      select: { fecha: true, tipo: true, total: true },
      orderBy: { fecha: 'asc' },
    });

    const meses: Record<string, { mes: string; contado: number; credito: number }> = {};
    for (const v of ventas) {
      const key = `${v.fecha.getFullYear()}-${String(v.fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!meses[key]) meses[key] = { mes: key, contado: 0, credito: 0 };
      meses[key][v.tipo] += Number(v.total);
    }
    return Object.values(meses);
  }

  async topProductos(limit = 10) {
    const items = await this.prisma.ventaItem.groupBy({
      by: ['productoId', 'nombreSnap'],
      _sum: { subtotal: true, cantidad: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
      where: { venta: { estado: { not: 'anulado' } } },
    });
    return items.map(i => ({
      productoId: i.productoId,
      nombre: i.nombreSnap,
      totalIngresos: i._sum.subtotal ?? 0,
      unidadesVendidas: i._sum.cantidad ?? 0,
    }));
  }

  async topClientes(limit = 10) {
    const ventas = await this.prisma.venta.groupBy({
      by: ['clienteId'],
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
      where: { clienteId: { not: null }, estado: { not: 'anulado' } },
    });

    const ids = ventas.map(v => v.clienteId!);
    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    });

    return ventas.map(v => ({
      clienteId: v.clienteId,
      nombre: clientes.find(c => c.id === v.clienteId)?.nombre ?? 'Desconocido',
      totalCompras: v._sum.total ?? 0,
      numCompras: v._count.id,
    }));
  }

  async alertasStock() {
    return this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.codigo, p.nombre, c.nombre AS categoria, p.stock, p.stock_minimo,
             (p.stock_minimo - p.stock) AS unidades_faltantes
      FROM productos p
      JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = true AND p.stock <= p.stock_minimo
      ORDER BY unidades_faltantes DESC
    `;
  }

  async carteraActiva() {
    return this.prisma.$queryRaw<any[]>`
      SELECT c.id AS cuota_id, c.numero, c.valor, c.saldo, c.fecha_vence, c.estado,
             v.numero AS venta_numero, v.total AS total_venta,
             cli.nombre AS cliente_nombre, cli.telefono,
             CURRENT_DATE - c.fecha_vence AS dias_mora
      FROM cuotas c
      JOIN ventas v ON v.id = c.venta_id
      LEFT JOIN clientes cli ON cli.id = v.cliente_id
      WHERE c.estado IN ('pendiente','vencida','parcial')
      ORDER BY c.fecha_vence ASC
    `;
  }
}
