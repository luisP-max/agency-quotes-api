import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js'; 

@Module({
  providers: [UsersService],
  exports: [UsersService], // Es fundamental exportarlo para que otros módulos lo usen
})
export class UsersModule {}
