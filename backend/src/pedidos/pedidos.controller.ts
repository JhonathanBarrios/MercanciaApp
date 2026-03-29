import { Controller, Post, Body } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';

@Controller('pedidos')
export class PedidosController {
  constructor(private svc: PedidosService) {}

  @Post()
  crear(@Body() dto: CreatePedidoDto) {
    return this.svc.crear(dto);
  }
}
