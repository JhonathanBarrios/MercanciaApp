import { IsString, IsOptional, IsEnum } from 'class-validator';
import { EstadoDespacho } from '@prisma/client';

export class UpdateDespachoDto {
  @IsOptional()
  @IsEnum(EstadoDespacho)
  estado?: EstadoDespacho;

  @IsOptional()
  @IsString()
  despachadorId?: string;

  @IsOptional()
  @IsString()
  fechaProgramada?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
