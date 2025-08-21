import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ReporteService } from './reporte.service';
import { ReporteDto } from './dto/create-reporte.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth-guard';

@Controller('/reporte')
@UseGuards(JwtAuthGuard)
export class ReporteController {
  private readonly logger = new Logger(ReporteController.name);

  constructor(private readonly reporteService: ReporteService) {}

  @Get('totales')
  @HttpCode(HttpStatus.OK)
  async getTotales(@Query() queryDto: ReporteDto) {
    this.logger.log(`Fetching totales with PeriodoAcademicoId: ${queryDto.periodoAcademicoId}, EstadoId: ${queryDto.estadoId}`);
    return await this.reporteService.getTotales(queryDto.periodoAcademicoId, queryDto.estadoId);
  }

  @Get('solicitudes-por-estado')
  @HttpCode(HttpStatus.OK)
  async getSolicitudesPorEstado(@Query() queryDto: ReporteDto) {
    this.logger.log(`Fetching solicitudes por estado with PeriodoAcademicoId: ${queryDto.periodoAcademicoId}`);
    return await this.reporteService.getSolicitudesPorEstado(queryDto.periodoAcademicoId);
  }

  @Get('financial')
  @HttpCode(HttpStatus.OK)
  async getFinancialData(@Query() queryDto: ReporteDto) {
    this.logger.log(`Fetching financial data with PeriodoAcademicoId: ${queryDto.periodoAcademicoId}, EstadoId: ${queryDto.estadoId}`);
    return await this.reporteService.getFinancialData(queryDto.periodoAcademicoId, queryDto.estadoId);
  }

  @Get('estudiantes')
  @HttpCode(HttpStatus.OK)
  async getStudentData() {
    this.logger.log('Fetching student data');
    return await this.reporteService.getStudentData();
  }

  @Get('impacto')
  @HttpCode(HttpStatus.OK)
  async getImpactData() {
    this.logger.log('Fetching impact data');
    return await this.reporteService.getImpactData();
  }
}
