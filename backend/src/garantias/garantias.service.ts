import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGarantiaDto } from './dto/create-garantia.dto';

@Injectable()
export class GarantiasService {
  constructor(private prisma: PrismaService) {}

  findAll(estado?: string, clienteId?: string) {
    return this.prisma.garantia.findMany({
      where: {
        estado: estado as any ?? undefined,
        clienteId: clienteId ?? undefined,
      },
      include: {
        producto: { select: { id: true, nombre: true, codigo: true } },
        cliente:  { select: { id: true, nombre: true, telefono: true } },
      },
      orderBy: { fechaVence: 'asc' },
    });
  }

  async findOne(id: string) {
    const g = await this.prisma.garantia.findUnique({
      where: { id },
      include: { producto: true, cliente: true },
    });
    if (!g) throw new NotFoundException('Garantía no encontrada');
    return g;
  }

  create(dto: CreateGarantiaDto) {
    const fechaVenta = new Date(dto.fechaVenta);
    const fechaVence = new Date(fechaVenta);
    fechaVence.setMonth(fechaVence.getMonth() + dto.meses);

    return this.prisma.garantia.create({
      data: {
        ...dto,
        fechaVenta,
        fechaVence,
      },
      include: { producto: true, cliente: true },
    });
  }

  async updateEstado(id: string, estado: string) {
    await this.findOne(id);
    return this.prisma.garantia.update({ where: { id }, data: { estado: estado as any } });
  }

  async actualizarEstados() {
    const hoy = new Date();
    const en30dias = new Date();
    en30dias.setDate(en30dias.getDate() + 30);

    await this.prisma.garantia.updateMany({
      where: { estado: { in: ['activa', 'por_vencer'] as any }, fechaVence: { lt: hoy } },
      data: { estado: 'vencida' as any },
    });
    await this.prisma.garantia.updateMany({
      where: { estado: 'activa' as any, fechaVence: { gte: hoy, lte: en30dias } },
      data: { estado: 'por_vencer' as any },
    });
    return { ok: true };
  }
}
