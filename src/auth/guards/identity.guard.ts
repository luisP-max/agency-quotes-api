import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service.js';
import { Request } from 'express';

// Extendemos la interfaz Request para decirle a TypeScript que tendrá una propiedad opcional llamada 'user'
interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  canActivate(context: ExecutionContext): boolean {
    // Usamos nuestra interfaz extendida aquí en lugar de la básica de Express
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const usernameHeader = request.headers['x-user'] as string;

    if (!usernameHeader) {
      throw new UnauthorizedException('User identity header (x-user) is missing');
    }

    const user = this.usersService.findOneByUsername(usernameHeader.trim());

    if (!user) {
      throw new UnauthorizedException(`User '${usernameHeader}' does not exist in the system`);
    }

    request.user = user;
    return true;
  }
}
