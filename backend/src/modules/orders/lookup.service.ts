import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────
// Apple serial number decoder (pre-2021, 12-char format)
// The last 3 characters of the serial encode model + config.
// Source: community documentation (EveryMac, iFixit, AppleDB).
// ─────────────────────────────────────────────────────────────────
const APPLE_MODEL_TABLE: Record<string, { model: string; type: string }> = {
    // ── iPhone 4 / 4S ──────────────────────────────────────────
    'DU3': { model: 'iPhone 4', type: 'Celular' },
    'DU4': { model: 'iPhone 4', type: 'Celular' },
    'DMT': { model: 'iPhone 4S', type: 'Celular' },
    'DMU': { model: 'iPhone 4S', type: 'Celular' },
    // ── iPhone 5 / 5C / 5S ─────────────────────────────────────
    'F2U': { model: 'iPhone 5', type: 'Celular' },
    'F2V': { model: 'iPhone 5', type: 'Celular' },
    'F7N': { model: 'iPhone 5C', type: 'Celular' },
    'F7P': { model: 'iPhone 5C', type: 'Celular' },
    'F7R': { model: 'iPhone 5S', type: 'Celular' },
    'F7S': { model: 'iPhone 5S', type: 'Celular' },
    'F7T': { model: 'iPhone 5S', type: 'Celular' },
    // ── iPhone 6 / 6 Plus ──────────────────────────────────────
    'FD4': { model: 'iPhone 6', type: 'Celular' },
    'FD5': { model: 'iPhone 6', type: 'Celular' },
    'FD6': { model: 'iPhone 6', type: 'Celular' },
    'FD7': { model: 'iPhone 6', type: 'Celular' },
    'FD8': { model: 'iPhone 6 Plus', type: 'Celular' },
    'FD9': { model: 'iPhone 6 Plus', type: 'Celular' },
    'FDC': { model: 'iPhone 6 Plus', type: 'Celular' },
    // ── iPhone 6S / 6S Plus ────────────────────────────────────
    'G0P': { model: 'iPhone 6S', type: 'Celular' },
    'G0R': { model: 'iPhone 6S', type: 'Celular' },
    'G0T': { model: 'iPhone 6S', type: 'Celular' },
    'G0U': { model: 'iPhone 6S', type: 'Celular' },
    'G0V': { model: 'iPhone 6S Plus', type: 'Celular' },
    'G0W': { model: 'iPhone 6S Plus', type: 'Celular' },
    'G0X': { model: 'iPhone 6S Plus', type: 'Celular' },
    // ── iPhone SE (1ª geração) ──────────────────────────────────
    'G7P': { model: 'iPhone SE', type: 'Celular' },
    'G7R': { model: 'iPhone SE', type: 'Celular' },
    'G7T': { model: 'iPhone SE', type: 'Celular' },
    // ── iPhone 7 / 7 Plus ──────────────────────────────────────
    'GNP': { model: 'iPhone 7', type: 'Celular' },
    'GNR': { model: 'iPhone 7', type: 'Celular' },
    'GNT': { model: 'iPhone 7', type: 'Celular' },
    'GNU': { model: 'iPhone 7', type: 'Celular' },
    'GNV': { model: 'iPhone 7 Plus', type: 'Celular' },
    'GNW': { model: 'iPhone 7 Plus', type: 'Celular' },
    'GNX': { model: 'iPhone 7 Plus', type: 'Celular' },
    'GNY': { model: 'iPhone 7 Plus', type: 'Celular' },
    // ── iPhone 8 / 8 Plus / X ──────────────────────────────────
    'HND': { model: 'iPhone 8', type: 'Celular' },
    'HNF': { model: 'iPhone 8', type: 'Celular' },
    'HNG': { model: 'iPhone 8', type: 'Celular' },
    'HNH': { model: 'iPhone 8 Plus', type: 'Celular' },
    'HNJ': { model: 'iPhone 8 Plus', type: 'Celular' },
    'HNK': { model: 'iPhone 8 Plus', type: 'Celular' },
    'HNL': { model: 'iPhone X', type: 'Celular' },
    'HNM': { model: 'iPhone X', type: 'Celular' },
    'HNN': { model: 'iPhone X', type: 'Celular' },
    // ── iPhone XS / XS Max / XR ────────────────────────────────
    'JCN': { model: 'iPhone XS', type: 'Celular' },
    'JCP': { model: 'iPhone XS', type: 'Celular' },
    'JCQ': { model: 'iPhone XS Max', type: 'Celular' },
    'JCR': { model: 'iPhone XS Max', type: 'Celular' },
    'JCS': { model: 'iPhone XR', type: 'Celular' },
    'JCT': { model: 'iPhone XR', type: 'Celular' },
    'JCU': { model: 'iPhone XR', type: 'Celular' },
    // ── iPhone 11 / 11 Pro / 11 Pro Max ────────────────────────
    'KD4': { model: 'iPhone 11', type: 'Celular' },
    'KD5': { model: 'iPhone 11', type: 'Celular' },
    'KD6': { model: 'iPhone 11', type: 'Celular' },
    'KD7': { model: 'iPhone 11 Pro', type: 'Celular' },
    'KD8': { model: 'iPhone 11 Pro', type: 'Celular' },
    'KD9': { model: 'iPhone 11 Pro Max', type: 'Celular' },
    'KDC': { model: 'iPhone 11 Pro Max', type: 'Celular' },
    // ── iPhone SE (2ª geração) ──────────────────────────────────
    'LH0': { model: 'iPhone SE (2ª geração)', type: 'Celular' },
    'LH1': { model: 'iPhone SE (2ª geração)', type: 'Celular' },
    // ── iPhone 12 / 12 Mini / 12 Pro / 12 Pro Max ───────────────
    'LT9': { model: 'iPhone 12', type: 'Celular' },
    'LTC': { model: 'iPhone 12', type: 'Celular' },
    'LTD': { model: 'iPhone 12 mini', type: 'Celular' },
    'LTF': { model: 'iPhone 12 mini', type: 'Celular' },
    'LTG': { model: 'iPhone 12 Pro', type: 'Celular' },
    'LTH': { model: 'iPhone 12 Pro', type: 'Celular' },
    'LTJ': { model: 'iPhone 12 Pro Max', type: 'Celular' },
    'LTK': { model: 'iPhone 12 Pro Max', type: 'Celular' },
    // ── iPad (principais modelos) ───────────────────────────────
    'F4N': { model: 'iPad Air', type: 'Tablet' },
    'F4P': { model: 'iPad Air', type: 'Tablet' },
    'GG7': { model: 'iPad Air 2', type: 'Tablet' },
    'GG8': { model: 'iPad Air 2', type: 'Tablet' },
    'HF4': { model: 'iPad (5ª geração)', type: 'Tablet' },
    'HF5': { model: 'iPad (5ª geração)', type: 'Tablet' },
    'JCK': { model: 'iPad (6ª geração)', type: 'Tablet' },
    'JCL': { model: 'iPad (6ª geração)', type: 'Tablet' },
    'KD3': { model: 'iPad (7ª geração)', type: 'Tablet' },
    'LGX': { model: 'iPad (8ª geração)', type: 'Tablet' },
    'LGY': { model: 'iPad (8ª geração)', type: 'Tablet' },
    'HNP': { model: 'iPad Pro 10.5"', type: 'Tablet' },
    'HNQ': { model: 'iPad Pro 12.9" (2ª geração)', type: 'Tablet' },
    'JDN': { model: 'iPad Pro 11" (1ª geração)', type: 'Tablet' },
    'JDP': { model: 'iPad Pro 12.9" (3ª geração)', type: 'Tablet' },
    'KDN': { model: 'iPad Pro 11" (2ª geração)', type: 'Tablet' },
    'KDP': { model: 'iPad Pro 12.9" (4ª geração)', type: 'Tablet' },
    // ── iPad Mini ───────────────────────────────────────────────
    'F3P': { model: 'iPad mini 2', type: 'Tablet' },
    'F3R': { model: 'iPad mini 3', type: 'Tablet' },
    'G7N': { model: 'iPad mini 4', type: 'Tablet' },
    'KDQ': { model: 'iPad mini 5', type: 'Tablet' },
    // ── MacBook / MacBook Air / MacBook Pro ─────────────────────
    'DNL': { model: 'MacBook Air 13"', type: 'Notebook' },
    'DNM': { model: 'MacBook Air 13"', type: 'Notebook' },
    'F5Y': { model: 'MacBook Air 13"', type: 'Notebook' },
    'F5Z': { model: 'MacBook Air 13"', type: 'Notebook' },
    'GN9': { model: 'MacBook Air 13" (2017)', type: 'Notebook' },
    'HNR': { model: 'MacBook Air 13" (2018)', type: 'Notebook' },
    'JCC': { model: 'MacBook Air 13" (2019)', type: 'Notebook' },
    'KDY': { model: 'MacBook Air 13" (2020)', type: 'Notebook' },
    'F4G': { model: 'MacBook Pro 13"', type: 'Notebook' },
    'F4H': { model: 'MacBook Pro 15"', type: 'Notebook' },
    'G8Y': { model: 'MacBook Pro 13" (2016)', type: 'Notebook' },
    'G8Z': { model: 'MacBook Pro 15" (2016)', type: 'Notebook' },
    'HNS': { model: 'MacBook Pro 13" (2018)', type: 'Notebook' },
    'HNT': { model: 'MacBook Pro 15" (2018)', type: 'Notebook' },
    'JCG': { model: 'MacBook Pro 13" (2019)', type: 'Notebook' },
    'JCH': { model: 'MacBook Pro 16" (2019)', type: 'Notebook' },
    'KDZ': { model: 'MacBook Pro 13" (2020)', type: 'Notebook' },
    // ── Apple Watch ─────────────────────────────────────────────
    'G7M': { model: 'Apple Watch Series 1', type: 'Smartwatch' },
    'HNX': { model: 'Apple Watch Series 3', type: 'Smartwatch' },
    'JCX': { model: 'Apple Watch Series 4', type: 'Smartwatch' },
    'KDX': { model: 'Apple Watch Series 5', type: 'Smartwatch' },
    'LTX': { model: 'Apple Watch Series 6', type: 'Smartwatch' },
    'LTY': { model: 'Apple Watch SE', type: 'Smartwatch' },
};

