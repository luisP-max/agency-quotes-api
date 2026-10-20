import { Injectable } from '@nestjs/common';

// Definimos una interfaz para tipar de forma estricta a nuestros usuarios
export interface UserInMemory {
  username: string;
  role: 'admin' | 'manager' | 'agent';
}

@Injectable()
export class UsersService {
  // Definimos la lista obligatoria de usuarios de prueba en memoria
  private readonly users: UserInMemory[] = [
    { username: 'sofia.admin', role: 'admin' },
    { username: 'andres.manager', role: 'manager' }, 
    { username: 'valeria.agent', role: 'agent' },   
    { username: 'mateo.agent', role: 'agent' },     
  ];

  /**
   * Busca un usuario por su nombre de usuario.
   * @param username El nombre de usuario enviado en el header x-user
   */
  findOneByUsername(username: string): UserInMemory | undefined {
    return this.users.find(user => user.username === username);
  }
}
