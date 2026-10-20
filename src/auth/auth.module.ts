import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule], //implementamos el modulo de usuario para poderlo ejecutar
})
export class AuthModule {}
