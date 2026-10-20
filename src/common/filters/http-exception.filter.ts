import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
@Catch() // Captura absolutamente todas las excepciones de la aplicación
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determinamos si es un error controlado de NestJS o un error inesperado (500)
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extraemos el mensaje de error limpio manejando las validaciones de class-validator
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exception.message;
      }
    } else {
      // Si es un error 500, registramos el error real en consola interna por seguridad
      console.error('Unexpected System Error:', exception);
    }

    // Estructura uniforme requerida en el literal 6.G del simulacro
    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
