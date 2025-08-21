import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación Swagger

export class CreateEstadoDto {
  @IsOptional() // Id es opcional al crear, pero puede venir al actualizar
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID del estado (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'El nombre del estado no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres.' })
  @ApiProperty({ description: 'Nombre del estado (Ej: Activo, Inactivo, Pendiente)', example: 'Activo' })
  Nombre: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de registro debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha de registro del estado (YYYY-MM-DD)', example: '2023-10-01', required: false })
  FechaRegistro?: string; // Opcional, a menudo manejado por la BD

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de modificación debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha de última modificación del estado (YYYY-MM-DD)', example: '2023-10-02', required: false })
  FechaModificacion?: string; // Opcional, a menudo manejado por la BD
}
