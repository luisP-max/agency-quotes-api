import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lee los roles definidos en el decorador @Roles() del método o del controlador
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se especificaron roles requeridos, el acceso es público (para usuarios válidos)
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['user']; // Recuperamos el usuario que inyectó el IdentityGuard

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Your role '${user?.role || 'none'}' does not have permission to access this resource`);
    }

    return true;
  }
}
