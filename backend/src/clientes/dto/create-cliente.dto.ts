import { IsString, IsOptional, IsEnum, IsNumber, Min, MaxLength, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoDocumento } from '@prisma/client';

export class CreateClienteDto {
  @IsString()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsEnum(TipoDocumento)
  tipoDocumento?: TipoDocumento;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cupoCredito?: number;
}
