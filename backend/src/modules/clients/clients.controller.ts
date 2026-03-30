import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ContactsService } from './contacts.service';
import { ClientOsHistoryService } from './client-os-history.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permissions.enum';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
    constructor(
        private readonly clientsService: ClientsService,
        private readonly contactsService: ContactsService,
        private readonly osHistoryService: ClientOsHistoryService,
    ) { }

    // ─── Clientes ──────────────────────────────────

    @Post()
    @RequirePermissions(Permission.CLIENT_CREATE)
    create(@Body() createClientDto: CreateClientDto, @Req() req) {
        return this.clientsService.create(createClientDto, req.user?.tenantId);
    }

    @Get()
    @RequirePermissions(Permission.CLIENT_READ)
    findAll(
        @Query('search') search?: string,
        @Query('tipo') tipo?: string,
        @Query('status') status?: string,
        @Req() req?: any,
    ) {
        return this.clientsService.findAll(search, tipo, status, req?.user?.tenantId);
    }

    @Get(':id')
    @RequirePermissions(Permission.CLIENT_READ)
    findOne(@Param('id') id: string, @Req() req) {
        return this.clientsService.findOne(id, req.user?.tenantId);
    }

    @Patch(':id')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.clientsService.update(id, updateClientDto, tenantId);
    }

    @Delete(':id')
    @RequirePermissions(Permission.CLIENT_DELETE)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        await this.clientsService.softDelete(id, tenantId);
    }

    @Patch(':id/reactivate')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    reactivate(@Param('id') id: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.clientsService.reactivate(id, tenantId);
    }

    // ─── Contatos ──────────────────────────────────

    @Get(':id/contacts')
    @RequirePermissions(Permission.CLIENT_READ)
    async findContacts(@Param('id') id: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        await this.clientsService.findOne(id, tenantId); // valida ownership
        return this.contactsService.findAllByClient(id);
    }

    @Post(':id/contacts')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    async createContact(
        @Param('id') id: string,
        @Body() dto: CreateContactDto,
        @Req() req,
    ) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        await this.clientsService.findOne(id, tenantId); // valida ownership
        return this.contactsService.create(id, dto);
    }

    @Patch(':id/contacts/:contactId')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    async updateContact(
        @Param('id') id: string,
        @Param('contactId') contactId: string,
        @Body() dto: UpdateContactDto,
        @Req() req,
    ) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        await this.clientsService.findOne(id, tenantId); // valida ownership
        return this.contactsService.update(id, contactId, dto);
    }

    @Delete(':id/contacts/:contactId')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeContact(
        @Param('id') id: string,
        @Param('contactId') contactId: string,
        @Req() req,
    ) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        await this.clientsService.findOne(id, tenantId); // valida ownership
        await this.contactsService.remove(id, contactId);
    }

    // ─── Histórico de OS ───────────────────────────

    @Get(':id/os-history')
    @RequirePermissions(Permission.CLIENT_READ)
    findOsHistory(@Param('id') id: string) {
        return this.osHistoryService.findByClient(id);
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string, @Req() req: any) {
        return this.clientsService.getClientStats(id, req.user?.tenantId);
    }
    @Post('import')
    async importClients(@Body() body: { data: any[] }, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        let imported = 0;
        const erros: string[] = [];
        for (const row of (body.data || [])) {
            try {
                if (!row.nome && !row.name) continue;
                await this.clientsService.create({
                    name: row.nome || row.name,
                    phone: row.telefone || row.phone || '',
                    email: row.email || '',
                    cpf: row.cpf || '',
                    address: row.endereco || row.address || '',
                    city: row.cidade || row.city || '',
                    notes: row.observacoes || row.notes || '',
                    tenantId,
                } as any);
                imported++;
            } catch (e: any) {
                erros.push(e.message);
            }
        }
        return { imported, errors: erros.length, details: erros.slice(0, 5) };
    }
}
