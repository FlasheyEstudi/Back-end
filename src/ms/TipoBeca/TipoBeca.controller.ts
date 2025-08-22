// src/app/ms/TipoBeca/TipoBeca.controller.ts
import { 
  Controller, Post, Body, Get, Param, Delete, Put, 
  Logger, HttpException, HttpStatus, ValidationPipe, UseGuards 
} from '@nestjs/common';
import { TipoBecaService } from './TipoBeca.service';
import { CreateTipoBecaDto } from './dto/create-TipoBeca.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth-guard'; // Para proteger endpoints de admin

@Controller('tipobeca')
export class TipoBecaController {
  private readonly logger = new Logger(TipoBecaController.name);
  
  constructor(private readonly tipoBecaService: TipoBecaService) {}

  // Endpoint protegido para administradores (funcionalidad existente)
  @Post('/add')
  @UseGuards(JwtAuthGuard)
  async create(
    @Body(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST 
    })) 
    dto: CreateTipoBecaDto
  ) {
    try {
      return await this.tipoBecaService.create(dto);
    } catch (error) {
      this.logger.error(`Error al crear TipoBeca: ${error.message}`, error.stack);
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, detalle: 'Error al crear el Tipo de Beca', technical: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint protegido para administradores (funcionalidad existente)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string, 
    @Body(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST 
    })) 
    dto: CreateTipoBecaDto
  ) {
    try {
      const numId = this.validarId(id);
      return await this.tipoBecaService.update(numId, dto);
    } catch (error) {
      this.logger.error(`Error al actualizar TipoBeca ID ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, detalle: 'Error al actualizar el Tipo de Beca', technical: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint protegido para administradores (funcionalidad existente)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    try {
      return await this.tipoBecaService.findAll();
    } catch (error) {
      this.logger.error(`Error al obtener todos los TipoBecas: ${error.message}`, error.stack);
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, detalle: 'Error al obtener los Tipos de Beca', technical: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint protegido para administradores (funcionalidad existente)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    try {
      const numId = this.validarId(id);
      return await this.tipoBecaService.findOne(numId);
    } catch (error) {
      this.logger.error(`Error al buscar TipoBeca ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException && error.getStatus() === HttpStatus.BAD_REQUEST) {
        throw error;
      }
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, detalle: `Error al buscar Tipo de Beca con ID ${id}`, technical: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint protegido para administradores (funcionalidad existente)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      const numId = this.validarId(id);
      return await this.tipoBecaService.remove(numId);
    } catch (error) {
      this.logger.error(`Error al eliminar TipoBeca ID ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, detalle: 'Error al eliminar el Tipo de Beca', technical: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint protegido para administradores (funcionalidad existente)
  @Put(':id/estado')
  @UseGuards(JwtAuthGuard)
  async updateEstado(@Param('id') id: string, @Body('EstadoId', new ValidationPipe({ transform: true })) estadoId: number) {
    try {
      const numId = this.validarId(id);
      if (!estadoId || estadoId <= 0) {
        throw new HttpException(
          { status: HttpStatus.BAD_REQUEST, detalle: 'EstadoId inválido', technical: 'El EstadoId debe ser un número positivo' },
          HttpStatus.BAD_REQUEST
        );
      }
      return await this.tipoBecaService.updateEstado(numId, estadoId);
    } catch (error) {
      this.logger.error(`Error al actualizar estado de TipoBeca ID ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, detalle: `Error al actualizar el estado del Tipo de Beca con ID ${id}`, technical: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint protegido para administradores (funcionalidad existente)
  @Get('resumen')
  @UseGuards(JwtAuthGuard)
  async getResumen() {
    try {
      return await this.tipoBecaService.getResumen();
    } catch (error) {
      this.logger.error(`Error al obtener resumen: ${error.message}`, error.stack);
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, detalle: 'Error al obtener el resumen de KPIs', technical: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ NUEVO: Endpoint público para estudiantes - obtener tipos de beca activos
  @Get('public/disponibles')
  async getTiposBecaDisponibles() {
    try {
      const todosLosTipos = await this.tipoBecaService.findAll();
      // Filtrar solo tipos de beca activos (asumiendo que EstadoId = 1 es activo)
      const tiposActivos = todosLosTipos.filter(tipo => tipo.EstadoId === 1);
      return tiposActivos;
    } catch (error) {
      this.logger.error(`Error al obtener tipos de beca disponibles: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener los Tipos de Beca disponibles',
          technical: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Helper para validar ID
  private validarId(id: string): number {
    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, detalle: `ID inválido: ${id}`, technical: 'El ID debe ser un número positivo' },
        HttpStatus.BAD_REQUEST
      );
    }
    return numId;
  }
}