// Prefixos de fábrica Apple conhecidos (para detecção de marca)
const APPLE_FACTORY_PREFIXES = [
    'C02', 'C07', 'C11', 'C17', 'C1X', 'C39', 'CK', 'DKH',
    'F17', 'FK1', 'FK2', 'F1F', 'GG7', 'G8W', 'HF', 'HC',
    'J1', 'K0', 'LT', 'LH', 'LG',
];

@Injectable()
export class LookupService {
    private readonly logger = new Logger(LookupService.name);

    constructor(private readonly settingsService: SettingsService) { }

    // ── Detecta tipo a partir de texto do modelo ───────────────
    private detectType(modelStr: string): string {
        const m = (modelStr || '').toLowerCase();
        if (m.includes('ipad') || m.includes('tablet') || m.includes('tab ')) return 'Tablet';
        if (m.includes('macbook') || m.includes('laptop') || m.includes('notebook')) return 'Notebook';
        if (m.includes('imac') || m.includes('mac mini') || m.includes('desktop') || m.includes('computer')) return 'Computador';
        if (m.includes('watch') || m.includes('smartwatch')) return 'Smartwatch';
        if (m.includes('airpods') || m.includes('headphone') || m.includes('earphone')) return 'Fone';
        return 'Celular';
    }

    // ── Camada 1: TAC lookup gratuito (para IMEI) ──────────────
    // TAC = primeiros 8 dígitos do IMEI (15 dígitos numéricos)
    // Banco Osmocom: open-source, sem limite, sem autenticação
    private async lookupByTac(tac: string): Promise<any | null> {
        try {
            const res = await axios.get(
                `https://tacdb.osmocom.org/api/tac/${tac}.json`,
                { timeout: 8000, validateStatus: () => true },
            );
            if (res.status === 200 && res.data?.manufacturer) {
                const brand = res.data.manufacturer
                    .replace(/ Inc\.?$/i, '').replace(/ Corp\.?$/i, '').replace(/ Ltd\.?$/i, '').trim();
                const model = res.data.model || '';
                this.logger.log(`TAC ${tac} → ${brand} ${model}`);
                return { brand, model, type: this.detectType(model) };
            }
        } catch (e) {
            this.logger.debug(`TAC lookup failed for ${tac}: ${e.message}`);
        }
        return null;
    }

