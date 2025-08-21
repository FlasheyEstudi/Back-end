import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateTipoBecaDto } from './dto/create-TipoBeca.dto';

@Injectable()
export class TipoBecaService {
  private readonly logger = new Logger(TipoBecaService.name);

  constructor(private readonly sqlService: SqlService) {}

  private async getNombreById(spName: string, id: number | null): Promise<string | null> {
    if (!id || id <= 0) return null;
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

  async create(dto: CreateTipoBecaDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      const isUpdate = dto.Id && dto.Id > 0;
      const tipoBecaIdForSp = isUpdate ? dto.Id : 0;

      request.input('Id', tipoBecaIdForSp);
      request.input('Categoria', dto.Categoria);
      request.input('Nombre', dto.Nombre);
      request.input('Descripcion', dto.Descripcion || null);
      request.input('Monto', dto.Monto);
      request.input('PorcentajeCobertura', dto.PorcentajeCobertura);
      request.input('Prioridad', dto.Prioridad);
      request.input('ColorHex', dto.ColorHex || null);
      request.input('EstadoId', dto.EstadoId);
      request.input('FechaRegistro', dto.FechaRegistro || null);
      request.input('FechaModificacion', dto.FechaModificacion || null);

      const result: any = await request.execute('Beca.sp_Save_TipoBeca');
      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || tipoBecaIdForSp;

      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', dto.EstadoId);

      const responseTipoBeca = {
        Id: newId,
        Categoria: dto.Categoria,
        Nombre: dto.Nombre,
        Descripcion: dto.Descripcion || null,
        Monto: dto.Monto,
        Cobertura: dto.PorcentajeCobertura,
        Prioridad: dto.Prioridad,
        ColorIdentificativo: dto.ColorHex || null,
        EstadoId: dto.EstadoId,
        Estadonombre: estadoNombre,
        Beneficiarios: 0
      };

      this.logger.log(`TipoBeca guardado/actualizado ID ${newId}: ${dto.Nombre}`);
      return responseTipoBeca;
    } catch (error: any) {
      this.logger.error(`Error al guardar TipoBeca: ${error.message}`, error.stack);
      let detalle = 'Error interno al guardar Tipo de Beca.';
      if (error.message.includes('Categoria')) {
        detalle = 'El campo Categoría no está soportado en la base de datos. Por favor, actualice la tabla TipoBeca.';
      } else if (error.number === 547) {
        detalle = 'Error: El EstadoId proporcionado no existe en la tabla Estado.';
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle,
          technical: error.message,
          sqlError: error.originalError?.info?.message || null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async update(id: number, dto: CreateTipoBecaDto) {
    dto.Id = id;
    return this.create(dto);
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const tiposBecaResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_TipoBeca');
      const tiposBeca = tiposBecaResult.recordset;
      const estadosAll = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado').then(res => res.recordset);
      return tiposBeca.map(tb => ({
        ...tb,
        Estadonombre: estadosAll.find(s => s.Id === tb.EstadoId)?.Nombre ?? null
      }));
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los TipoBecas: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener los Tipos de Beca',
          technical: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
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
      return { ...tipoBeca, Estadonombre: estadoNombre };
    } catch (error: any) {
      this.logger.error(`Error al buscar TipoBeca por ID ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar Tipo de Beca con ID ${id}`,
          technical: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
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
      let detalle = 'Error al eliminar Tipo de Beca. Puede estar asociada a solicitudes existentes.';
      if (error.number === 50002) {
        detalle = error.message;
      } else if (error.number === 50001) {
        detalle = 'No se encontró el Tipo de Beca con el ID especificado.';
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle,
          technical: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateEstado(id: number, estadoId: number) {
    try {
      const tipoBeca = await this.findOne(id);
      return this.update(id, {
        Id: tipoBeca.Id,
        Categoria: tipoBeca.Categoria,
        Nombre: tipoBeca.Nombre,
        Descripcion: tipoBeca.Descripcion,
        Monto: tipoBeca.Monto,
        PorcentajeCobertura: tipoBeca.Cobertura,
        Prioridad: tipoBeca.Prioridad,
        ColorHex: tipoBeca.ColorIdentificativo,
        EstadoId: estadoId,
        FechaRegistro: tipoBeca.FechaRegistro,
        FechaModificacion: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      this.logger.error(`Error al actualizar estado del TipoBeca ID ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al actualizar el estado del Tipo de Beca con ID ${id}`,
          technical: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getResumen() {
    try {
      const pool = await this.sqlService.getConnection();
      const result: any = await pool.request().execute('Beca.sp_ResumenTotales');
      return result.recordset[0];
    } catch (error: any) {
      this.logger.error(`Error al obtener resumen: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener el resumen de KPIs',
          technical: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}