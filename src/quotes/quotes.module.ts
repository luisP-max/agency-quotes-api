import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller.js';
import { QuotesService } from './quotes.service.js';
import { Quote } from './entities/quote.entity.js';
import { UsersModule } from '../users/users.module.js'; // Lo necesitaremos para validar agentes en la RN-01

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote]), // Registra el repositorio de la entidad Quote
    UsersModule, // Importamos UsersModule para poder verificar si un asesor existe
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
