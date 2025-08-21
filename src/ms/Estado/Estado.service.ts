import { Injectable, Logger, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { SqlService } from '../cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta
import { CreateEstadoDto } from './dto/create-Estado.dto';

// Interfaz para el tipo de datos que se retorna del servicio
export interface EstadoResponse {
  Id: number;
  Nombre: string;
  FechaRegistro: Date;
  FechaModificacion: Date | null;
}

@Injectable()
export class EstadoService {
  private readonly logger = new Logger(EstadoService.name);

  constructor(private readonly sqlService: SqlService) {}

  // Este método maneja tanto la creación (INSERT) como la actualización (UPDATE)
  async create(dto: CreateEstadoDto): Promise<EstadoResponse> {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      const isUpdate = dto.Id && dto.Id > 0;
      const estadoIdForSp = isUpdate ? dto.Id : 0; // 0 para nuevo, >0 para actualizar

      request.input('Id', estadoIdForSp);
      request.input('Nombre', dto.Nombre);
      
      // Manejar fechas de registro y modificación
      request.input('FechaRegistro', dto.FechaRegistro || null);
      request.input('FechaModificacion', dto.FechaModificacion || null);

      const result: any = await request.execute('Beca.sp_Save_Estado'); // Asumiendo este SP

      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || estadoIdForSp;

      if (!newId && !isUpdate) {
        throw new Error('El procedimiento almacenado no devolvió un NewId válido al crear el estado.');
      }
      
      this.logger.log(`Estado guardado/actualizado ID ${newId}: ${dto.Nombre}`);
      // Retornar el objeto completo para que el frontend tenga los datos más recientes
      return await this.findOne(newId); 

    } catch (error: any) {
      this.logger.error(`Error al guardar Estado: ${error.message}`, error.stack);
      // Captura errores específicos de SQL, como violaciones de UNIQUE KEY (nombre duplicado)
      const sqlErrorMessage = error.originalError?.info?.message || error.message;
      if (sqlErrorMessage.includes('Cannot insert duplicate key row')) {
          throw new ConflictException(`El estado con nombre '${dto.Nombre}' ya existe.`);
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error interno al guardar Estado.',
          technical: error.message,
          sqlError: sqlErrorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método explícito para actualización (llamado por el controlador PUT)
  async update(id: number, dto: CreateEstadoDto): Promise<EstadoResponse> {
      dto.Id = id; // Asegura que el ID del parámetro se usa para la actualización
      return this.create(dto); // Reutiliza el método 'create' que ya tiene la lógica de UPDATE
  }

  async findAll(): Promise<EstadoResponse[]> {
    try {
      const pool = await this.sqlService.getConnection();
      const result: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado');
      // Asegura que las fechas sean objetos Date si se espera ese tipo en el frontend
      return result.recordset.map(r => ({
          ...r,
          FechaRegistro: r.FechaRegistro ? new Date(r.FechaRegistro) : null,
          FechaModificacion: r.FechaModificacion ? new Date(r.FechaModificacion) : null,
      })) as EstadoResponse[];
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los Estados: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener los Estados',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number): Promise<EstadoResponse> {
    try {
      const pool = await this.sqlService.getConnection();
      const result: any = await pool.request().input('Id', id).execute('Beca.sp_Get_Estado');

      if (result.recordset.length === 0) {
        throw new HttpException(`Estado con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      const estado = result.recordset[0];
      return {
        ...estado,
        FechaRegistro: estado.FechaRegistro ? new Date(estado.FechaRegistro) : null,
        FechaModificacion: estado.FechaModificacion ? new Date(estado.FechaModificacion) : null,
      } as EstadoResponse;
    } catch (error: any) {
      this.logger.error(`Error al buscar Estado por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar el Estado con ID ${id}`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number): Promise<{ mensaje: string }> {
    try {
      const pool = await this.sqlService.getConnection();

      // Verificar si hay referencias en otras tablas (ej. Estudiante, TipoBeca, Requisito, SolicitudBeca, PeriodoAcademico)
      const tablesToCheck = ['Estudiante', 'TipoBeca', 'Requisito', 'SolicitudBeca', 'PeriodoAcademico'];
      let totalReferences = 0;

      for (const table of tablesToCheck) {
        const refCheck = await pool
          .request()
          .input('EstadoId', id)
          .query(`SELECT COUNT(*) as Total FROM Beca.${table} WHERE EstadoId = @EstadoId`);
        totalReferences += refCheck.recordset[0]?.Total ?? 0;
      }
      
      if (totalReferences > 0) {
        throw new ConflictException(`No se puede eliminar el Estado con ID ${id} porque está siendo usado por ${totalReferences} registro(s) en otras tablas.`);
      }

      // Si no hay referencia, proceder a eliminar
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_Estado');

      if (result.rowsAffected[0] === 0) {
        throw new HttpException(`Estado con ID ${id} no encontrado o no se pudo eliminar.`, HttpStatus.NOT_FOUND);
      }
      return { mensaje: `Estado con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar Estado ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar el Estado',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
