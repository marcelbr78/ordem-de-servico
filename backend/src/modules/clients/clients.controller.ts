import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permissions.enum';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Protegendo com JWT e Permissões
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    @RequirePermissions(Permission.CLIENT_CREATE)
    create(@Body() createClientDto: CreateClientDto) {
        return this.clientsService.create(createClientDto);
    }

    @Get()
    @RequirePermissions(Permission.CLIENT_READ)
    findAll() {
        return this.clientsService.findAll();
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
    remove(@Param('id') id: string) {
        return this.clientsService.remove(id);
    }
}
