import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '@prisma/client';

export class CreatePagoDto {
  @IsString()
  cuotaId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsEnum(MetodoPago)
  metodo: MetodoPago;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
