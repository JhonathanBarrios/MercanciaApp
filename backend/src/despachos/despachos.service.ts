import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDespachoDto } from './dto/update-despacho.dto';

@Injectable()
export class DespachosService {
  constructor(private prisma: PrismaService) {}

  findAll(estado?: string) {
    return this.prisma.despacho.findMany({
      where: { estado: estado as any ?? undefined },
      include: {
        venta: {
          select: {
            id: true, numero: true, total: true,
            cliente: { select: { id: true, nombre: true, telefono: true, direccion: true } },
          },
        },
        despachador: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const d = await this.prisma.despacho.findUnique({
      where: { id },
      include: {
        venta: { include: { items: true, cliente: true } },
        despachador: { select: { id: true, nombre: true } },
      },
    });
    if (!d) throw new NotFoundException('Despacho no encontrado');
    return d;
  }

  async update(id: string, dto: UpdateDespachoDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.fechaProgramada) data.fechaProgramada = new Date(dto.fechaProgramada);
    if (dto.estado === 'entregado') data.fechaEntrega = new Date();
    return this.prisma.despacho.update({ where: { id }, data });
  }

  async crear(ventaId: string, direccion: string, ciudad?: string) {
    return this.prisma.despacho.create({
      data: { ventaId, direccion, ciudad: ciudad ?? 'Cali' },
    });
  }
}
