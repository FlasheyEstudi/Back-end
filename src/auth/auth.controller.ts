// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from '../ms/Usuario/dto/create-usuario.dto';

@Controller('auth') // <- Esto crea /auth/*
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: CreateUsuarioDto) {
    return this.authService.register(userData);
  }

  @Post('login')
  async login(@Body() body: { identifier: string; password: string }) {
    const { identifier, password } = body;
    return this.authService.login(identifier, password);
  }
}