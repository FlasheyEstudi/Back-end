// src/ms/estudiante/dto/create-estudiante.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsEmail, IsInt, Min, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEstudianteDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID debe ser un número.' })
  @ApiProperty({ description: 'ID del estudiante (opcional para creación)', example: 0 })
  Id?: number;

  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Nombre del estudiante', example: 'Juan' })
  Nombre: string;

  @IsNotEmpty({ message: 'El apellido no puede estar vacío.' })
  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Apellido del estudiante', example: 'Pérez' })
  Apellido: string;

  @IsNotEmpty({ message: 'La edad no puede estar vacía.' })
  @IsNumber({}, { message: 'La edad debe ser un número.' })
  @IsInt({ message: 'La edad debe ser un número entero.' })
  @Min(1, { message: 'La edad debe ser al menos 1.' })
  @ApiProperty({ description: 'Edad del estudiante', example: 20 })
  Edad: number;

  @IsNotEmpty({ message: 'El correo no puede estar vacío.' })
  @IsEmail({}, { message: 'El correo debe ser una dirección de correo válida.' })
  @ApiProperty({ description: 'Correo electrónico del estudiante', example: 'juan.perez@example.com' })
  Correo: string;

  @IsNotEmpty({ message: 'El ID del estado no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del estado debe ser un número.' })
  @ApiProperty({ description: 'ID del estado del estudiante', example: 1 })
  EstadoId: number;

  @IsNotEmpty({ message: 'El ID de la carrera no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID de la carrera debe ser un número.' })
  @ApiProperty({ description: 'ID de la carrera del estudiante', example: 1 })
  CarreraId: number;

  @IsOptional()
  @IsIn(['estudiante', 'admin'], { message: 'El rol debe ser "estudiante" o "admin".' })
  @ApiProperty({ description: 'Rol del usuario a crear', example: 'estudiante', default: 'estudiante' })
  Role?: string;
}