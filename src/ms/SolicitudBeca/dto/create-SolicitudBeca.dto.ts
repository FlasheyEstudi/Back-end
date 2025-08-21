import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación Swagger

export class CreateSolicitudBecaDto {
  @IsOptional() // Id es opcional al crear, pero puede venir al actualizar
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID de la solicitud de beca (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'El ID del estudiante no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estudiante debe ser un número entero.' })
  @Min(1, { message: 'El ID del estudiante debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del estudiante asociado a la solicitud', example: 1 })
  EstudianteId: number;

  @IsNotEmpty({ message: 'El ID del tipo de beca no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del tipo de beca debe ser un número entero.' })
  @Min(1, { message: 'El ID del tipo de beca debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del tipo de beca solicitado', example: 1 })
  TipoBecaId: number;

  @IsNotEmpty({ message: 'El ID del estado no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estado debe ser un número entero.' })
  @Min(1, { message: 'El ID del estado debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del estado de la solicitud (ej. Pendiente, Aprobada)', example: 1 })
  EstadoId: number;

  @IsNotEmpty({ message: 'La fecha de solicitud no puede estar vacía.' })
  @IsDateString({}, { message: 'La fecha de solicitud debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha en que se realizó la solicitud (YYYY-MM-DD)', example: '2024-08-19' })
  FechaSolicitud: string;

  @IsNotEmpty({ message: 'El ID del periodo académico no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del periodo académico debe ser un número entero.' })
  @Min(1, { message: 'El ID del periodo académico debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del periodo académico al que aplica la solicitud', example: 1 })
  PeriodoAcademicoId: number;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto.' })
  @ApiProperty({ description: 'Observaciones adicionales de la solicitud', example: 'Documentos entregados correctamente', required: false })
  Observaciones?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de resultado debe ser una fecha válida (YYYY-MM-DD).' })
  @ApiProperty({ description: 'Fecha en que se obtuvo el resultado de la solicitud (YYYY-MM-DD)', example: '2024-09-15', required: false })
  Fecha_resultado?: string;
}
