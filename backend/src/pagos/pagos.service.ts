import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePagoDto } from './dto/create-pago.dto';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  findByCuota(cuotaId: string) {
    return this.prisma.pago.findMany({
      where: { cuotaId },
      orderBy: { createdAt: 'desc' },
      include: { cobrador: { select: { id: true, nombre: true } } },
    });
  }

  async registrar(dto: CreatePagoDto, cobradorId?: string) {
    const cuota = await this.prisma.cuota.findUnique({ where: { id: dto.cuotaId } });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');
    if (cuota.estado === 'pagada') throw new BadRequestException('La cuota ya está completamente pagada');

    if (dto.valor > Number(cuota.saldo)) {
      throw new BadRequestException(`El pago ($${dto.valor}) supera el saldo pendiente ($${cuota.saldo})`);
    }

    const nuevoSaldo = Number(cuota.saldo) - dto.valor;
    const nuevoEstado = nuevoSaldo === 0 ? 'pagada' : 'parcial';

    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: { ...dto, cobradorId },
      });

      await tx.cuota.update({
        where: { id: dto.cuotaId },
        data: { saldo: nuevoSaldo, estado: nuevoEstado as any },
      });

      // Si todas las cuotas están pagadas, actualizar saldo del cliente
      const venta = await tx.venta.findUnique({
        where: { id: cuota.ventaId },
        include: { cuotas: true },
      });
      if (venta?.clienteId && nuevoEstado === 'pagada') {
        const pendientes = venta.cuotas.filter(c => c.id !== dto.cuotaId && c.estado !== 'pagada');
        if (pendientes.length === 0) {
          await tx.cliente.update({
            where: { id: venta.clienteId },
            data: { saldoDeuda: { decrement: Number(venta.total) } },
          });
        } else {
          await tx.cliente.update({
            where: { id: venta.clienteId },
            data: { saldoDeuda: { decrement: dto.valor } },
          });
        }
      }

      return pago;
    });
  }
}
