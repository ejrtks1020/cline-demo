import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './application/user.service';
import { IUserRepository } from './infrastructure/repositories/repository.interface';
import { UserRepository } from './infrastructure/repositories/postgres/user.repository';
import { UserSchema } from './infrastructure/repositories/postgres/user.schema';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UserService, { provide: IUserRepository, useClass: UserRepository }],
  exports: [UserService, IUserRepository],
})
export class UserModule {}
