import axios from 'axios';
import * as https from 'https';
import * as forge from 'node-forge';
import { FiscalError, FiscalErrorCode } from '../fiscal.errors';

export interface SefazConfig {
    uf: string;
    ambiente: number; // 1=Produção, 2=Homologação
    certPem: string;
    keyPem: string;
}

export interface SefazResponse {
    cStat: number;
    xMotivo: string;
    protocolo?: string;
    chaveAcesso?: string;
    recibo?: string;
    xmlRetorno?: string;
}

/**
 * URLs dos WebServices SEFAZ por UF (exemplos SP, RS, SC)
 * Referência: https://www.nfe.fazenda.gov.br/portal/webService.aspx
 */
const SEFAZ_URLS: Record<string, Record<number, Record<string, string>>> = {
    SP: {
        1: {
            NFeAutorizacao4: 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
            NFeRetAutorizacao4: 'https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
            NFeConsultaProtocolo4: 'https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
            NFeInutilizacao4: 'https://nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
            RecepcaoEvento4: 'https://nfe.fazenda.sp.gov.br/ws/recepcaoevento4.asmx',
        },
        2: {
            NFeAutorizacao4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
            NFeRetAutorizacao4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
            NFeConsultaProtocolo4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
            NFeInutilizacao4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
            RecepcaoEvento4: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/recepcaoevento4.asmx',
        },
    },
    SC: {
        1: {
            NFeAutorizacao4: 'https://nfe.sef.sc.gov.br/ws/NFeAutorizacao4',
            NFeRetAutorizacao4: 'https://nfe.sef.sc.gov.br/ws/NFeRetAutorizacao4',
            NFeConsultaProtocolo4: 'https://nfe.sef.sc.gov.br/ws/NfeConsulta2',
            NFeInutilizacao4: 'https://nfe.sef.sc.gov.br/ws/NFeInutilizacao4',
            RecepcaoEvento4: 'https://nfe.sef.sc.gov.br/ws/RecepcaoEvento',
        },
        2: {
            NFeAutorizacao4: 'https://hom.sef.sc.gov.br/ws/NFeAutorizacao4',
            NFeRetAutorizacao4: 'https://hom.sef.sc.gov.br/ws/NFeRetAutorizacao4',
            NFeConsultaProtocolo4: 'https://hom.sef.sc.gov.br/ws/NfeConsulta2',
            NFeInutilizacao4: 'https://hom.sef.sc.gov.br/ws/NFeInutilizacao4',
            RecepcaoEvento4: 'https://hom.sef.sc.gov.br/ws/RecepcaoEvento',
        },
    },
    SVRS: { // Ambiente Nacional para estados sem sefaz própria
        1: {
            NFeAutorizacao4: 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
            NFeRetAutorizacao4: 'https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
            NFeConsultaProtocolo4: 'https://nfe.svrs.rs.gov.br/ws/NfeConsulta2/NfeConsulta2.asmx',
            NFeInutilizacao4: 'https://nfe.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
            RecepcaoEvento4: 'https://nfe.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
        },
        2: {
            NFeAutorizacao4: 'https://homolog.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
            NFeRetAutorizacao4: 'https://homolog.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
            NFeConsultaProtocolo4: 'https://homolog.svrs.rs.gov.br/ws/NfeConsulta2/NfeConsulta2.asmx',
            NFeInutilizacao4: 'https://homolog.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
            RecepcaoEvento4: 'https://homolog.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx',
        },
    },
};

// Mapeamento UF → servidor SEFAZ
const UF_TO_SEFAZ: Record<string, string> = {
    SP: 'SP', SC: 'SC', RS: 'SVRS', PR: 'SVRS', RJ: 'SVRS',
    MG: 'SVRS', GO: 'SVRS', BA: 'SVRS', PE: 'SVRS', CE: 'SVRS',
};

function getUrlFor(uf: string, ambiente: number, service: string): string {
    const server = UF_TO_SEFAZ[uf.toUpperCase()] || 'SVRS';
    return SEFAZ_URLS[server]?.[ambiente]?.[service]
        ?? SEFAZ_URLS['SVRS'][ambiente][service];
}

/**
 * Cria um agente HTTPS com o certificado do contribuinte para mutual TLS
 */
function createHttpsAgent(config: SefazConfig): https.Agent {
    return new https.Agent({
        cert: config.certPem,
        key: config.keyPem,
        rejectUnauthorized: false, // SEFAZ usa CA própria; em produção ideal é true com CA bundle
        secureProtocol: 'TLSv1_2_method',
        minVersion: 'TLSv1.2',
    });
}

/**
 * Envolve o XML assinado em envelope SOAP 1.2 e envia para a SEFAZ
 * Retorna o XML de resposta bruto
 */
