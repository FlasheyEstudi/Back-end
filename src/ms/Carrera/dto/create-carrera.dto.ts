// src/ms/Carrera/dto/create-carrera.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación

export class CreateCarreraDto {
  @IsNotEmpty({ message: 'El nombre de la carrera no puede estar vacío.' })
  @IsString({ message: 'El nombre de la carrera debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Nombre de la carrera', example: 'Ingeniería Civil' })
  Nombre: string;

  @IsNotEmpty({ message: 'El ID del área de conocimiento no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del área de conocimiento debe ser un número.' })
  @IsInt({ message: 'El ID del área de conocimiento debe ser un número entero.' })
  @Min(1, { message: 'El ID del área de conocimiento debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del área de conocimiento asociada a la carrera', example: 1 })
  AreaConocimientoId: number;
}
