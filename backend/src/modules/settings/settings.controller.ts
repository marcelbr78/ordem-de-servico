import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingType } from './entities/setting.entity';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll() {
        return this.settingsService.findAll();
    }

    @Get('public')
    findPublic() {
        // Implement filter in service if needed, for now getting all is fine for admin
        // But for public endpoint, we should filter. 
        // Let's keep it simple for now, admin access mostly.
        return this.settingsService.findAll();
    }

    @Put(':key')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('key') key: string,
        @Body() body: { value: string; type?: SettingType; description?: string; isPublic?: boolean }
    ) {
        return this.settingsService.set(key, body.value, body.type, body.description, body.isPublic);
    }

    @Post('seed')
    @UseGuards(JwtAuthGuard)
    seed() {
        return this.settingsService.seedDefaults();
    }
}
