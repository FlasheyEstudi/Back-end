import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { EstadoService, EstadoResponse } from './Estado.service'; // Importa EstadoResponse
import { CreateEstadoDto } from './dto/create-Estado.dto';
import { ValidationPipe } from '@nestjs/common'; // Importar ValidationPipe

@Controller('estado') // Usar 'estado' (minúscula) por convención y para el prefijo global 'api-beca'
export class EstadoController {
  private readonly logger = new Logger(EstadoController.name);

  constructor(private readonly estadoService: EstadoService) {}

  @Post('/add') // Ruta final: POST /api-beca/estado/add (para crear)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateEstadoDto
  ): Promise<EstadoResponse> { // Especifica el tipo de retorno
    this.logger.log('Creando Estado: ' + JSON.stringify(dto));
    try {
      return await this.estadoService.create(dto);
    } catch (error) {
      this.logger.error(`Error en controlador al crear Estado: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id') // Ruta final: PUT /api-beca/estado/:id (para actualizar)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateEstadoDto
  ): Promise<EstadoResponse> { // Especifica el tipo de retorno
    const idNum = Number(id);
    this.logger.log(`Actualizando Estado ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    try {
      return await this.estadoService.update(idNum, dto);
    } catch (error) {
      this.logger.error(`Error en controlador al actualizar Estado ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get() // Ruta final: GET /api-beca/estado (para obtener todos)
  async findAll(): Promise<EstadoResponse[]> { // Especifica el tipo de retorno
    this.logger.log('Obteniendo todos los Estados');
    try {
      return await this.estadoService.findAll();
    } catch (error) {
      this.logger.error(`Error en controlador al obtener todos los Estados: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id') // Ruta final: GET /api-beca/estado/:id (para obtener uno por ID)
  async findOne(@Param('id') id: string): Promise<EstadoResponse> { // Especifica el tipo de retorno
    const idNum = Number(id);
    this.logger.log('Obteniendo Estado ID: ' + idNum);
    try {
      return await this.estadoService.findOne(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al obtener Estado ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id') // Ruta final: DELETE /api-beca/estado/:id (para eliminar)
  async remove(@Param('id') id: string): Promise<{ mensaje: string }> { // El tipo de retorno es un objeto con mensaje
    const idNum = Number(id);
    this.logger.log('Eliminando Estado ID: ' + idNum);
    try {
      return await this.estadoService.remove(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al eliminar Estado ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
