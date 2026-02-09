import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private readonly apiUrl: string;
    private readonly apiKey: string;
    private readonly instance: string;

    constructor(private configService: ConfigService) {
        this.apiUrl = this.configService.get<string>('EVOLUTION_API_URL');
        this.apiKey = this.configService.get<string>('EVOLUTION_API_KEY');
        this.instance = this.configService.get<string>('EVOLUTION_INSTANCE_ID');
    }

    async sendMessage(to: string, message: string): Promise<void> {
        if (!this.apiUrl || !this.apiKey || !this.instance) {
            this.logger.warn('WhatsApp integration not configured. Skipping message.');
            return;
        }

        try {
            // Remover caracteres não numéricos do WhatsApp
            const remoteJid = `${to.replace(/\D/g, '')}@s.whatsapp.net`;

            await axios.post(
                `${this.apiUrl}/message/sendText/${this.instance}`,
                {
                    number: remoteJid,
                    options: {
                        delay: 1200,
                        presence: 'composing',
                        linkPreview: false,
                    },
                    text: message,
                },
                {
                    headers: {
                        apikey: this.apiKey,
                        'Content-Type': 'application/json',
                    },
                },
            );
            this.logger.log(`WhatsApp sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp to ${to}: ${error.message}`);
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
}
