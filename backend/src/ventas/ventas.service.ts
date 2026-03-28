import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';

@Injectable()
export class VentasService {
  constructor(private prisma: PrismaService) {}

  findAll(tipo?: string, estado?: string, clienteId?: string) {
    return this.prisma.venta.findMany({
      where: {
        tipo: tipo as any ?? undefined,
        estado: estado as any ?? undefined,
        clienteId: clienteId ?? undefined,
      },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        vendedor: { select: { id: true, nombre: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const v = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        cliente: true,
        vendedor: { select: { id: true, nombre: true } },
        items: { include: { producto: { select: { id: true, nombre: true, codigo: true } } } },
        cuotas: { orderBy: { numero: 'asc' }, include: { pagos: true } },
        despachos: true,
      },
    });
    if (!v) throw new NotFoundException(`Venta ${id} no encontrada`);
    return v;
  }

  async create(dto: CreateVentaDto, vendedorId?: string) {
    // 1. Cargar productos y validar stock
    const productosIds = dto.items.map(i => i.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productosIds }, activo: true },
    });

    if (productos.length !== productosIds.length) {
      throw new BadRequestException('Uno o más productos no existen o están inactivos');
    }

    // 2. Calcular totales
    const lineas = dto.items.map(item => {
      const prod = productos.find(p => p.id === item.productoId)!;
      if (prod.stock < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${prod.nombre}: disponible ${prod.stock}`);
      }
      return {
        productoId: item.productoId,
        nombreSnap: prod.nombre,
        precioSnap: prod.precio,
        costoSnap: prod.costo,
        cantidad: item.cantidad,
        subtotal: Number(prod.precio) * item.cantidad,
      };
    });

    const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
    const descuento = dto.descuento ?? 0;
    const total = subtotal - descuento;

    // 3. Validar crédito
    if (dto.tipo === 'credito') {
      if (!dto.numCuotas || dto.numCuotas < 1) {
        throw new BadRequestException('Ventas a crédito requieren número de cuotas');
      }
      if (dto.clienteId) {
        const cliente = await this.prisma.cliente.findUnique({ where: { id: dto.clienteId } });
        if (cliente) {
          const cupoDisponible = Number(cliente.cupoCredito) - Number(cliente.saldoDeuda);
          if (cupoDisponible < total) {
            throw new BadRequestException(`Cupo insuficiente. Disponible: $${cupoDisponible.toLocaleString('es-CO')}`);
          }
        }
      }
    }

    // 4. Generar número de venta
    const count = await this.prisma.venta.count();
    const numero = `V-${String(count + 1).padStart(4, '0')}`;

    // 5. Crear todo en transacción
    return this.prisma.$transaction(async (tx) => {
      // Crear venta
      const venta = await tx.venta.create({
        data: {
          numero,
          clienteId: dto.clienteId,
          vendedorId,
          tipo: dto.tipo,
          subtotal,
          descuento,
          total,
          numCuotas: dto.numCuotas,
          observaciones: dto.observaciones,
          items: { create: lineas },
        },
        include: { items: true },
      });

      // Generar cuotas si es crédito
      if (dto.tipo === 'credito' && dto.numCuotas) {
        const valorCuota = Math.round(total / dto.numCuotas);
        const cuotasData = Array.from({ length: dto.numCuotas }, (_, i) => {
          const fecha = new Date();
          fecha.setMonth(fecha.getMonth() + i + 1);
          return {
            ventaId: venta.id,
            numero: i + 1,
            valor: valorCuota,
            saldo: valorCuota,
            fechaVence: fecha,
          };
        });
        await tx.cuota.createMany({ data: cuotasData });

        // Actualizar saldo del cliente
        if (dto.clienteId) {
          await tx.cliente.update({
            where: { id: dto.clienteId },
            data: { saldoDeuda: { increment: total } },
          });
        }
      }

      // Reducir stock y registrar movimientos
      for (const linea of lineas) {
        const prod = productos.find(p => p.id === linea.productoId)!;
        await tx.producto.update({
          where: { id: linea.productoId },
          data: { stock: { decrement: linea.cantidad } },
        });
        await tx.inventarioMovimiento.create({
          data: {
            productoId: linea.productoId,
            usuarioId: vendedorId,
            tipo: 'salida',
            cantidad: -linea.cantidad,
            stockAntes: prod.stock,
            stockDespues: prod.stock - linea.cantidad,
            referenciaTipo: 'venta',
            referenciaId: venta.id,
          },
        });
      }

      return this.findOne(venta.id);
    });
  }

  async anular(id: string) {
    const venta = await this.findOne(id);
    if (venta.estado === 'anulado') throw new BadRequestException('La venta ya está anulada');
    return this.prisma.venta.update({ where: { id }, data: { estado: 'anulado' } });
  }

  async marcarDespachado(id: string) {
    await this.findOne(id);
    return this.prisma.venta.update({ where: { id }, data: { estado: 'despachado' } });
  }
}