    // ── Camada 2: Decoder de serial Apple (pré-2021) ───────────
    // Últimos 3 chars do serial de 12 chars = código do modelo
    private decodeAppleSerial(serial: string): any | null {
        const upper = serial.toUpperCase().replace(/\s/g, '');

        // Serial Apple tem 10 ou 12 chars alfanumérico
        if (upper.length < 10 || upper.length > 12) return null;

        // Verifica se começa com prefixo de fábrica Apple conhecida
        const isApple = APPLE_FACTORY_PREFIXES.some(p => upper.startsWith(p));
        if (!isApple) return null;

        // Tenta decodificar modelo pelos últimos 3 chars (12-char serial)
        if (upper.length === 12) {
            const code = upper.slice(-3);
            const entry = APPLE_MODEL_TABLE[code];
            if (entry) {
                this.logger.log(`Apple serial ${serial} → código ${code} → ${entry.model}`);
                return { brand: 'Apple', model: entry.model, type: entry.type };
            }
        }

        // Reconheceu como Apple mas não identificou o modelo exato
        this.logger.log(`Apple serial ${serial} detectado — modelo não mapeado, definindo marca`);
        return { brand: 'Apple', model: '', type: 'Celular' };
    }

    // ── Método principal ────────────────────────────────────────
    async lookupExternal(serial: string): Promise<any> {
        const trimmed = serial.trim();

        // Camada 1 — IMEI: 14-16 dígitos todos numéricos → TAC lookup gratuito
        if (/^\d{14,16}$/.test(trimmed)) {
            this.logger.log(`Tentando TAC lookup gratuito para IMEI ${trimmed}`);
            const tacResult = await this.lookupByTac(trimmed.slice(0, 8));
            if (tacResult?.brand) return tacResult;
        }

        // Camada 2 — Serial Apple: alfanumérico 10-12 chars → decoder local
        if (/^[A-Z0-9]{10,12}$/i.test(trimmed) && !/^\d+$/.test(trimmed)) {
            this.logger.log(`Tentando decoder de serial Apple para ${trimmed}`);
            const appleResult = this.decodeAppleSerial(trimmed);
            if (appleResult) return appleResult;
        }

        // Camada 3 — API paga (imeicheck.net ou outro configurado)
        const provider =
            await this.settingsService.findByKey('integration_imei_provider') ||
            await this.settingsService.findByKey('imei_api_provider');
        const token =
            await this.settingsService.findByKey('integration_imei_token') ||
            await this.settingsService.findByKey('imei_api_token');

        if (!token) {
            this.logger.warn('Nenhum token de API configurado — lookup externo encerrado.');
            return null;
        }

        this.logger.log(`Camada 3 — API paga: provider=${provider}, serial=${trimmed}`);

        try {
            if (!provider || provider === 'imeicheck') {
                const response = await axios.post(
                    'https://api.imeicheck.net/v1/checks',
                    { deviceId: trimmed, serviceId: 12 },
                    {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        timeout: 15000,
                        validateStatus: () => true,
                    },
                );
                this.logger.log(`imeicheck HTTP ${response.status} — ${JSON.stringify(response.data).slice(0, 300)}`);
                if (response.status === 200 && response.data?.properties) {
                    const p = response.data.properties;
                    const brand = p.brand || p.brandName || p.manufacturer || '';
                    const model = p.modelName || p.model || p.name || '';
                    if (brand || model) return { brand, model, type: this.detectType(model) };
                }
                return null;
            }

            if (provider === 'imei.org') {
                const res = await axios.get(`https://api.imei.org/v1/check?token=${token}&imei=${trimmed}`, { timeout: 15000, validateStatus: () => true });
                if (res.data?.success) {
                    return { brand: res.data.device?.brand || '', model: res.data.device?.model || '', type: this.detectType(res.data.device?.model || '') };
                }
            } else if (provider === 'zylalabs') {
                const res = await axios.get(`https://zylalabs.com/api/xxx/imei+checker/v1/check?imei=${trimmed}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 15000,
                    validateStatus: () => true,
                });
                if (res.data?.brand || res.data?.model) {
                    return { brand: res.data.brand || '', model: res.data.model || '', type: 'Celular' };
                }
            }
        } catch (error) {
            this.logger.error(`API externa falhou (${provider}): ${error.message}`);
        }

        return null;
    }
}
