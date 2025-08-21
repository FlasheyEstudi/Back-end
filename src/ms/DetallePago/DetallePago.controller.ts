// src/ms/DetallePago/DetallePago.controller.ts
import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpCode, HttpStatus, ValidationPipe, UseGuards, HttpException } from '@nestjs/common';
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

  // === NUEVOS ENDPOINTS PARA EL DASHBOARD === //
  
  /**
   * Endpoint para obtener el resumen del dashboard
   * Retorna totales de pagos, beneficiarios activos y presupuesto total
   */
  @Get('dashboard-summary')
  @HttpCode(HttpStatus.OK)
  async getDashboardSummary() {
    this.logger.log('[DetallePagoController] Obteniendo resumen del dashboard');
    try {
      const summary = await this.detallePagoService.getDashboardSummary();
      this.logger.log('[DetallePagoController] Resumen del dashboard obtenido exitosamente');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: summary
      };
    } catch (error: any) {
      this.logger.error(`[DetallePagoController] Error al obtener resumen del dashboard: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos resumen del dashboard.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Endpoint para obtener el control de pagos
   * Retorna tabla principal de control de pagos
   */
  @Get('control-pagos')
  @HttpCode(HttpStatus.OK)
  async getControlDePagos() {
    this.logger.log('[DetallePagoController] Obteniendo control de pagos');
    try {
      const control = await this.detallePagoService.getControlDePagos();
      this.logger.log('[DetallePagoController] Control de pagos obtenido exitosamente');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: control
      };
    } catch (error: any) {
      this.logger.error(`[DetallePagoController] Error al obtener control de pagos: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos del control de pagos.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Endpoint para obtener el calendario de pagos
   * Retorna pagos agrupados por fecha
   */
  @Get('calendario-pagos')
  @HttpCode(HttpStatus.OK)
  async getCalendarioDePagos() {
    this.logger.log('[DetallePagoController] Obteniendo calendario de pagos');
    try {
      const calendar = await this.detallePagoService.getCalendarioDePagos();
      this.logger.log('[DetallePagoController] Calendario de pagos obtenido exitosamente');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: calendar
      };
    } catch (error: any) {
      this.logger.error(`[DetallePagoController] Error al obtener calendario de pagos: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos del calendario de pagos.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Endpoint para obtener el historial de transacciones
   * Retorna todas las transacciones realizadas
   */
  @Get('historial')
  @HttpCode(HttpStatus.OK)
  async getHistorialTransacciones() {
    this.logger.log('[DetallePagoController] Obteniendo historial de transacciones');
    try {
      const history = await this.detallePagoService.getHistorialTransacciones();
      this.logger.log('[DetallePagoController] Historial de transacciones obtenido exitosamente');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: history
      };
    } catch (error: any) {
      this.logger.error(`[DetallePagoController] Error al obtener historial de transacciones: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos del historial de transacciones.',
        technical: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // === ENDPOINTS EXISTENTES (mantener tal cual) === //
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