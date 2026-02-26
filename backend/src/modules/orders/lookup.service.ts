import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

@Injectable()
export class LookupService {
    private readonly logger = new Logger(LookupService.name);

    constructor(private readonly settingsService: SettingsService) { }

    async lookupExternal(serial: string): Promise<any> {
        const provider = await this.settingsService.findByKey('imei_api_provider');
        const token = await this.settingsService.findByKey('imei_api_token');

        if (!token) {
            this.logger.warn('External IMEI lookup attempted but no token configured.');
            return null;
        }

        try {
            if (provider === 'imei.org') {
                // Mock implementation for imei.org API
                // In a real scenario, we would use their documented endpoint
                const response = await axios.get(`https://api.imei.org/v1/check?token=${token}&imei=${serial}`);
                if (response.data && response.data.success) {
                    return {
                        brand: response.data.device?.brand,
                        model: response.data.device?.model,
                        type: response.data.device?.type || 'Celular'
                    };
                }
            } else if (provider === 'zylalabs') {
                // Mock implementation for Zyla Labs
                const response = await axios.get(`https://zylalabs.com/api/xxx/imei+checker/v1/check?imei=${serial}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return {
                    brand: response.data?.brand,
                    model: response.data?.model,
                    type: 'Celular'
                };
            }

            return null;
        } catch (error) {
            this.logger.error(`Error fetching from external API (${provider}): ${error.message}`);
            return null;
        }
    }
}
