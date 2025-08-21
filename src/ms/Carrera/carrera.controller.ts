// src/ms/carrera/carrera.controller.ts
import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CarreraService } from './carrera.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { ValidationPipe } from '@nestjs/common'; // Asegúrate de importar ValidationPipe si lo usas a nivel de método

@Controller('carrera') // Usar solo 'carrera' ya que el prefijo global 'api-beca' se maneja en main.ts
export class CarreraController {
  private readonly logger = new Logger(CarreraController.name);

  constructor(private readonly carreraService: CarreraService) {}

  @Post('/add') // ¡Ahora coincide con la llamada POST desde Angular! (POST /api-beca/carrera/add)
  async create(
    // Si tienes ValidationPipe configurado globalmente en main.ts, este es redundante pero no hace daño.
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateCarreraDto
  ) {
    this.logger.log('Creando carrera: ' + JSON.stringify(dto));
    try {
      return await this.carreraService.create(dto);
    } catch (error) {
      this.logger.error(`Error en controlador al crear carrera: ${error.message}`, error.stack);
      // Re-lanzar la excepción para que el interceptor de excepciones de NestJS la maneje
      throw error;
    }
  }

  @Put(':id') // ¡Nuevo endpoint para la actualización! (PUT /api-beca/carrera/:id)
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateCarreraDto // Puedes usar el mismo DTO o uno específico para actualización
  ) {
    const idNum = Number(id);
    this.logger.log(`Actualizando carrera ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    try {
      return await this.carreraService.update(idNum, dto);
    } catch (error) {
      this.logger.error(`Error en controlador al actualizar carrera ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get() // (GET /api-beca/carrera)
  async findAll() {
    this.logger.log('Obteniendo todas las carreras');
    try {
      return await this.carreraService.findAll();
    } catch (error) {
      this.logger.error(`Error en controlador al obtener todas las carreras: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id') // (GET /api-beca/carrera/:id)
  async findOne(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Obteniendo carrera ID: ' + idNum);
    try {
      return await this.carreraService.findOne(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al obtener carrera ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id') // (DELETE /api-beca/carrera/:id)
  async remove(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Eliminando carrera ID: ' + idNum);
    try {
      return await this.carreraService.remove(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al eliminar carrera ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
