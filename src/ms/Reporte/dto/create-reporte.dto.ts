import { IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReporteDto {
  @IsOptional()
  @IsNumber({}, { message: 'El periodoAcademicoId debe ser un número válido.' })
  @ApiProperty({ description: 'ID opcional del periodo académico para filtrar reportes', example: 1, required: false })
  periodoAcademicoId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El estadoId debe ser un número válido.' })
  @ApiProperty({ description: 'ID opcional del estado para filtrar reportes', example: 1, required: false })
  estadoId?: number;
}
