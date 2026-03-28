import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, categoriaId?: number, soloActivos = true) {
    return this.prisma.producto.findMany({
      where: {
        activo: soloActivos ? true : undefined,
        categoriaId: categoriaId ?? undefined,
        nombre: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      include: { categoria: true, proveedor: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.producto.findUnique({
      where: { id },
      include: { categoria: true, proveedor: true },
    });
    if (!p) throw new NotFoundException(`Producto ${id} no encontrado`);
    return p;
  }

  async create(dto: CreateProductoDto) {
    const existe = await this.prisma.producto.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Ya existe un producto con código ${dto.codigo}`);
    return this.prisma.producto.create({ data: dto, include: { categoria: true } });
  }

  async update(id: string, dto: UpdateProductoDto) {
    await this.findOne(id);
    return this.prisma.producto.update({ where: { id }, data: dto, include: { categoria: true } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.producto.update({ where: { id }, data: { activo: false } });
  }

  async alertasStock() {
    return this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.codigo, p.nombre, c.nombre AS categoria, p.stock, p.stock_minimo
      FROM productos p
      JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = true AND p.stock <= p.stock_minimo
      ORDER BY p.stock ASC
    `;
  }

  async ajustarStock(id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', usuarioId?: string, obs?: string) {
    const producto = await this.findOne(id);
    const stockAntes = producto.stock;
    const stockDespues = tipo === 'entrada'
      ? stockAntes + cantidad
      : tipo === 'salida'
        ? stockAntes - cantidad
        : cantidad;

    return this.prisma.$transaction([
      this.prisma.producto.update({ where: { id }, data: { stock: stockDespues } }),
      this.prisma.inventarioMovimiento.create({
        data: {
          productoId: id,
          usuarioId,
          tipo,
          cantidad: tipo === 'salida' ? -cantidad : cantidad,
          stockAntes,
          stockDespues,
          referenciaTipo: 'ajuste_manual',
          observaciones: obs,
        },
      }),
    ]);
  }
}
