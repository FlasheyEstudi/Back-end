import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { UsuarioService } from '../ms/Usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    const user = await this.usuarioService.findOneByUsernameOrEmail(identifier);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const isPasswordValid = await this.usuarioService.validatePassword(password, user.Contrasena);
    if (!isPasswordValid) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { 
      sub: user.Id, 
      role: user.Role || 'estudiante', 
      nombre: user.Nombre,
      email: user.Correo
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: { 
        id: user.Id, 
        nombre: user.Nombre, 
        role: user.Role || 'estudiante',
        email: user.Correo
      },
    };
  }

  async register(data: {
    Nombre: string;
    Apellidos: string;
    Correo: string;
    Edad: number; // ✅ Necesario para la contraseña automática
    Role?: string;
  }) {
    const { Nombre, Apellidos, Correo, Edad, Role = 'estudiante' } = data;

    // Verificar si el correo ya existe
    const existingUser = await this.usuarioService.findOneByEmail(Correo);
    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Generar contraseña automática simple: 3 letras de nombre + 3 letras de apellido + edad
    const plainPassword = `${Nombre.substring(0,3).toLowerCase()}${Apellidos.substring(0,3).toLowerCase()}${Edad}`;

    // Hashear la contraseña
    const hashedPassword = await this.usuarioService.hashPassword(plainPassword);

    // Crear el usuario
    const newUser = await this.usuarioService.create({
      Nombre,
      Apellidos,
      Correo,
      Contrasena: hashedPassword,
      Role,
    });

    // Generar token de autenticación
    const payload = { 
      sub: newUser.Id, 
      role: newUser.Role, 
      nombre: newUser.Nombre,
      email: newUser.Correo
    };
    const token = this.jwtService.sign(payload);

    // Retornar también la contraseña generada
    return {
      access_token: token,
      passwordGenerada: plainPassword, // ✅ Contraseña que puede enviarse al usuario
      user: { 
        id: newUser.Id, 
        nombre: newUser.Nombre, 
        role: newUser.Role,
        email: newUser.Correo
      },
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    // ✅ Verificar que userId sea válido
    if (!userId || userId <= 0) {
      throw new NotFoundException('ID de usuario inválido');
    }

    const user = await this.usuarioService.findOne(userId);
    if (!user) throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);

    const isValid = await this.usuarioService.validatePassword(currentPassword, user.Contrasena);
    if (!isValid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const hashed = await this.usuarioService.hashPassword(newPassword);
    await this.usuarioService.updatePassword(userId, hashed);

    return { message: 'Contraseña cambiada correctamente' };
  }

  async validateUserById(userId: number) {
    if (!userId || userId <= 0) return null;
    const user = await this.usuarioService.findOne(userId);
    return user ? { 
      id: user.Id, 
      nombre: user.Nombre, 
      role: user.Role, 
      email: user.Correo
    } : null;
  }
}
