import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetallePagoDto {
  @IsOptional()
  @IsInt({ message: 'El ID debe ser un número entero.' })
  @Min(1, { message: 'El ID debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del detalle de pago (opcional para creación)', example: 1, required: false })
  Id?: number;

  @IsNotEmpty({ message: 'El ID de la Solicitud de Beca no puede estar vacío.' })
  @IsInt({ message: 'El ID de Solicitud de Beca debe ser un número entero.' })
  @Min(1, { message: 'El ID de Solicitud de Beca debe ser un número positivo.' })
  @ApiProperty({ description: 'ID de la solicitud de beca asociada', example: 101 })
  SolicitudBecaId: number;

  @IsNotEmpty({ message: 'El ID de Tipo de Pago no puede estar vacío.' })
  @IsInt({ message: 'El ID de Tipo de Pago debe ser un número entero.' })
  @Min(1, { message: 'El ID de Tipo de Pago debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del tipo de pago asociado (Ej: Matrícula, Mensualidad)', example: 1 })
  TipoPagoId: number;

  @IsNotEmpty({ message: 'El Monto no puede estar vacío.' })
  @IsNumber({}, { message: 'El Monto debe ser un número válido.' })
  @Min(0, { message: 'El Monto no puede ser negativo.' })
  @ApiProperty({ description: 'Monto del pago', example: 1500.75 })
  Monto: number;

  @IsNotEmpty({ message: 'La Fecha de Pago no puede estar vacía.' })
  @IsDateString({}, { message: 'La Fecha de Pago debe ser una cadena de fecha válida (ISO 8601).' })
  @ApiProperty({ description: 'Fecha en que se realizó el pago (Formato ISO 8601)', example: '2023-08-15T10:00:00Z' })
  FechaPago: string;

  @IsOptional()
  @IsString({ message: 'La Referencia debe ser una cadena de texto.' })
  @ApiProperty({ description: 'Referencia o número de transacción del pago (opcional)', example: 'TRX-12345', required: false })
  Referencia?: string;

  @IsNotEmpty({ message: 'El ID de Estado no puede estar vacío.' })
  @IsInt({ message: 'El ID de Estado debe ser un número entero.' })
  @Min(1, { message: 'El ID de Estado debe ser un número positivo.' })
  @ApiProperty({ description: 'ID del estado del pago (Ej: Pendiente, Pagado, Anulado)', example: 1 })
  EstadoId: number;
}
