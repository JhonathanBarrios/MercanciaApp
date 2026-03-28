import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { DespachosService } from './despachos.service';
import { UpdateDespachoDto } from './dto/update-despacho.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('despachos')
export class DespachosController {
  constructor(private svc: DespachosService) {}

  @Get()
  findAll(@Query('estado') estado?: string) {
    return this.svc.findAll(estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDespachoDto) {
    return this.svc.update(id, dto);
  }

  @Post('crear')
  crear(@Body() body: { ventaId: string; direccion: string; ciudad?: string }) {
    return this.svc.crear(body.ventaId, body.direccion, body.ciudad);
  }
}
