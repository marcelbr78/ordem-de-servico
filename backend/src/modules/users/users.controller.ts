import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';
// import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    //   @Roles(UserRole.ADMIN)
    create(@Body() createUserDto: CreateUserDto, @Request() req) {
        return this.usersService.create({ ...createUserDto, tenantId: req.user?.tenantId });
    }

    @Get()
    findAll(@Request() req) {
        // Obter o tenantId do usuário logado (via JWT)
        // Se for Super Admin sem tenantId fixo, ele verá os usuários globais (sem tenantId)
        // Mas a regra principal aqui é esconder o Super Admin da lista da loja.
        const { tenantId } = req.user;
        return this.usersService.findAll(tenantId, true);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.usersService.findOne(id, req.user?.tenantId);
    }

    @Patch(':id')
    //   @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
        return this.usersService.update(id, updateUserDto, req.user?.tenantId);
    }

    @Post(':id/reset-password')
    async resetPassword(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        // Gerar senha temporária aleatória de 8 chars
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let tempPassword = '';
        for (let i = 0; i < 8; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        await this.usersService.changePassword(id, tempPassword, tenantId);
        // Forçar troca no próximo login
        await this.usersService.update(id, { mustChangePassword: true } as any, tenantId);
        return { tempPassword, message: 'Senha temporária gerada. O usuário deverá trocar no próximo acesso.' };
    }

    //   @Delete(':id')
    //   @Roles(UserRole.ADMIN)
    //   remove(@Param('id') id: string) {
    //     return this.usersService.remove(id);
    //   }
}
