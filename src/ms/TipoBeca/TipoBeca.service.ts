import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateTipoBecaDto } from './dto/create-TipoBeca.dto';

@Injectable()
export class TipoBecaService {
  private readonly logger = new Logger(TipoBecaService.name);

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
  async create(dto: CreateTipoBecaDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      const isUpdate = dto.Id && dto.Id > 0;
      const tipoBecaIdForSp = isUpdate ? dto.Id : 0; // Si es update, usa el ID; si es insert, usa 0

      request.input('Id', tipoBecaIdForSp);
      request.input('Nombre', dto.Nombre);
      request.input('Descripcion', dto.Descripcion || null); // Descripción puede ser opcional
      request.input('Monto', dto.Monto);
      request.input('EstadoId', dto.EstadoId);
      
      // Manejar fechas
      request.input('FechaRegistro', dto.FechaRegistro || null);
      // Para actualización, actualiza FechaModificacion; para creación, usa FechaRegistro o deja que el SP ponga GETDATE()
      request.input('FechaModificacion', dto.FechaModificacion || null);

      const result: any = await request.execute('Beca.sp_Save_TipoBeca'); // Asumiendo que este SP maneja INSERT/UPDATE

      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || tipoBecaIdForSp;

      if (!newId && !isUpdate) {
        throw new Error('El procedimiento almacenado no devolvió un NewId válido al crear el tipo de beca.');
      }

      // Obtener nombre de estado para la respuesta
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', dto.EstadoId);

      const responseTipoBeca = {
        Id: newId,
        Nombre: dto.Nombre,
        Descripcion: dto.Descripcion || null,
        Monto: dto.Monto,
        FechaRegistro: dto.FechaRegistro || null,
        FechaModificacion: dto.FechaModificacion || null,
        EstadoId: dto.EstadoId,
        Estadonombre: estadoNombre,
      };

      this.logger.log(`TipoBeca guardado/actualizado ID ${newId}: ${dto.Nombre}`);
      return responseTipoBeca;

    } catch (error: any) {
      this.logger.error(`Error al guardar TipoBeca: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error interno al guardar Tipo de Beca. Verifique los datos o ID de Estado.',
          technical: error.message,
          sqlError: error.originalError?.info?.message || null
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método explícito para actualización (llamado por el controlador PUT)
  async update(id: number, dto: CreateTipoBecaDto) {
      dto.Id = id; // Asegura que el ID del parámetro se use para la actualización
      return this.create(dto); // Reutiliza el método 'create' que ya tiene la lógica de UPDATE
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const tipoBecaResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_TipoBeca');
      const tiposBeca = tipoBecaResult.recordset;

      // Obtener todos los estados una vez
      const estadosAll = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado').then(res => res.recordset);

      const tiposBecaConNombres = tiposBeca.map(tb => {
        const estado = estadosAll.find(s => s.Id === tb.EstadoId);
        return {
          ...tb,
          Estadonombre: estado?.Nombre ?? null,
        };
      });
      return tiposBecaConNombres;
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los TipoBecas: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener los Tipos de Beca',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const tipoBecaResult: any = await pool.request().input('Id', id).execute('Beca.sp_Get_TipoBeca');

      if (tipoBecaResult.recordset.length === 0) {
        throw new HttpException(`TipoBeca con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      const tipoBeca = tipoBecaResult.recordset[0];

      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', tipoBeca.EstadoId);

      return {
        ...tipoBeca,
        Estadonombre: estadoNombre,
      };
    } catch (error: any) {
      this.logger.error(`Error al buscar TipoBeca por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar el Tipo de Beca con ID ${id}`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_TipoBeca');

      if (result.rowsAffected[0] === 0) {
        throw new HttpException(`TipoBeca con ID ${id} no encontrado o no se pudo eliminar.`, HttpStatus.NOT_FOUND);
      }
      return { mensaje: `TipoBeca con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar TipoBeca ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar el Tipo de Beca',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
