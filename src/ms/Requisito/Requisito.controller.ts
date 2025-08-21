import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RequisitoService } from './Requisito.service';
import { CreateRequisitoDto } from './dto/create-Requisito.dto';
import { ValidationPipe } from '@nestjs/common'; // Importar ValidationPipe

@Controller('requisito') // Usar 'requisito' (minúscula) por convención y para el prefijo global 'api-beca'
export class RequisitoController {
  private readonly logger = new Logger(RequisitoController.name);

  constructor(private readonly requisitoService: RequisitoService) {}

  @Post('/add') // Ruta final: POST /api-beca/requisito/add (para crear)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateRequisitoDto
  ) {
    this.logger.log('Creando requisito: ' + JSON.stringify(dto));
    try {
      return await this.requisitoService.create(dto);
    } catch (error) {
      this.logger.error(`Error en controlador al crear requisito: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id') // Ruta final: PUT /api-beca/requisito/:id (para actualizar)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateRequisitoDto
  ) {
    const idNum = Number(id);
    this.logger.log(`Actualizando requisito ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    try {
      return await this.requisitoService.update(idNum, dto);
    } catch (error) {
      this.logger.error(`Error en controlador al actualizar requisito ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get() // Ruta final: GET /api-beca/requisito (para obtener todos)
  async findAll() {
    this.logger.log('Obteniendo todos los requisitos');
    try {
      return await this.requisitoService.findAll();
    } catch (error) {
      this.logger.error(`Error en controlador al obtener todos los requisitos: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id') // Ruta final: GET /api-beca/requisito/:id (para obtener uno por ID)
  async findOne(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Obteniendo requisito ID: ' + idNum);
    try {
      return await this.requisitoService.findOne(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al obtener requisito ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id') // Ruta final: DELETE /api-beca/requisito/:id (para eliminar)
  async remove(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Eliminando requisito ID: ' + idNum);
    try {
      return await this.requisitoService.remove(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al eliminar requisito ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
