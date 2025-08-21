import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service'; // Asegúrate de que esta ruta sea correcta
import { CreateAreaConocimientoDto } from './dto/create-AreaConocimiento.dto'; // Asumo que el DTO es correcto

@Injectable()
export class AreaConocimientoService {
  private readonly logger = new Logger(AreaConocimientoService.name);

  constructor(private readonly sqlService: SqlService) {}

  async create(dto: CreateAreaConocimientoDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      if (dto.Id) {
        // Modo UPDATE
        const query = `UPDATE Beca.AreaConocimiento SET nombre = @nombre WHERE Id = @Id`;
        request.input('Id', dto.Id);
        request.input('nombre', dto.nombre);
        await request.query(query);
        return await this.findOne(dto.Id); // Retorna el objeto actualizado
      } else {
        // Modo INSERT
        const query = `INSERT INTO Beca.AreaConocimiento(nombre) VALUES (@nombre); SELECT SCOPE_IDENTITY() AS NewId;`;
        request.input('nombre', dto.nombre);
        const result = await request.query(query);
        const newId = result.recordset[0]?.NewId;
        if (!newId) {
          throw new Error('El procedimiento almacenado no devolvió un NewId válido.');
        }
        return await this.findOne(newId); // Retorna el objeto recién creado
      }
    } catch (error: any) {
      this.logger.error(`Error al crear/actualizar AreaConocimiento: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error interno al procesar Área de Conocimiento',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const query = `SELECT Id, nombre FROM Beca.AreaConocimiento`; // Especificar columnas
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error: any) {
      this.logger.error(`Error al obtener AreaConocimiento: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener Áreas de Conocimiento',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const query = `SELECT Id, nombre FROM Beca.AreaConocimiento WHERE Id = @id`;
      const result = await pool.request().input('id', id).query(query);

      if (result.recordset.length === 0) {
        throw new HttpException(`AreaConocimiento con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }
      return result.recordset[0];
    } catch (error: any) {
      this.logger.error(`Error al buscar AreaConocimiento por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar Área de Conocimiento con ID ${id}`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const query = `DELETE FROM Beca.AreaConocimiento WHERE Id = @id`;
      const result = await pool.request().input('id', id).query(query);

      if (result.rowsAffected[0] === 0) {
        throw new HttpException(`AreaConocimiento con ID ${id} no encontrado para eliminar.`, HttpStatus.NOT_FOUND);
      }
      return { mensaje: `AreaConocimiento con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar AreaConocimiento ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar Área de Conocimiento',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
