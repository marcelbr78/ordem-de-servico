import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting, SettingType } from './entities/setting.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
    ) { }

    async findAll(): Promise<SystemSetting[]> {
        return this.settingsRepository.find();
    }

    async findByKey(key: string): Promise<string> {
        const setting = await this.settingsRepository.findOne({ where: { key } });
        if (!setting) return null;
        return setting.value;
    }

    async set(key: string, value: string, type: SettingType = SettingType.STRING, description?: string, isPublic: boolean = false): Promise<SystemSetting> {
        let setting = await this.settingsRepository.findOne({ where: { key } });

        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
            setting.isPublic = isPublic;
        } else {
            setting = this.settingsRepository.create({
                key,
                value,
                type,
                description,
                isPublic
            });
        }

        return this.settingsRepository.save(setting);
    }

    async seedDefaults() {
        const defaults = [
            { key: 'os_primary_color', value: '#000000', type: SettingType.STRING, description: 'Cor principal da OS', isPublic: true },
            { key: 'os_secondary_color', value: '#ffffff', type: SettingType.STRING, description: 'Cor secundária da OS', isPublic: true },
            { key: 'company_name', value: 'Minha Assistência', type: SettingType.STRING, description: 'Nome da Empresa', isPublic: true },
            { key: 'whatsapp_api_url', value: 'https://api.evolution.com', type: SettingType.STRING, description: 'URL da Evolution API', isPublic: false },
            { key: 'whatsapp_api_token', value: '', type: SettingType.STRING, description: 'Token da Evolution API', isPublic: false },
            { key: 'whatsapp_instance_name', value: 'instance', type: SettingType.STRING, description: 'Nome da Instância WhatsApp', isPublic: false },
            {
                key: 'os_custom_workflow',
                value: JSON.stringify({
                    labels: {
                        'aberta': 'Aberta',
                        'em_diagnostico': 'Em Diagnóstico',
                        'aguardando_aprovacao': 'Aguardando Aprovação',
                        'aguardando_peca': 'Aguardando Peça',
                        'em_reparo': 'Em Bancada / Realizando Reparo',
                        'testes': 'Testes',
                        'finalizada': 'Finalizada',
                        'entregue': 'Entregue',
                        'cancelada': 'Cancelada'
                    },
                    flow: {
                        'aberta': ['em_diagnostico', 'cancelada'],
                        'em_diagnostico': ['aguardando_aprovacao', 'aguardando_peca', 'cancelada'],
                        'aguardando_aprovacao': ['aguardando_peca', 'em_reparo', 'cancelada'],
                        'aguardando_peca': ['em_reparo', 'aguardando_aprovacao'],
                        'em_reparo': ['testes', 'aguardando_peca'],
                        'testes': ['finalizada', 'em_reparo'],
                        'finalizada': ['entregue', 'em_reparo'],
                        'entregue': [],
                        'cancelada': []
                    }
                }),
                type: SettingType.JSON,
                description: 'Configuração de fluxo e labels de status da OS',
                isPublic: true
            },
            {
                key: 'service_terms',
                value: "1. GARANTIA\\n- A garantia é de 90 (noventa) dias, cobrindo exclusivamente o serviço executado e as peças substituídas descritas nesta Ordem de Serviço.\\n- O prazo de garantia inicia-se na data de retirada do equipamento.\\n\\n2. PERDA DA GARANTIA\\nA garantia será automaticamente anulada em casos de:\\n- Mau uso, quedas, ou danos físicos posteriores à entrega.\\n- Contato com líquidos ou oxidação.\\n- Rompimento do selo de garantia.\\n- Tentativa de reparo ou abertura do aparelho por terceiros.\\n\\n3. ABANDONO\\n- Equipamentos não retirados no prazo de 90 dias após a notificação de 'Pronto' ou 'Orçamento Reprovado' serão considerados abandonados.\\n- A empresa poderá dar a destinação que julgar conveniente para custear as despesas de armazenamento e peças, conforme Art. 1.275 do Código Civil.\\n\\n4. BACKUP E DADOS\\n- A empresa não se responsabiliza pela perda de dados (fotos, contatos, arquivos) durante o processo de reparo. Recomenda-se realizar backup antes de deixar o aparelho.\\n\\nDeclaro estar de acordo com os termos acima e ter recebido o aparelho testado e em perfeitas condições de funcionamento.",
                type: SettingType.STRING,
                description: 'Termo de Garantia e Entrega (visível na impressão)',
                isPublic: true
            }
        ];

        for (const def of defaults) {
            const exists = await this.settingsRepository.findOne({ where: { key: def.key } });
            if (!exists) {
                await this.set(def.key, def.value, def.type, def.description, def.isPublic);
            }
        }
    }
}
