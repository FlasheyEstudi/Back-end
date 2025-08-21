// src/ms/Reporte/Reporte.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../cnxjs/sql.service';

@Injectable()
export class ReporteService {
  private readonly logger = new Logger(ReporteService.name);

  constructor(private readonly sqlService: SqlService) {}

  async getTotales(periodoAcademicoId?: number, estadoId?: number): Promise<any> {
    try {
      // Logs más claros sobre los parámetros recibidos
      this.logger.log(`[getTotales] Iniciando con PeriodoAcademicoId: ${periodoAcademicoId}, EstadoId: ${estadoId}`);
      
      const periodoParam = periodoAcademicoId ?? null;
      const estadoParam = estadoId ?? null;
      
      // Usar parámetros con nombre para mejor legibilidad y seguridad
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('PeriodoAcademicoId', periodoParam);
      request.input('EstadoId', estadoParam);

      const query = `EXEC Beca.sp_ResumenTotales @PeriodoAcademicoId, @EstadoId`;
      this.logger.debug(`[getTotales] Ejecutando query: ${query}`);
      
      const result = await request.execute('Beca.sp_ResumenTotales'); // Ejecutar SP directamente
      
      this.logger.debug(`[getTotales] Resultado raw: ${JSON.stringify(result.recordset)}`);
      
      // Asegurarse de devolver el recordset
      return result.recordset;
    } catch (error: any) {
      this.logger.error(`[getTotales] Error al obtener totales: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener resumen de totales.',
        technical: error.message,
        sqlError: error.originalError?.info?.message || null,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSolicitudesPorEstado(periodoAcademicoId?: number): Promise<any> {
    try {
      this.logger.log(`[getSolicitudesPorEstado] Iniciando con PeriodoAcademicoId: ${periodoAcademicoId}`);
      
      const periodoParam = periodoAcademicoId ?? null;
      
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('PeriodoAcademicoId', periodoParam);

      const query = `EXEC Beca.sp_SolicitudesPorEstado @PeriodoAcademicoId`;
      this.logger.debug(`[getSolicitudesPorEstado] Ejecutando query: ${query}`);
      
      const result = await request.execute('Beca.sp_SolicitudesPorEstado');
      this.logger.debug(`[getSolicitudesPorEstado] Resultado raw: ${JSON.stringify(result.recordset)}`);
      
      return result.recordset;
    } catch (error: any) {
      this.logger.error(`[getSolicitudesPorEstado] Error: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener solicitudes por estado.',
        technical: error.message,
        sqlError: error.originalError?.info?.message || null,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getFinancialData(periodoAcademicoId?: number, estadoId?: number): Promise<any> {
    try {
      this.logger.log(`[getFinancialData] Iniciando con PeriodoAcademicoId: ${periodoAcademicoId}, EstadoId: ${estadoId}`);
      
      const periodoParam = periodoAcademicoId ?? null;
      const estadoParam = estadoId ?? null;
      
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('PeriodoAcademicoId', periodoParam);
      request.input('EstadoId', estadoParam);

      const query = `EXEC Beca.sp_ResumenFinanciero @PeriodoAcademicoId, @EstadoId`;
      this.logger.debug(`[getFinancialData] Ejecutando query: ${query}`);
      
      const result = await request.execute('Beca.sp_ResumenFinanciero');
      this.logger.debug(`[getFinancialData] Resultado raw: ${JSON.stringify(result.recordset)}`);
      
      return result.recordset;
    } catch (error: any) {
      this.logger.error(`[getFinancialData] Error: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos financieros.',
        technical: error.message,
        sqlError: error.originalError?.info?.message || null,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getStudentData(): Promise<any> {
    try {
      this.logger.log(`[getStudentData] Iniciando...`);
      
      const query = `EXEC Beca.sp_Get_Estudiante_Detalle`;
      this.logger.debug(`[getStudentData] Ejecutando query: ${query}`);
      
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().execute('Beca.sp_Get_Estudiante_Detalle');
      
      this.logger.debug(`[getStudentData] Resultado raw: ${JSON.stringify(result.recordset)}`);
      return result.recordset;
    } catch (error: any) {
      this.logger.error(`[getStudentData] Error: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener información detallada de estudiantes.',
        technical: error.message,
        sqlError: error.originalError?.info?.message || null,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getImpactData(): Promise<any> {
    try {
      this.logger.log(`[getImpactData] Iniciando...`);
      
      const query = `EXEC Beca.sp_Get_Impacto_Becas`;
      this.logger.debug(`[getImpactData] Ejecutando query: ${query}`);
      
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().execute('Beca.sp_Get_Impacto_Becas');
      
      this.logger.debug(`[getImpactData] Resultado raw: ${JSON.stringify(result.recordset)}`);
      return result.recordset;
    } catch (error: any) {
      this.logger.error(`[getImpactData] Error: ${error.message}`, error.stack);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detalle: 'Error al obtener datos de impacto.',
        technical: error.message,
        sqlError: error.originalError?.info?.message || null,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
// Nota: Se mantienen los nombres de los métodos y la estructura general.
// La corrección principal será en el frontend para que coincidan los nombres.