import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../repository.interface';
import { UserSchema, UserSchemaRecord } from './user.schema';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@InjectRepository(UserSchema) private readonly repository: Repository<UserSchemaRecord>) {}

  async findById(id: string): Promise<User | null> {
    const record = await this.repository.findOneBy({ id });
    return record ? this.toDomain(record) : null;
  }

  async findByLoginId(loginId: string): Promise<User | null> {
    const record = await this.repository.findOneBy({ loginId });
    return record ? this.toDomain(record) : null;
  }

  async save(user: User): Promise<User> {
    const saved = await this.repository.save(this.toPersistence(user));
    return this.toDomain(saved);
  }

  private toDomain(record: UserSchemaRecord): User {
    // persistence schema를 application 계층에 노출하지 않기 위한 변환 지점이다.
    return new User(record.id, record.loginId, record.passwordHash, record.name, record.createdAt, record.updatedAt);
  }

  private toPersistence(user: User): UserSchemaRecord {
    return { id: user.id, loginId: user.loginId, passwordHash: user.passwordHash, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt };
  }
}
