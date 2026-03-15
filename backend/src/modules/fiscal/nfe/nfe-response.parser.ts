import { XMLParser } from 'fast-xml-parser';

export interface ParsedSefazResponse {
    cStat: number;
    xMotivo: string;
    protocolo?: string;
    chaveAcesso?: string;
    recibo?: string;
    dhRecbto?: string;
    tpAmb?: number;
    autorizado: boolean;
    rejeitado: boolean;
    emProcessamento: boolean;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    parseTagValue: true,
});

/**
 * Faz parse completo do XML de retorno da SEFAZ
 * cStat = 100 → AUTORIZADA
 * cStat = 101 → CANCELADA
 * cStat = 105/106 → Em processamento (consultar recibo)
 * Demais → REJEITADA
 */
export function parseSefazResponse(xmlRetorno: string): ParsedSefazResponse {
    let parsed: any;

    try {
        parsed = parser.parse(xmlRetorno);
    } catch {
        return {
            cStat: 0,
            xMotivo: 'Erro ao parsear XML de retorno da SEFAZ',
            autorizado: false,
            rejeitado: true,
            emProcessamento: false,
        };
    }

    // Navegar estrutura SOAP
    const env = parsed?.['soap:Envelope'] ?? parsed?.['soap12:Envelope'] ?? parsed;
    const body = env?.['soap:Body'] ?? env?.['soap12:Body'] ?? env;

    // Buscar retAutorizacao ou retConsReciNFe
    const retAuth = findDeep(body, 'retEnviNFe')
        ?? findDeep(body, 'retConsReciNFe')
        ?? findDeep(body, 'retEvento')
        ?? body;

    const cStatRaw = findDeep(retAuth, 'cStat');
    const xMotivoRaw = findDeep(retAuth, 'xMotivo');
    const nRecRaw = findDeep(retAuth, 'nRec');
    const dhRecbtoRaw = findDeep(retAuth, 'dhRecbto');
    const tpAmbRaw = findDeep(retAuth, 'tpAmb');

    // Protocolo pode estar em infProt
    const infProt = findDeep(retAuth, 'infProt');
    const nProtRaw = infProt?.nProt ?? findDeep(retAuth, 'nProt');
    const chNFeRaw = infProt?.chNFe ?? findDeep(retAuth, 'chNFe');
    const cStatProt = infProt?.cStat ?? cStatRaw;

    const cStat = Number(cStatProt || cStatRaw || 0);

    return {
        cStat,
        xMotivo: String(xMotivoRaw || infProt?.xMotivo || 'Sem descrição'),
        protocolo: nProtRaw ? String(nProtRaw) : undefined,
        chaveAcesso: chNFeRaw ? String(chNFeRaw) : undefined,
        recibo: nRecRaw ? String(nRecRaw) : undefined,
        dhRecbto: dhRecbtoRaw ? String(dhRecbtoRaw) : undefined,
        tpAmb: tpAmbRaw ? Number(tpAmbRaw) : undefined,
        autorizado: cStat === 100,
        rejeitado: cStat !== 100 && cStat !== 105 && cStat !== 106,
        emProcessamento: cStat === 105 || cStat === 106,
    };
}

/**
 * Busca recursiva de propriedade em objeto
 */
function findDeep(obj: any, key: string): any {
    if (!obj || typeof obj !== 'object') return undefined;
    if (key in obj) return obj[key];
    for (const k of Object.keys(obj)) {
        const result = findDeep(obj[k], key);
        if (result !== undefined) return result;
    }
    return undefined;
}
