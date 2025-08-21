import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta
import { CreateCarreraDto } from './dto/create-carrera.dto'; // Asumimos que este DTO se usa para create y update

@Injectable()
export class CarreraService {
  private readonly logger = new Logger(CarreraService.name);

  constructor(private readonly sqlService: SqlService) {}

  async create(dto: CreateCarreraDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      // Este método es para CREAR. Asumimos que el SP maneja el INSERT y devuelve el NewId.
      // Si tu SP 'Beca.sp_Save_Carrera' también actualiza basado en un 'Id' > 0,
      // entonces puedes usar un solo método 'save' o 'upsert'.
      // Dada la implementación del frontend, 'create' solo se llama para nuevas carreras.
      request.input('Id', 0); // Indicar al SP que es una nueva carrera (si tu SP lo usa así)
      request.input('Nombre', dto.Nombre);
      request.input('AreaConocimientoId', Number(dto.AreaConocimientoId));

      const result = await request.execute('Beca.sp_Save_Carrera');
      const newId = result.recordset?.[0]?.NewId; // Usar ?. para seguridad

      if (!newId) {
        throw new Error('El procedimiento almacenado no devolvió un NewId válido al crear.');
      }

      return await this.findOne(newId); // Retorna la carrera recién creada
    } catch (error: any) {
      this.logger.error(`Error creando carrera: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          detalle: 'Error al crear carrera',
          technical: error.message,
          sqlError: error.originalError?.info?.message || null // Detalles de error de SQL
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Nuevo método para actualizar una carrera existente
  async update(id: number, dto: CreateCarreraDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      // Asumimos que tienes un SP 'Beca.sp_Update_Carrera' para actualizar
      // O que 'Beca.sp_Save_Carrera' puede manejar actualizaciones si le pasas el Id.
      // Si 'sp_Save_Carrera' lo maneja, podrías llamarlo así:
      // request.input('Id', id);
      // request.input('Nombre', dto.Nombre);
      // request.input('AreaConocimientoId', Number(dto.AreaConocimientoId));
      // await request.execute('Beca.sp_Save_Carrera');

      // Si necesitas un SP de UPDATE separado (recomendado para claridad):
      await pool.request()
        .input('Id', id)
        .input('Nombre', dto.Nombre)
        .input('AreaConocimientoId', Number(dto.AreaConocimientoId))
        .execute('Beca.sp_Update_Carrera'); // <-- Asegúrate de tener este SP

      return await this.findOne(id); // Retorna la carrera actualizada
    } catch (error: any) {
      this.logger.error(`Error actualizando carrera ID ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          detalle: 'Error al actualizar carrera',
          technical: error.message,
          sqlError: error.originalError?.info?.message || null
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const query = `
        SELECT c.Id, c.Nombre, c.AreaConocimientoId, a.nombre AS AreaConocimientonombre
        FROM Beca.Carrera c
        LEFT JOIN Beca.AreaConocimiento a ON c.AreaConocimientoId = a.Id
      `;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error: any) {
      this.logger.error(`Error al obtener todas las carreras: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener carreras',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('id', id).query(`
        SELECT c.Id, c.Nombre, c.AreaConocimientoId, a.nombre AS AreaConocimientonombre
        FROM Beca.Carrera c
        LEFT JOIN Beca.AreaConocimiento a ON c.AreaConocimientoId = a.Id
        WHERE c.Id = @id
      `);
      if (result.recordset.length === 0) {
        throw new HttpException('Carrera no encontrada', HttpStatus.NOT_FOUND);
      }
      return result.recordset[0];
    } catch (error: any) {
      this.logger.error(`Error al obtener carrera por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al obtener carrera con ID ${id}`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_Carrera');
      if (result.rowsAffected[0] === 0) {
        throw new HttpException('No se encontró la carrera para eliminar o no se pudo eliminar.', HttpStatus.NOT_FOUND);
      }
      return { mensaje: `Carrera eliminada ID: ${id}` };
    } catch (error: any) {
      this.logger.error(`Error eliminando carrera ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar carrera',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
