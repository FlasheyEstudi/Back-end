import { 
  Controller, Post, Body, Get, Param, Delete, Put, 
  Logger, HttpException, HttpStatus, ValidationPipe 
} from '@nestjs/common';
import { TipoBecaService } from './TipoBeca.service';
import { CreateTipoBecaDto } from './dto/create-TipoBeca.dto';

@Controller('tipobeca')
export class TipoBecaController {
  private readonly logger = new Logger(TipoBecaController.name);

  constructor(private readonly tipoBecaService: TipoBecaService) {}

  // --- Helper para validar ID ---
  private validarId(id: string): number {
    const numId = Number(id);
    if (isNaN(numId) || numId <= 0) {
      throw new HttpException(`ID inválido: ${id}`, HttpStatus.BAD_REQUEST);
    }
    return numId;
  }

  @Post('/add')
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) 
    dto: CreateTipoBecaDto
  ) {
    return this.tipoBecaService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) 
    dto: CreateTipoBecaDto
  ) {
    const numId = this.validarId(id);
    return this.tipoBecaService.update(numId, dto);
  }

  @Get()
  async findAll() {
    return this.tipoBecaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numId = this.validarId(id);
    return this.tipoBecaService.findOne(numId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numId = this.validarId(id);
    return this.tipoBecaService.remove(numId);
  }

  @Put(':id/estado')
  async updateEstado(@Param('id') id: string, @Body('EstadoId') estadoId: number) {
    const numId = this.validarId(id);

    if (!estadoId || estadoId <= 0) {
      throw new HttpException('EstadoId inválido', HttpStatus.BAD_REQUEST);
    }

    return this.tipoBecaService.updateEstado(numId, estadoId);
  }

  @Get('resumen')
  async getResumen() {
    return this.tipoBecaService.getResumen();
  }
}
