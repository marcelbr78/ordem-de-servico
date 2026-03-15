import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting, SettingType } from './entities/setting.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
    ) {}

    async findAll(): Promise<SystemSetting[]> {
        return this.settingsRepository.find({ order: { key: 'ASC' } });
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
            setting = this.settingsRepository.create({ key, value, type, description, isPublic });
        }
        return this.settingsRepository.save(setting);
    }

    async delete(key: string): Promise<void> {
        await this.settingsRepository.delete({ key });
    }

    async seedDefaults() {
        const defaults: { key: string; value: string; type: SettingType; description: string; isPublic: boolean }[] = [
            // ── Empresa ──────────────────────────────────────────────────
            { key: 'company_name',                value: 'Minha Assistência',  type: SettingType.STRING, description: 'Razão Social', isPublic: true },
            { key: 'company_fantasy_name',         value: '',                   type: SettingType.STRING, description: 'Nome Fantasia', isPublic: true },
            { key: 'company_cnpj',                 value: '',                   type: SettingType.STRING, description: 'CNPJ', isPublic: false },
            { key: 'company_ie',                   value: '',                   type: SettingType.STRING, description: 'Inscrição Estadual', isPublic: false },
            { key: 'company_im',                   value: '',                   type: SettingType.STRING, description: 'Inscrição Municipal', isPublic: false },
            { key: 'company_phone',                value: '',                   type: SettingType.STRING, description: 'Telefone/WhatsApp', isPublic: true },
            { key: 'company_email',                value: '',                   type: SettingType.STRING, description: 'E-mail', isPublic: true },
            { key: 'company_website',              value: '',                   type: SettingType.STRING, description: 'Website', isPublic: true },
            { key: 'company_url',                  value: '',                   type: SettingType.STRING, description: 'URL do Sistema', isPublic: true },
            { key: 'company_address_street',       value: '',                   type: SettingType.STRING, description: 'Rua', isPublic: true },
            { key: 'company_address_number',       value: '',                   type: SettingType.STRING, description: 'Número', isPublic: true },
            { key: 'company_address_complement',   value: '',                   type: SettingType.STRING, description: 'Complemento', isPublic: true },
            { key: 'company_address_neighborhood', value: '',                   type: SettingType.STRING, description: 'Bairro', isPublic: true },
            { key: 'company_address_city',         value: '',                   type: SettingType.STRING, description: 'Cidade', isPublic: true },
            { key: 'company_address_state',        value: 'SC',                 type: SettingType.STRING, description: 'Estado', isPublic: true },
            { key: 'company_address_zip',          value: '',                   type: SettingType.STRING, description: 'CEP', isPublic: true },
            { key: 'company_logo_url',             value: '',                   type: SettingType.STRING, description: 'URL do Logotipo', isPublic: true },
            { key: 'company_opening_hours',        value: 'Seg-Sex 9h-18h | Sáb 9h-13h', type: SettingType.STRING, description: 'Horário de Atendimento', isPublic: true },
            // ── Fluxo de OS ──────────────────────────────────────────────
            { key: 'os_primary_color',             value: '#3b82f6',            type: SettingType.STRING, description: 'Cor principal da OS', isPublic: true },
            { key: 'os_secondary_color',           value: '#7c3aed',            type: SettingType.STRING, description: 'Cor secundária da OS', isPublic: true },
            { key: 'os_warranty_days',             value: '90',                 type: SettingType.STRING, description: 'Dias de garantia padrão', isPublic: true },
            { key: 'os_protocol_prefix',           value: '',                   type: SettingType.STRING, description: 'Prefixo do protocolo (ex: AT)', isPublic: true },
            { key: 'os_require_checklist',         value: 'false',              type: SettingType.BOOLEAN, description: 'Exigir checklist de entrada', isPublic: false },
            { key: 'os_require_photos_entry',      value: 'false',              type: SettingType.BOOLEAN, description: 'Exigir fotos na entrada', isPublic: false },
            { key: 'os_require_photos_exit',       value: 'false',              type: SettingType.BOOLEAN, description: 'Exigir fotos na saída', isPublic: false },
            { key: 'os_allow_partial_delivery',    value: 'false',              type: SettingType.BOOLEAN, description: 'Permitir entrega parcial sem pagamento', isPublic: false },
            { key: 'os_auto_budget_notify',        value: 'true',               type: SettingType.BOOLEAN, description: 'Notificar cliente automaticamente no orçamento', isPublic: false },
            { key: 'os_max_open_days',             value: '30',                 type: SettingType.STRING, description: 'Dias máximos de OS aberta antes de alerta', isPublic: false },
            // ── Impressão ────────────────────────────────────────────────
            { key: 'print_format',                 value: 'a4',                 type: SettingType.STRING, description: 'Formato de impressão', isPublic: false },
            { key: 'print_show_cnpj',              value: 'true',               type: SettingType.BOOLEAN, description: 'Mostrar CNPJ na impressão', isPublic: false },
            { key: 'print_show_address',           value: 'true',               type: SettingType.BOOLEAN, description: 'Mostrar endereço', isPublic: false },
            { key: 'print_show_phone',             value: 'true',               type: SettingType.BOOLEAN, description: 'Mostrar telefone', isPublic: false },
            { key: 'print_show_logo',              value: 'true',               type: SettingType.BOOLEAN, description: 'Mostrar logo', isPublic: false },
            { key: 'print_show_signatures',        value: 'true',               type: SettingType.BOOLEAN, description: 'Mostrar assinaturas', isPublic: false },
            { key: 'print_show_checklist',         value: 'true',               type: SettingType.BOOLEAN, description: 'Mostrar checklist', isPublic: false },
            { key: 'print_show_financials',        value: 'true',               type: SettingType.BOOLEAN, description: 'Mostrar valores', isPublic: false },
            { key: 'print_header_text',            value: '',                   type: SettingType.STRING, description: 'Texto do cabeçalho', isPublic: false },
            { key: 'print_footer_text',            value: '',                   type: SettingType.STRING, description: 'Texto do rodapé', isPublic: false },
            { key: 'print_copies',                 value: '1',                  type: SettingType.STRING, description: 'Número de vias', isPublic: false },
            // ── Financeiro ───────────────────────────────────────────────
            { key: 'finance_payment_methods',      value: JSON.stringify(['Dinheiro','PIX','Cartão de Crédito','Cartão de Débito','Transferência','Cheque']), type: SettingType.JSON, description: 'Formas de pagamento', isPublic: false },
            { key: 'finance_cost_centers',         value: JSON.stringify(['Serviços','Peças','Despesas Gerais','Salários','Aluguel','Marketing']), type: SettingType.JSON, description: 'Centros de custo', isPublic: false },
            { key: 'finance_default_payment',      value: 'PIX',                type: SettingType.STRING, description: 'Forma de pagamento padrão', isPublic: false },
            { key: 'finance_require_payment_os',   value: 'false',              type: SettingType.BOOLEAN, description: 'Exigir pagamento ao entregar OS', isPublic: false },
            { key: 'finance_pix_key',              value: '',                   type: SettingType.STRING, description: 'Chave PIX', isPublic: true },
            { key: 'finance_pix_key_type',         value: 'cpf',                type: SettingType.STRING, description: 'Tipo da chave PIX', isPublic: false },
            // ── Notificações ─────────────────────────────────────────────
            { key: 'notif_wa_os_created',          value: 'true',               type: SettingType.BOOLEAN, description: 'WA: OS criada', isPublic: false },
            { key: 'notif_wa_status_change',       value: 'true',               type: SettingType.BOOLEAN, description: 'WA: mudança de status', isPublic: false },
            { key: 'notif_wa_budget_ready',        value: 'true',               type: SettingType.BOOLEAN, description: 'WA: orçamento pronto', isPublic: false },
            { key: 'notif_wa_ready_pickup',        value: 'true',               type: SettingType.BOOLEAN, description: 'WA: pronto para retirada', isPublic: false },
            { key: 'notif_wa_delivered',           value: 'true',               type: SettingType.BOOLEAN, description: 'WA: entregue', isPublic: false },
            { key: 'notif_email_os_created',       value: 'false',              type: SettingType.BOOLEAN, description: 'E-mail: OS criada', isPublic: false },
            { key: 'notif_email_budget_ready',     value: 'false',              type: SettingType.BOOLEAN, description: 'E-mail: orçamento pronto', isPublic: false },
            // ── WhatsApp / Evolution ─────────────────────────────────────
            { key: 'whatsapp_api_url',             value: '',                   type: SettingType.STRING, description: 'URL da Evolution API', isPublic: false },
            { key: 'whatsapp_api_token',           value: '',                   type: SettingType.STRING, description: 'Token da Evolution API', isPublic: false },
            { key: 'whatsapp_instance_name',       value: 'instance',           type: SettingType.STRING, description: 'Nome da Instância', isPublic: false },
            // ── Fiscal ───────────────────────────────────────────────────
            { key: 'fiscal_regime',                value: 'simples',            type: SettingType.STRING, description: 'Regime tributário', isPublic: false },
            { key: 'fiscal_nfe_serie',             value: '001',                type: SettingType.STRING, description: 'Série NF-e', isPublic: false },
            { key: 'fiscal_nfe_ambiente',          value: '2',                  type: SettingType.STRING, description: 'Ambiente (1=Prod, 2=Homolog)', isPublic: false },
            { key: 'fiscal_nfse_municipio',        value: '',                   type: SettingType.STRING, description: 'Código município NFS-e', isPublic: false },
            { key: 'fiscal_aliquota_iss',          value: '5',                  type: SettingType.STRING, description: 'Alíquota ISS (%)', isPublic: false },
            { key: 'fiscal_auto_nfse_delivery',    value: 'false',              type: SettingType.BOOLEAN, description: 'Emitir NFS-e automático ao entregar', isPublic: false },
            // ── Personalização ───────────────────────────────────────────
            { key: 'ui_theme',                     value: 'dark',               type: SettingType.STRING, description: 'Tema do sistema', isPublic: false },
            { key: 'ui_language',                  value: 'pt-BR',              type: SettingType.STRING, description: 'Idioma', isPublic: false },
            { key: 'ui_date_format',               value: 'DD/MM/YYYY',         type: SettingType.STRING, description: 'Formato de data', isPublic: false },
            { key: 'ui_currency',                  value: 'BRL',                type: SettingType.STRING, description: 'Moeda', isPublic: false },
            { key: 'ui_show_kanban_default',       value: 'false',              type: SettingType.BOOLEAN, description: 'Abrir Kanban por padrão', isPublic: false },
            // ── Termos ───────────────────────────────────────────────────
            { key: 'service_terms',                value: '', type: SettingType.STRING, description: 'Termos de garantia e entrega', isPublic: true },
            // ── OS workflow ──────────────────────────────────────────────
            { key: 'os_custom_workflow',           value: JSON.stringify({
                labels: {
                    aberta: 'Aberta', em_diagnostico: 'Em Diagnóstico',
                    aguardando_aprovacao: 'Aguardando Aprovação', aguardando_peca: 'Aguardando Peça',
                    em_reparo: 'Em Reparo', testes: 'Testes',
                    finalizada: 'Finalizada', entregue: 'Entregue', cancelada: 'Cancelada',
                },
                flow: {
                    aberta: ['em_diagnostico','cancelada'],
                    em_diagnostico: ['aguardando_aprovacao','aguardando_peca','cancelada'],
                    aguardando_aprovacao: ['aguardando_peca','em_reparo','cancelada'],
                    aguardando_peca: ['em_reparo','aguardando_aprovacao'],
                    em_reparo: ['testes','aguardando_peca'],
                    testes: ['finalizada','em_reparo'],
                    finalizada: ['entregue','em_reparo'],
                    entregue: [], cancelada: [],
                },
            }), type: SettingType.JSON, description: 'Fluxo e labels de status da OS', isPublic: true },

            // ── Logo & Horários ──────────────────────────────────────────
            { key: 'company_logo_url',             value: '',       type: SettingType.STRING,  description: 'URL do logo', isPublic: true },
            { key: 'company_favicon_url',          value: '',       type: SettingType.STRING,  description: 'URL do favicon', isPublic: true },
            { key: 'company_opening_hours_json',   value: JSON.stringify({
                seg: { open: true, from: '09:00', to: '18:00' },
                ter: { open: true, from: '09:00', to: '18:00' },
                qua: { open: true, from: '09:00', to: '18:00' },
                qui: { open: true, from: '09:00', to: '18:00' },
                sex: { open: true, from: '09:00', to: '18:00' },
                sab: { open: true, from: '09:00', to: '13:00' },
                dom: { open: false, from: '', to: '' },
            }), type: SettingType.JSON, description: 'Horários por dia', isPublic: true },
            { key: 'company_social_instagram',     value: '', type: SettingType.STRING, description: 'Instagram', isPublic: true },
            { key: 'company_social_facebook',      value: '', type: SettingType.STRING, description: 'Facebook', isPublic: true },
            { key: 'company_social_whatsapp',      value: '', type: SettingType.STRING, description: 'WhatsApp público', isPublic: true },

            // ── OS — SLA e campos ────────────────────────────────────────
            { key: 'os_sla_low',                   value: '72',  type: SettingType.STRING, description: 'SLA prioridade baixa (horas)', isPublic: false },
            { key: 'os_sla_normal',                value: '48',  type: SettingType.STRING, description: 'SLA prioridade normal (horas)', isPublic: false },
            { key: 'os_sla_high',                  value: '24',  type: SettingType.STRING, description: 'SLA prioridade alta (horas)', isPublic: false },
            { key: 'os_sla_urgent',                value: '4',   type: SettingType.STRING, description: 'SLA prioridade urgente (horas)', isPublic: false },
            { key: 'os_require_serial',            value: 'false', type: SettingType.BOOLEAN, description: 'Exigir serial/IMEI', isPublic: false },
            { key: 'os_require_accessories',       value: 'false', type: SettingType.BOOLEAN, description: 'Exigir lista de acessórios', isPublic: false },
            { key: 'os_show_accessories',          value: 'true',  type: SettingType.BOOLEAN, description: 'Mostrar campo acessórios', isPublic: false },
            { key: 'os_enable_multi_equipment',    value: 'true',  type: SettingType.BOOLEAN, description: 'Permitir múltiplos equipamentos por OS', isPublic: false },
            { key: 'os_auto_number_format',        value: 'YYYYMMDD-{N}', type: SettingType.STRING, description: 'Formato do número automático', isPublic: false },
            { key: 'os_public_status_fields',      value: JSON.stringify(['status','equipment','technician','estimated_date']), type: SettingType.JSON, description: 'Campos visíveis no status público', isPublic: false },

            // ── Impressão térmica ────────────────────────────────────────
            { key: 'thermal_enabled',              value: 'false', type: SettingType.BOOLEAN, description: 'Habilitar impressora térmica', isPublic: false },
            { key: 'thermal_connection',           value: 'bluetooth', type: SettingType.STRING, description: 'Tipo: bluetooth|usb|network', isPublic: false },
            { key: 'thermal_ip',                   value: '', type: SettingType.STRING, description: 'IP da impressora de rede', isPublic: false },
            { key: 'thermal_port',                 value: '9100', type: SettingType.STRING, description: 'Porta da impressora', isPublic: false },
            { key: 'thermal_paper_width',          value: '80', type: SettingType.STRING, description: 'Largura do papel (mm): 58|80', isPublic: false },
            { key: 'thermal_show_logo',            value: 'true', type: SettingType.BOOLEAN, description: 'Mostrar logo na etiqueta', isPublic: false },
            { key: 'thermal_show_qrcode',          value: 'true', type: SettingType.BOOLEAN, description: 'QR Code no recibo', isPublic: false },
            { key: 'thermal_auto_print_entry',     value: 'false', type: SettingType.BOOLEAN, description: 'Imprimir automaticamente ao abrir OS', isPublic: false },
            { key: 'thermal_copies',               value: '1', type: SettingType.STRING, description: 'Cópias padrão da térmica', isPublic: false },

            // ── E-mail SMTP ──────────────────────────────────────────────
            { key: 'smtp_enabled',                 value: 'false', type: SettingType.BOOLEAN, description: 'Habilitar SMTP próprio', isPublic: false },
            { key: 'smtp_host',                    value: '', type: SettingType.STRING, description: 'Host SMTP', isPublic: false },
            { key: 'smtp_port',                    value: '587', type: SettingType.STRING, description: 'Porta SMTP', isPublic: false },
            { key: 'smtp_user',                    value: '', type: SettingType.STRING, description: 'Usuário SMTP', isPublic: false },
            { key: 'smtp_password',                value: '', type: SettingType.STRING, description: 'Senha SMTP', isPublic: false },
            { key: 'smtp_from_name',               value: '', type: SettingType.STRING, description: 'Nome do remetente', isPublic: false },
            { key: 'smtp_from_email',              value: '', type: SettingType.STRING, description: 'E-mail remetente', isPublic: false },
            { key: 'smtp_tls',                     value: 'true', type: SettingType.BOOLEAN, description: 'Usar TLS/SSL', isPublic: false },

            // ── Integrações ──────────────────────────────────────────────
            { key: 'integration_pagbank_token',    value: '', type: SettingType.STRING, description: 'Token PagBank', isPublic: false },
            { key: 'integration_pagbank_sandbox',  value: 'true', type: SettingType.BOOLEAN, description: 'PagBank sandbox', isPublic: false },
            { key: 'integration_mp_access_token',  value: '', type: SettingType.STRING, description: 'Access token MercadoPago', isPublic: false },
            { key: 'integration_mp_public_key',    value: '', type: SettingType.STRING, description: 'Public key MercadoPago', isPublic: false },
            { key: 'integration_imei_provider',    value: 'imeicheck', type: SettingType.STRING, description: 'Provedor IMEI: imeicheck|imeidb', isPublic: false },
            { key: 'integration_imei_token',       value: '', type: SettingType.STRING, description: 'Token API IMEI', isPublic: false },
            { key: 'integration_google_maps_key',  value: '', type: SettingType.STRING, description: 'Chave Google Maps', isPublic: false },
            { key: 'integration_viacep_enabled',   value: 'true', type: SettingType.BOOLEAN, description: 'Busca automática de endereço por CEP', isPublic: false },

            // ── Financeiro — comissões e metas ───────────────────────────
            { key: 'finance_commission_enabled',   value: 'false', type: SettingType.BOOLEAN, description: 'Habilitar comissões', isPublic: false },
            { key: 'finance_commission_default',   value: '10', type: SettingType.STRING, description: 'Comissão padrão (%)', isPublic: false },
            { key: 'finance_commission_rules',     value: JSON.stringify([]), type: SettingType.JSON, description: 'Regras de comissão por técnico', isPublic: false },
            { key: 'finance_monthly_goal',         value: '0', type: SettingType.STRING, description: 'Meta mensal de faturamento (R$)', isPublic: false },
            { key: 'finance_min_margin',           value: '0', type: SettingType.STRING, description: 'Margem mínima por OS (%)', isPublic: false },

            // ── Status público ───────────────────────────────────────────
            { key: 'public_status_show_technician', value: 'false', type: SettingType.BOOLEAN, description: 'Mostrar nome do técnico no status público', isPublic: false },
            { key: 'public_status_show_price',     value: 'false', type: SettingType.BOOLEAN, description: 'Mostrar valor no status público', isPublic: false },
            { key: 'public_status_show_timeline',  value: 'true',  type: SettingType.BOOLEAN, description: 'Mostrar timeline no status público', isPublic: false },
            { key: 'public_status_custom_message', value: '', type: SettingType.STRING, description: 'Mensagem customizada no topo do status público', isPublic: true },
            { key: 'public_status_accent_color',   value: '#3b82f6', type: SettingType.STRING, description: 'Cor de destaque no status público', isPublic: true },

            // ── Automações ───────────────────────────────────────────────
            { key: 'automation_rules',             value: JSON.stringify([]), type: SettingType.JSON, description: 'Regras de automação configuradas', isPublic: false },
            { key: 'automation_follow_up_days',    value: '3', type: SettingType.STRING, description: 'Follow-up automático após X dias sem resposta', isPublic: false },
            { key: 'automation_abandoned_days',    value: '30', type: SettingType.STRING, description: 'Alerta de OS abandonada após X dias', isPublic: false },

            // ── Termos ───────────────────────────────────────────────────
            { key: 'terms_general',                value: '', type: SettingType.STRING, description: 'Termos gerais de serviço', isPublic: true },
            { key: 'terms_warranty',               value: '', type: SettingType.STRING, description: 'Termos de garantia', isPublic: true },
            { key: 'terms_delivery',               value: '', type: SettingType.STRING, description: 'Termos de entrega', isPublic: true },
            { key: 'terms_require_digital_sign',   value: 'false', type: SettingType.BOOLEAN, description: 'Exigir aceite digital nos termos', isPublic: false },

            // ── Aparência ────────────────────────────────────────────────
            { key: 'ui_primary_color',             value: '#3b82f6', type: SettingType.STRING, description: 'Cor primária do sistema', isPublic: true },
            { key: 'ui_secondary_color',           value: '#7c3aed', type: SettingType.STRING, description: 'Cor secundária', isPublic: true },
            { key: 'ui_sidebar_collapsed',         value: 'false', type: SettingType.BOOLEAN, description: 'Sidebar recolhida por padrão', isPublic: false },
            { key: 'ui_compact_mode',              value: 'false', type: SettingType.BOOLEAN, description: 'Modo compacto (menor espaçamento)', isPublic: false },
            { key: 'ui_default_page',              value: 'dashboard', type: SettingType.STRING, description: 'Página inicial padrão', isPublic: false },
            { key: 'ui_items_per_page',            value: '20', type: SettingType.STRING, description: 'Itens por página nas listagens', isPublic: false },
        ];

        for (const def of defaults) {
            const exists = await this.settingsRepository.findOne({ where: { key: def.key } });
            if (!exists) {
                await this.set(def.key, def.value, def.type, def.description, def.isPublic);
            }
        }
    }
}
