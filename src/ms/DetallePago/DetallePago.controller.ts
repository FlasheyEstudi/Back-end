// src/ms/DetallePago/DetallePago.controller.ts
import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpCode, HttpStatus, ValidationPipe, UseGuards } from '@nestjs/common';
import { DetallePagoService } from './DetallePago.service';
import { CreateDetallePagoDto } from './dto/create-DetallePago.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth-guard';

@Controller('detallepago')
@UseGuards(JwtAuthGuard)
export class DetallePagoController {
  private readonly logger = new Logger(DetallePagoController.name);

  constructor(private readonly detallePagoService: DetallePagoService) {}

  // === ENDPOINT PRINCIPAL: DEVUELVE TODOS LOS DATOS JUNTOS === //
  @Get('all-data')
  @HttpCode(HttpStatus.OK)
  async getAllData() {
    this.logger.log('[DetallePagoController] Obteniendo todos los datos para gestión de Detalles de Pago');
    try {
      // === CORRECCIÓN: Usar el servicio directamente, no getConnection === //
      // El servicio se encarga de la conexión internamente
      const data = await this.detallePagoService.getAllData();
      
      this.logger.log('[DetallePagoController] Datos obtenidos exitosamente');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: data,
        counts: {
          detalles: data.detalles.length,
          solicitudes: data.solicitudes.length,
          tiposPago: data.tiposPago.length,
          estados: data.estados.length
        }
      };
    } catch (error: any) {
      this.logger.error(`[DetallePagoController] Error al obtener todos los datos: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('/add')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateDetallePagoDto,
  ) {
    this.logger.log('[DetallePagoController] Creando Detalle de Pago: ' + JSON.stringify(dto));
    return this.detallePagoService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateDetallePagoDto,
  ) {
    const idNum = Number(id);
    this.logger.log(`[DetallePagoController] Actualizando Detalle de Pago ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    return this.detallePagoService.update(idNum, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    this.logger.log('[DetallePagoController] Obteniendo todos los Detalles de Pago');
    return this.detallePagoService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('[DetallePagoController] Obteniendo Detalle de Pago ID: ' + idNum);
    return this.detallePagoService.findOne(idNum);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('[DetallePagoController] Eliminando Detalle de Pago ID: ' + idNum);
    return this.detallePagoService.remove(idNum);
  }
}