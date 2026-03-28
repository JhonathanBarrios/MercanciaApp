import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { ClientesModule } from './clientes/clientes.module';
import { VentasModule } from './ventas/ventas.module';
import { PagosModule } from './pagos/pagos.module';
import { GarantiasModule } from './garantias/garantias.module';
import { DespachosModule } from './despachos/despachos.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductosModule,
    ClientesModule,
    VentasModule,
    PagosModule,
    GarantiasModule,
    DespachosModule,
    ReportesModule,
  ],
})
export class AppModule {}

