import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.username, dto.password);
    return this.authService.login(user);
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.authService.getMe((req.user as { id: number }).id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      (req.user as { id: number }).id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
