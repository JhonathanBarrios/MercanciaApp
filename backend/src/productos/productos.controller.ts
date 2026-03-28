import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('productos')
export class ProductosController {
  constructor(private svc: ProductosService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('soloActivos') soloActivos?: string,
  ) {
    return this.svc.findAll(
      search,
      categoriaId ? parseInt(categoriaId) : undefined,
      soloActivos !== 'false',
    );
  }

  @Get('alertas-stock')
  alertasStock() {
    return this.svc.alertasStock();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductoDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Post(':id/ajustar-stock')
  ajustarStock(
    @Param('id') id: string,
    @Body() body: { cantidad: number; tipo: 'entrada' | 'salida' | 'ajuste'; observaciones?: string },
    @Request() req: any,
  ) {
    return this.svc.ajustarStock(id, body.cantidad, body.tipo, req.user?.id, body.observaciones);
  }
}
