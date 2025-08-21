// src/app/ms/SolicitudBeca/SolicitudBeca.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateSolicitudBecaDto } from './dto/create-SolicitudBeca.dto';

@Injectable()
export class SolicitudBecaService {
  private readonly logger = new Logger(SolicitudBecaService.name);

  constructor(private readonly sqlService: SqlService) {}
  
  async getConnection() {
    return await this.sqlService.getConnection();
  }

  /**
   * MÉTODO PRINCIPAL - Obtiene todos los datos necesarios para el frontend
   * Solución definitiva sin validaciones problemáticas
   */
  async getAllFrontendData() {
    try {
      this.logger.log('=== INICIANDO OBTENCIÓN DE DATOS PARA FRONTEND ===');
      
      // Obtener conexión a base de datos
      const pool = await this.getConnection();
      
      // ==================== EJECUTAR PROCEDIMIENTOS ALMACENADOS ====================
      // 1. Obtener todas las solicitudes de beca (con datos de lookup)
      this.logger.log('Ejecutando: Beca.sp_Get_SolicitudBeca @Id=0');
      const solicitudBecaResult = await pool.request().input('Id', 0).execute('Beca.sp_Get_SolicitudBeca');
      const solicitudes = solicitudBecaResult.recordset || [];
      this.logger.log(`Solicitudes obtenidas: ${solicitudes.length}`);

      // 2. Obtener todos los estudiantes (procedimiento específico sin parámetros)
      this.logger.log('Ejecutando: Beca.sp_Get_All_Estudiantes');
      const estudianteResult = await pool.request().execute('Beca.sp_Get_All_Estudiantes');
      const estudiantes = estudianteResult.recordset || [];
      this.logger.log(`Estudiantes obtenidos: ${estudiantes.length}`);

      // 3. Obtener todos los tipos de beca (procedimiento específico sin parámetros)
      this.logger.log('Ejecutando: Beca.sp_Get_All_TipoBeca');
      const tipoBecaResult = await pool.request().execute('Beca.sp_Get_All_TipoBeca');
      const tiposBeca = tipoBecaResult.recordset || [];
      this.logger.log(`Tipos de beca obtenidos: ${tiposBeca.length}`);

      // 4. Obtener todos los estados (procedimiento específico sin parámetros)
      this.logger.log('Ejecutando: Beca.sp_Get_All_Estado');
      const estadoResult = await pool.request().execute('Beca.sp_Get_All_Estado');
      const estados = estadoResult.recordset || [];
      this.logger.log(`Estados obtenidos: ${estados.length}`);

      // 5. Obtener todos los periodos académicos (procedimiento específico sin parámetros)
      this.logger.log('Ejecutando: Beca.sp_Get_All_PeriodoAcademico');
      const periodoAcademicoResult = await pool.request().execute('Beca.sp_Get_All_PeriodoAcademico');
      const periodosAcademicos = periodoAcademicoResult.recordset || [];
      this.logger.log(`Periodos académicos obtenidos: ${periodosAcademicos.length}`);

      // ==================== RETORNAR DATOS ESTRUCTURADOS ====================
      this.logger.log('=== DATOS OBTENIDOS EXITOSAMENTE ===');
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          solicitudes,
          estudiantes,
          tiposBeca,
          estados,
          periodosAcademicos
        },
        counts: {
          solicitudes: solicitudes.length,
          estudiantes: estudiantes.length,
          tiposBeca: tiposBeca.length,
          estados: estados.length,
          periodosAcademicos: periodosAcademicos.length
        }
      };

    } catch (error) {
      this.logger.error('=== ERROR CRÍTICO EN getAllFrontendData ===');
      this.logger.error('Error completo:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Retornar estructura segura sin lanzar excepciones
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          type: error.constructor.name,
          code: error.code || 'UNKNOWN_ERROR'
        },
        data: null,
        counts: {
          solicitudes: 0,
          estudiantes: 0,
          tiposBeca: 0,
          estados: 0,
          periodosAcademicos: 0
        }
      };
    }
  }

  /**
   * MÉTODO DE DEBUG - Para verificar conectividad y datos básicos
   */
  async debugDatabaseConnection() {
    try {
      this.logger.log('=== DEBUG: Verificando conexión a base de datos ===');
      const pool = await this.getConnection();
      
      // Verificar que podemos ejecutar una consulta simple
      const testResult = await pool.request().query('SELECT COUNT(*) as count FROM DbBecas.Beca.SolicitudBeca');
      
      return {
        success: true,
        message: 'Conexión a base de datos verificada',
        testCount: testResult.recordset[0].count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('DEBUG ERROR:', error);
      return {
        success: false,
        message: 'Error de conexión',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtiene una solicitud de beca por ID con manejo de errores robusto
   */
  async findOne(id: number) {
    // Validación estricta de entrada - PREVENCIÓN DE NaN
    if (id === undefined || id === null || isNaN(id) || id <= 0 || !Number.isInteger(id)) {
      this.logger.warn(`findOne: ID inválido recibido - ${typeof id} ${id}`);
      throw new Error(`ID inválido para búsqueda: ${id}`);
    }

    try {
      this.logger.log(`findOne: Buscando solicitud con ID ${id}`);
      const pool = await this.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Get_SolicitudBeca');
      
      if (!result.recordset || result.recordset.length === 0) {
        throw new Error(`Solicitud de Beca con ID ${id} no encontrada`);
      }

      const solicitud = result.recordset[0];
      
      // Procesar y retornar datos con formato consistente
      return {
        Id: solicitud.Id,
        EstudianteId: solicitud.EstudianteId,
        TipoBecaId: solicitud.TipoBecaId,
        EstadoId: solicitud.EstadoId,
        FechaSolicitud: solicitud.FechaSolicitud ? new Date(solicitud.FechaSolicitud) : null,
        PeriodoAcademicoId: solicitud.PeriodoAcademicoId,
        Observaciones: solicitud.Observaciones,
        Fecha_resultado: solicitud.Fecha_resultado ? new Date(solicitud.Fecha_resultado) : null,
        EstudianteNombre: solicitud.EstudianteNombre || null,
        EstudianteApellido: solicitud.EstudianteApellido || null,
        TipoBecaNombre: solicitud.TipoBecaNombre || null,
        Estadonombre: solicitud.Estadonombre || null,
        PeriodoAcademicoNombre: solicitud.PeriodoAcademicoNombre ? 
          `${solicitud.PeriodoAcademicoNombre} (${solicitud.PeriodoAnioAcademico})` : null
      };
    } catch (error) {
      this.logger.error(`findOne: Error buscando solicitud ID ${id}:`, {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Obtiene todas las solicitudes de beca
   */
  async findAll() {
    try {
      this.logger.log('findAll: Obteniendo todas las solicitudes de beca');
      const pool = await this.getConnection();
      const result = await pool.request().input('Id', 0).execute('Beca.sp_Get_SolicitudBeca');
      return result.recordset || [];
    } catch (error) {
      this.logger.error('findAll: Error obteniendo solicitudes:', error);
      throw error;
    }
  }

  /**
   * Crea o actualiza una solicitud de beca
   */
  async create(dto: CreateSolicitudBecaDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      const isUpdate = dto.Id && dto.Id > 0;
      const solicitudBecaIdForSp = isUpdate ? dto.Id : 0;

      request.input('Id', solicitudBecaIdForSp);
      request.input('EstudianteId', dto.EstudianteId);
      request.input('TipoBecaId', dto.TipoBecaId);
      request.input('EstadoId', dto.EstadoId);
      request.input('FechaSolicitud', new Date(dto.FechaSolicitud));
      request.input('PeriodoAcademicoId', dto.PeriodoAcademicoId);
      request.input('Observaciones', dto.Observaciones || null);
      request.input('Fecha_resultado', dto.Fecha_resultado ? new Date(dto.Fecha_resultado) : null);

      const result: any = await request.execute('Beca.sp_Save_SolicitudBeca');
      
      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || solicitudBecaIdForSp;

      if (!newId && !isUpdate) {
        throw new Error('El procedimiento almacenado no devolvió un NewId válido al guardar la solicitud de beca.');
      }

      return await this.findOne(newId);

    } catch (error: any) {
      this.logger.error(`Error al guardar Solicitud de Beca: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Actualiza una solicitud de beca existente
   */
  async update(id: number, dto: CreateSolicitudBecaDto) {
      dto.Id = id;
      return this.create(dto);
  }

  /**
   * Elimina una solicitud de beca por su ID
   */
  async remove(id: number): Promise<{ mensaje: string }> {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_SolicitudBeca');

      if (result.rowsAffected[0] === 0) {
        throw new Error(`Solicitud de Beca con ID ${id} no encontrada o no se pudo eliminar.`);
      }
      return { mensaje: `Solicitud de Beca con ID ${id} eliminada correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar Solicitud de Beca ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}