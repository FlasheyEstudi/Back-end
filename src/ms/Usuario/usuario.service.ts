import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { SqlService } from '../cnxjs/sql.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private readonly sqlService: SqlService) {}

  // ✅ Método reutilizable para hashear contraseñas
  async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }
    return await bcrypt.hash(password, 10);
  }

  async findOneByUsernameOrEmail(identifier: string) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      request.input('Nombre', identifier);
      const result = await request.execute('Beca.sp_Get_Usuario_By_Identifier');
      
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Error buscando usuario por nombre o email:', error);
      throw new BadRequestException('Error al buscar usuario');
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      request.input('Id', id);
      const result = await request.execute('Beca.sp_Get_Usuario');
      
      if (result.recordset.length > 0) {
        const user = result.recordset[0];
        return {
          Id: user.Id,
          Nombre: user.Nombre,
          Apellidos: user.Apellidos,
          Correo: user.Email,
          Role: user.Role,
          Contrasena: user.Contrasena, // Ya está hasheada
        };
      }
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw new BadRequestException(`Error obteniendo usuario: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      request.input('Id', 0);
      const result = await request.execute('Beca.sp_Get_Usuario');

      return result.recordset.map(user => ({
        Id: user.Id,
        Nombre: user.Nombre,
        Apellidos: user.Apellidos,
        Correo: user.Email,
        Role: user.Role,
      }));
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new BadRequestException(`Error al obtener usuarios: ${error.message}`);
    }
  }

  // ✅ NUEVO: Buscar por correo (usa el SP existente)
  async findOneByEmail(email: string) {
    try {
      if (!email || typeof email !== 'string') {
        return null;
      }

      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      request.input('Nombre', email); // Usa el SP existente
      const result = await request.execute('Beca.sp_Get_Usuario_By_Identifier');
      
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error('Error buscando usuario por email:', error);
      throw new BadRequestException('Error al buscar usuario por correo');
    }
  }

  // ✅ CORREGIDO: create() ahora devuelve el usuario completo
  async create(userData: CreateUsuarioDto) {
    try {
      if (!userData.Contrasena) {
        throw new BadRequestException('La contraseña es requerida');
      }

      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      // ✅ Hashear la contraseña
      const hashedPassword = await this.hashPassword(userData.Contrasena);

      const id = userData.Id ?? 0;

      request.input('Id', id);
      request.input('Nombre', userData.Nombre);
      request.input('Contrasena', hashedPassword);
      request.input('Apellidos', userData.Apellidos || null);
      request.input('Email', userData.Correo || null);
      request.input('Role', userData.Role || 'estudiante');

      const result = await request.execute('Beca.sp_Save_Usuario');

      let newId: number;

      if (result.recordset && result.recordset.length > 0) {
        newId = result.recordset[0].NewId || result.recordset[0].UpdatedId || id;
      } else {
        throw new BadRequestException('No se pudo obtener el ID del usuario creado');
      }

      // ✅ Retornar el usuario completo usando findOne
      return await this.findOne(newId);

    } catch (error) {
      console.error('Error creando usuario:', error);

      // Si el SP ya lanza error por email duplicado, lo capturamos
      if (error.message?.includes('correo electrónico ya está registrado')) {
        throw new ConflictException('El correo ya está registrado');
      }

      throw error;
    }
  }

  async updatePassword(userId: number, newPassword: string) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      const hashedPassword = await this.hashPassword(newPassword);

      request.input('Id', userId);
      request.input('Password', hashedPassword);
      
      await request.execute('Beca.sp_Update_Password');
      return { message: `Contraseña actualizada para el usuario con ID ${userId}` };
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      throw new BadRequestException(`Error actualizando contraseña: ${error.message}`);
    }
  }

  async remove(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      request.input('Id', id);
      await request.execute('Beca.sp_Delete_Usuario');

      return { mensaje: `Usuario con ID ${id} eliminado correctamente` };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw new BadRequestException(`Error al eliminar usuario: ${error.message}`);
    }
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword) {
      return false;
    }
    return await bcrypt.compare(password, hashedPassword);
  }
}