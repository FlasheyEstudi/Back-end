import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación Swagger

export class CreatePeriodoAcademicoDto {
  @IsOptional() // Id es opcional al crear, pero puede venir al actualizar
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID del periodo académico (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'El nombre del periodo no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Nombre del periodo académico (Ej: Primer Cuatrimestre)', example: 'Primer Cuatrimestre' })
  Nombre: string;

  @IsNotEmpty({ message: 'El año académico no puede estar vacío.' })
  @IsString({ message: 'El año académico debe ser una cadena de texto.' })
  @Length(4, 4, { message: 'El año académico debe tener 4 dígitos.' })
  @ApiProperty({ description: 'Año académico (Ej: 2024)', example: '2024' })
  AnioAcademico: string; // Se mantiene como string para el año (e.g., '2024')

  @IsNotEmpty({ message: 'La fecha de inicio no puede estar vacía.' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha de inicio del periodo (YYYY-MM-DD)', example: '2024-01-15' })
  FechaInicio: string;

  @IsNotEmpty({ message: 'La fecha de fin no puede estar vacía.' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha de fin del periodo (YYYY-MM-DD)', example: '2024-04-30' })
  FechaFin: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de registro debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha de registro del periodo (YYYY-MM-DD)', example: '2023-10-01', required: false })
  FechaRegistro?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de modificación debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha de última modificación del periodo (YYYY-MM-DD)', example: '2023-10-02', required: false })
  FechaModificacion?: string;

  @IsNotEmpty({ message: 'El ID del estado no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estado debe ser un número entero.' })
  @ApiProperty({ description: 'ID del estado del periodo (ej. Activo, Inactivo)', example: 1 })
  EstadoId: number;
}
