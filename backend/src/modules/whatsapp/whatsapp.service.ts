import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

const API_TIMEOUT = 120000; // 2 minutes (Render free tier can be slow to wake up)

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    constructor(
        private configService: ConfigService,
        private settingsService: SettingsService,
    ) { }

    /** Ping Evolution API every 10 minutes to keep Render awake */
    @Cron('*/10 * * * *')
    async keepAlive() {
        try {
            const { apiUrl } = await this.getConfig();
            if (apiUrl) {
                await axios.get(apiUrl, { timeout: 10000 });
                this.logger.debug('Evolution API keep-alive ping OK');
            }
        } catch {
            this.logger.debug('Evolution API keep-alive ping (may be waking up)');
        }
    }

    /** Resolve config: DB settings take priority, env vars as fallback */
    private async getConfig(): Promise<{ apiUrl: string; apiKey: string; instance: string }> {
        const apiUrl = (await this.settingsService.findByKey('whatsapp_api_url')) || this.configService.get<string>('EVOLUTION_API_URL') || '';
        const apiKey = (await this.settingsService.findByKey('whatsapp_api_token')) || this.configService.get<string>('EVOLUTION_API_KEY') || '';
        const instance = (await this.settingsService.findByKey('whatsapp_instance_name')) || this.configService.get<string>('EVOLUTION_INSTANCE_ID') || '';
        return { apiUrl, apiKey, instance };
    }

    /** Public method: tells frontend if API is configured */
    async getConfigStatus(): Promise<{ configured: boolean; hasInstance: boolean; apiUrl?: string; instanceName?: string }> {
        const { apiUrl, apiKey, instance } = await this.getConfig();
        return {
            configured: !!(apiUrl && apiKey),
            hasInstance: !!instance,
            apiUrl: apiUrl ? apiUrl.replace(/\/+$/, '') : undefined,
            instanceName: instance,
        };
    }

    /** Helper to wait for Render server to wake up */
    private async waitForServer(apiUrl: string): Promise<boolean> {
        this.logger.log(`Checking if WhatsApp server at ${apiUrl} is awake...`);
        for (let i = 0; i < 15; i++) { // Try for 75 seconds (15 * 5s)
            try {
                await axios.get(apiUrl, { timeout: 5000 });
                this.logger.log('WhatsApp server is awake!');
                return true;
            } catch (error) {
                this.logger.debug(`Waiting for server to wake up... (${i + 1}/15)`);
                await new Promise(r => setTimeout(r, 5000));
            }
        }
        this.logger.error('WhatsApp server failed to wake up after multiple attempts');
        return false;
    }

    async sendMessage(to: string, message: string): Promise<void> {
        const { apiUrl, apiKey, instance } = await this.getConfig();

        if (!apiUrl || !apiKey || !instance) {
            this.logger.warn('WhatsApp integration not configured. Skipping message.');
            return;
        }

        try {
            const cleanNumber = to.replace(/\D/g, '');

            // Resolve the correct WhatsApp JID (handles Brazilian 9th digit removal)
            let resolvedJid = `${cleanNumber}@s.whatsapp.net`;
            try {
                const checkRes = await axios.post(
                    `${apiUrl}/chat/whatsappNumbers/${instance}`,
                    { numbers: [cleanNumber] },
                    {
                        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                        timeout: 15000,
                    },
                );
                const result = Array.isArray(checkRes.data) ? checkRes.data[0] : null;
                if (result?.exists && result?.jid) {
                    resolvedJid = result.jid;
                    this.logger.log(`Number ${cleanNumber} resolved to JID: ${resolvedJid}`);
                } else {
                    this.logger.warn(`Number ${cleanNumber} not found on WhatsApp (exists: ${result?.exists}). Trying anyway...`);
                }
            } catch (checkErr) {
                this.logger.warn(`Could not verify number ${cleanNumber}: ${checkErr.message}. Sending anyway...`);
            }

            this.logger.log(`Sending WhatsApp to ${resolvedJid} via instance ${instance}`);

            await axios.post(
                `${apiUrl}/message/sendText/${instance}`,
                {
                    number: resolvedJid,
                    options: {
                        delay: 1200,
                        presence: 'composing',
                        linkPreview: false,
                    },
                    textMessage: {
                        text: message,
                    },
                },
                {
                    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                    timeout: API_TIMEOUT,
                },
            );
            this.logger.log(`WhatsApp sent successfully to ${resolvedJid}`);
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp to ${to}: ${error.message}`);
            if (error.response?.data) {
                this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    async sendOSCreated(to: string, protocol: string, equipment: string): Promise<void> {
        const msg = `✅ *Ordem de Serviço Aberta!* \n\nOlá! Recebemos seu *${equipment}* para análise.\n📝 *Protocolo:* ${protocol}\n\nVocê será avisado por aqui assim que o diagnóstico for concluído.`;
        await this.sendMessage(to, msg);
    }

    async sendBudgetAvailable(to: string, protocol: string): Promise<void> {
        const msg = `📋 *Orçamento Disponível!* \n\nO diagnóstico do seu equipamento (OS: ${protocol}) foi finalizado.\n\nPor favor, entre em contato para aprovação do serviço.`;
        await this.sendMessage(to, msg);
    }

    /** Create a new instance on Evolution API */
    async createInstance(instanceName: string, number?: string): Promise<{ success: boolean; instance?: any; qrcode?: string; error?: string }> {
        const { apiUrl, apiKey } = await this.getConfig();

        if (!apiUrl || !apiKey) {
            return { success: false, error: 'API URL e Token não configurados. Contate o suporte.' };
        }

        // Wait for server to wake up
        const isAwake = await this.waitForServer(apiUrl);
        if (!isAwake) {
            return { success: false, error: 'O servidor WhatsApp não respondeu. Tente novamente em alguns instantes.' };
        }

        try {
            const response = await axios.post(
                `${apiUrl}/instance/create`,
                {
                    instanceName,
                    integration: 'WHATSAPP-BAILEYS',
                    qrcode: true,
                    number: number ? number.replace(/\D/g, '') : undefined,
                },
                {
                    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                    timeout: 30000,
                },
            );

            // Save instance name in settings
            await this.settingsService.set('whatsapp_instance_name', instanceName);

            this.logger.log(`Instance ${instanceName} created`);

            // Extract QR code from create response (v2.2.3 returns it here)
            const qrcode = response.data?.qrcode?.base64 || response.data?.hash || null;

            return { success: true, instance: response.data, qrcode };
        } catch (error) {
            this.logger.error(`Failed to create instance: ${error.message}`);
            const errMsg = error.response?.data?.response?.message || error.response?.data?.message || error.message;
            return { success: false, error: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg };
        }
    }

    /** Check connection status of the Evolution API instance */
    async checkConnectionStatus(): Promise<{ connected: boolean; status: string; number?: string; details?: any }> {
        const { apiUrl, apiKey, instance } = await this.getConfig();

        if (!apiUrl || !apiKey || !instance) {
            return { connected: false, status: 'not_configured' };
        }

        try {
            const response = await axios.get(
                `${apiUrl}/instance/connectionState/${instance}`,
                { headers: { apikey: apiKey }, timeout: API_TIMEOUT },
            );
            const state = response.data?.instance?.state || response.data?.state || 'unknown';

            // Handle specific case where instance exists but is disconnected/closed
            if (state === 'close') {
                return { connected: false, status: 'disconnected', details: response.data };
            }

            return {
                connected: state === 'open',
                status: state,
                details: response.data,
            };
        } catch (error) {
            this.logger.error(`Failed to check WhatsApp status: ${error.message}`);
            return { connected: false, status: 'error', details: error.message };
        }
    }

    /** Get QR code for pairing */
    async getQRCode(): Promise<{ qrcode?: string; status: string; pairingCode?: string }> {
        const { apiUrl, apiKey, instance } = await this.getConfig();

        if (!apiUrl || !apiKey || !instance) {
            return { status: 'not_configured' };
        }

        // Wait for server to wake up
        await this.waitForServer(apiUrl);

        try {
            // Try /instance/connect first (v2.2.3)
            // Retry logic: The QR might not be ready immediately after create
            for (let i = 0; i < 10; i++) {
                // A. Try /connect endpoint
                try {
                    const response = await axios.get(
                        `${apiUrl}/instance/connect/${instance}`,
                        { headers: { apikey: apiKey }, timeout: API_TIMEOUT },
                    );

                    const qr = response.data?.qrcode?.base64 || response.data?.base64 || response.data?.urlCode;
                    if (qr) {
                        return { qrcode: qr, pairingCode: response.data?.pairingCode || null, status: 'ok' };
                    }
                    this.logger.debug(`Attempt ${i + 1}: No QR from /connect (${JSON.stringify(response.data)})`);
                } catch (e) {
                    this.logger.debug(`Attempt ${i + 1}: /connect failed (${e.message})`);
                }

                // B. Try /fetchInstances endpoint (Fallback)
                try {
                    const fetchRes = await axios.get(
                        `${apiUrl}/instance/fetchInstances`,
                        { headers: { apikey: apiKey }, timeout: API_TIMEOUT, params: { instanceName: instance } },
                    );
                    const instances = Array.isArray(fetchRes.data) ? fetchRes.data : [fetchRes.data];
                    const inst = instances.find((item: any) => item.instance?.instanceName === instance);

                    if (inst?.qrcode?.base64) {
                        return { qrcode: inst.qrcode.base64, status: 'ok' };
                    }
                    this.logger.debug(`Attempt ${i + 1}: No QR from /fetchInstances (Status: ${inst?.instance?.status})`);
                } catch (e) {
                    this.logger.debug(`Attempt ${i + 1}: /fetchInstances failed (${e.message})`);
                }

                // Wait before retrying
                await new Promise(r => setTimeout(r, 3000));
            }

            return { status: 'waiting', pairingCode: null };
        } catch (error) {
            // 404 implies instance doesn't exist or is improperly configured
            if (error.response?.status === 404) {
                return { status: 'disconnected' }; // Prompt frontend to create again
            }
            this.logger.error(`Failed to get QR code: ${error.message}`);
            return { status: 'error' };
        }
    }

    /** Disconnect and delete instance */
    async disconnectInstance(): Promise<{ success: boolean; error?: string }> {
        const { apiUrl, apiKey, instance } = await this.getConfig();

        if (!apiUrl || !apiKey || !instance) {
            return { success: false, error: 'Não configurado' };
        }

        try {
            await axios.delete(
                `${apiUrl}/instance/logout/${instance}`,
                { headers: { apikey: apiKey }, timeout: API_TIMEOUT },
            );
            this.logger.log(`Instance ${instance} logged out`);
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to logout instance: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /** Send a test message */
    async sendTestMessage(to: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.sendMessage(to, '🧪 *Mensagem de Teste*\n\nSua integração WhatsApp está funcionando corretamente! ✅');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
