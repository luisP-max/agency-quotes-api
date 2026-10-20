import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers['x-api-key'] as string;

    if (!apiKeyHeader) {
      throw new UnauthorizedException('API Key header (x-api-key) is missing');
    }

    // Leemos la variable de entorno 'API_KEYS'
    const rawKeys = this.configService.get<string>('API_KEYS', '');
    
    // Cumpliendo RN-05: Separar por comas, limpiar espacios e ignorar vacíos
    const validApiKeys = rawKeys
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    const isValid = validApiKeys.includes(apiKeyHeader.trim());

    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key provided');
    }

    return true;
  }
}
