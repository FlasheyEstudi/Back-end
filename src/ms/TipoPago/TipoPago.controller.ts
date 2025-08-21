import { Controller, Post, Body, Get, Param, Delete, Put, UseGuards, ValidationPipe, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { TipoPagoService, TipoPagoResponse } from './TipoPago.service';
import { CreateTipoPagoDto } from './dto/create-TipoPago.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth-guard';

@Controller('/tipopago')
@UseGuards(JwtAuthGuard)
export class TipoPagoController {
  private readonly logger = new Logger(TipoPagoController.name);

  constructor(private readonly tipopagoService: TipoPagoService) {}

  @Post('/add')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateTipoPagoDto
  ): Promise<TipoPagoResponse> {
    this.logger.log('Creando Tipo de Pago: ' + JSON.stringify(dto));
    return await this.tipopagoService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateTipoPagoDto
  ): Promise<TipoPagoResponse> {
    const idNum = Number(id);
    // VALIDACIÓN ADICIONAL
    if (isNaN(idNum) || idNum <= 0) {
      throw new Error('ID inválido');
    }
    this.logger.log(`Actualizando Tipo de Pago ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    return await this.tipopagoService.update(idNum, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<TipoPagoResponse[]> {
    this.logger.log('Obteniendo todos los Tipos de Pago');
    return await this.tipopagoService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<TipoPagoResponse> {
    const idNum = Number(id);
    // VALIDACIÓN ADICIONAL
    if (isNaN(idNum) || idNum <= 0) {
      throw new Error('ID inválido');
    }
    this.logger.log('Obteniendo Tipo de Pago ID: ' + idNum);
    return await this.tipopagoService.findOne(idNum);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<{ mensaje: string }> {
    const idNum = Number(id);
    // VALIDACIÓN ADICIONAL
    if (isNaN(idNum) || idNum <= 0) {
      throw new Error('ID inválido');
    }
    this.logger.log('Eliminando Tipo de Pago ID: ' + idNum);
    return await this.tipopagoService.remove(idNum);
  }
}