import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordHasherProvider } from '../../common/providers/password-hasher.provider';
import { UuidProvider } from '../../common/providers/uuid.provider';
import { User } from '../../user/domain/entities/user.entity';
import { IUserRepository } from '../../user/infrastructure/repositories/repository.interface';
import { JwtPayload } from '../infrastructure/strategies/jwt-payload.interface';
import { LoginCommand, SignupCommand } from './dto/auth.command';
import { AuthResponse, UserPublicResponse } from './dto/auth.response';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly passwordHasher: PasswordHasherProvider,
    private readonly uuidProvider: UuidProvider,
  ) {}

  async signup(command: SignupCommand): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByLoginId(command.loginId);
    if (existingUser) throw new ConflictException('loginId already exists');

    const now = new Date();
    const user = await this.userRepository.save(
      new User(this.uuidProvider.generate(), command.loginId, await this.passwordHasher.hash(command.password), command.name ?? null, now, now),
    );
    return { accessToken: await this.signAccessToken(user), user: this.toPublicUser(user) };
  }

  async login(command: LoginCommand): Promise<AuthResponse> {
    const user = await this.userRepository.findByLoginId(command.loginId);
    // 로그인 실패 원인을 일반화해 ID 존재 여부를 추측할 수 없게 한다.
    if (!user || !(await this.passwordHasher.compare(command.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { accessToken: await this.signAccessToken(user), user: this.toPublicUser(user) };
  }

  async getCurrentUser(userId: string): Promise<UserPublicResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.toPublicUser(user);
  }

  private signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = { sub: user.id, loginId: user.loginId };
    return this.jwtService.signAsync(payload);
  }

  private toPublicUser(user: User): UserPublicResponse {
    return { id: user.id, loginId: user.loginId, ...(user.name ? { name: user.name } : {}) };
  }
}
