import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Quote } from './quotes/entities/quote.entity.js';
import { QuotesModule } from './quotes/quotes.module.js'; // Importamos el módulo de cotizaciones
import { AuthModule } from './auth/auth.module.js'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const options: TypeOrmModuleOptions = {
          type: 'better-sqlite3' as any, 
          database: configService.get<string>('DB_PATH', './data/agency.sqlite'),
          entities: [Quote],
          synchronize: true, 
        };
        return options;
      },
    }),
    QuotesModule,
    AuthModule,
  ],
})
export class AppModule {}
