import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pagos')
export class PagosController {
  constructor(private svc: PagosService) {}

  @Get('cuota/:cuotaId')
  findByCuota(@Param('cuotaId') cuotaId: string) {
    return this.svc.findByCuota(cuotaId);
  }

  @Post()
  registrar(@Body() dto: CreatePagoDto, @Request() req: any) {
    return this.svc.registrar(dto, req.user?.id);
  }
}
