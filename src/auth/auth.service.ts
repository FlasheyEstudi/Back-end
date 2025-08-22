import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
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

    const payload = { sub: user.Id, role: user.Role || 'estudiante', nombre: user.Nombre };
    const token = this.jwtService.sign(payload);

    return { 
      access_token: token, 
      user: { Id: user.Id, nombre: user.Nombre, role: user.Role || 'estudiante' } 
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usuarioService.findOne(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isValid = await this.usuarioService.validatePassword(currentPassword, user.Contrasena);
    if (!isValid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const hashed = await this.usuarioService.hashPassword(newPassword);
    await this.usuarioService.updatePassword(userId, hashed);

    return { message: 'Contraseña cambiada correctamente' };
  }

  async validateUserById(userId: number) {
    if (!userId) return null;
    const user = await this.usuarioService.findOne(userId);
    return user || null;
  }
}
