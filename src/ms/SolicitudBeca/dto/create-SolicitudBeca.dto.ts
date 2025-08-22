import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSolicitudBecaDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número válido.' })
  @ApiProperty({ description: 'ID de la solicitud (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'El ID del estudiante no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estudiante debe ser un número entero.' })
  @Min(1, { message: 'El ID del estudiante debe ser positivo.' })
  @ApiProperty({ description: 'ID del estudiante', example: 1 })
  EstudianteId: number;

  @IsNotEmpty({ message: 'El ID del tipo de beca no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del tipo de beca debe ser un número entero.' })
  @Min(1, { message: 'El ID del tipo de beca debe ser positivo.' })
  @ApiProperty({ description: 'ID del tipo de beca', example: 1 })
  TipoBecaId: number;

  @IsNotEmpty({ message: 'El ID del estado no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estado debe ser un número entero.' })
  @Min(1, { message: 'El ID del estado debe ser positivo.' })
  @ApiProperty({ description: 'ID del estado de la solicitud', example: 1 })
  EstadoId: number;

  @IsNotEmpty({ message: 'La fecha de solicitud no puede estar vacía.' })
  @IsDateString({}, { message: 'La fecha de solicitud debe ser YYYY-MM-DD.' })
  @ApiProperty({ description: 'Fecha de solicitud', example: '2024-08-19' })
  FechaSolicitud: string;

  @IsNotEmpty({ message: 'El ID del periodo académico no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del periodo académico debe ser un número entero.' })
  @Min(1, { message: 'El ID del periodo académico debe ser positivo.' })
  @ApiProperty({ description: 'ID del periodo académico', example: 1 })
  PeriodoAcademicoId: number;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto.' })
  @ApiProperty({ description: 'Observaciones', example: 'Documentos entregados correctamente', required: false })
  Observaciones?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de resultado debe ser YYYY-MM-DD.' })
  @ApiProperty({ description: 'Fecha de resultado', example: '2024-09-15', required: false })
  Fecha_resultado?: string;
}
