import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación Swagger

export class CreateRequisitoDto {
  @IsOptional() // Id es opcional al crear, pero podría estar presente al actualizar
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID del requisito (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'La descripción del requisito no puede estar vacía.' })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Descripción del requisito', example: 'Acta de nacimiento apostillada' })
  Descripcion: string;

  @IsNotEmpty({ message: 'El ID del estudiante no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estudiante debe ser un número entero.' })
  @ApiProperty({ description: 'ID del estudiante asociado al requisito', example: 1 })
  EstudianteId: number;

  @IsNotEmpty({ message: 'El ID del estado no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estado debe ser un número entero.' })
  @ApiProperty({ description: 'ID del estado del requisito (ej. Pendiente, Aprobado)', example: 1 })
  EstadoId: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de registro debe ser una fecha válida.' })
  @ApiProperty({ description: 'Fecha de registro del requisito (formato YYYY-MM-DD)', example: '2023-10-26', required: false })
  FechaRegistro?: string; // Usar string para fechas si no se transforman a Date objetos en el backend

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de modificación debe ser una fecha válida.' })
  @ApiProperty({ description: 'Fecha de última modificación del requisito (formato YYYY-MM-DD)', example: '2023-10-26', required: false })
  FechaModificacion?: string; // Usar string para fechas
}
