import { IsNotEmpty, IsString, IsInt, Min, Max, IsPositive, IsOptional } from 'class-validator';

export class CreateQuoteDto {
  @IsNotEmpty()
  @IsString()
  client: string;

  @IsNotEmpty()
  @IsString()
  destination: string;

  @IsNotEmpty()
  @IsString()
  departureDate: string; // Validaremos la lógica de fechas cruzadas en el servicio

  @IsNotEmpty()
  @IsString()
  returnDate: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(20) // RN-04: pasajeros debe ser un entero entre 1 y 20
  passengers: number;

  @IsNotEmpty()
  @IsPositive() // RN-04: valorTotal debe ser un número mayor que 0
  totalValue: number;

  // El campo agent es opcional en el DTO porque si registra un asesor se ignora, 
  // pero si registra un admin/manager se vuelve obligatorio en la validación del servicio.
  @IsOptional()
  @IsString()
  agent?: string;
}