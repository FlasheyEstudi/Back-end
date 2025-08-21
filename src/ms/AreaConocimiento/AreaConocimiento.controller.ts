import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AreaConocimientoService } from './AreaConocimiento.service';
import { CreateAreaConocimientoDto } from './dto/create-AreaConocimiento.dto';

@Controller('area-conocimiento') // ¡AHORA SOLO ES 'area-conocimiento'!
export class AreaConocimientoController {
  private readonly logger = new Logger(AreaConocimientoController.name);

  constructor(private readonly areaConocimientoService: AreaConocimientoService) {}

  @Post('/add') // Ruta final: POST /api-beca/area-conocimiento/add
  async create(@Body() dto: CreateAreaConocimientoDto) {
    this.logger.log('Creando AreaConocimiento: ' + JSON.stringify(dto));
    return await this.areaConocimientoService.create(dto);
  }

  @Put(':id') // Ruta final: PUT /api-beca/area-conocimiento/:id
  async update(@Param('id') id: string, @Body() dto: CreateAreaConocimientoDto) {
    const idNum = Number(id);
    this.logger.log(`Actualizando AreaConocimiento ID: ${idNum} con datos: ${JSON.stringify(dto)}`);
    dto.Id = idNum; // Asegurarse que el ID del parámetro se usa en el DTO
    return await this.areaConocimientoService.create(dto);
  }

  @Get() // Ruta final: GET /api-beca/area-conocimiento
  async findAll() {
    this.logger.log('Obteniendo todas las AreaConocimiento');
    return await this.areaConocimientoService.findAll();
  }

  @Get(':id') // Ruta final: GET /api-beca/area-conocimiento/:id
  async findOne(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Obteniendo AreaConocimiento ID: ' + idNum);
    return await this.areaConocimientoService.findOne(idNum);
  }

  @Delete(':id') // Ruta final: DELETE /api-beca/area-conocimiento/:id
  async remove(@Param('id') id: string) {
    const idNum = Number(id);
    this.logger.log('Eliminando AreaConocimiento ID: ' + idNum);
    return await this.areaConocimientoService.remove(idNum);
  }
}
