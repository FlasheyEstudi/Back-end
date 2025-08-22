import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Put,
  Logger,
  HttpException,      // ✅ Importado
  HttpStatus,         // ✅ Importado
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { RequisitoService } from './Requisito.service';
import { CreateRequisitoDto } from './dto/create-Requisito.dto';

@Controller('requisito')
export class RequisitoController {
  private readonly logger = new Logger(RequisitoController.name);

  constructor(private readonly requisitoService: RequisitoService) {}

  @Post('/add')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() dto: CreateRequisitoDto) {
    this.logger.log(`Creando requisito: ${JSON.stringify(dto)}`);
    return await this.requisitoService.create(dto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() dto: CreateRequisitoDto) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new HttpException('ID inválido en la URL.', HttpStatus.BAD_REQUEST);
    }
    this.logger.log(`Actualizando requisito ID ${idNum}`);
    return await this.requisitoService.update(idNum, dto);
  }

  @Get()
  async findAll() {
    this.logger.log('Obteniendo todos los requisitos');
    return await this.requisitoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new HttpException('ID inválido en la URL.', HttpStatus.BAD_REQUEST);
    }
    this.logger.log(`Obteniendo requisito ID ${idNum}`);
    return await this.requisitoService.findOne(idNum);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const idNum = Number(id);
    if (isNaN(idNum)) {
      throw new HttpException('ID inválido en la URL.', HttpStatus.BAD_REQUEST);
    }
    this.logger.log(`Eliminando requisito ID ${idNum}`);
    return await this.requisitoService.remove(idNum);
  }
}