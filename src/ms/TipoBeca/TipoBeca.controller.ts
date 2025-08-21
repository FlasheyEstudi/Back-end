import { Controller, Post, Body, Get, Param, Delete, Put, Logger, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { TipoBecaService } from './TipoBeca.service';
import { CreateTipoBecaDto } from './dto/create-TipoBeca.dto';

@Controller('tipobeca')
export class TipoBecaController {
  private readonly logger = new Logger(TipoBecaController.name);

  constructor(private readonly tipoBecaService: TipoBecaService) {}

  @Post('/add')
  async create(@Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateTipoBecaDto) {
    return this.tipoBecaService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: CreateTipoBecaDto) {
    return this.tipoBecaService.update(Number(id), dto);
  }

  @Get()
  async findAll() {
    return this.tipoBecaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tipoBecaService.findOne(Number(id));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tipoBecaService.remove(Number(id));
  }

  @Put(':id/estado')
  async updateEstado(@Param('id') id: string, @Body('EstadoId') estadoId: number) {
    const idNum = Number(id);
    if (isNaN(idNum) || idNum <= 0) throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    if (!estadoId || estadoId <= 0) throw new HttpException('EstadoId inválido', HttpStatus.BAD_REQUEST);

    return this.tipoBecaService.updateEstado(idNum, estadoId);
  }

  @Get('resumen')
  async getResumen() {
    return this.tipoBecaService.getResumen();
  }
}