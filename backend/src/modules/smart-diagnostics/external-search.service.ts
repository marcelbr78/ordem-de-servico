import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ExternalResult {
    source: string;
    sourceUrl: string;
    title: string;
    snippet: string;
    url?: string;
    confidence: 'high' | 'medium' | 'low';
}

@Injectable()
export class ExternalSearchService {
    private readonly logger = new Logger(ExternalSearchService.name);

    // ── Busca principal: agrega resultados de múltiplas fontes ─
    async search(model: string, symptom: string): Promise<ExternalResult[]> {
        const results: ExternalResult[] = [];
        const query = `${model} ${symptom}`.trim();

        const searches = await Promise.allSettled([
            this.searchBadCaps(query, model, symptom),
            this.searchElectronicaBR(query, model, symptom),
            this.searchRossmann(query, model),
            this.searchGoogleCustom(query),
        ]);

        for (const result of searches) {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                results.push(...result.value);
            }
        }

        // Ordenar por confiança
        return results.sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.confidence] - order[b.confidence];
        }).slice(0, 10);
    }

    // ── BadCaps.net (fórum de eletrônica) ──────────────────────
    private async searchBadCaps(query: string, model: string, symptom: string): Promise<ExternalResult[]> {
        try {
            const encoded = encodeURIComponent(`${model} ${symptom}`);
            const url = `https://www.badcaps.net/forum/search.php?keywords=${encoded}&searchsubmit=Search`;
            const res = await axios.get(url, {
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechAssist/1.0)' },
            });
            const results: ExternalResult[] = [];
            // Extrair títulos de threads com regex
            const matches = res.data.matchAll(/<a[^>]+href="(showthread[^"]+)"[^>]*>([^<]{10,})<\/a>/gi);
            for (const match of matches) {
                const title = match[2].trim();
                const href = match[1];
                if (title.toLowerCase().includes(model.toLowerCase().split(' ')[0]) ||
                    title.toLowerCase().includes(symptom.toLowerCase().split(' ')[0])) {
                    results.push({
                        source: 'BadCaps Forum',
                        sourceUrl: 'https://badcaps.net',
                        title,
                        snippet: `Thread no fórum BadCaps relacionado a "${query}"`,
                        url: `https://www.badcaps.net/forum/${href}`,
                        confidence: 'high',
                    });
                }
            }
            return results.slice(0, 3);
        } catch (err) {
            this.logger.debug(`BadCaps search failed: ${err.message}`);
            // Retornar link direto de pesquisa
            return [{
                source: 'BadCaps Forum',
                sourceUrl: 'https://badcaps.net',
                title: `Buscar "${query}" no BadCaps`,
                snippet: 'Fórum especializado em eletrônica, capacitores e reparos. Clique para buscar.',
                url: `https://www.badcaps.net/forum/search.php?keywords=${encodeURIComponent(query)}`,
                confidence: 'medium',
            }];
        }
    }

    // ── Eletrônica BR ──────────────────────────────────────────
    private async searchElectronicaBR(query: string, model: string, symptom: string): Promise<ExternalResult[]> {
        try {
            const encoded = encodeURIComponent(query);
            return [{
                source: 'Eletrônica BR',
                sourceUrl: 'https://www.electronicsbr.com.br',
                title: `Buscar "${query}" no Eletrônica BR`,
                snippet: 'Fórum brasileiro de eletrônica com reparos documentados por técnicos.',
                url: `https://www.electronicsbr.com.br/search?q=${encoded}`,
                confidence: 'medium',
            }];
        } catch {
            return [];
        }
    }

    // ── Rossmann Group ─────────────────────────────────────────
    private async searchRossmann(query: string, model: string): Promise<ExternalResult[]> {
        try {
            // Rossmann Group tem vídeos no YouTube e forum próprio
            const encoded = encodeURIComponent(`${model} schematic repair`);
            return [{
                source: 'Rossmann Group',
                sourceUrl: 'https://rossmanngroup.com',
                title: `Buscar reparos de ${model} no canal Rossmann`,
                snippet: 'Louis Rossmann — reparos de lógica de placa, especialmente MacBooks e iPhones.',
                url: `https://www.youtube.com/c/rossmanngroup/search?query=${encoded}`,
                confidence: 'medium',
            }];
        } catch {
            return [];
        }
    }

    // ── Google Custom Search API ───────────────────────────────
    // (requer configuração de GOOGLE_SEARCH_API_KEY e GOOGLE_SEARCH_CX)
    private async searchGoogleCustom(query: string): Promise<ExternalResult[]> {
        const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
        const cx = process.env.GOOGLE_SEARCH_CX;
        if (!apiKey || !cx) return [];

        try {
            const encoded = encodeURIComponent(`${query} reparo diagnóstico técnico`);
            const res = await axios.get(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encoded}&num=5`, { timeout: 5000 });
            return (res.data.items || []).map((item: any) => ({
                source: item.displayLink || 'Web',
                sourceUrl: item.link,
                title: item.title,
                snippet: item.snippet,
                url: item.link,
                confidence: 'low' as const,
            }));
        } catch {
            return [];
        }
    }

    // ── Estimativa baseada no banco local + fontes externas ────
    async getRepairEstimate(model: string, symptom: string, diagnosis: string): Promise<{
        estimatedTime: string;
        difficulty: 'baixa' | 'média' | 'alta';
        commonParts: string[];
        tips: string[];
        externalLinks: ExternalResult[];
    }> {
        const MODEL_LOWER = model.toLowerCase();
        const SYMPTOM_LOWER = symptom.toLowerCase();
        const DIAG_LOWER = (diagnosis || '').toLowerCase();

        // Regras de estimativa baseadas em padrões conhecidos
        const estimate = this.estimateFromPatterns(MODEL_LOWER, SYMPTOM_LOWER, DIAG_LOWER);
        const externalLinks = await this.search(model, symptom);

        return { ...estimate, externalLinks };
    }

    private estimateFromPatterns(model: string, symptom: string, diagnosis: string) {
        // Base de conhecimento embutida
        const rules = [
            { match: ['tela','quebrada','display','lcd','oled'], time: '30-60 min', difficulty: 'baixa' as const, parts: ['Display + Touch','Película','Ferramentas de abertura'], tips: ['Aquecer bordas para facilitar abertura','Usar ventosa para displays OLED','Verificar cabos flex após substituição'] },
            { match: ['carrega','conector','usb','type-c','lightning'], time: '20-45 min', difficulty: 'baixa' as const, parts: ['Conector de carga','Flex de carga'], tips: ['Verificar pinos internos com lupas antes de substituir','Limpar conector com álcool antes de trocar'] },
            { match: ['bateria','inchada','dura pouco','autonomia'], time: '20-40 min', difficulty: 'baixa' as const, parts: ['Bateria original','Fita adesiva'], tips: ['Usar bateria certificada','Calibrar após substituição (carregar até 100% por 3 ciclos)'] },
            { match: ['não liga','sem imagem','placa','mãe','circuito'], time: '2-8 horas', difficulty: 'alta' as const, parts: ['Capacitores','Resistores SMD','IC de carga','PMIC'], tips: ['Verificar tensão na entrada','Medir corrente de consumo','Consultar schematic'] },
            { match: ['câmera','foto','embaçada','fosca'], time: '30-60 min', difficulty: 'média' as const, parts: ['Módulo câmera','Lente câmera'], tips: ['Verificar embaçamento interno','Checar flex de câmera'] },
            { match: ['molhada','líquido','água','corrosão'], time: '1-4 horas', difficulty: 'alta' as const, parts: ['Capacitores','Conector de carga','Bateria'], tips: ['Limpar com álcool isopropílico 99%','Usar ultrassom se disponível','Secar por 24h antes de ligar'] },
            { match: ['touch','toque','sensível'], time: '30-60 min', difficulty: 'média' as const, parts: ['Display + Touch integrado','Flex'], tips: ['Verificar se é software antes de trocar hardware','Atualizar firmware'] },
            { match: ['som','caixa','speaker','alto-falante'], time: '20-45 min', difficulty: 'baixa' as const, parts: ['Alto-falante','Flex de áudio'], tips: ['Limpar grade antes de substituir','Testar com músicas diferentes'] },
        ];

        const combined = `${symptom} ${diagnosis}`;
        for (const rule of rules) {
            if (rule.match.some(m => combined.includes(m))) {
                return { estimatedTime: rule.time, difficulty: rule.difficulty, commonParts: rule.parts, tips: rule.tips };
            }
        }
        return { estimatedTime: '30-90 min', difficulty: 'média' as const, commonParts: [], tips: ['Verificar visualmente antes de diagnosticar','Testar funções básicas'] };
    }
}
