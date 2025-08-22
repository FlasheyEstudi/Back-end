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
    
    console.log('Authorization header:', authHeader); // Log para depuración
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new UnauthorizedException('No se encontró el token de autorización');
    }

    const [bearer, token] = authHeader.split(' ');
    console.log('Extracted token:', token); // Log para depuración
    if (bearer !== 'Bearer' || !token) {
      console.error('Invalid token format');
      throw new UnauthorizedException('Formato de token inválido');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'default_secret',
      });
      console.log('Token payload:', payload); // Log para depuración
      
      if (!payload.sub || payload.sub <= 0) {
        console.error('Invalid user ID in token:', payload.sub);
        throw new UnauthorizedException('Token inválido: ID de usuario no válido');
      }
      
      const user = await this.authService.validateUserById(payload.sub);
      if (!user) {
        console.error('User not found for ID:', payload.sub);
        throw new UnauthorizedException('Usuario no encontrado');
      }

      request['user'] = user;
      console.log('User validated:', user); // Log para depuración
      return true;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}