import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min, Max, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTipoBecaDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID del tipo de beca', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'La categoría no puede estar vacía.' })
  @IsString({ message: 'La categoría debe ser una cadena de texto.' })
  @Length(1, 1, { message: 'La categoría debe ser un solo carácter (A, B, C, D).' })
  @ApiProperty({ description: 'Letra identificativa de la categoría (A, B, C, D)', example: 'A' })
  Categoria: string;

  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres.' })
  @ApiProperty({ description: 'Nombre del tipo de beca', example: 'Beca Excelencia Académica' })
  Nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @Length(0, 255, { message: 'La descripción debe tener un máximo de 255 caracteres.' })
  @ApiProperty({ description: 'Descripción de la beca', example: 'Beca para estudiantes con alto rendimiento', required: false })
  Descripcion?: string;

  @IsNotEmpty({ message: 'El monto no puede estar vacío.' })
  @IsNumber({}, { message: 'El monto debe ser un número válido.' })
  @Min(0, { message: 'El monto no puede ser negativo.' })
  @ApiProperty({ description: 'Monto de la beca', example: 1500.00 })
  Monto: number;

  @IsNotEmpty({ message: 'El porcentaje de cobertura no puede estar vacío.' })
  @IsNumber({}, { message: 'El porcentaje de cobertura debe ser un número válido.' })
  @Min(1, { message: 'El porcentaje de cobertura debe ser al menos 1.' })
  @Max(100, { message: 'El porcentaje de cobertura no puede exceder 100.' })
  @ApiProperty({ description: 'Porcentaje de cobertura de la beca', example: 100 })
  PorcentajeCobertura: number;

  @IsNotEmpty({ message: 'La prioridad no puede estar vacía.' })
  @IsNumber({}, { message: 'La prioridad debe ser un número válido.' })
  @Min(1, { message: 'La prioridad debe ser al menos 1.' })
  @ApiProperty({ description: 'Prioridad de la beca', example: 1 })
  Prioridad: number;

  @IsOptional()
  @IsString({ message: 'El color debe ser una cadena de texto en formato hexadecimal.' })
  @Length(0, 7, { message: 'El color debe tener un máximo de 7 caracteres (formato hexadecimal, ej. #FFFFFF).' })
  @ApiProperty({ description: 'Color identificativo en formato hexadecimal', example: '#009dd5', required: false })
  ColorHex?: string;

  @IsNotEmpty({ message: 'El ID del estado no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estado debe ser un número entero.' })
  @ApiProperty({ description: 'ID del estado de la beca', example: 1 })
  EstadoId: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de registro debe ser válida.' })
  @ApiProperty({ description: 'Fecha de registro', example: '2023-10-26', required: false })
  FechaRegistro?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de modificación debe ser válida.' })
  @ApiProperty({ description: 'Fecha de modificación', example: '2023-10-27', required: false })
  FechaModificacion?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha límite debe ser válida.' })
  @ApiProperty({ description: 'Fecha límite de la beca', example: '2025-08-30', required: false })
  FechaLimite?: string;
}