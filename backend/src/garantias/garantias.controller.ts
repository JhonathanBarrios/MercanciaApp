import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { GarantiasService } from './garantias.service';
import { CreateGarantiaDto } from './dto/create-garantia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('garantias')
export class GarantiasController {
  constructor(private svc: GarantiasService) {}

  @Get()
  findAll(@Query('estado') estado?: string, @Query('clienteId') clienteId?: string) {
    return this.svc.findAll(estado, clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGarantiaDto) {
    return this.svc.create(dto);
  }

  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.svc.updateEstado(id, estado);
  }

  @Post('actualizar-estados')
  actualizarEstados() {
    return this.svc.actualizarEstados();
  }
}
