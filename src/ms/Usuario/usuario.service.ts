import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
      console.error('Error buscando usuario:', error);
      return null;
    }
  }

  async findOne(id: number) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      request.input('Id', id);
      const result = await request.execute('Beca.sp_Get_Usuario');
      
      if (result.recordset.length > 0) {
        return result.recordset[0];
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

      return result.recordset;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new BadRequestException(`Error al obtener usuarios: ${error.message}`);
    }
  }

  async create(userData: CreateUsuarioDto) {
    try {
      if (!userData.Contrasena) {
        throw new BadRequestException('La contraseña es requerida');
      }

      const pool = await this.sqlService.getConnection();
      const request = pool.request();

      // ✅ Usa el nuevo método
      const hashedPassword = await this.hashPassword(userData.Contrasena);

      const id = userData.Id ?? 0;

      request.input('Id', id);
      request.input('Nombre', userData.Nombre);
      request.input('Contrasena', hashedPassword);
      request.input('Apellidos', userData.Apellidos || null);
      request.input('Email', userData.Correo || null);
      request.input('Role', userData.Role || 'estudiante');

      const result = await request.execute('Beca.sp_Save_Usuario');

      if (result.recordset && result.recordset.length > 0) {
        return {
          id: result.recordset[0].NewId ?? result.recordset[0].UpdatedId ?? id,
        };
      }

      return { id };
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  async updatePassword(userId: number, newPassword: string) {
    try {
      const pool = await this.sqlService.getConnection();
      const request = pool.request();
      
      // ✅ Usa el nuevo método
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
