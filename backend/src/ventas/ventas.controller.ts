import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ventas')
export class VentasController {
  constructor(private svc: VentasService) {}

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
    @Query('clienteId') clienteId?: string,
  ) {
    return this.svc.findAll(tipo, estado, clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVentaDto, @Request() req: any) {
    return this.svc.create(dto, req.user?.id);
  }

  @Patch(':id/anular')
  anular(@Param('id') id: string) {
    return this.svc.anular(id);
  }

  @Patch(':id/despachar')
  despachar(@Param('id') id: string) {
    return this.svc.marcarDespachado(id);
  }
}
