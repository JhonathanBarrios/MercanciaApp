import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.cliente.findMany({
      where: {
        activo: true,
        nombre: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        ventas: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!c) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return c;
  }

  async create(dto: CreateClienteDto) {
    if (dto.documento) {
      const existe = await this.prisma.cliente.findFirst({
        where: { documento: dto.documento, tipoDocumento: dto.tipoDocumento ?? 'CC' },
      });
      if (existe) throw new ConflictException('Ya existe un cliente con ese documento');
    }
    return this.prisma.cliente.create({ data: dto });
  }

  async update(id: string, dto: UpdateClienteDto) {
    await this.findOne(id);
    return this.prisma.cliente.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cliente.update({ where: { id }, data: { activo: false } });
  }

  async actualizarSaldo(id: string, monto: number) {
    return this.prisma.cliente.update({
      where: { id },
      data: { saldoDeuda: { increment: monto } },
    });
  }
}
