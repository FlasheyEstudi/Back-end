import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreatePeriodoAcademicoDto } from './dto/create-PeriodoAcademico.dto';

@Injectable()
export class PeriodoAcademicoService {
  private readonly logger = new Logger(PeriodoAcademicoService.name);

  constructor(private readonly sqlService: SqlService) {}

  // 🔁 Función reutilizable para obtener un nombre desde un SP por ID (ej. para Estado)
  private async getNombreById(spName: string, id: number | null): Promise<string | null> {
    if (id === null || id === undefined || id <= 0) return null;
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('Id', id);
      const result = await request.execute(spName);
      return result.recordset?.[0]?.Nombre ?? null;
    } catch (error: any) {
      this.logger.error(`Error obteniendo nombre desde ${spName} para ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Este método maneja tanto la creación (INSERT) como la actualización (UPDATE)
  async create(dto: CreatePeriodoAcademicoDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      const isUpdate = dto.Id && dto.Id > 0;
      const periodoAcademicoIdForSp = isUpdate ? dto.Id : 0;

      request.input('Id', periodoAcademicoIdForSp);
      request.input('Nombre', dto.Nombre);
      request.input('AnioAcademico', dto.AnioAcademico);
      request.input('FechaInicio', dto.FechaInicio);
      request.input('FechaFin', dto.FechaFin);
      request.input('EstadoId', dto.EstadoId);
      
      // Manejar fechas de registro y modificación
      request.input('FechaRegistro', dto.FechaRegistro || null);
      request.input('FechaModificacion', dto.FechaModificacion || null);

      const result: any = await request.execute('Beca.sp_Save_PeriodoAcademico'); // Asumiendo este SP

      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || periodoAcademicoIdForSp;

      if (!newId && !isUpdate) {
        throw new Error('El procedimiento almacenado no devolvió un NewId válido al crear el periodo académico.');
      }

      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', dto.EstadoId);

      const responsePeriodoAcademico = {
        Id: newId,
        Nombre: dto.Nombre,
        AnioAcademico: dto.AnioAcademico,
        FechaInicio: dto.FechaInicio,
        FechaFin: dto.FechaFin,
        FechaRegistro: dto.FechaRegistro || null,
        FechaModificacion: dto.FechaModificacion || null,
        EstadoId: dto.EstadoId,
        Estadonombre: estadoNombre,
      };

      this.logger.log(`Periodo Académico guardado/actualizado ID ${newId}: ${dto.Nombre}`);
      return responsePeriodoAcademico;

    } catch (error: any) {
      this.logger.error(`Error al guardar Periodo Académico: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error interno al guardar Periodo Académico. Verifique los datos o ID de Estado.',
          technical: error.message,
          sqlError: error.originalError?.info?.message || null
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método explícito para actualización (llamado por el controlador PUT)
  async update(id: number, dto: CreatePeriodoAcademicoDto) {
      dto.Id = id; // Asegura que el ID del parámetro se usa para la actualización
      return this.create(dto); // Reutiliza el método 'create' que ya tiene la lógica de UPDATE
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const periodoAcademicoResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_PeriodoAcademico');
      const periodosAcademicos = periodoAcademicoResult.recordset;

      const estadosAll = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado').then(res => res.recordset);

      const periodosAcademicosConNombres = periodosAcademicos.map(pa => {
        const estado = estadosAll.find(s => s.Id === pa.EstadoId);
        return {
          ...pa,
          Estadonombre: estado?.Nombre ?? null,
        };
      });
      return periodosAcademicosConNombres;
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los Periodos Académicos: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener los Periodos Académicos',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const periodoAcademicoResult: any = await pool.request().input('Id', id).execute('Beca.sp_Get_PeriodoAcademico');

      if (periodoAcademicoResult.recordset.length === 0) {
        throw new HttpException(`Periodo Académico con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      const periodoAcademico = periodoAcademicoResult.recordset[0];

      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', periodoAcademico.EstadoId);

      return {
        ...periodoAcademico,
        Estadonombre: estadoNombre,
      };
    } catch (error: any) {
      this.logger.error(`Error al buscar Periodo Académico por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar el Periodo Académico con ID ${id}`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_PeriodoAcademico');

      if (result.rowsAffected[0] === 0) {
        throw new HttpException(`Periodo Académico con ID ${id} no encontrado o no se pudo eliminar.`, HttpStatus.NOT_FOUND);
      }
      return { mensaje: `Periodo Académico con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar Periodo Académico ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar el Periodo Académico',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
