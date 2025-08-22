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
  UseGuards,
  BadRequestException,
  NotFoundException,
  Query
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
      throw new BadRequestException('Error al obtener datos para frontend');
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
   * ENDPOINT PARA MAPEO - Mapear UserId a EstudianteId
   */
  @Get('map-user-to-estudiante')
  async mapUserToEstudiante(@Query('userId') userId: number) {
    this.logger.log(`=== SOLICITUD: mapUserToEstudiante userId=${userId} ===`);
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new BadRequestException('userId inválido');
    }
    try {
      const estudianteId = await this.solicitudBecaService.mapUserToEstudiante(userId);
      return { estudianteId };
    } catch (error) {
      this.logger.error('=== ERROR: mapUserToEstudiante falló ===', error);
      throw new NotFoundException('No se encontró un estudiante asociado al usuario.');
    }
  }

  /**
   * ENDPOINT CRUD - Todas las solicitudes
   */
  @Get()
  async findAll() {
    this.logger.log('findAll: Obteniendo todas las solicitudes');
    return await this.solicitudBecaService.findAll();
  }

  /**
   * ENDPOINT CRUD - Una solicitud específica (con manejo seguro)
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`findOne: Buscando solicitud con ID param: ${id}`);
    
    // Conversión segura
    const idNum = parseInt(id, 10);
    
    // Validación segura
    if (isNaN(idNum) || idNum <= 0) {
      this.logger.warn(`findOne: ID inválido recibido: ${id}`);
      throw new BadRequestException('ID inválido. Debe ser un número entero positivo');
    }
    
    try {
      const result = await this.solicitudBecaService.findOne(idNum);
      return result;
    } catch (error) {
      this.logger.error(`findOne: Error buscando ID ${idNum}:`, error);
      throw new NotFoundException(`Solicitud con ID ${idNum} no encontrada`);
    }
  }

  /**
   * ENDPOINT CRUD - Crear nueva solicitud
   */
  @Post('/add')
  async create(@Body() dto: CreateSolicitudBecaDto) {
    this.logger.log('Creando Solicitud de Beca: ' + JSON.stringify(dto));
    
    // Validación básica
    if (!dto.EstudianteId || dto.EstudianteId <= 0) {
      throw new BadRequestException('ID de estudiante inválido');
    }
    
    if (!dto.TipoBecaId || dto.TipoBecaId <= 0) {
      throw new BadRequestException('ID de tipo de beca inválido');
    }
    
    if (!dto.PeriodoAcademicoId || dto.PeriodoAcademicoId <= 0) {
      throw new BadRequestException('ID de período académico inválido');
    }
    
    return await this.solicitudBecaService.create(dto);
  }

  /**
   * ENDPOINT CRUD - Actualizar solicitud existente
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateSolicitudBecaDto) {
    this.logger.log(`Actualizando Solicitud de Beca ID: ${id} con datos: ${JSON.stringify(dto)}`);
    
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      throw new BadRequestException('ID inválido');
    }
    
    return await this.solicitudBecaService.update(idNum, dto);
  }

  /**
   * ENDPOINT CRUD - Eliminar solicitud por ID
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log('Eliminando Solicitud de Beca ID: ' + id);
    
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      throw new BadRequestException('ID inválido');
    }
    
    return await this.solicitudBecaService.remove(idNum);
  }
  @Get('estudiante/:estudianteId')
async getSolicitudesPorEstudiante(@Param('estudianteId') estudianteId: string) {
  this.logger.log(`Obteniendo solicitudes para estudiante ID: ${estudianteId}`);
  
  const idNum = parseInt(estudianteId, 10);
  if (isNaN(idNum) || idNum <= 0) {
    throw new BadRequestException('ID de estudiante inválido');
  }
  
  try {
    const solicitudes = await this.solicitudBecaService.findByEstudianteId(idNum);
    return solicitudes;
  } catch (error) {
    this.logger.error(`Error al obtener solicitudes para estudiante ${idNum}:`, error);
    throw new NotFoundException(`No se encontraron solicitudes para el estudiante con ID ${idNum}`);
  }

}}