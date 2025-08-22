import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SqlService } from '../cnxjs/sql.service';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EstudianteService {
  private readonly logger = new Logger(EstudianteService.name);
  private readonly saltRounds = 10;

  constructor(private readonly sqlService: SqlService) {}

  // ✅ NUEVO MÉTODO: Mapear usuario ID a estudiante ID
  async mapUserToEstudiante(userId: number): Promise<{ estudianteId: number }> {
    try {
      this.logger.log(`🔍 Mapeando usuario ID ${userId} a estudiante`);
      
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('UserId', userId);
      
      const result = await request.execute('Beca.sp_Map_UserToEstudiante');
      
      if (result.recordset.length === 0) {
        this.logger.warn(`❌ No se encontró estudiante para usuario ${userId}`);
        throw new NotFoundException('No se encontró un estudiante asociado al usuario.');
      }
      
      const estudianteId = result.recordset[0].EstudianteId;
      this.logger.log(`✅ Usuario ${userId} mapeado a estudiante ${estudianteId}`);
      
      return { estudianteId };
    } catch (error) {
      this.logger.error(`❌ Error mapping user to student: ${error.message}`, error.stack);
      throw new BadRequestException('Error al mapear usuario a estudiante');
    }
  }

  private generateTemporaryPassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  private async createUserForStudent(
    estudianteId: number,
    email: string,
    nombre: string,
    apellido: string,
    role: string = 'estudiante'
  ): Promise<{ username: string; password: string; hashedPassword: string }> {
    try {
      this.logger.log(`👤 Creando usuario para estudiante ID: ${estudianteId}, Email: ${email}`);
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      const username = email.split('@')[0];
      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, this.saltRounds);
      this.logger.log(`🔑 Contraseña generada para ${username}`);
      request.input('Id', 0);
      request.input('Nombre', username);
      request.input('Contrasena', hashedPassword);
      request.input('Apellidos', apellido);
      request.input('Email', email);
      request.input('Role', role);
      request.input('Identifier', null);
      const result = await request.execute('Beca.sp_Save_Usuario');
      const usuarioId = result.recordset?.[0]?.NewId;
      if (!usuarioId) throw new Error('No se devolvió un ID de usuario válido');
      this.logger.log(`✅ Usuario creado con ID: ${usuarioId}`);
      return { username, password: tempPassword, hashedPassword };
    } catch (error: any) {
      this.logger.error(`❌ Error creando usuario para estudiante ${estudianteId}: ${error.message}`, error.stack);
      throw new Error('No se pudo crear el usuario: ' + error.message);
    }
  }

  async create(obj: CreateEstudianteDto) {
    try {
      this.logger.log('➕ Creando estudiante: ' + JSON.stringify(obj));
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
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
        throw new Error('No se devolvió un ID válido al crear el estudiante');
      }
      this.logger.log(`✅ Estudiante creado/actualizado con ID: ${estudianteId}`);
      const credenciales = await this.createUserForStudent(estudianteId, obj.Correo, obj.Nombre, obj.Apellido);
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
          password: credenciales.password,
          mensaje: 'Usuario creado exitosamente',
        },
      };
    } catch (error: any) {
      this.logger.error(`❌ Error creando estudiante: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const result: any = await pool.request().execute('Beca.sp_Get_All_Estudiantes');
      this.logger.log(`📋 Estudiantes obtenidos: ${result.recordset?.length || 0}`);
      const estudiantes = result.recordset || [];
      const estadosResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Estado');
      const estados = estadosResult.recordset;
      const carrerasResult: any = await pool.request().input('Id', 0).execute('Beca.sp_Get_Carrera');
      const carreras = carrerasResult.recordset;
      return estudiantes.map((est: any) => ({
        ...est,
        estadoNombre: estados.find((e: any) => e.Id === est.EstadoId)?.Nombre ?? null,
        carreraNombre: carreras.find((c: any) => c.Id === est.CarreraId)?.Nombre ?? null,
      }));
    } catch (error: any) {
      this.logger.error(`❌ Error al obtener estudiantes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result: any = await pool.request().input('Id', id).execute('Beca.sp_Get_Estudiante');
      this.logger.log(`🔍 Resultado de sp_Get_Estudiante para ID ${id}: ${result.recordset?.length || 0} registros`);
      if (result.recordset.length === 0) {
        throw new NotFoundException(`Estudiante con ID ${id} no encontrado`);
      }
      const estudiante = result.recordset[0];
      const estadoNombre = await this.getNombreById('Beca.sp_Get_Estado', estudiante.EstadoId);
      const carreraNombre = await this.getNombreById('Beca.sp_Get_Carrera', estudiante.CarreraId);
      return {
        ...estudiante,
        estadoNombre,
        carreraNombre,
      };
    } catch (error: any) {
      this.logger.error(`❌ Error al buscar estudiante por ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const result = await pool.request().input('Id', id).execute('Beca.sp_Delete_Estudiante');
      if (result.rowsAffected[0] === 0) {
        throw new NotFoundException(`Estudiante con ID ${id} no encontrado o no se pudo eliminar`);
      }
      return { mensaje: `✅ Estudiante con ID ${id} eliminado correctamente` };
    } catch (error: any) {
      this.logger.error(`❌ Error al eliminar estudiante ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getNombreById(spName: string, id: number | null): Promise<string | null> {
    if (id === null || id === undefined || id <= 0) {
      this.logger.warn(`⚠️ ID inválido para ${spName}: ${id}`);
      return null;
    }
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      request.input('Id', id);
      const result = await request.execute(spName);
      return result.recordset?.[0]?.Nombre ?? null;
    } catch (error: any) {
      this.logger.error(`❌ Error obteniendo nombre desde ${spName} para ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }
}