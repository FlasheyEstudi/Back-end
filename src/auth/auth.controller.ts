import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth-guard';
import { User } from '../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { identifier: string; password: string }) {
    const { identifier, password } = body;
    return this.authService.login(identifier, password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @User() user: any,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    const { currentPassword, newPassword } = body;
    return this.authService.changePassword(user.sub, currentPassword, newPassword);
  }
}