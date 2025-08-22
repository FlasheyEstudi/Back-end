import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    
    if (!authHeader) throw new UnauthorizedException('No se encontró el token de autorización');

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) throw new UnauthorizedException('Formato de token inválido');

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'default_secret',
      });
      
      // ✅ Asegurarse de que el payload tiene un ID válido
      if (!payload.sub || payload.sub <= 0) {
        throw new UnauthorizedException('Token inválido: ID de usuario no válido');
      }
      
      const user = await this.authService.validateUserById(payload.sub);
      if (!user) throw new UnauthorizedException('Usuario no encontrado');

      // ✅ Añadir información completa del usuario a la request
      request['user'] = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}