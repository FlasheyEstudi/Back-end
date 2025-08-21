// src/ms/estudiante/estudiante.controller.ts
import { Controller, Post, Body, Get, Param, Delete, Logger } from '@nestjs/common';
import { EstudianteService } from './estudiante.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { ValidationPipe } from '@nestjs/common';

@Controller('estudiante')
export class EstudianteController {
  private readonly logger = new Logger(EstudianteController.name);

  constructor(private readonly estudianteService: EstudianteService) {}

  @Post()
  async create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateEstudianteDto
  ) {
    this.logger.log('Creando estudiante: ' + JSON.stringify(dto));
    return await this.estudianteService.create(dto);
  }

  @Get()
  async findAll() {
    this.logger.log('Obteniendo todos los estudiantes');
    return await this.estudianteService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log('Obteniendo estudiante ID: ' + id);
    return await this.estudianteService.findOne(Number(id));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log('Eliminando estudiante ID: ' + id);
    return await this.estudianteService.remove(Number(id));
  }
}