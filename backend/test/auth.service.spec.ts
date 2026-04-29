import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/application/auth.service';
import { PasswordHasherProvider } from '../src/common/providers/password-hasher.provider';
import { UuidProvider } from '../src/common/providers/uuid.provider';
import { User } from '../src/user/domain/entities/user.entity';
import { IUserRepository } from '../src/user/infrastructure/repositories/repository.interface';

describe('AuthService', () => {
  let users: User[];
  let service: AuthService;

  beforeEach(() => {
    users = [];
    const repo: IUserRepository = {
      findById: jest.fn(async (id) => users.find((user) => user.id === id) ?? null),
      findByLoginId: jest.fn(async (loginId) => users.find((user) => user.loginId === loginId) ?? null),
      save: jest.fn(async (user) => {
        users.push(user);
        return user;
      }),
    };
    const jwt = { signAsync: jest.fn(async (payload) => `token:${payload.sub}:${payload.loginId}`) } as unknown as JwtService;
    const hasher = { hash: jest.fn(async () => 'hashed'), compare: jest.fn(async (password: string) => password === 'password123') } as unknown as PasswordHasherProvider;
    const uuid = { generate: jest.fn(() => '018f6b8e-7c00-7000-8000-000000000001') } as unknown as UuidProvider;
    service = new AuthService(repo, jwt, hasher, uuid);
  });

  it('signs up and excludes passwordHash from response', async () => {
    const result = await service.signup({ loginId: 'tester', password: 'password123', name: '테스터' });
    expect(result.accessToken).toContain('tester');
    expect(result.user).toEqual({ id: '018f6b8e-7c00-7000-8000-000000000001', loginId: 'tester', name: '테스터' });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate loginId', async () => {
    await service.signup({ loginId: 'tester', password: 'password123' });
    await expect(service.signup({ loginId: 'tester', password: 'password123' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with generic failure message', async () => {
    await service.signup({ loginId: 'tester', password: 'password123' });
    await expect(service.login({ loginId: 'tester', password: 'wrong-password' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.login({ loginId: 'missing', password: 'password123' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.login({ loginId: 'tester', password: 'password123' })).resolves.toHaveProperty('accessToken');
  });
});
