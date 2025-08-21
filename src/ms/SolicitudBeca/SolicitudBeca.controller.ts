// src/app/ms/SolicitudBeca/SolicitudBeca.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Put,
  Logger,
  UseGuards
} from '@nestjs/common';
import { SolicitudBecaService } from './SolicitudBeca.service';
import { CreateSolicitudBecaDto } from './dto/create-SolicitudBeca.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth-guard'; 

@Controller('solicitudbeca')
@UseGuards(JwtAuthGuard)
export class SolicitudBecaController {
  private readonly logger = new Logger(SolicitudBecaController.name);

  constructor(private readonly solicitudBecaService: SolicitudBecaService) {}

  /**
   * ENDPOINT PRINCIPAL - Datos completos para frontend
   * Este endpoint está diseñado para evitar cualquier validación problemática
   */
  @Get('frontend-data')
  async getFrontendData() {
    this.logger.log('=== SOLICITUD: getFrontendData ===');
    try {
      const result = await this.solicitudBecaService.getAllFrontendData();
      this.logger.log('=== RESPUESTA: getFrontendData exitoso ===');
      return result;
    } catch (error) {
      this.logger.error('=== ERROR: getFrontendData falló ===', error);
      return {
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * ENDPOINT DE DEBUG - Verificación de conectividad
   */
  @Get('debug-connection')
  async debugConnection() {
    this.logger.log('=== SOLICITUD: debugConnection ===');
    return await this.solicitudBecaService.debugDatabaseConnection();
  }

  /**
   * ENDPOINT EXISTENTE - Todas las solicitudes
   */
  @Get()
  async findAll() {
    this.logger.log('findAll: Obteniendo todas las solicitudes');
    return await this.solicitudBecaService.findAll();
  }

  /**
   * ENDPOINT EXISTENTE - Una solicitud específica (con manejo seguro)
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`findOne: Buscando solicitud con ID param: ${id}`);
    
    // Conversión segura
    const idNum = parseInt(id, 10);
    
    // Validación segura sin lanzar excepciones HTTP
    if (isNaN(idNum) || idNum <= 0) {
      this.logger.warn(`findOne: ID inválido recibido: ${id}`);
      return { 
        error: 'ID inválido', 
        received: id,
        message: 'El ID debe ser un número entero positivo'
      };
    }
    
    try {
      const result = await this.solicitudBecaService.findOne(idNum);
      return result;
    } catch (error) {
      this.logger.error(`findOne: Error buscando ID ${idNum}:`, error);
      return { 
        error: error.message,
        id: idNum
      };
    }
  }

  // Resto de endpoints existentes...
  @Post('/add')
  async create(@Body() dto: CreateSolicitudBecaDto) {
    this.logger.log('Creando Solicitud de Beca: ' + JSON.stringify(dto));
    return await this.solicitudBecaService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateSolicitudBecaDto) {
    this.logger.log(`Actualizando Solicitud de Beca ID: ${id} con datos: ${JSON.stringify(dto)}`);
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return { error: 'ID inválido' };
    }
    return await this.solicitudBecaService.update(idNum, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log('Eliminando Solicitud de Beca ID: ' + id);
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return { error: 'ID inválido' };
    }
    return await this.solicitudBecaService.remove(idNum);
  }
}