// src/ms/estudiante/estudiante.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SqlService } from '../cnxjs/sql.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EstudianteService {
  private readonly logger = new Logger(EstudianteService.name);
  private readonly saltRounds = 10;

  constructor(private readonly sqlService: SqlService) {}

  // 🔐 Función para generar una contraseña temporal segura
  private generateTemporaryPassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    // Garantizar al menos un carácter de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar con caracteres aleatorios
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar la contraseña
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  // 👤 Función para crear usuario automáticamente con hash correcto
  private async createUserForStudent(
    estudianteId: number, 
    email: string, 
    nombre: string, 
    apellido: string, 
    role: string = 'estudiante'
  ): Promise<{ username: string, password: string, hashedPassword: string }> {
    try {
      this.logger.log(`Creando usuario para estudiante ID: ${estudianteId}, Email: ${email}`);
      
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      // Generar credenciales
      const username = email.split('@')[0]; // Usar la parte antes del @ como username
      const tempPassword = this.generateTemporaryPassword();
      
      // ✅ HASH LA CONTRASEÑA CORRECTAMENTE
      const hashedPassword = await bcrypt.hash(tempPassword, this.saltRounds);
      this.logger.log(`Contraseña generada y hasheada para ${username}: ${tempPassword} -> ${hashedPassword.substring(0, 20)}...`);
      
      // ✅ PASAR TODOS LOS PARÁMETROS REQUERIDOS POR EL SP
      request.input('Id', 0); // 0 para nuevo usuario
      request.input('Nombre', username);
      request.input('Contrasena', hashedPassword); // ✅ Contraseña hasheada
      request.input('Apellidos', apellido);
      request.input('Email', email);
      request.input('Role', role);
      request.input('Identifier', null); // El SP lo generará automáticamente
      
      const result = await request.execute('Beca.sp_Save_Usuario');
      const usuarioId = result.recordset?.[0]?.NewId;
      
      this.logger.log(`Usuario creado exitosamente con ID: ${usuarioId} para estudiante: ${estudianteId}`);
      
      return { username, password: tempPassword, hashedPassword };
    } catch (error: any) {
      this.logger.error(`Error creando usuario para estudiante ${estudianteId}: ${error.message}`, error.stack);
      throw new Error('No se pudo crear el usuario automáticamente: ' + error.message);
    }
  }

  async create(obj: CreateEstudianteDto) {
    try {
      this.logger.log('Creando estudiante: ' + JSON.stringify(obj));
      
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      // Preparar datos para el SP de estudiante
      const id = obj.Id ?? 0;
      const EstadoId = obj.EstadoId !== undefined && obj.EstadoId !== null ? Number(obj.EstadoId) : null;
      const CarreraId = obj.CarreraId !== undefined && obj.CarreraId !== null ? Number(obj.CarreraId) : null;

      request.input('Id', id);
      request.input('Nombre', obj.Nombre);
      request.input('Apellido', obj.Apellido);
      request.input('Edad', obj.Edad);
      request.input('Correo', obj.Correo);
      request.input('EstadoId', EstadoId);
      request.input('CarreraId', CarreraId);

      const result: any = await request.execute('Beca.sp_Save_Estudiante');
      const estudianteId = result.recordset?.[0]?.NewId || id;

      if (!estudianteId && id === 0) {
        throw new Error('No se devolvió un ID válido al crear el estudiante.');
      }

      this.logger.log(`Estudiante creado/actualizado con ID: ${estudianteId}`);

      // Crear usuario automáticamente con hash correcto
      const credenciales = await this.createUserForStudent(
        estudianteId, 
        obj.Correo, 
        obj.Nombre, 
        obj.Apellido,
        'estudiante'
      );

      // Obtener nombres de lookup
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', EstadoId);
      const carreraNombre = await this.getNombreById('Beca.sp_Get_Carrera', CarreraId);

      return {
        estudiante: {
          Id: estudianteId,
          Nombre: obj.Nombre,
          Apellido: obj.Apellido,
          Edad: obj.Edad,
          Correo: obj.Correo,
          EstadoId,
          estadoNombre,
          CarreraId,
          carreraNombre,
        },
        credenciales: {
          username: credenciales.username,
          password: credenciales.password, // ✅ Contraseña sin hash para mostrar
          mensaje: 'Usuario creado exitosamente'
        }
      };

    } catch (error: any) {
      this.logger.error(`Error creando estudiante: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Resto de métodos mantienen la misma lógica...
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

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const estudiantesResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estudiante');
      const estudiantes = estudiantesResult.recordset;

      const estadosResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado');
      const estados = estadosResult.recordset;

      const carrerasResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Carrera');
      const carreras = carrerasResult.recordset;

      const estudiantesConNombres = estudiantes.map((est: any) => {
        const estado = estados.find((e: any) => e.Id === est.EstadoId);
        const carrera = carreras.find((c: any) => c.Id === est.CarreraId);
        return {
          ...est,
          estadoNombre: estado?.Nombre ?? null,
          carreraNombre: carrera?.Nombre ?? null,
        };
      });

      return estudiantesConNombres;
    } catch (error: any) {
      this.logger.error(`Error al obtener todos los estudiantes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const estudianteResult: any = await pool.request().input('Id', id).execute('Beca.sp_Get_Estudiante');

      if (estudianteResult.recordset.length === 0) {
        throw new Error(`Estudiante con ID ${id} no encontrado`);
      }

      const estudiante = estudianteResult.recordset[0];
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', estudiante.EstadoId);
      const carreraNombre = await this.getNombreById('Beca.sp_Get_Carrera', estudiante.CarreraId);

      return {
        ...estudiante,
        estadoNombre,
        carreraNombre,
      };
    } catch (error: any) {
      this.logger.error(`Error al buscar estudiante por ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_Estudiante');

      if (result.rowsAffected[0] === 0) {
        throw new Error(`Estudiante con ID ${id} no encontrado o no se pudo eliminar.`);
      }
      return { mensaje: `Estudiante con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`Error al eliminar estudiante ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}