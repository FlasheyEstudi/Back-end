// src/ms/TipoPago/TipoPago.service.ts
import { Injectable, Logger, HttpException, HttpStatus, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateTipoPagoDto } from './dto/create-TipoPago.dto';

// Interfaz para el tipo de datos que se retorna del servicio
export interface TipoPagoResponse {
  Id: number;
  Nombre: string;
  Descripcion: string;
  EstadoId: number; // Cambiado a EstadoId para coincidir con el backend
  Estadonombre: string | null;
}

@Injectable()
export class TipoPagoService {
  private readonly logger = new Logger(TipoPagoService.name);

  constructor(private readonly sqlService: SqlService) {}

  // 🔁 Función reutilizable para obtener un nombre desde un SP por ID
  private async getEstadoNameById(estadoId: number | null): Promise<string | null> {
    if (estadoId === null || estadoId === undefined || estadoId <= 0) return null;
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('Id', estadoId);
      const result = await request.execute('Beca.sp_Get_Estado');
      return result.recordset?.[0]?.Nombre ?? null;
    } catch (error: any) {
      this.logger.warn(`No se pudo obtener nombre de Estado para ID ${estadoId}: ${error.message}`);
      return null;
    }
  }

  // Este método maneja tanto la creación (INSERT) como la actualización (UPDATE)
  async create(dto: CreateTipoPagoDto): Promise<TipoPagoResponse> {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      const isUpdate = dto.Id && dto.Id > 0;
      const tipoPagoIdForSp = isUpdate ? dto.Id : 0; // 0 para nuevo, >0 para actualizar

      request.input('Id', tipoPagoIdForSp);
      request.input('Nombre', dto.Nombre);
      request.input('Descripcion', dto.Descripcion);
      request.input('EstadoId', dto.Estadoid); // Cambiado a EstadoId

      const result: any = await request.execute('Beca.sp_Save_TipoPago');

      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || tipoPagoIdForSp;

      if (!newId && !isUpdate) {
        throw new Error('El procedimiento almacenado no devolvió un NewId válido al crear el tipo de pago.');
      }

      const estadoNombre = await this.getEstadoNameById(dto.Estadoid); // Cambiado a EstadoId

      const responseTipoPago: TipoPagoResponse = {
        Id: newId,
        Nombre: dto.Nombre,
        Descripcion: dto.Descripcion,
        EstadoId: dto.Estadoid, // Cambiado a EstadoId
        Estadonombre: estadoNombre,
      };

      this.logger.log(`Tipo de Pago guardado/actualizado ID ${newId}: ${dto.Nombre}`);
      return responseTipoPago;

    } catch (error: any) {
      this.logger.error(`Error al guardar Tipo de Pago: ${error.message}`, error.stack);
      const sqlErrorMessage = error.originalError?.info?.message || error.message;
      if (sqlErrorMessage.includes('FOREIGN KEY constraint') || sqlErrorMessage.includes('The INSERT statement conflicted with the FOREIGN KEY constraint')) {
          throw new BadRequestException('El EstadoId proporcionado no existe.');
      }
      if (sqlErrorMessage.includes('Cannot insert duplicate key row')) {
          throw new ConflictException(`El tipo de pago con nombre '${dto.Nombre}' ya existe.`);
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error interno al guardar Tipo de Pago.',
          technical: error.message,
          sqlError: sqlErrorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método explícito para actualización (llamado por el controlador PUT)
  async update(id: number, dto: CreateTipoPagoDto): Promise<TipoPagoResponse> {
      dto.Id = id;
      return this.create(dto);
  }

  async findAll(): Promise<TipoPagoResponse[]> {
    try {
      const pool = await this.sqlService.getConnection();
      const tipoPagoResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_TipoPago');
      const tiposDePago = tipoPagoResult.recordset;

      // Obtener todos los estados una vez para el lookup
      const estadosResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado');
      const estados = estadosResult.recordset;

      const tiposDePagoConNombres = tiposDePago.map((tp: any) => {
        const estado = estados.find((e: any) => e.Id === tp.EstadoId); // Cambiado a EstadoId
        return {
          ...tp,
          EstadoId: tp.EstadoId, // Aseguramos el nombre correcto
          Estadonombre: estado?.Nombre ?? null,
        } as TipoPagoResponse;
      });
      return tiposDePagoConNombres;
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los Tipos de Pago: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener los Tipos de Pago',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number): Promise<TipoPagoResponse> {
    try {
      const pool = await this.sqlService.getConnection();
      const tipoPagoResult: any = await pool.request().input('Id', id).execute('Beca.sp_Get_TipoPago');

      if (tipoPagoResult.recordset.length === 0) {
        throw new NotFoundException(`Tipo de Pago con ID ${id} no encontrado`);
      }

      const tipoPago = tipoPagoResult.recordset[0];
      const estadoNombre = await this.getEstadoNameById(tipoPago.EstadoId); // Cambiado a EstadoId

      return {
        ...tipoPago,
        EstadoId: tipoPago.EstadoId, // Aseguramos el nombre correcto
        Estadonombre: estadoNombre,
      } as TipoPagoResponse;
    } catch (error: any) {
      this.logger.error(`Error al buscar Tipo de Pago por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar el Tipo de Pago con ID ${id}`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number): Promise<{ mensaje: string }> {
    try {
      const pool = await this.sqlService.getConnection();

      // Verificar referencias en otras tablas
      const referencesCheck = await pool.request()
          .input('TipoPagoId', id)
          .query(`SELECT COUNT(*) as Total FROM Beca.TipoBeca WHERE TipoPagoId = @TipoPagoId`);
      
      const totalReferences = referencesCheck.recordset[0]?.Total || 0;

      if (totalReferences > 0) {
          throw new ConflictException(`No se puede eliminar el Tipo de Pago con ID ${id} porque está asociado a ${totalReferences} tipo(s) de beca(s).`);
      }

      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_TipoPago');

      if (result.rowsAffected[0] === 0) {
        throw new NotFoundException(`Tipo de Pago con ID ${id} no encontrado o no se pudo eliminar.`);
      }
      return { mensaje: `Tipo de Pago con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar Tipo de Pago ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar el Tipo de Pago',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}