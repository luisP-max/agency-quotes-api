import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiSecurity, ApiTags, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto.js';
import { ApiKeyGuard } from '../auth/guards/api-key.guard.js';
import { IdentityGuard } from '../auth/guards/identity.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Quotes Management') // Organiza el módulo en la UI de Swagger
@ApiSecurity('x-api-key')    // Activa la autenticación por API Key en la UI
@ApiSecurity('x-user')
@Controller('quotes')
@UseGuards(ApiKeyGuard, IdentityGuard, RolesGuard) // RN-05: Orden estricto de ejecución ejecutado por NestJS
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  async create(
    @Body() createQuoteDto: CreateQuoteDto,
    @CurrentUser() currentUser: any,
  ) {
    return await this.quotesService.create(createQuoteDto, currentUser);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter quotes by status (DRAFT, SENT, etc.)' })
  async findAll(
    @CurrentUser() currentUser: any,
    @Query('status') statusFilter?: string,
  ) {
    return await this.quotesService.findAll(currentUser, statusFilter);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number, // RN-06: Valida que el ID sea numérico para evitar un 500
    @CurrentUser() currentUser: any,
  ) {
    return await this.quotesService.findOne(id, currentUser);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuoteStatusDto: UpdateQuoteStatusDto,
    @CurrentUser() currentUser: any,
  ) {
    return await this.quotesService.updateStatus(
      id,
      updateQuoteStatusDto.status,
      updateQuoteStatusDto.rejectionReason,
      currentUser,
    );
  }
}
