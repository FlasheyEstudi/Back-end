import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth-guard';
import { User } from '../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔑 Login
  @Post('login')
  async login(@Body() body: { identifier: string; password: string }) {
    const { identifier, password } = body;
    return this.authService.login(identifier, password);
  }

  // ✅ Registro de usuario
  @Post('register')
  async register(
    @Body() body: {
      Nombre: string;
      Apellidos: string;
      Correo: string;
      Contrasena: string;
      Role?: string;
    }
  ) {
    return this.authService.register(body);
  }

  // 🔐 Cambio de contraseña
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @User() user: any, // ✅ Usuario autenticado desde JWT
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    const userId = user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const { currentPassword, newPassword } = body;
    return this.authService.changePassword(userId, currentPassword, newPassword);
  }

  // 🔹 Otros endpoints de Auth pueden agregarse aquí
}
