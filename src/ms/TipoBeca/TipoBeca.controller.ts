import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { TipoBecaService } from './TipoBeca.service';
import { CreateTipoBecaDto } from './dto/create-TipoBeca.dto';
import { ValidationPipe } from '@nestjs/common';

@Controller('tipobeca')
export class TipoBecaController {
  private readonly logger = new Logger(TipoBecaController.name);

  constructor(private readonly tipoBecaService: TipoBecaService) {}

  @Post('/add')
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateTipoBecaDto
  ) {
    this.logger.log('Creando TipoBeca: ' + JSON.stringify(dto));
    try {
      return await this.tipoBecaService.create(dto);
    } catch (error) {
      this.logger.error(`Error en controlador al crear TipoBeca: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateTipoBecaDto
  ) {
    const idNum = Number(id);
    // VALIDACIÓN ADICIONAL
    if (isNaN(idNum) || idNum <= 0) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    this.logger.log(`Actualizando TipoBeca ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    try {
      return await this.tipoBecaService.update(idNum, dto);
    } catch (error) {
      this.logger.error(`Error en controlador al actualizar TipoBeca ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get()
  async findAll() {
    this.logger.log('Obteniendo todos los TipoBecas');
    try {
      return await this.tipoBecaService.findAll();
    } catch (error) {
      this.logger.error(`Error en controlador al obtener todos los TipoBecas: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const idNum = Number(id);
    // VALIDACIÓN ADICIONAL
    if (isNaN(idNum) || idNum <= 0) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    this.logger.log('Obteniendo TipoBeca ID: ' + idNum);
    try {
      return await this.tipoBecaService.findOne(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al obtener TipoBeca ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const idNum = Number(id);
    // VALIDACIÓN ADICIONAL
    if (isNaN(idNum) || idNum <= 0) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }
    this.logger.log('Eliminando TipoBeca ID: ' + idNum);
    try {
      return await this.tipoBecaService.remove(idNum);
    } catch (error) {
      this.logger.error(`Error en controlador al eliminar TipoBeca ID ${idNum}: ${error.message}`, error.stack);
      throw error;
    }
  }
}