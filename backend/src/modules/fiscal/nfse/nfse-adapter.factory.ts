import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { FiscalCliente } from '../entities/fiscal-cliente.entity';
import { FiscalServico } from '../entities/fiscal-servico.entity';
import { FiscalError, FiscalErrorCode } from '../fiscal.errors';
import { CertificateData } from '../nfe/nfe-signer';

/** Padrões municipais suportados */
export enum NfsePattern {
    ABRASF = 'ABRASF',    // Padrão nacional LC 116
    BETHA = 'BETHA',       // Sistema Betha (SC, PR, RS)
    EQUIPLANO = 'EQUIPLANO',
    NACIONAL_RFB = 'NACIONAL_RFB', // Padrão RFB (DFe Nacional)
    GINFES = 'GINFES',    // Ginfes (Niterói, Londrina, etc.)
}

export interface NfseConfig {
    pattern: NfsePattern;
    urlWsdl?: string;
    urlRest?: string;
    codigoMunicipio: string;
    inscricaoMunicipal: string;
    cert: CertificateData;
    ambiente: number;
}

export interface NfseResult {
    numero?: string;
    protocolo?: string;
    xmlRetorno?: string;
    pdf?: string;
    autorizado: boolean;
    mensagem: string;
}

/**
 * Detecta o padrão municipal baseado no código IBGE
 * Base de dados simplificada — expandir conforme necessidade
 */
export function detectNfsePattern(codigoIbge: string): NfsePattern {
    const codigoPadrao: Record<string, NfsePattern> = {
        // Santa Catarina — Betha
        '4202404': NfsePattern.BETHA, // Blumenau
        '4205407': NfsePattern.BETHA, // Florianópolis
        '4209102': NfsePattern.BETHA, // Joinville
        '4204202': NfsePattern.BETHA, // Criciúma
        '4216602': NfsePattern.BETHA, // São José
        // São Paulo — ABRASF
        '3550308': NfsePattern.ABRASF, // São Paulo
        '3509502': NfsePattern.ABRASF, // Campinas
        '3543402': NfsePattern.ABRASF, // Ribeirão Preto
        // Rio de Janeiro
        '3304557': NfsePattern.GINFES, // Rio de Janeiro
        '3303302': NfsePattern.GINFES, // Niterói
        // Minas Gerais
        '3106200': NfsePattern.ABRASF, // Belo Horizonte
        // Paraná
        '4106902': NfsePattern.BETHA, // Curitiba
        '4113700': NfsePattern.BETHA, // Londrina
    };

    return codigoPadrao[codigoIbge] ?? NfsePattern.ABRASF;
}

/**
 * Adapter para padrão ABRASF (LC 116)
 */