async function sendSoapRequest(url: string, action: string, body: string, agent: https.Agent): Promise<string> {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>${body}</soap12:Body>
</soap12:Envelope>`;

    const response = await axios.post(url, envelope, {
        headers: {
            'Content-Type': 'application/soap+xml;charset=UTF-8',
            SOAPAction: action,
        },
        httpsAgent: agent,
        timeout: 30000,
        responseType: 'text',
    });

    return response.data as string;
}

/**
 * Envia lote de NF-e para NFeAutorizacao4
 */
export async function enviarNFe(xmlAssinado: string, config: SefazConfig): Promise<SefazResponse> {
    const agent = createHttpsAgent(config);
    const url = getUrlFor(config.uf, config.ambiente, 'NFeAutorizacao4');

    // Lote de envio
    const idLote = Date.now().toString().slice(-15).padStart(15, '0');
    const xmlLote = `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
    <enviNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
      <idLote>${idLote}</idLote>
      <indSinc>1</indSinc>
      ${xmlAssinado}
    </enviNFe>
  </nfeDadosMsg>`;

    try {
        const xml = await sendSoapRequest(url, 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4', xmlLote, agent);
        return parseAutorizacaoResponse(xml);
    } catch (err: any) {
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
            throw new FiscalError('Timeout ao comunicar com a SEFAZ', FiscalErrorCode.SEFAZ_TIMEOUT, err);
        }
        throw new FiscalError(`Erro SEFAZ: ${err.message}`, FiscalErrorCode.SEFAZ_ERROR, err);
    }
}

/**
 * Consulta retorno da autorização via recibo
 */
export async function consultarRetornoNFe(recibo: string, config: SefazConfig): Promise<SefazResponse> {
    const agent = createHttpsAgent(config);
    const url = getUrlFor(config.uf, config.ambiente, 'NFeRetAutorizacao4');

    const body = `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4">
    <consReciNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
      <tpAmb>${config.ambiente}</tpAmb>
      <nRec>${recibo}</nRec>
    </consReciNFe>
  </nfeDadosMsg>`;

    try {
        const xml = await sendSoapRequest(url, 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4', body, agent);
        return parseRetAutorizacaoResponse(xml);
    } catch (err: any) {
        if (err.code === 'ETIMEDOUT') {
            throw new FiscalError('Timeout ao consultar retorno SEFAZ', FiscalErrorCode.SEFAZ_TIMEOUT, err);
        }
        throw new FiscalError(`Erro consulta SEFAZ: ${err.message}`, FiscalErrorCode.SEFAZ_ERROR, err);
    }
}

/**
 * Envia evento de cancelamento (110111) ou carta de correção (110110)
 */
export async function enviarEvento(params: {
    chaveAcesso: string;
    tpEvento: '110111' | '110110';
    xJust?: string;   // Para cancelamento
    xCorrecao?: string; // Para CC-e
    nSeqEvento?: number;
    config: SefazConfig;
    cnpjEmitente: string;
}): Promise<SefazResponse> {
    const { chaveAcesso, tpEvento, xJust, xCorrecao, nSeqEvento = 1, config, cnpjEmitente } = params;
    const agent = createHttpsAgent(config);
    const url = getUrlFor(config.uf, config.ambiente, 'RecepcaoEvento4');

    const now = new Date().toISOString().replace(/\.\d{3}Z$/, '-03:00');
    const idEvento = `ID${tpEvento}${chaveAcesso}${String(nSeqEvento).padStart(2, '0')}`;

    let detEvento = '';
    if (tpEvento === '110111') {
        detEvento = `<detEvento versao="1.00">
      <descEvento>Cancelamento</descEvento>
      <nProt>${chaveAcesso}</nProt>
      <xJust>${xJust || 'Cancelamento solicitado pelo emitente'}</xJust>
    </detEvento>`;
    } else {
        detEvento = `<detEvento versao="1.10">
      <descEvento>Carta de Correcao</descEvento>
      <xCorrecao>${xCorrecao}</xCorrecao>
      <xCondUso>A Carta de Correcao...</xCondUso>
    </detEvento>`;
    }

    const body = `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/RecepcaoEvento4">
    <envEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
      <idLote>${Date.now()}</idLote>
      <evento versao="1.00">
        <infEvento Id="${idEvento}">
          <cOrgao>${getCodigoUfFromChave(chaveAcesso)}</cOrgao>
          <tpAmb>${config.ambiente}</tpAmb>
          <CNPJ>${cnpjEmitente}</CNPJ>
          <chNFe>${chaveAcesso}</chNFe>
          <dhEvento>${now}</dhEvento>
          <tpEvento>${tpEvento}</tpEvento>
          <nSeqEvento>${nSeqEvento}</nSeqEvento>
          <verEvento>1.00</verEvento>
          ${detEvento}
        </infEvento>
      </evento>
    </envEvento>
  </nfeDadosMsg>`;

    try {
        const xml = await sendSoapRequest(url, 'http://www.portalfiscal.inf.br/nfe/wsdl/RecepcaoEvento4', body, agent);
        return parseEventoResponse(xml);
    } catch (err: any) {
        throw new FiscalError(`Erro ao enviar evento: ${err.message}`, FiscalErrorCode.SEFAZ_ERROR, err);
    }
}

function getCodigoUfFromChave(chave: string): string {
    return chave.slice(0, 2);
}

function parseAutorizacaoResponse(xml: string): SefazResponse {
    const cStatMatch = xml.match(/<cStat>(\d+)<\/cStat>/);
    const xMotivoMatch = xml.match(/<xMotivo>([^<]+)<\/xMotivo>/);
    const nRecMatch = xml.match(/<nRec>(\d+)<\/nRec>/);
    const protMatch = xml.match(/<nProt>(\d+)<\/nProt>/);
    const chaveMatch = xml.match(/<chNFe>(\d{44})<\/chNFe>/);

    const cStat = cStatMatch ? parseInt(cStatMatch[1]) : 0;
    return {
        cStat,
        xMotivo: xMotivoMatch?.[1] || 'Sem descrição',
        recibo: nRecMatch?.[1],
        protocolo: protMatch?.[1],
        chaveAcesso: chaveMatch?.[1],
        xmlRetorno: xml,
    };
}

function parseRetAutorizacaoResponse(xml: string): SefazResponse {
    return parseAutorizacaoResponse(xml);
}

function parseEventoResponse(xml: string): SefazResponse {
    return parseAutorizacaoResponse(xml);
}
