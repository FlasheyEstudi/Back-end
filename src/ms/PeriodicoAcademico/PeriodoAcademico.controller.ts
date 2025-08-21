import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PeriodoAcademicoService } from './PeriodoAcademico.service';
import { CreatePeriodoAcademicoDto } from './dto/create-PeriodoAcademico.dto';
import { ValidationPipe } from '@nestjs/common'; // Importar ValidationPipe

@Controller('periodoacademico') // Usar 'periodoacademico' (minúscula) por convención y para el prefijo global 'api-beca'
export class PeriodoAcademicoController {
  private readonly logger = new Logger(PeriodoAcademicoController.name);

  constructor(private readonly periodoAcademicoService: PeriodoAcademicoService) {}

  @Post('/add') // Ruta final: POST /api-beca/periodoacademico/add (para crear)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreatePeriodoAcademicoDto
  ) {
    this.logger.log('Creando Periodo Académico: ' + JSON.stringify(dto));
    try {
      return await this.periodoAcademicoService.create(dto);
    } catch (error) {
      this.logger.error(`Error en controlador al crear Periodo Académico: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id') // Ruta final: PUT /api-beca/periodoacademico/:id (para actualizar)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreatePeriodoAcademicoDto
  ) {
    const idNum = Number(id);
    this.logger.log(`Actualizando Periodo Académico ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    try {
      return await this.periodoAcademicoService.update(idNum, dto);
    } catch (error) {
      this.logger.error(`Error en controlador al actualizar Periodo Académico ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get() // Ruta final: GET /api-beca/periodoacademico (para obtener todos)
  async findAll() {
    this.logger.log('Obteniendo todos los Periodos Académicos');
    try {
      return await this.periodoAcademicoService.findAll();
    } catch (error) {
      this.logger.error(`Error en controlador al obtener todos los Periodos Académicos: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id') // Ruta final: GET /api-beca/periodoacademico/:id (para obtener uno por ID)
  async findOne(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Obteniendo Periodo Académico ID: ' + idNum);
    try {
      return await this.periodoAcademicoService.findOne(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al obtener Periodo Académico ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id') // Ruta final: DELETE /api-beca/periodoacademico/:id (para eliminar)
  async remove(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Eliminando Periodo Académico ID: ' + idNum);
    try {
      return await this.periodoAcademicoService.remove(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al eliminar Periodo Académico ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
