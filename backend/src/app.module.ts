import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ChatMessageSchema } from './chat/infrastructure/repositories/postgres/chat-message.schema';
import { ChatSessionSchema } from './chat/infrastructure/repositories/postgres/chat-session.schema';
import { UserSchema } from './user/infrastructure/repositories/postgres/user.schema';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwtSecret = config.get<string>('JWT_SECRET');
        if (process.env.NODE_ENV === 'production' && !jwtSecret) {
          throw new Error('JWT_SECRET is required in production');
        }
        if (process.env.NODE_ENV === 'production' && config.get<string>('DB_SYNC') === 'true') {
          throw new Error('DB_SYNC=true is not allowed in production');
        }
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: Number(config.get<string>('DB_PORT') ?? 5432),
          username: config.get<string>('DB_USER') ?? 'postgres',
          password: config.get<string>('DB_PASS') ?? 'postgres',
          database: config.get<string>('DB_NAME') ?? 'chatbot',
          synchronize: config.get<string>('DB_SYNC') === 'true',
          entities: [UserSchema, ChatSessionSchema, ChatMessageSchema],
        };
      },
    }),
    UserModule,
    AuthModule,
    ChatModule,
  ],
})
export class AppModule {}
