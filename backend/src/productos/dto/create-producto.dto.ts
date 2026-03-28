import { IsString, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductoDto {
  @IsString()
  @MaxLength(30)
  codigo: string;

  @IsString()
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Number)
  @IsNumber()
  categoriaId: number;

  @IsOptional()
  @IsString()
  proveedorId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsString()
  imagenUrl?: string;
}
