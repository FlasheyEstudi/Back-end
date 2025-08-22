import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateRequisitoDto } from './dto/create-Requisito.dto';

@Injectable()
export class RequisitoService {
  private readonly logger = new Logger(RequisitoService.name);

  constructor(private readonly sqlService: SqlService) {}

  /**
   * Obtiene el nombre de una entidad (Estudiante, Estado, etc.) por su ID.
   */
  private async getNombreById(spName: string, id: number): Promise<string | null> {
    if (!id || id <= 0) return null;

    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute(spName);

      if (result.recordset.length === 0) return null;

      const record = result.recordset[0];
      if (record.Nombre !== undefined) {
        // Si tiene Apellido (como Estudiante)
        if (record.Apellido !== undefined) {
          return `${record.Nombre} ${record.Apellido || ''}`.trim();
        }
        return record.Nombre;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Error obteniendo nombre desde ${spName} para ID ${id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Crea o actualiza un requisito.
   */
  async create(dto: CreateRequisitoDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      // Determinar si es UPDATE o INSERT
      const isUpdate = dto.Id && dto.Id > 0;
      const spId = isUpdate ? dto.Id : 0; // SP usa 0 para INSERT

      request.input('Id', spId);
      request.input('Descripcion', dto.Descripcion);
      request.input('EstudianteId', dto.EstudianteId || null);
      request.input('EstadoId', dto.EstadoId || null);
      request.input('FechaRegistro', dto.FechaRegistro || null);
      request.input('FechaModificacion', dto.FechaModificacion || null);

      const result: any = await request.execute('Beca.sp_Save_Requisito');
      const newId = result.recordset?.[0]?.NewId ?? result.recordset?.[0]?.UpdatedId ?? spId;

      if (!newId) {
        throw new Error('No se obtuvo un ID válido del procedimiento almacenado.');
      }

      // Obtener nombres relacionados
      const estudianteNombre = await this.getNombreById('Beca.sp_Get_Estudiante', dto.EstudianteId);
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', dto.EstadoId);

      const response = {
        Id: newId,
        Descripcion: dto.Descripcion,
        EstudianteId: dto.EstudianteId,
        Estudiantenombre: estudianteNombre,
        EstadoId: dto.EstadoId,
        Estadonombre: estadoNombre,
        FechaRegistro: dto.FechaRegistro || null,
        FechaModificacion: dto.FechaModificacion || null,
      };

      this.logger.log(`Requisito ${isUpdate ? 'actualizado' : 'creado'}: ID ${newId}`);
      return response;

    } catch (error) {
      this.logger.error(`Error al guardar requisito: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          detalle: 'Error al guardar el requisito. Verifique los datos enviados.',
          technical: error.message,
          sqlError: error.originalError?.info?.message || null,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualiza un requisito por ID.
   */
  async update(id: number, dto: CreateRequisitoDto) {
    if (!id || id <= 0) {
      throw new HttpException('ID inválido para actualización.', HttpStatus.BAD_REQUEST);
    }

    dto.Id = id;
    return this.create(dto);
  }

  /**
   * Obtiene todos los requisitos (sin filtros).
   */
  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();

      // Obtener todos los requisitos
      const { recordset: requisitos } = await pool
        .request()
        .execute('Beca.sp_Get_All_Requisitos');

      if (requisitos.length === 0) {
        return [];
      }

      // Obtener todos los estudiantes y estados
      const [estudiantesResult, estadosResult] = await Promise.all([
        pool.request().execute('Beca.sp_Get_All_Estudiantes'),
        pool.request().execute('Beca.sp_Get_All_Estado'),
      ]);

      // Crear mapas para búsqueda rápida
      const estudiantesMap = new Map(
        estudiantesResult.recordset.map(e => [
          e.Id,
          `${e.Nombre} ${e.Apellido || ''}`.trim(),
        ]),
      );

      const estadosMap = new Map(
        estadosResult.recordset.map(s => [s.Id, s.Nombre]),
      );

      // Enriquecer los requisitos con nombres
      return requisitos.map(req => ({
        ...req,
        Estudiantenombre: req.EstudianteId ? estudiantesMap.get(req.EstudianteId) || null : null,
        Estadonombre: req.EstadoId ? estadosMap.get(req.EstadoId) || null : null,
      }));

    } catch (error) {
      this.logger.error(`Error al obtener todos los requisitos: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener la lista de requisitos.',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un requisito por ID.
   */
  async findOne(id: number) {
    if (!id || id <= 0) {
      throw new HttpException('ID inválido.', HttpStatus.BAD_REQUEST);
    }

    try {
      const pool = await this.sqlService.getConnection();
      const { recordset } = await pool
        .request()
        .input('Id', id)
        .execute('Beca.sp_Get_Requisito');

      if (recordset.length === 0) {
        throw new HttpException(`Requisito con ID ${id} no encontrado.`, HttpStatus.NOT_FOUND);
      }

      const req = recordset[0];

      // Obtener nombres relacionados
      const estudianteNombre = await this.getNombreById('Beca.sp_Get_Estudiante', req.EstudianteId);
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', req.EstadoId);

      return {
        ...req,
        Estudiantenombre: estudianteNombre,
        Estadonombre: estadoNombre,
      };

    } catch (error) {
      this.logger.error(`Error al buscar requisito ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar el requisito con ID ${id}.`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un requisito por ID.
   */
  async remove(id: number) {
    if (!id || id <= 0) {
      throw new HttpException('ID inválido para eliminación.', HttpStatus.BAD_REQUEST);
    }

    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool
        .request()
        .input('Id', id)
        .execute('Beca.sp_Delete_Requisito');

      if (result.rowsAffected[0] === 0) {
        throw new HttpException(`Requisito con ID ${id} no encontrado o ya eliminado.`, HttpStatus.NOT_FOUND);
      }

      return { mensaje: `Requisito con ID ${id} eliminado correctamente.` };

    } catch (error) {
      this.logger.error(`Error al eliminar requisito ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al intentar eliminar el requisito.',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}