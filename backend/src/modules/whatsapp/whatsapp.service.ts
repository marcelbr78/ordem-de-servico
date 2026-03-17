import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { SettingsService } from '../settings/settings.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import axios from 'axios';

const API_TIMEOUT = 120000; // 2 minutes (Render free tier can be slow to wake up)

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    constructor(
        private configService: ConfigService,
        private settingsService: SettingsService,
        @InjectRepository(Tenant)
        private tenantRepo: Repository<Tenant>,
    ) { }

    /** Ping Evolution API every 5 minutes to keep Render free tier awake */
    @Cron('*/5 * * * *')
    async keepEvolutionAlive() {
        try {
            const { apiUrl } = await this.getConfig();
            if (apiUrl) {
                await axios.get(apiUrl, { timeout: 10000, validateStatus: () => true });
                this.logger.debug('Evolution API keep-alive ping OK');
            }
        } catch {
            this.logger.debug('Evolution API keep-alive ping failed (may be waking up)');
        }
    }

    /** Ping this backend's own health endpoint every 5 minutes so Render doesn't sleep it.
     *  Render sets RENDER_EXTERNAL_URL automatically for web services. */
    @Cron('*/5 * * * *')
    async keepBackendAlive() {
        const selfUrl = this.configService.get<string>('RENDER_EXTERNAL_URL');
        if (!selfUrl) return; // only runs on Render
        try {
            await axios.get(`${selfUrl}/health`, { timeout: 10000, validateStatus: () => true });
            this.logger.debug('Backend self keep-alive ping OK');
        } catch {
            this.logger.debug('Backend self keep-alive ping failed');
        }
    }

    /** Resolve config: DB settings take priority, env vars as fallback */
    private async getConfig(tenantId?: string): Promise<{ apiUrl: string; apiKey: string; instance: string }> {
        // URL e Key fixas do servidor — cliente não precisa configurar
        const apiUrl = this.configService.get<string>('EVOLUTION_API_URL')
            || (await (this.settingsService as any).findByKey('whatsapp_api_url', tenantId))
            || '';
        const apiKey = this.configService.get<string>('EVOLUTION_API_KEY')
            || (await (this.settingsService as any).findByKey('whatsapp_api_token', tenantId))
            || '';
        // Instância: específica por tenant para isolamento
        // Nome da instância = subdomain do tenant; fallback = slug do storeName; fallback2 = os4u-{id8}
        let instance = 'instance';
        if (tenantId) {
            const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
            const storeSlug = tenant?.storeName
                ? tenant.storeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 30)
                : '';
            instance = tenant?.subdomain || storeSlug || `os4u-${tenantId.slice(0, 8)}`;
        }
        return { apiUrl, apiKey, instance };
    }

    /** Public method: tells frontend if API is configured */
    async getConfigStatus(tenantId?: string): Promise<{ configured: boolean; hasInstance: boolean; apiUrl?: string; instanceName?: string }> {
        const { apiUrl, apiKey, instance } = await this.getConfig(tenantId);
        return {
            configured: !!(apiUrl && apiKey),
            hasInstance: !!instance,
            apiUrl: apiUrl ? apiUrl.replace(/\/+$/, '') : undefined,
            instanceName: instance,
        };
    }

    /** Ping Evolution API — up to 3 tries × 5s = 15s max */
    private async waitForServer(apiUrl: string): Promise<boolean> {
        this.logger.log(`Checking if WhatsApp server at ${apiUrl} is awake...`);
        for (let i = 0; i < 3; i++) {
            try {
                await axios.get(apiUrl, { timeout: 8000, validateStatus: () => true });
                this.logger.log('WhatsApp server is awake!');
                return true;
            } catch {
                this.logger.debug(`Waiting for server to wake up... (${i + 1}/3)`);
                if (i < 2) await new Promise(r => setTimeout(r, 5000));
            }
        }
        this.logger.warn('WhatsApp server did not respond in time');
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

    async sendButtons(to: string, title: string, description: string, buttons: any[], footer?: string): Promise<void> {
        const { apiUrl, apiKey, instance } = await this.getConfig();

        if (!apiUrl || !apiKey || !instance) {
            this.logger.warn('WhatsApp integration not configured. Skipping buttons.');
            return;
        }

        try {
            const cleanNumber = to.replace(/\D/g, '');
            let resolvedJid = `${cleanNumber}@s.whatsapp.net`;

            // Try to resolve JID
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
                }
            } catch (err) {
                this.logger.warn(`Could not verify number ${cleanNumber} for buttons: ${err.message}`);
            }

            this.logger.log(`Sending WhatsApp Buttons to ${resolvedJid} via instance ${instance}`);

            await axios.post(
                `${apiUrl}/message/sendButtons/${instance}`,
                {
                    number: resolvedJid,
                    title,
                    description,
                    footer: footer || '',
                    buttons,
                },
                {
                    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                    timeout: API_TIMEOUT,
                },
            );
            this.logger.log(`WhatsApp Buttons sent successfully to ${resolvedJid}`);
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp Buttons to ${to}: ${error.message}`);
            // Fallback: If buttons fail, try sending as text
            this.logger.warn(`Falling back to text message for ${to}`);
            let textMsg = `*${title}*\n\n${description}`;
            if (footer) textMsg += `\n\n_${footer}_`;
            for (const b of buttons) {
                if (b.type === 'url') {
                    textMsg += `\n\n🔗 *${b.displayText}:* ${b.url}`;
                } else {
                    textMsg += `\n\n✅ *${b.displayText}*`;
                }
            }
            await this.sendMessage(to, textMsg);
        }
    }

    async sendOSCreated(to: string, protocol: string, equipment: string, statusUrl?: string): Promise<void> {
        const title = '📋 *OS ABERTA*';
        const description = `Olá! Recebemos seu *${equipment}* para análise.\n📝 *Protocolo:* ${protocol}\n\nVocê será avisado por aqui assim que o diagnóstico for concluído.`;

        if (statusUrl) {
            await this.sendButtons(to, title, description, [
                { type: 'url', displayText: '🔍 Ver Status', url: statusUrl }
            ]);
        } else {
            await this.sendMessage(to, `${title}\n\n${description}`);
        }
    }

    async sendBudgetAvailable(to: string, protocol: string): Promise<void> {
        const msg = `📋 *Orçamento Disponível!* \n\nO diagnóstico do seu equipamento (OS: ${protocol}) foi finalizado.\n\nPor favor, entre em contato para aprovação do serviço.`;
        await this.sendMessage(to, msg);
    }

    /** Extracts QR base64 from any Evolution API response shape */
    private extractQR(data: any): string | null {
        return data?.qrcode?.base64
            || data?.qrcode?.urlCode
            || data?.base64
            || data?.urlCode
            || data?.code
            || null;
    }

    /** Checks if instance is already open (connected) */
    private async isInstanceOpen(apiUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
        try {
            const res = await axios.get(
                `${apiUrl}/instance/connectionState/${instanceName}`,
                { headers: { apikey: apiKey }, timeout: 8000, validateStatus: () => true },
            );
            const state = res.data?.instance?.state || res.data?.state || '';
            this.logger.log(`Instance ${instanceName} state: ${state}`);
            return state === 'open';
        } catch {
            return false;
        }
    }

    async createInstance(tenantId?: string): Promise<{ success: boolean; qrcode?: string; alreadyConnected?: boolean; error?: string }> {
        const { apiUrl, apiKey, instance: instanceName } = await this.getConfig(tenantId);

        if (!apiUrl || !apiKey) {
            return { success: false, error: 'API URL e Token não configurados. Contate o suporte.' };
        }

        const isAwake = await this.waitForServer(apiUrl);
        if (!isAwake) {
            return { success: false, error: 'O servidor WhatsApp não respondeu. Tente novamente em instantes.' };
        }

        let alreadyInUse = false;
        let qrFromCreate: string | null = null;

        try {
            const response = await axios.post(
                `${apiUrl}/instance/create`,
                { instanceName, integration: 'WHATSAPP-BAILEYS', qrcode: true },
                {
                    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
                    timeout: 20000,
                    validateStatus: (status) => status < 500,
                },
            );

            this.logger.log(`/instance/create ${instanceName} → HTTP ${response.status}: ${JSON.stringify(response.data).slice(0, 300)}`);

            alreadyInUse =
                response.data?.response?.message?.toString().includes('already in use') ||
                response.data?.message?.toString().includes('already in use');

            if (!alreadyInUse && response.status >= 400) {
                const errMsg = response.data?.response?.message || response.data?.message || `HTTP ${response.status}`;
                return { success: false, error: Array.isArray(errMsg) ? errMsg.join(', ') : String(errMsg) };
            }

            if (!alreadyInUse) {
                // Nova instância — QR vem no próprio response do create
                qrFromCreate = this.extractQR(response.data);
                this.logger.log(`Instance ${instanceName} created, QR in create response: ${!!qrFromCreate}`);
            } else {
                this.logger.log(`Instance ${instanceName} already existed`);
            }
        } catch (error) {
            this.logger.error(`Failed to create instance: ${error.message}`);
            return { success: false, error: error.message };
        }

        // Nome vem do subdomain do tenant — não precisa salvar nas settings

        // QR veio direto do create — retorna imediatamente
        if (qrFromCreate) {
            return { success: true, qrcode: qrFromCreate };
        }

        // Instância já existia: verifica se está conectada ou precisa de novo QR
        if (alreadyInUse) {
            const open = await this.isInstanceOpen(apiUrl, apiKey, instanceName);
            if (open) {
                this.logger.log(`Instance ${instanceName} is already connected (open)`);
                return { success: true, alreadyConnected: true };
            }
        }

        // Não conectada e sem QR no create — tenta /instance/connect
        try {
            const connectRes = await axios.get(
                `${apiUrl}/instance/connect/${instanceName}`,
                { headers: { apikey: apiKey }, timeout: 10000, validateStatus: () => true },
            );
            this.logger.log(`/instance/connect response: ${JSON.stringify(connectRes.data).slice(0, 300)}`);
            const qr = this.extractQR(connectRes.data);
            if (qr) return { success: true, qrcode: qr };
        } catch (e) {
            this.logger.debug(`/instance/connect failed: ${e.message}`);
        }

        // Frontend vai fazer polling de GET /whatsapp/qrcode
        return { success: true };
    }

    /** Check connection status — also returns connected phone number when open */
    async checkConnectionStatus(tenantId?: string): Promise<{ connected: boolean; status: string; number?: string; connectedAt?: string }> {
        const { apiUrl, apiKey, instance } = await this.getConfig(tenantId);

        if (!apiUrl || !apiKey || !instance) {
            return { connected: false, status: 'not_configured' };
        }

        try {
            const response = await axios.get(
                `${apiUrl}/instance/connectionState/${instance}`,
                { headers: { apikey: apiKey }, timeout: 10000, validateStatus: () => true },
            );
            const state = response.data?.instance?.state || response.data?.state || 'unknown';

            if (state !== 'open') {
                return { connected: false, status: state === 'close' ? 'disconnected' : state };
            }

            // Instância conectada — busca o número do WhatsApp vinculado
            let number: string | undefined;
            try {
                const fetchRes = await axios.get(
                    `${apiUrl}/instance/fetchInstances`,
                    { headers: { apikey: apiKey }, timeout: 8000, validateStatus: () => true, params: { instanceName: instance } },
                );
                const instances = Array.isArray(fetchRes.data) ? fetchRes.data : [fetchRes.data];
                const inst = instances.find((i: any) => i.instance?.instanceName === instance);
                const owner: string = inst?.instance?.owner || inst?.instance?.ownerJid || '';
                if (owner) {
                    // Remove @s.whatsapp.net e formata como número brasileiro
                    number = owner.replace('@s.whatsapp.net', '').replace('@c.us', '');
                }
            } catch {}

            // Salva timestamp de conexão nas settings do tenant (primeira vez)
            const savedAt = await this.settingsService.findByKey('whatsapp_connected_at', tenantId);
            if (!savedAt) {
                await this.settingsService.set('whatsapp_connected_at', new Date().toISOString(), undefined, undefined, undefined, tenantId);
            }
            const connectedAt = savedAt || new Date().toISOString();

            return { connected: true, status: 'open', number, connectedAt };
        } catch (error) {
            this.logger.error(`Failed to check WhatsApp status: ${error.message}`);
            return { connected: false, status: 'error' };
        }
    }

    /** Get QR code — called repeatedly by the frontend every 2-3s after createInstance */
    async getQRCode(tenantId?: string): Promise<{ qrcode?: string; status: string; pairingCode?: string }> {
        const { apiUrl, apiKey, instance } = await this.getConfig(tenantId);

        if (!apiUrl || !apiKey || !instance) {
            return { status: 'not_configured' };
        }

        // A. Try /instance/connect (fast, single attempt)
        try {
            const response = await axios.get(
                `${apiUrl}/instance/connect/${instance}`,
                { headers: { apikey: apiKey }, timeout: 10000, validateStatus: () => true },
            );
            this.logger.debug(`getQRCode /connect response: ${JSON.stringify(response.data).slice(0, 300)}`);
            const qr = this.extractQR(response.data);
            if (qr) {
                this.logger.debug('QR obtained from /instance/connect');
                return { qrcode: qr, status: 'ok' };
            }
            // {"count":0} or state=open means already connected
            const state = response.data?.instance?.state || response.data?.state;
            if (state === 'open') return { status: 'connected' };
        } catch (e) {
            this.logger.debug(`/connect failed: ${e.message}`);
        }

        // B. If /connect gave no QR, check actual connection state
        const open = await this.isInstanceOpen(apiUrl, apiKey, instance);
        if (open) return { status: 'connected' };

        // B. Fallback: /fetchInstances
        try {
            const fetchRes = await axios.get(
                `${apiUrl}/instance/fetchInstances`,
                { headers: { apikey: apiKey }, timeout: 10000, validateStatus: () => true, params: { instanceName: instance } },
            );
            const instances = Array.isArray(fetchRes.data) ? fetchRes.data : [fetchRes.data];
            const inst = instances.find((item: any) => item.instance?.instanceName === instance);
            if (inst?.qrcode?.base64) {
                return { qrcode: inst.qrcode.base64, status: 'ok' };
            }
        } catch (e) {
            this.logger.debug(`/fetchInstances failed: ${e.message}`);
        }

        return { status: 'waiting' };
    }

    /** Disconnect and delete instance */
    async disconnectInstance(tenantId?: string): Promise<{ success: boolean; error?: string }> {
        const { apiUrl, apiKey, instance } = await this.getConfig(tenantId);

        if (!apiUrl || !apiKey || !instance) {
            return { success: false, error: 'Não configurado' };
        }

        try {
            await axios.delete(
                `${apiUrl}/instance/logout/${instance}`,
                { headers: { apikey: apiKey }, timeout: API_TIMEOUT },
            );
            this.logger.log(`Instance ${instance} logged out`);
            // Limpa timestamp de conexão para mostrar corretamente na próxima conexão
            await this.settingsService.delete('whatsapp_connected_at', tenantId).catch(() => {});
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to logout instance: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /** Apaga o nome de instância salvo para que o sistema gere um novo */
    async resetInstance(tenantId?: string): Promise<{ success: boolean }> {
        try {
            await this.settingsService.delete('whatsapp_instance_name', tenantId);
            // Também tenta apagar o registro global (legado sem tenantId)
            await this.settingsService.delete('whatsapp_instance_name');
        } catch {}
        this.logger.log(`Instance name reset for tenant ${tenantId}`);
        return { success: true };
    }

    /** Send a test message */
    async sendTestMessage(to: string, tenantId?: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.sendMessage(to, '🧪 *Mensagem de Teste*\n\nSua integração WhatsApp está funcionando corretamente! ✅');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
