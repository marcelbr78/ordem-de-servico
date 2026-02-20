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
    create(@Body() createClientDto: CreateClientDto) {
        return this.clientsService.create(createClientDto);
    }

    @Get()
    @RequirePermissions(Permission.CLIENT_READ)
    findAll(
        @Query('search') search?: string,
        @Query('tipo') tipo?: string,
        @Query('status') status?: string,
    ) {
        return this.clientsService.findAll(search, tipo, status);
    }

    @Get(':id')
    @RequirePermissions(Permission.CLIENT_READ)
    findOne(@Param('id') id: string) {
        return this.clientsService.findOne(id);
    }

    @Patch(':id')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
        return this.clientsService.update(id, updateClientDto);
    }

    @Delete(':id')
    @RequirePermissions(Permission.CLIENT_DELETE)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.clientsService.softDelete(id);
    }

    @Patch(':id/reactivate')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    reactivate(@Param('id') id: string) {
        return this.clientsService.reactivate(id);
    }

    // ─── Contatos ──────────────────────────────────

    @Get(':id/contacts')
    @RequirePermissions(Permission.CLIENT_READ)
    findContacts(@Param('id') id: string) {
        return this.contactsService.findAllByClient(id);
    }

    @Post(':id/contacts')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    createContact(
        @Param('id') id: string,
        @Body() dto: CreateContactDto,
    ) {
        return this.contactsService.create(id, dto);
    }

    @Patch(':id/contacts/:contactId')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    updateContact(
        @Param('id') id: string,
        @Param('contactId') contactId: string,
        @Body() dto: UpdateContactDto,
    ) {
        return this.contactsService.update(id, contactId, dto);
    }

    @Delete(':id/contacts/:contactId')
    @RequirePermissions(Permission.CLIENT_UPDATE)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeContact(
        @Param('id') id: string,
        @Param('contactId') contactId: string,
    ) {
        await this.contactsService.remove(id, contactId);
    }

    // ─── Histórico de OS ───────────────────────────

    @Get(':id/os-history')
    @RequirePermissions(Permission.CLIENT_READ)
    findOsHistory(@Param('id') id: string) {
        return this.osHistoryService.findByClient(id);
    }
}
