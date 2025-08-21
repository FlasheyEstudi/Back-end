import { IsNotEmpty, IsString, IsNumber, IsOptional, Length, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación Swagger

export class CreateTipoPagoDto {
  @IsOptional() // Id es opcional al crear, pero puede venir al actualizar
  @IsInt({ message: 'El ID debe ser un número entero.' })
  @Min(1, { message: 'El ID debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del tipo de pago (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'El nombre del tipo de pago no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres.' })
  @ApiProperty({ description: 'Nombre del tipo de pago (Ej: Matrícula, Mensualidad)', example: 'Matrícula' })
  Nombre: string;

  @IsNotEmpty({ message: 'La descripción del tipo de pago no puede estar vacía.' })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  @Length(5, 500, { message: 'La descripción debe tener entre 5 y 500 caracteres.' })
  @ApiProperty({ description: 'Descripción detallada del tipo de pago', example: 'Pago por concepto de matrícula semestral.' })
  Descripcion: string;

  @IsNotEmpty({ message: 'El ID de Estado no puede estar vacío.' })
  @IsInt({ message: 'El ID de Estado debe ser un número entero.' })
  @Min(1, { message: 'El ID de Estado debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del estado asociado (Ej: Activo, Inactivo)', example: 1 })
  Estadoid: number; // Corresponde al Id en la tabla Beca.Estado
}
