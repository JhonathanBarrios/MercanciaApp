import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CreatePedidoDto) {
    // 1. Buscar o crear cliente por email
    let cliente = await this.prisma.cliente.findFirst({
      where: { email: dto.email },
    });

    if (!cliente) {
      cliente = await this.prisma.cliente.create({
        data: {
          nombre: dto.nombre,
          email: dto.email,
          telefono: dto.celular,
          direccion: dto.direccion ?? '',
          cupoCredito: 0,
          saldoDeuda: 0,
        },
      });
    }

    // 2. Cargar productos y validar stock
    const productosIds = dto.items.map(i => i.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productosIds }, activo: true },
    });

    if (productos.length !== productosIds.length) {
      throw new BadRequestException('Uno o más productos no están disponibles');
    }

    // 3. Calcular líneas y totales
    const lineas = dto.items.map(item => {
      const prod = productos.find(p => p.id === item.productoId)!;
      if (prod.stock < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${prod.nombre}`);
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
    const total = subtotal;

    // 4. Generar número
    const count = await this.prisma.venta.count();
    const numero = `V-${String(count + 1).padStart(4, '0')}`;

    // 5. Crear venta en transacción
    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          numero,
          clienteId: cliente!.id,
          tipo: 'contado',
          subtotal,
          descuento: 0,
          total,
          observaciones: `Pedido web — Tel: ${dto.celular}${dto.direccion ? ` | Dir: ${dto.direccion}` : ''}`,
          items: { create: lineas },
        },
      });

      // Reducir stock
      for (const linea of lineas) {
        const prod = productos.find(p => p.id === linea.productoId)!;
        await tx.producto.update({
          where: { id: linea.productoId },
          data: { stock: { decrement: linea.cantidad } },
        });
        await tx.inventarioMovimiento.create({
          data: {
            productoId: linea.productoId,
            tipo: 'salida',
            cantidad: -linea.cantidad,
            stockAntes: prod.stock,
            stockDespues: prod.stock - linea.cantidad,
            referenciaTipo: 'venta',
            referenciaId: venta.id,
          },
        });
      }

      return { numero: venta.numero, ventaId: venta.id, total };
    });
  }
}
