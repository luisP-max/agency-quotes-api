import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Definimos el tipo de estado permitido como un tipo de TypeScript
export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  client: string;

  @Column({ type: 'varchar' })
  destination: string;

  @Column({ type: 'varchar' })
  departureDate: string; // Guardado en formato ISO string (YYYY-MM-DD)

  @Column({ type: 'varchar' })
  returnDate: string;

  @Column({ type: 'int' })
  passengers: number;

  @Column({ type: 'float' }) // Usamos tipo flotante/numérico adecuado para dinero
  totalValue: number;

  @Column({ type: 'varchar' })
  agent: string; // Nombre del asesor responsable de la cotización

  @Column({ type: 'varchar', default: 'DRAFT' })
  status: QuoteStatus;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null; // Vacío excepto cuando el estado es REJECTED

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}