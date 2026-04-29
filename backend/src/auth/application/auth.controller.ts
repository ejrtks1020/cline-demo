import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginCommand, SignupCommand } from './dto/auth.command';
import { AuthResponse, UserPublicResponse } from './dto/auth.response';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() command: SignupCommand): Promise<AuthResponse> {
    return this.authService.signup(command);
  }

  @Post('login')
  login(@Body() command: LoginCommand): Promise<AuthResponse> {
    return this.authService.login(command);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload): Promise<UserPublicResponse> {
    return this.authService.getCurrentUser(user.id);
  }
}
