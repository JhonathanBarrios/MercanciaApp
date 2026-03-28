import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateGarantiaDto {
  @IsOptional()
  @IsString()
  ventaItemId?: string;

  @IsString()
  productoId: string;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsString()
  serial?: string;

  @IsString()
  fechaVenta: string;

  @IsInt()
  @Min(1)
  meses: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
