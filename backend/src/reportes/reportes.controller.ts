import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private svc: ReportesService) {}

  @Get('resumen')
  resumen() {
    return this.svc.resumenGeneral();
  }

  @Get('ventas-por-mes')
  ventasPorMes() {
    return this.svc.ventasPorMes();
  }

  @Get('top-productos')
  topProductos(@Query('limit') limit?: string) {
    return this.svc.topProductos(limit ? parseInt(limit) : 10);
  }

  @Get('top-clientes')
  topClientes(@Query('limit') limit?: string) {
    return this.svc.topClientes(limit ? parseInt(limit) : 10);
  }

  @Get('alertas-stock')
  alertasStock() {
    return this.svc.alertasStock();
  }

  @Get('cartera-activa')
  carteraActiva() {
    return this.svc.carteraActiva();
  }
}
