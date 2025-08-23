// src/app/ms/TipoBeca/TipoBeca.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Ajusta la ruta según tu estructura
import { CreateTipoBecaDto } from './dto/create-TipoBeca.dto'; // Ajusta la ruta según tu estructura

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
      // request.input('FechaLimite', dto.FechaLimite || null); // Campo no presente en el script original

      const result: any = await request.execute('Beca.sp_Save_TipoBeca');
      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || tipoBecaIdForSp;

      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', dto.EstadoId);

      const responseTipoBeca = {
        Id: newId,
        Categoria: dto.Categoria,
        Nombre: dto.Nombre,
        Descripcion: dto.Descripcion || null,
        Monto: dto.Monto,
        PorcentajeCobertura: dto.PorcentajeCobertura,
        Prioridad: dto.Prioridad,
        ColorHex: dto.ColorHex || null,
        EstadoId: dto.EstadoId,
        Estadonombre: estadoNombre,
        Beneficiarios: 0, // Calculado por sp_Get_TipoBeca
        // FechaLimite: dto.FechaLimite || null, // Campo no presente en el script original
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
      // sp_Get_TipoBeca calcula Beneficiarios
      const tiposBecaResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_TipoBeca');
      const tiposBeca = tiposBecaResult.recordset;
      const estadosAll = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado').then(res => res.recordset);

      // Obtener detalles de requisitos usando @TipoBecaId = 0 para todos
      const detallesResult: any = await pool.request().input('TipoBecaId', 0).execute('Beca.sp_Get_Detalle_Requisitos_Beca');
      const detalles = detallesResult.recordset;
      // Contar requisitos por TipoBecaId para mostrar en la lista
      const requisitosPorBeca = detalles.reduce((acc: { [key: number]: number }, detalle: any) => {
        acc[detalle.TipoBecaId] = (acc[detalle.TipoBecaId] || 0) + 1;
        return acc;
      }, {});

      return tiposBeca.map(tb => {
        // Filtrar requisitos específicos para esta beca
        const requisitosFiltrados = detalles.filter((d: any) => d.TipoBecaId === tb.Id);
        // Concatenar descripciones de requisitos como ejemplo
        const requisitosPrincipales = requisitosFiltrados.length > 0
          ? requisitosFiltrados.map((d: any) => d.RequisitoDescripcion || d.RequisitoId).join(', ')
          : null;
        return {
          ...tb,
          Estadonombre: estadosAll.find(s => s.Id === tb.EstadoId)?.Nombre ?? null,
          // FechaLimite: tb.FechaLimite || null, // Campo no presente en el script original
          RequisitosPrincipales: requisitosPrincipales,
          RequisitosAdicionales: requisitosPorBeca[tb.Id] || 0
        };
      });
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

  // ✅ Método para obtener solo las becas disponibles (EstadoId = 1)
  async findAllDisponibles() {
    const ESTADO_DISPONIBLE_ID = 1; // <--- Asegúrate de que este ID sea el correcto para "Disponible" en tu tabla Beca.Estado

    try {
      // Reutilizamos findAll() para obtener todos los datos procesados (incluyendo nombres de estado, requisitos, beneficiarios)
      const todosLosTipos = await this.findAll();

      // Filtramos los resultados para obtener solo los disponibles
      const becasDisponibles = (todosLosTipos as any[]).filter(
        (tipoBeca: any) => tipoBeca.EstadoId === ESTADO_DISPONIBLE_ID
      );

      return becasDisponibles;

    } catch (error: any) {
      this.logger.error(`Error al obtener becas disponibles: ${error.message}`, error.stack);
      // Relanzamos el error para que el controller lo maneje
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      // sp_Get_TipoBeca calcula Beneficiarios
      const tipoBecaResult: any = await pool.request().input('Id', id).execute('Beca.sp_Get_TipoBeca');
      if (tipoBecaResult.recordset.length === 0) {
        throw new HttpException(`TipoBeca con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }
      const tipoBeca = tipoBecaResult.recordset[0];
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', tipoBeca.EstadoId);

      // Obtener detalles de requisitos para este TipoBeca específico
      const detallesResult: any = await pool.request().input('TipoBecaId', id).execute('Beca.sp_Get_Detalle_Requisitos_Beca');
      const detalles = detallesResult.recordset;
      // Concatenar descripciones de requisitos como ejemplo
      const requisitosPrincipales = detalles.length > 0
        ? detalles.map((d: any) => d.RequisitoDescripcion || d.RequisitoId).join(', ')
        : null;
      const requisitosAdicionales = detalles.length;

      return {
        ...tipoBeca,
        Estadonombre: estadoNombre,
        // FechaLimite: tipoBeca.FechaLimite || null, // Campo no presente en el script original
        RequisitosPrincipales: requisitosPrincipales,
        RequisitosAdicionales: requisitosAdicionales
      };
    } catch (error: any) {
      this.logger.error(`Error al buscar TipoBeca por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
         // Relanzar errores específicos como NOT_FOUND
         throw error;
      }
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
      // El SP sp_Delete_TipoBeca maneja sus propios mensajes de error con THROW
      // Si llega aquí sin error, es que se eliminó
      if (result.rowsAffected[0] === 0) {
         // Este caso podría no ocurrir si el SP siempre lanza error para 0 filas
         throw new HttpException(`TipoBeca con ID ${id} no encontrado o no se pudo eliminar.`, HttpStatus.NOT_FOUND);
      }
      return { mensaje: `TipoBeca con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar TipoBeca ID ${id}: ${error.message}`, error.stack);
      // Manejar errores específicos del SP
      if (error.number === 50002) {
        // Error definido en sp_Delete_TipoBeca: No se puede eliminar por solicitudes asociadas
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT, // 409 Conflict es más apropiado para este caso
            detalle: error.message,
            technical: error.message
          },
          HttpStatus.CONFLICT
        );
      } else if (error.number === 50001) {
        // Error definido en sp_Delete_TipoBeca: No se encontró el ID
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            detalle: error.message,
            technical: error.message
          },
          HttpStatus.NOT_FOUND
        );
      }
      // Para otros errores (incluyendo errores de conexión, etc.)
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar Tipo de Beca. Puede estar asociada a solicitudes existentes.',
          technical: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateEstado(id: number, estadoId: number) {
    try {
      // Primero obtenemos la beca para asegurarnos de que existe y tener sus datos actuales
      const tipoBeca = await this.findOne(id);
      // Luego llamamos a update con los datos actuales + el nuevo EstadoId
      // Nota: Este enfoque actualiza todos los campos. Si solo quieres cambiar el EstadoId,
      // el SP Beca.sp_Save_TipoBeca podría modificarse para aceptar solo el ID y EstadoId.
      return this.update(id, {
        ...tipoBeca, // Esto incluye todos los campos actuales
        Id: tipoBeca.Id, // Asegurar que Id esté presente
        EstadoId: estadoId,
        FechaModificacion: new Date().toISOString().split('T')[0], // Actualizar fecha de modificación
      });
    } catch (error: any) {
      this.logger.error(`Error al actualizar estado del TipoBeca ID ${id}: ${error.message}`, error.stack);
      // Si findOne lanzó NOT_FOUND, se relanza. Si fue otro error, se maneja aquí.
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
         throw error; // Relanzar errores de no encontrado
      }
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
