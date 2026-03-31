import { Controller, Get, Post, Body, Param, UseGuards, Put, Request, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingType } from './entities/setting.entity';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Request() req) {
        const tenantId = req.user?.tenantId;
        const settings = await this.settingsService.findAll(tenantId);
        // Seed defaults na primeira vez que o tenant acessa
        if (tenantId && settings.length === 0) {
            await this.settingsService.seedDefaults(tenantId);
            return this.settingsService.findAll(tenantId);
        }
        return settings;
    }

    @Get('public')
    @UseGuards(JwtAuthGuard)
    findPublic(@Request() req) {
        const tenantId = req.user?.tenantId;
        return this.settingsService.findAll(tenantId);
    }

    @Get(':key')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('key') key: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        const value = await this.settingsService.findByKey(key, tenantId);
        if (value === null) throw new NotFoundException(`Setting '${key}' not found`);
        return { key, value };
    }

    // Compatibilidade: POST /settings com { key, value } no body
    @Post()
    @UseGuards(JwtAuthGuard)
    upsert(
        @Body() body: { key: string; value: string; type?: SettingType; description?: string; isPublic?: boolean },
        @Request() req,
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado — settings não podem ser salvas sem tenant');
        return this.settingsService.set(body.key, body.value, body.type, body.description, body.isPublic, tenantId);
    }

    @Put(':key')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('key') key: string,
        @Body() body: { value: string; type?: SettingType; description?: string; isPublic?: boolean },
        @Request() req,
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado — settings não podem ser salvas sem tenant');
        return this.settingsService.set(key, body.value, body.type, body.description, body.isPublic, tenantId);
    }

    @Post('seed')
    @UseGuards(JwtAuthGuard)
    seed(@Request() req) {
        return this.settingsService.seedDefaults(req.user?.tenantId);
    }
}
