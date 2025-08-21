import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaConocimientoDto {
  // Id es opcional porque al crear, el frontend no lo envía.
  // Pero al actualizar, podría venir en el DTO (aunque lo ideal es usarlo de @Param).
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID del área de conocimiento (opcional para creación)', example: 1, required: false })
  Id?: number; // Permite que sea opcional para DTOs de entrada y actualización

  @IsNotEmpty({ message: 'El nombre del área de conocimiento no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Nombre del área de conocimiento', example: 'Ciencias de la Computación' })
  nombre: string;
}
