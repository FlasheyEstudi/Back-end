import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsuarioService } from '../ms/Usuario/usuario.service';
import { CreateUsuarioDto } from '../ms/Usuario/dto/create-usuario.dto';
import { JwtService } from '@nestjs/jwt'; // <-- Añade esta línea

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService, // <-- Ya estaba bien
  ) {}

  async register(userData: CreateUsuarioDto) {
    const existingUser = await this.usuarioService.findOneByUsernameOrEmail(userData.Nombre);
    if (existingUser) {
      throw new UnauthorizedException('El usuario ya existe');
    }
    const createdUser = await this.usuarioService.create(userData);
    return createdUser;
  }

  async login(identifier: string, password: string) {
    const user = await this.usuarioService.findOneByUsernameOrEmail(identifier);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = await this.usuarioService.validatePassword(
      password,
      user.Contrasena,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const payload = { sub: user.Id, role: user.Role || 'estudiante', nombre: user.Nombre };
    const token = this.jwtService.sign(payload);

    return { 
      access_token: token, 
      user: { id: user.Id, nombre: user.Nombre, role: user.Role || 'estudiante' } 
    };
  }

  async validateUser(id: number) {
    return this.usuarioService.findOne(id);
  }

  async validateUserById(userId: number) {
    // Asegúrate de que userId no sea undefined
    if (userId === undefined || userId === null) {
      throw new NotFoundException('ID de usuario inválido');
    }
    const user = await this.usuarioService.findOne(userId);
    if (!user) return null;
    return user;
  }
}