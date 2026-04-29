import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import { IUserRepository } from '../infrastructure/repositories/repository.interface';

@Injectable()
export class UserService {
  constructor(@Inject(IUserRepository) private readonly userRepository: IUserRepository) {}

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}
