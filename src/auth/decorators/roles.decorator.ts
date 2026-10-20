import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Permite marcar controladores o métodos con los roles autorizados
export const Roles = (...roles: ('admin' | 'manager' | 'agent')[]) => SetMetadata(ROLES_KEY, roles);