@Injectable()
export class AbrasfAdapter {
    async emitir(cliente: FiscalCliente, servico: FiscalServico, config: NfseConfig, valor: number, discriminacao?: string): Promise<NfseResult> {
        const now = new Date().toISOString();
        const loteId = Date.now();

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsRequest xmlns="http://www.abrasf.org.br/ABRASF/arquivos/nfse.xsd">
  <LoteRps Id="lote${loteId}">
    <NumeroLote>${loteId}</NumeroLote>
    <CpfCnpj><Cnpj>${config.inscricaoMunicipal}</Cnpj></CpfCnpj>
    <InscricaoMunicipal>${config.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfRps Id="rps${loteId}">
          <IdentificacaoRps>
            <Numero>${loteId}</Numero>
            <Serie>1</Serie>
            <Tipo>1</Tipo>
          </IdentificacaoRps>
          <DataEmissao>${now}</DataEmissao>
          <NaturezaOperacao>1</NaturezaOperacao>
          <OptanteSimplesNacional>1</OptanteSimplesNacional>
          <IncentivadorCultural>2</IncentivadorCultural>
          <Status>1</Status>
          <Servico>
            <Valores>
              <ValorServicos>${valor.toFixed(2)}</ValorServicos>
              <ValorIss>${(valor * (servico.aliquotaIss / 100)).toFixed(2)}</ValorIss>
              <Aliquota>${(servico.aliquotaIss / 100).toFixed(4)}</Aliquota>
              <BaseCalculo>${valor.toFixed(2)}</BaseCalculo>
              <ValorLiquidoNfse>${valor.toFixed(2)}</ValorLiquidoNfse>
            </Valores>
            <IssRetido>2</IssRetido>
            <ItemListaServico>${servico.codigoServico}</ItemListaServico>
            <Discriminacao>${discriminacao || servico.descricao}</Discriminacao>
            <CodigoMunicipio>${config.codigoMunicipio}</CodigoMunicipio>
          </Servico>
          <Prestador>
            <CpfCnpj><Cnpj>${config.inscricaoMunicipal}</Cnpj></CpfCnpj>
            <InscricaoMunicipal>${config.inscricaoMunicipal}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                ${cliente.cpfCnpj.length === 14
                ? `<Cnpj>${cliente.cpfCnpj}</Cnpj>`
                : `<Cpf>${cliente.cpfCnpj}</Cpf>`}
              </CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${cliente.nome}</RazaoSocial>
            <Endereco>
              <Endereco>${cliente.endereco || ''}</Endereco>
              <Numero>${cliente.numero || 'S/N'}</Numero>
              <Bairro>${cliente.bairro || ''}</Bairro>
              <CodigoMunicipio>${cliente.codigoIbge || config.codigoMunicipio}</CodigoMunicipio>
              <Uf>${cliente.uf}</Uf>
              <Cep>${(cliente.cep || '').replace(/\D/g, '')}</Cep>
            </Endereco>
          </Tomador>
        </InfRps>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsRequest>`;

        try {
            // Em homologação, muitos municípios usam endpoint de teste
            const url = config.ambiente === 2
                ? (config.urlWsdl?.replace('/nfse', '/homolog/nfse') ?? config.urlWsdl)
                : config.urlWsdl;

            const response = await axios.post(url ?? '', xml, {
                headers: { 'Content-Type': 'application/xml' },
                timeout: 30000,
            });

            return parseAbrasfResponse(response.data);
        } catch (err: any) {
            return {
                autorizado: false,
                mensagem: `Erro ABRASF: ${err.message}`,
                xmlRetorno: xml,
            };
        }
    }
}

/**
 * Adapter para padrão Betha (SC, PR)
 */
@Injectable()
export class BethaAdapter {
    async emitir(cliente: FiscalCliente, servico: FiscalServico, config: NfseConfig, valor: number, discriminacao?: string): Promise<NfseResult> {
        // Betha usa SOAP com WSDL próprio
        const soapBody = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <RecepcionarLoteRps xmlns="http://www.betha.com.br/e-nota-contribuinte-ws">
      <xml><![CDATA[
        ${buildBethaXml(cliente, servico, config, valor, discriminacao)}
      ]]></xml>
    </RecepcionarLoteRps>
  </soap:Body>
</soap:Envelope>`;

        try {
            const response = await axios.post(config.urlWsdl ?? '', soapBody, {
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    SOAPAction: 'RecepcionarLoteRps',
                },
                timeout: 30000,
            });
            return parseBethaResponse(response.data);
        } catch (err: any) {
            return { autorizado: false, mensagem: `Erro Betha: ${err.message}` };
        }
    }
}

function buildBethaXml(cliente: FiscalCliente, servico: FiscalServico, config: NfseConfig, valor: number, discriminacao?: string): string {
    const loteId = Date.now();
    return `<LoteRps xmlns="http://www.betha.com.br/e-nota-contribuinte-ws/nfse" versao="2.02">
    <NumeroLote>${loteId}</NumeroLote>
    <CpfCnpj><Cnpj>${config.inscricaoMunicipal}</Cnpj></CpfCnpj>
    <InscricaoMunicipal>${config.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps versao="2.02">
        <Id>rps${loteId}</Id>
        <Numero>${loteId}</Numero>
        <Serie>1</Serie>
        <ItemListaServico>${servico.codigoServico}</ItemListaServico>
        <Discriminacao>${discriminacao || servico.descricao}</Discriminacao>
        <ValorServico>${valor.toFixed(2)}</ValorServico>
        <Aliquota>${servico.aliquotaIss}</Aliquota>
      </Rps>
    </ListaRps>
  </LoteRps>`;
}

function parseAbrasfResponse(xml: string): NfseResult {
    const numMatch = xml.match(/<Numero>(\d+)<\/Numero>/);
    const errMatch = xml.match(/<Mensagem>([^<]+)<\/Mensagem>/);
    return {
        autorizado: !xml.includes('ListaMensagemRetorno'),
        numero: numMatch?.[1],
        mensagem: errMatch?.[1] || (xml.includes('ListaMensagemRetorno') ? 'Rejeitada' : 'Autorizada'),
        xmlRetorno: xml,
    };
}

function parseBethaResponse(xml: string): NfseResult {
    const numMatch = xml.match(/<Numero>(\d+)<\/Numero>/);
    const errMatch = xml.match(/<Descricao>([^<]+)<\/Descricao>/);
    return {
        autorizado: !xml.toLowerCase().includes('erro') && !xml.includes('ListaMensagemRetorno'),
        numero: numMatch?.[1],
        mensagem: errMatch?.[1] || 'Processado',
        xmlRetorno: xml,
    };
}

/**
 * Factory: retorna o adapter correto baseado no padrão
 */
@Injectable()
export class NfseAdapterFactory {
    constructor(
        private readonly abrasf: AbrasfAdapter,
        private readonly betha: BethaAdapter,
    ) { }

    getAdapter(pattern: NfsePattern): AbrasfAdapter | BethaAdapter {
        switch (pattern) {
            case NfsePattern.BETHA:
                return this.betha;
            case NfsePattern.ABRASF:
            default:
                return this.abrasf;
        }
    }
}
