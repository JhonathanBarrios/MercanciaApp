import { IsString, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoVenta } from '@prisma/client';

export class LineaVentaDto {
  @IsString()
  productoId: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CreateVentaDto {
  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsEnum(TipoVenta)
  tipo: TipoVenta;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  numCuotas?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaVentaDto)
  items: LineaVentaDto[];
}
