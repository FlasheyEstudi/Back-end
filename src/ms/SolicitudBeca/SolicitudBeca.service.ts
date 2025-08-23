// src/app/ms/SolicitudBeca/SolicitudBeca.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateSolicitudBecaDto } from './dto/create-SolicitudBeca.dto';

// Interfaz para asegurar que el backend devuelva datos compatibles con el frontend
export interface SolicitudBecaDetalle {
  Id: number;
  EstudianteId: number;
  TipoBecaId: number;
  EstadoId: number;
  FechaSolicitud: string;
  PeriodoAcademicoId: number;
  Observaciones?: string;
  Fecha_resultado?: string;
  EstudianteNombre: string;
  EstudianteApellido: string;
  TipoBecaNombre: string;
  EstadoNombre: string;
  PeriodoAcademicoNombre: string;
  PeriodoAnioAcademico: string;
}

@Injectable()
export class SolicitudBecaService {
  private readonly logger = new Logger(SolicitudBecaService.name);

  constructor(private readonly sqlService: SqlService) {}

  async getConnection() {
    return await this.sqlService.getConnection();
  }

  async mapUserToEstudiante(userId: number): Promise<number> {
    try {
      this.logger.log(`Mapeando UserId ${userId} a EstudianteId`);
      const pool = await this.getConnection();
      const request = pool.request();
      request.input('UserId', userId);
      const result = await request.execute('Beca.sp_Map_UserToEstudiante');

      if (result.recordset.length === 0) {
        throw new Error(`No se encontró estudiante asociado al usuario ID ${userId}`);
      }

      const estudianteId = result.recordset[0].EstudianteId;
      this.logger.log(`Mapeo exitoso: UserId ${userId} -> EstudianteId ${estudianteId}`);
      return estudianteId;
    } catch (error) {
      this.logger.error(`Error en mapeo UserId->EstudianteId: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEstudianteId(userId: number): Promise<SolicitudBecaDetalle[]> {
    try {
      this.logger.log(`Buscando solicitudes para Usuario ID (a mapear): ${userId}`);
      const pool = await this.getConnection();

      // Mapear Usuario.Id a Estudiante.Id
      let estudianteId: number;
      try {
        this.logger.log(`Mapeando UserId ${userId} a EstudianteId...`);
        const mapRequest = pool.request();
        mapRequest.input('UserId', userId);
        const mapResult = await mapRequest.execute('Beca.sp_Map_UserToEstudiante');

        if (mapResult.recordset && mapResult.recordset.length > 0) {
          estudianteId = mapResult.recordset[0].EstudianteId;
          this.logger.log(`Mapeo exitoso: Usuario.Id ${userId} -> Estudiante.Id ${estudianteId}`);
        } else {
          const errorMsg = `sp_Map_UserToEstudiante no devolvió un EstudianteId para Usuario.Id ${userId}`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (mapError: any) {
        this.logger.error(`Error en mapeo UserId->EstudianteId: ${mapError.message}`, mapError.stack);
        throw new Error(`No se pudo obtener el ID del estudiante asociado al usuario. Detalle: ${mapError.message}`);
      }

      // Validar que el estudiante exista
      this.logger.log(`Verificando existencia del Estudiante.Id ${estudianteId}...`);
      const estudianteExists = await pool.request()
        .input('Id', estudianteId)
        .execute('Beca.sp_Get_Estudiante');

      if (estudianteExists.recordset.length === 0) {
        const errorMsg = `Estudiante con ID ${estudianteId} no encontrado después del mapeo.`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      this.logger.log(`Estudiante.Id ${estudianteId} verificado.`);

      // Obtener solicitudes del estudiante
      this.logger.log(`Obteniendo solicitudes para Estudiante.Id ${estudianteId}...`);
      const result = await pool.request()
        .input('EstudianteId', estudianteId)
        .execute('Beca.sp_Get_SolicitudBeca_ByEstudiante');

      // Mapear los datos a la interfaz SolicitudBecaDetalle
      const solicitudes: SolicitudBecaDetalle[] = (result.recordset || []).map(solicitud => ({
        Id: solicitud.Id,
        EstudianteId: solicitud.EstudianteId,
        TipoBecaId: solicitud.TipoBecaId,
        EstadoId: solicitud.EstadoId,
        FechaSolicitud: solicitud.FechaSolicitud ? new Date(solicitud.FechaSolicitud).toISOString() : null,
        PeriodoAcademicoId: solicitud.PeriodoAcademicoId,
        Observaciones: solicitud.Observaciones || null,
        Fecha_resultado: solicitud.Fecha_resultado ? new Date(solicitud.Fecha_resultado).toISOString() : null,
        EstudianteNombre: solicitud.EstudianteNombre || null,
        EstudianteApellido: solicitud.EstudianteApellido || null,
        TipoBecaNombre: solicitud.TipoBecaNombre || null,
        EstadoNombre: solicitud.Estadonombre || solicitud.EstadoNombre || null, // Manejar ambas posibilidades
        PeriodoAcademicoNombre: solicitud.PeriodoAcademicoNombre || null,
        PeriodoAnioAcademico: solicitud.PeriodoAnioAcademico || null
      }));

      this.logger.log(`Solicitudes obtenidas para Estudiante.Id ${estudianteId}: ${solicitudes.length}`);
      return solicitudes;
    } catch (error: any) {
      this.logger.error(`Error al obtener solicitudes para Usuario/Estudiante ID ${userId}:`, error);
      throw error;
    }
  }

  async getAllFrontendData() {
    try {
      this.logger.log('=== INICIANDO OBTENCIÓN DE DATOS PARA FRONTEND ===');
      const pool = await this.getConnection();

      this.logger.log('Ejecutando: Beca.sp_Get_SolicitudBeca @Id=0');
      const solicitudBecaResult = await pool.request().input('Id', 0).execute('Beca.sp_Get_SolicitudBeca');
      const solicitudes = solicitudBecaResult.recordset || [];
      this.logger.log(`Solicitudes obtenidas: ${solicitudes.length}`);

      this.logger.log('Ejecutando: Beca.sp_Get_All_Estudiantes');
      const estudianteResult = await pool.request().execute('Beca.sp_Get_All_Estudiantes');
      const estudiantes = estudianteResult.recordset || [];
      this.logger.log(`Estudiantes obtenidos: ${estudiantes.length}`);

      this.logger.log('Ejecutando: Beca.sp_Get_All_TipoBeca');
      const tipoBecaResult = await pool.request().execute('Beca.sp_Get_All_TipoBeca');
      const tiposBeca = tipoBecaResult.recordset || [];
      this.logger.log(`Tipos de beca obtenidos: ${tiposBeca.length}`);

      this.logger.log('Ejecutando: Beca.sp_Get_All_Estado');
      const estadoResult = await pool.request().execute('Beca.sp_Get_All_Estado');
      const estados = estadoResult.recordset || [];
      this.logger.log(`Estados obtenidos: ${estados.length}`);

      this.logger.log('Ejecutando: Beca.sp_Get_All_PeriodoAcademico');
      const periodoAcademicoResult = await pool.request().execute('Beca.sp_Get_All_PeriodoAcademico');
      const periodosAcademicos = periodoAcademicoResult.recordset || [];
      this.logger.log(`Periodos académicos obtenidos: ${periodosAcademicos.length}`);

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

  async debugDatabaseConnection() {
    try {
      this.logger.log('=== DEBUG: Verificando conexión a base de datos ===');
      const pool = await this.getConnection();
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

  async findOne(id: number) {
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
      return {
        Id: solicitud.Id,
        EstudianteId: solicitud.EstudianteId,
        TipoBecaId: solicitud.TipoBecaId,
        EstadoId: solicitud.EstadoId,
        FechaSolicitud: solicitud.FechaSolicitud ? new Date(solicitud.FechaSolicitud).toISOString() : null,
        PeriodoAcademicoId: solicitud.PeriodoAcademicoId,
        Observaciones: solicitud.Observaciones,
        Fecha_resultado: solicitud.Fecha_resultado ? new Date(solicitud.Fecha_resultado).toISOString() : null,
        EstudianteNombre: solicitud.EstudianteNombre || null,
        EstudianteApellido: solicitud.EstudianteApellido || null,
        TipoBecaNombre: solicitud.TipoBecaNombre || null,
        EstadoNombre: solicitud.Estadonombre || solicitud.EstadoNombre || null,
        PeriodoAcademicoNombre: solicitud.PeriodoAcademicoNombre
          ? `${solicitud.PeriodoAcademicoNombre} (${solicitud.PeriodoAnioAcademico})`
          : null
      };
    } catch (error) {
      this.logger.error(`findOne: Error buscando solicitud ID ${id}:`, {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

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

  async create(dto: CreateSolicitudBecaDto) {
    try {
      this.logger.log(`Creando Solicitud de Beca con datos (originales): ${JSON.stringify(dto)}`);
      const pool = await this.sqlService.getConnection();

      let estudianteIdToUse = dto.EstudianteId;
      try {
        this.logger.log(`Intentando mapear Usuario.Id ${dto.EstudianteId} a Estudiante.Id...`);
        const mapRequest = pool.request();
        mapRequest.input('UserId', dto.EstudianteId);
        const mapResult = await mapRequest.execute('Beca.sp_Map_UserToEstudiante');

        if (mapResult.recordset && mapResult.recordset.length > 0) {
          estudianteIdToUse = mapResult.recordset[0].EstudianteId;
          this.logger.log(`Mapeo exitoso: Usuario.Id ${dto.EstudianteId} -> Estudiante.Id ${estudianteIdToUse}`);
        } else {
          const errorMsg = `sp_Map_UserToEstudiante no devolvió un EstudianteId para Usuario.Id ${dto.EstudianteId}`;
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (mapError: any) {
        this.logger.error(`Error al mapear Usuario.Id ${dto.EstudianteId} a Estudiante.Id:`, mapError);
        throw new Error(`No se pudo obtener el ID del estudiante asociado al usuario. Detalle: ${mapError.message}`);
      }

      this.logger.log(`Verificando existencia del Estudiante.Id ${estudianteIdToUse}...`);
      const estudianteExists = await pool.request()
        .input('Id', estudianteIdToUse)
        .execute('Beca.sp_Get_Estudiante');

      if (estudianteExists.recordset.length === 0) {
        const errorMsg = `Estudiante con ID ${estudianteIdToUse} no encontrado en la tabla Estudiante.`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }
      this.logger.log(`Estudiante.Id ${estudianteIdToUse} verificado correctamente.`);

      const request = pool.request();
      const isUpdate = dto.Id && dto.Id > 0;
      const solicitudBecaIdForSp = isUpdate ? dto.Id : 0;

      request.input('Id', solicitudBecaIdForSp);
      request.input('EstudianteId', estudianteIdToUse);
      request.input('TipoBecaId', dto.TipoBecaId);
      request.input('EstadoId', dto.EstadoId || 1);
      request.input('FechaSolicitud', new Date(dto.FechaSolicitud));
      request.input('PeriodoAcademicoId', dto.PeriodoAcademicoId);
      request.input('Observaciones', dto.Observaciones || null);
      request.input('Fecha_resultado', dto.Fecha_resultado ? new Date(dto.Fecha_resultado) : null);

      this.logger.log(`Ejecutando sp_Save_SolicitudBeca con EstudianteId=${estudianteIdToUse}, TipoBecaId=${dto.TipoBecaId}, PeriodoAcademicoId=${dto.PeriodoAcademicoId}...`);
      const result: any = await request.execute('Beca.sp_Save_SolicitudBeca');

      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || solicitudBecaIdForSp;

      if (!newId && !isUpdate) {
        const errorMsg = 'El procedimiento almacenado no devolvió un NewId válido al guardar la solicitud de beca.';
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      this.logger.log(`Solicitud de Beca creada/actualizada con ID: ${newId}`);
      return await this.findOne(newId);
    } catch (error: any) {
      this.logger.error(`Error al guardar Solicitud de Beca: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, dto: CreateSolicitudBecaDto) {
    dto.Id = id;
    return this.create(dto);
  }

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