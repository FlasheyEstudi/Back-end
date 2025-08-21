// src/ms/estudiante/estudiante.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SqlService } from '../cnxjs/sql.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EstudianteService {
  private readonly logger = new Logger(EstudianteService.name);

  constructor(private readonly sqlService: SqlService) {}

  // 🔁 Función reutilizable para obtener un nombre desde un SP por ID
  private async getNombreById(spName: string, id: number | null): Promise<string | null> {
    if (id === null || id === undefined || id <= 0) return null;
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute(spName);
      return result.recordset?.[0]?.Nombre ?? null;
    } catch (error) {
      this.logger.error(`Error obteniendo nombre desde ${spName}:`, error);
      return null;
    }
  }

  // 🔐 Función para generar una contraseña temporal
  private generateTemporaryPassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // 👤 Función para crear usuario automáticamente - CORREGIDA
  private async createUserForStudent(estudianteId: number, email: string, nombre: string, apellido: string, role: string = 'estudiante'): Promise<{ username: string, password: string }> {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      // Generar credenciales
      const username = email.split('@')[0]; // Usar la parte antes del @ como username
      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // ✅ CORRECCIÓN: Pasar todos los parámetros requeridos por el SP
      request.input('Id', 0); // 0 para nuevo usuario
      request.input('Nombre', username);
      request.input('Contrasena', hashedPassword);
      request.input('Apellidos', apellido);
      request.input('Email', email);
      request.input('Role', role);
      request.input('Identifier', null); // ✅ El SP lo generará automáticamente
      
      const result = await request.execute('Beca.sp_Save_Usuario');
      const usuarioId = result.recordset?.[0]?.NewId;
      
      this.logger.log(`Usuario creado exitosamente con ID: ${usuarioId} para estudiante: ${estudianteId}`);
      
      return { username, password: tempPassword };
    } catch (error) {
      this.logger.error('Error detallado creando usuario para estudiante:', error);
      throw new Error('No se pudo crear el usuario automáticamente: ' + error.message);
    }
  }

  async create(obj: CreateEstudianteDto) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      // Siempre enviar Id; 0 si es nuevo estudiante
      const id = obj.Id ?? 0;
      const EstadoId = obj.EstadoId !== undefined && obj.EstadoId !== null ? Number(obj.EstadoId) : null;
      const CarreraId = obj.CarreraId !== undefined && obj.CarreraId !== null ? Number(obj.CarreraId) : null;

      request.input('Id', id);
      request.input('Nombre', obj.Nombre);
      request.input('Apellido', obj.Apellido);
      request.input('Edad', obj.Edad);
      request.input('Correo', obj.Correo);
      
      // Solo pasar valores válidos (no null) a los SPs
      if (EstadoId !== null && EstadoId > 0) {
        request.input('EstadoId', EstadoId);
      } else {
        request.input('EstadoId', null);
      }
      
      if (CarreraId !== null && CarreraId > 0) {
        request.input('CarreraId', CarreraId);
      } else {
        request.input('CarreraId', null);
      }

      const result: any = await request.execute('Beca.sp_Save_Estudiante');

      const estudianteId = result.recordset?.[0]?.NewId || id;

      // Crear usuario automáticamente - ✅ Ahora con los parámetros correctos
      const credenciales = await this.createUserForStudent(
        estudianteId, 
        obj.Correo, 
        obj.Nombre, 
        obj.Apellido,
        obj.Role || 'estudiante'
      );

      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', EstadoId);
      const carreraNombre = await this.getNombreById('Beca.sp_Get_Carrera', CarreraId);

      return {
        estudiante: {
          id: estudianteId,
          Nombre: obj.Nombre,
          Apellido: obj.Apellido,
          Edad: obj.Edad,
          Correo: obj.Correo,
          EstadoId,
          estadoNombre,
          CarreraId,
          carreraNombre,
        },
        credenciales
      };
    } catch (e: any) {
      this.logger.error('Error creando estudiante:', e);
      return {
        error: 'Error interno',
        detalle: e?.message || e?.originalError?.info?.message || JSON.stringify(e),
      };
    }
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();

      const estudiantesResult = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estudiante');
      const estudiantes = estudiantesResult.recordset;

      // Obtener todas las carreras y estados
      const [carrerasResult, estadosResult] = await Promise.all([
        pool.request().input('Id', 0).execute('Beca.sp_Get_Carrera'),
        pool.request().input('Id', 0).execute('Beca.sp_Get_Estado'),
      ]);

      const carreras = carrerasResult.recordset;
      const estados = estadosResult.recordset;

      return estudiantes.map(est => {
        const carrera = carreras.find(c => c.Id === est.CarreraId);
        const estado = estados.find(e => e.Id === est.EstadoId);
        return {
          ...est,
          carreraNombre: carrera?.Nombre ?? null,
          estadoNombre: estado?.Nombre ?? null,
        };
      });
    } catch (e: any) {
      this.logger.error('Error al obtener estudiantes', e);
      return { error: 'Error al obtener los estudiantes', detalle: e.message ?? e };
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const estudianteResult = await pool.request().input('Id', id).execute('Beca.sp_Get_Estudiante');

      if (!estudianteResult.recordset?.length) {
        return { mensaje: `Estudiante con ID ${id} no encontrado` };
      }

      const estudiante = estudianteResult.recordset[0];

      const [estadoNombre, carreraNombre] = await Promise.all([
        this.getNombreById('Beca.sp_Get_Estado', estudiante.EstadoId),
        this.getNombreById('Beca.sp_Get_Carrera', estudiante.CarreraId),
      ]);

      return {
        ...estudiante,
        estadoNombre,
        carreraNombre,
      };
    } catch (e: any) {
      this.logger.error('Error al buscar estudiante por ID:', e);
      return { error: 'Error al buscar el estudiante', detalle: e.message ?? e };
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();

      const estudianteResult = await pool.request().input('Id', id).execute('Beca.sp_Get_Estudiante');
      if (!estudianteResult.recordset?.length) {
        return { mensaje: `Estudiante con ID ${id} no encontrado` };
      }

      const estudiante = estudianteResult.recordset[0];
      const [estadoNombre, carreraNombre] = await Promise.all([
        this.getNombreById('Beca.sp_Get_Estado', estudiante.EstadoId),
        this.getNombreById('Beca.sp_Get_Carrera', estudiante.CarreraId),
      ]);

      await pool.request().input('Id', id).execute('Beca.sp_Delete_Estudiante');

      return {
        mensaje: `Estudiante con ID ${id} eliminado correctamente`,
        estudiante: { ...estudiante, estadoNombre, carreraNombre },
      };
    } catch (e: any) {
      this.logger.error('Error al eliminar estudiante:', e);
      return { error: 'Error al eliminar el estudiante', detalle: e.message ?? e };
    }
  }
}