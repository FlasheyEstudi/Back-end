import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SqlService } from '../../ms/cnxjs/sql.service';
import { CreateRequisitoDto } from './dto/create-Requisito.dto';

@Injectable()
export class RequisitoService {
  private readonly logger = new Logger(RequisitoService.name);

  constructor(private readonly sqlService: SqlService) {}

  // 🔁 Función reutilizable para obtener un nombre desde un SP por ID
  private async getNombreById(spName: string, id: number | null): Promise<string | null> {
    if (id === null || id === undefined || id <= 0) return null;
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('Id', id);
      const result = await request.execute(spName);
      // Asume que el SP devuelve un campo 'Nombre' o 'Nombre' y 'Apellido'
      return result.recordset?.[0]?.Nombre
        ? `${result.recordset[0].Nombre} ${result.recordset[0].Apellido || ''}`.trim()
        : null;
    } catch (error: any) {
      this.logger.error(`Error obteniendo nombre desde ${spName} para ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Este método maneja tanto la creación (INSERT) como la actualización (UPDATE)
  async create(dto: CreateRequisitoDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      const isUpdate = dto.Id && dto.Id > 0;
      const requisitoIdForSp = isUpdate ? dto.Id : 0; // Si es update, usa el ID; si es insert, usa 0 o un valor que el SP interprete como nuevo

      request.input('Id', requisitoIdForSp); // Parámetro para el SP
      request.input('Descripcion', dto.Descripcion);
      request.input('EstudianteId', dto.EstudianteId);
      request.input('EstadoId', dto.EstadoId);
      
      // Manejar fechas, si vienen, usarlas; si no, dejar que el SP use sus valores por defecto o NULL
      if (dto.FechaRegistro) {
        request.input('FechaRegistro', dto.FechaRegistro);
      } else {
        request.input('FechaRegistro', null); // Asegurarse de que el input se setee a NULL si no viene
      }
      if (dto.FechaModificacion) {
        request.input('FechaModificacion', dto.FechaModificacion);
      } else {
        request.input('FechaModificacion', null);
      }


      const result: any = await request.execute('Beca.sp_Save_Requisito'); // Asumiendo que este SP maneja INSERT/UPDATE

      const newId = result.recordset?.[0]?.NewId || result.recordset?.[0]?.UpdatedId || requisitoIdForSp;

      if (!newId && !isUpdate) { // Si es una creación y no se obtuvo un ID
          throw new Error('El procedimiento almacenado no devolvió un NewId válido al crear el requisito.');
      }

      // Obtener nombres relacionados para la respuesta
      const estudianteNombre = await this.getNombreById('Beca.sp_Get_Estudiante', dto.EstudianteId);
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', dto.EstadoId);

      const responseRequisito = {
        Id: newId,
        Descripcion: dto.Descripcion,
        EstudianteId: dto.EstudianteId,
        Estudiantenombre: estudianteNombre,
        EstadoId: dto.EstadoId,
        Estadonombre: estadoNombre,
        FechaRegistro: dto.FechaRegistro || null, // Incluir fechas en la respuesta
        FechaModificacion: dto.FechaModificacion || null,
      };

      this.logger.log(`Requisito guardado/actualizado ID ${newId}: ${dto.Descripcion}`);
      return responseRequisito;

    } catch (error: any) {
      this.logger.error(`Error al guardar requisito: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error; // Re-lanza si ya es una HttpException
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          detalle: 'Error al guardar el requisito. Verifique los IDs de Estudiante y Estado.',
          technical: error.message,
          sqlError: error.originalError?.info?.message || null
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Método explícito para actualización (llamado por el controlador PUT)
  async update(id: number, dto: CreateRequisitoDto) {
    dto.Id = id; // Asegura que el ID del parámetro se usa para la actualización
    return this.create(dto); // Reutiliza el método 'create' que ya tiene la lógica de UPDATE
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const requisitoResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Requisito');
      const requisitos = requisitoResult.recordset;

      // Optimización: Obtener todos los estudiantes y estados una vez
      const [estudiantesAll, estadosAll] = await Promise.all([
        pool.request().input('Id', 0).execute('Beca.sp_Get_Estudiante').then(res => res.recordset),
        pool.request().input('Id', 0).execute('Beca.sp_Get_Estado').then(res => res.recordset),
      ]);

      const requisitosConNombres = requisitos.map(req => {
        const estudiante = estudiantesAll.find(e => e.Id === req.EstudianteId);
        const estado = estadosAll.find(s => s.Id === req.EstadoId);

        return {
          ...req,
          Estudiantenombre: estudiante ? `${estudiante.Nombre} ${estudiante.Apellido || ''}`.trim() : null,
          Estadonombre: estado?.Nombre ?? null,
        };
      });
      return requisitosConNombres;
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los requisitos: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al obtener los requisitos',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const requisitoResult: any = await pool.request().input('Id', id).execute('Beca.sp_Get_Requisito');

      if (requisitoResult.recordset.length === 0) {
        throw new HttpException(`Requisito con ID ${id} no encontrado`, HttpStatus.NOT_FOUND);
      }

      const requisito = requisitoResult.recordset[0];

      const [estudianteNombre, estadoNombre] = await Promise.all([
        this.getNombreById('Beca.sp_Get_Estudiante', requisito.EstudianteId),
        this.getNombreById('Beca.sp_Get_Estado', requisito.EstadoId),
      ]);

      return {
        ...requisito,
        Estudiantenombre: estudianteNombre,
        Estadonombre: estadoNombre,
      };
    } catch (error: any) {
      this.logger.error(`Error al buscar requisito por ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: `Error al buscar el requisito con ID ${id}`,
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_Requisito');

      if (result.rowsAffected[0] === 0) {
        throw new HttpException(`Requisito con ID ${id} no encontrado o no se pudo eliminar.`, HttpStatus.NOT_FOUND);
      }
      return { mensaje: `Requisito con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar requisito ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detalle: 'Error al eliminar el requisito',
          technical: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
