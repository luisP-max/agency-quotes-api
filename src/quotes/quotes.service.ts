import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  ForbiddenException, 
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    private readonly usersService: UsersService, // Inyectamos el servicio para validar agentes
  ) {}

  /**
   * Registra una nueva cotización aplicando las reglas de negocio de fechas y roles.
   * @param createQuoteDto Datos enviados en el body
   * @param currentUser Usuario autenticado que realiza la petición (inyectado por el IdentityGuard)
   */
  async create(createQuoteDto: CreateQuoteDto, currentUser: any): Promise<Quote> {
    const { departureDate, returnDate, client, destination, passengers, totalValue } = createQuoteDto;

    // --- RN-04: VALIDACIÓN DE FECHAS ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Limpiamos horas para comparar solo el día

    const depDate = new Date(departureDate);
    const retDate = new Date(returnDate);

    if (isNaN(depDate.getTime()) || isNaN(retDate.getTime())) {
      throw new BadRequestException('Dates must be valid ISO strings (YYYY-MM-DD)');
    }

    if (depDate <= today) {
      throw new BadRequestException('Departure date must be in the future (after today)');
    }

    if (retDate < depDate) {
      throw new BadRequestException('Return date must be equal to or after the departure date');
    }

    // --- RN-01: DETERMINACIÓN DEL ASESOR RESPONSABLE ---
    let assignedAgent: string;

    if (currentUser.role === 'agent') {
      // Si es asesor, él es el responsable obligatorio de la cotización
      assignedAgent = currentUser.username;
    } else {
      // Si es admin o manager, debe especificar obligatoriamente un agente del body
      if (!createQuoteDto.agent) {
        throw new BadRequestException('The field "agent" is required when created by an admin or manager');
      }

      // Validamos que el agente propuesto exista en el sistema y tenga el rol correcto
      const targetUser = this.usersService.findOneByUsername(createQuoteDto.agent);
      if (!targetUser || targetUser.role !== 'agent') {
        throw new BadRequestException(`The user "${createQuoteDto.agent}" is not a valid agent in the system`);
      }

      assignedAgent = targetUser.username;
    }

    // --- CREACIÓN E INICIALIZACIÓN DEL REGISTRO ---
    const newQuote = this.quoteRepository.create({
      client,
      destination,
      departureDate,
      returnDate,
      passengers,
      totalValue,
      agent: assignedAgent,
      status: 'DRAFT', // Estado inicial forzado por el sistema
      rejectionReason: null,
    });

    return await this.quoteRepository.save(newQuote);
  }

 /**
   * RN-02: Lista todas las cotizaciones autorizadas aplicando filtros directamente en la DB.
   */
  async findAll(currentUser: any, statusFilter?: string): Promise<Quote[]> {
    // Creamos el objeto de condiciones dinámicas para el WHERE de TypeORM
    const whereCondition: any = {};

    // Si el usuario es un asesor, restringimos la consulta SÓLO a sus registros en la DB
    if (currentUser.role === 'agent') {
      whereCondition.agent = currentUser.username;
    }

    // Si envían un filtro de estado, validamos que pertenezca al tipo de estados permitidos
    if (statusFilter) {
      const upperStatus = statusFilter.toUpperCase() as QuoteStatus;
      const validStatuses: QuoteStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'];
      
      if (!validStatuses.includes(upperStatus)) {
        throw new BadRequestException(`"${statusFilter}" is not a valid status filter`);
      }
      
      whereCondition.status = upperStatus;
    }

    // Traemos de la base de datos aplicando la cláusula WHERE estructurada
    return await this.quoteRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Consulta una cotización individual protegiendo la privacidad del propietario.
   */
  async findOne(id: number, currentUser: any): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({ where: { id } });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    // Evitamos el error común de seguridad: Validar que el asesor no acceda a IDs ajenos
    if (currentUser.role === 'agent' && quote.agent !== currentUser.username) {
      // Justificación de seguridad: Respondemos 404 (Not Found) en lugar de 403 para no dar pistas 
      // al atacante de que el ID de la cotización realmente existe en el sistema.
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  /**
   * RN-03: Administra el flujo de estados y las transiciones del negocio de forma estricta.
   */
  async updateStatus(id: number, newStatus: string, rejectionReason: string | undefined, currentUser: any): Promise<Quote> {
    const quote = await this.findOne(id, currentUser); // Reutiliza la lógica de propiedad y existencia anterior
    const targetStatus = newStatus.toUpperCase() as QuoteStatus;
    const currentStatus = quote.status;

    const validStatuses: QuoteStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(targetStatus)) {
      throw new BadRequestException(`"${newStatus}" is not a valid targeted status`);
    }

    // Bloqueo de estados finales (APPROVED y REJECTED no se pueden tocar)
    if (currentStatus === 'APPROVED' || currentStatus === 'REJECTED') {
      throw new ConflictException(`Cannot modify status. Quote ${id} is already in a terminal state (${currentStatus})`);
    }

    // --- EVALUACIÓN DE TRANSICIONES Y PERMISOS ---
    if (currentStatus === 'DRAFT' && targetStatus === 'SENT') {
      // Cualquier rol válido (siempre que sea el dueño en el caso del asesor, validado en findOne) puede enviarla
      quote.status = 'SENT';
    } 
    
    else if (currentStatus === 'SENT' && targetStatus === 'APPROVED') {
      // Restricción: Un asesor nunca aprueba
      if (currentUser.role === 'agent') {
        throw new ForbiddenException('Agents do not have permission to approve quotes');
      }
      quote.status = 'APPROVED';
    } 
    
    else if (currentStatus === 'SENT' && targetStatus === 'REJECTED') {
      // Restricción: Un asesor nunca rechaza
      if (currentUser.role === 'agent') {
        throw new ForbiddenException('Agents do not have permission to reject quotes');
      }

      // Condición adicional: Es obligatorio el motivo de rechazo de mínimo 10 caracteres
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        throw new BadRequestException('A rejection reason of at least 10 characters is mandatory when rejecting a quote');
      }

      quote.status = 'REJECTED';
      quote.rejectionReason = rejectionReason.trim();
    } 
    
    else {
      // Cualquier otro intento de salto de estado (Ej: DRAFT -> APPROVED, SENT -> DRAFT, etc.) es ilegal
      throw new ConflictException(`Invalid status transition from "${currentStatus}" to "${targetStatus}"`);
    }

    // Guardamos la cotización actualizada con su nuevo estado en SQLite
    return await this.quoteRepository.save(quote);
  }
}