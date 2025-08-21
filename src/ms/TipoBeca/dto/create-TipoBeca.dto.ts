import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación Swagger

export class CreateTipoBecaDto {
  @IsOptional() // Id es opcional al crear, pero puede venir al actualizar
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID del tipo de beca (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Nombre del tipo de beca', example: 'Beca Excelencia Académica' })
  Nombre: string;

  @IsOptional() // Descripción puede ser opcional
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Descripción detallada del tipo de beca', example: 'Beca para estudiantes con alto rendimiento académico', required: false })
  Descripcion?: string;

  @IsNotEmpty({ message: 'El monto no puede estar vacío.' })
  @IsNumber({}, { message: 'El monto debe ser un número válido.' })
  @Min(0, { message: 'El monto no puede ser negativo.' })
  @ApiProperty({ description: 'Monto de la beca', example: 1500.00 })
  Monto: number;

  @IsNotEmpty({ message: 'El ID del estado no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estado debe ser un número entero.' })
  @ApiProperty({ description: 'ID del estado de la beca (ej. Activo, Inactivo)', example: 1 })
  EstadoId: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de registro debe ser una fecha válida.' })
  @ApiProperty({ description: 'Fecha de registro del tipo de beca (formato YYYY-MM-DD)', example: '2023-10-26', required: false })
  FechaRegistro?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de modificación debe ser una fecha válida.' })
  @ApiProperty({ description: 'Fecha de última modificación del tipo de beca (formato YYYY-MM-DD)', example: '2023-10-27', required: false })
  FechaModificacion?: string;
}
