import { create } from 'xmlbuilder2';
import { FiscalCliente } from '../entities/fiscal-cliente.entity';
import { FiscalProduto } from '../entities/fiscal-produto.entity';

export interface NFeItem {
    produto: FiscalProduto;
    quantidade: number;
    valorUnitario: number;
    desconto?: number;
}

export interface NFeData {
    numero: number;
    serie: string;
    ambiente: number; // 1=Produção, 2=Homologação
    emitente: EmitenteData;
    cliente: FiscalCliente;
    itens: NFeItem[];
    informacoesAdicionais?: string;
    finalidade?: number;
}

export interface EmitenteData {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cMun: string;
    xMun: string;
    uf: string;
    cep: string;
    cPais: string;
    xPais: string;
    fone?: string;
    ie: string; // Inscrição Estadual
    crt: string; // 1=Simples, 3=Normal
}



function buildIde(parent: any, ide: any) {
    parent.ele('ide')
        .ele('cUF').txt(ide.cUF).up()
        .ele('cNF').txt(ide.cNF).up()
        .ele('natOp').txt('VENDA DE MERCADORIA').up()
        .ele('mod').txt(ide.mod).up()
        .ele('serie').txt(ide.serie).up()
        .ele('nNF').txt(ide.nNF).up()
        .ele('dhEmi').txt(ide.dhEmi).up()
        .ele('dhSaiEnt').txt(ide.dhEmi).up()
        .ele('tpNF').txt(ide.tpNF).up()
        .ele('idDest').txt(ide.idDest || '1').up()
        .ele('cMunFG').txt(ide.cMunFG).up()
        .ele('tpImp').txt('1').up()
        .ele('tpEmis').txt('1').up()
        .ele('cDV').txt(String(ide.cDV)).up()
        .ele('tpAmb').txt(String(ide.ambiente)).up()
        .ele('finNFe').txt(String(ide.finalidade)).up()
        .ele('indFinal').txt('1').up()
        .ele('indPres').txt('1').up()
        .ele('procEmi').txt('0').up()
        .ele('verProc').txt('4.00').up()
        .up();
}

function buildEmitente(parent: any, emit: EmitenteData) {
    parent.ele('emit')
        .ele('CNPJ').txt(emit.cnpj).up()
        .ele('xNome').txt(emit.razaoSocial).up()
        .ele('xFant').txt(emit.nomeFantasia || emit.razaoSocial).up()
        .ele('enderEmit')
        .ele('xLgr').txt(emit.logradouro).up()
        .ele('nro').txt(emit.numero).up()
        .ele('xBairro').txt(emit.bairro).up()
        .ele('cMun').txt(emit.cMun).up()
        .ele('xMun').txt(emit.xMun).up()
        .ele('UF').txt(emit.uf).up()
        .ele('CEP').txt(emit.cep.replace(/\D/g, '')).up()
        .ele('cPais').txt(emit.cPais || '1058').up()
        .ele('xPais').txt(emit.xPais || 'Brasil').up()
        .ele('fone').txt((emit.fone || '').replace(/\D/g, '')).up()
        .up()
        .ele('IE').txt(emit.ie).up()
        .ele('CRT').txt(emit.crt).up()
        .up();
}

function buildDestinatarioNode(parent: any, cliente: FiscalCliente) {
    const dest = parent.ele('dest');
    const cpfCnpj = cliente.cpfCnpj.replace(/\D/g, '');

    if (cpfCnpj.length === 14) {
        dest.ele('CNPJ').txt(cpfCnpj).up();
    } else {
        dest.ele('CPF').txt(cpfCnpj).up();
    }

    dest.ele('xNome').txt(cliente.nome).up()
        .ele('enderDest')
        .ele('xLgr').txt(cliente.endereco || 'Não informado').up()
        .ele('nro').txt(cliente.numero || 'S/N').up()
        .ele('xBairro').txt(cliente.bairro || 'Não informado').up()
        .ele('cMun').txt(cliente.codigoIbge || '9999999').up()
        .ele('xMun').txt(cliente.cidade).up()
        .ele('UF').txt(cliente.uf).up()
        .ele('CEP').txt((cliente.cep || '00000000').replace(/\D/g, '')).up()
        .ele('cPais').txt('1058').up()
        .ele('xPais').txt('Brasil').up()
        .up()
        .ele('indIEDest').txt('9').up() // 9=Não Contribuinte
        .ele('email').txt(cliente.email || '').up()
        .up();
}

function buildItem(parent: any, item: NFeItem, nItem: number, crt: string) {
    const { produto, quantidade, valorUnitario, desconto = 0 } = item;
    const vProd = quantidade * valorUnitario;
    const vDesc = desconto;
    const vLiq = vProd - vDesc;

    const det = parent.ele('det', { nItem: String(nItem) });

    // prod
    det.ele('prod')
        .ele('cProd').txt(produto.id.slice(0, 20)).up()
        .ele('cEAN').txt('SEM GTIN').up()
        .ele('xProd').txt(produto.nome.slice(0, 120)).up()
        .ele('NCM').txt(produto.ncm).up()
        .ele('CFOP').txt(produto.cfop).up()
        .ele('uCom').txt(produto.unidade || 'UN').up()
        .ele('qCom').txt(quantidade.toFixed(4)).up()
        .ele('vUnCom').txt(valorUnitario.toFixed(10)).up()
        .ele('vProd').txt(vProd.toFixed(2)).up()
        .ele('cEANTrib').txt('SEM GTIN').up()
        .ele('uTrib').txt(produto.unidade || 'UN').up()
        .ele('qTrib').txt(quantidade.toFixed(4)).up()
        .ele('vUnTrib').txt(valorUnitario.toFixed(10)).up()
        .ele('vDesc').txt(vDesc.toFixed(2)).up()
        .ele('indTot').txt('1').up()
        .up();

    // imposto
    const imposto = det.ele('imposto');

    // ICMS — Simples Nacional (CSOSN) ou Regime Normal (CST)
    const icms = imposto.ele('ICMS');
    if (crt === '1' || crt === '2') {
        // Simples Nacional
        const csosn = produto.csosn || '400';
        icms.ele('ICMSSN400')
            .ele('orig').txt('0').up()
            .ele('CSOSN').txt(csosn).up()
            .up();
    } else {
        // Regime Normal
        icms.ele('ICMS00')
            .ele('orig').txt('0').up()
            .ele('CST').txt(produto.cst || '00').up()
            .ele('modBC').txt('3').up()
            .ele('vBC').txt(vLiq.toFixed(2)).up()
            .ele('pICMS').txt((produto.aliquotaIcms || 0).toFixed(2)).up()
            .ele('vICMS').txt((vLiq * (produto.aliquotaIcms || 0) / 100).toFixed(2)).up()
            .up();
    }
    icms.up();

    // PIS
    imposto.ele('PIS')
        .ele('PISAliq')
        .ele('CST').txt('01').up()
        .ele('vBC').txt(vLiq.toFixed(2)).up()
        .ele('pPIS').txt((produto.aliquotaPis || 0.65).toFixed(4)).up()
        .ele('vPIS').txt((vLiq * (produto.aliquotaPis || 0.65) / 100).toFixed(2)).up()
        .up()
        .up();

    // COFINS
    imposto.ele('COFINS')
        .ele('COFINSAliq')
        .ele('CST').txt('01').up()
        .ele('vBC').txt(vLiq.toFixed(2)).up()
        .ele('pCOFINS').txt((produto.aliquotaCofins || 3).toFixed(4)).up()
        .ele('vCOFINS').txt((vLiq * (produto.aliquotaCofins || 3) / 100).toFixed(2)).up()
        .up()
        .up();

    imposto.up();
    det.up();
}

function buildTotais(parent: any, vProd: number, vDesc: number, vNF: number) {
    const vPis = vNF * 0.0065;
    const vCofins = vNF * 0.03;

    parent.ele('total')
        .ele('ICMSTot')
        .ele('vBC').txt('0.00').up()
        .ele('vICMS').txt('0.00').up()
        .ele('vICMSDeson').txt('0.00').up()
        .ele('vFCP').txt('0.00').up()
        .ele('vBCST').txt('0.00').up()
        .ele('vST').txt('0.00').up()
        .ele('vFCPST').txt('0.00').up()
        .ele('vFCPSTRet').txt('0.00').up()
        .ele('vProd').txt(vProd.toFixed(2)).up()
        .ele('vFrete').txt('0.00').up()
        .ele('vSeg').txt('0.00').up()
        .ele('vDesc').txt(vDesc.toFixed(2)).up()
        .ele('vII').txt('0.00').up()
        .ele('vIPI').txt('0.00').up()
        .ele('vIPIDevol').txt('0.00').up()
        .ele('vPIS').txt(vPis.toFixed(2)).up()
        .ele('vCOFINS').txt(vCofins.toFixed(2)).up()
        .ele('vOutro').txt('0.00').up()
        .ele('vNF').txt(vNF.toFixed(2)).up()
        .up()
        .up();
}

function buildTransporte(parent: any) {
    parent.ele('transp')
        .ele('modFrete').txt('9').up() // 9=Sem frete
        .up();
}

function buildPagamento(parent: any, vNF: number) {
    parent.ele('pag')
        .ele('detPag')
        .ele('tPag').txt('01').up() // 01=Dinheiro
        .ele('vPag').txt(vNF.toFixed(2)).up()
        .up()
        .up();
}

function buildDestinatario(cliente: FiscalCliente): any[] { return []; }

/**
 * Dígito verificador da chave de acesso NF-e
 * Módulo 11, pesos 2 a 9 ciclicamente
 */
function calcularDigitoVerificador(chave: string): number {
    const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
    let soma = 0;
    let pesoIdx = 0;

    for (let i = chave.length - 1; i >= 0; i--) {
        soma += parseInt(chave[i]) * pesos[pesoIdx % 8];
        pesoIdx++;
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
}

function getCodigoUF(uf: string): string {
    const codigos: Record<string, string> = {
        RO: '11', AC: '12', AM: '13', RR: '14', PA: '15', AP: '16', TO: '17',
        MA: '21', PI: '22', CE: '23', RN: '24', PB: '25', PE: '26', AL: '27',
        SE: '28', BA: '29', MG: '31', ES: '32', RJ: '33', SP: '35',
        PR: '41', SC: '42', RS: '43', MS: '50', MT: '51', GO: '52', DF: '53',
    };
    return codigos[uf.toUpperCase()] || '42';
}

/**
 * Função principal que monta o XML completo da NF-e pronto para assinatura
 */
export function buildNFeXmlComplete(data: NFeData): { xml: string; chaveAcesso: string; numero: number } {
    const now = new Date();
    const dhEmi = formatDateBr(now);
    const cNF = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
    const cUF = getCodigoUF(data.emitente.uf);
    const mod = '55';
    const serie = data.serie.padStart(3, '0');
    const nNF = String(data.numero).padStart(9, '0');
    const tpEmis = '1';

    const aamm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const chaveBase = `${cUF}${aamm}${data.emitente.cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
    const cDV = calcularDigitoVerificador(chaveBase);
    const chaveAcesso = `${chaveBase}${cDV}`;
    const idNFe = `NFe${chaveAcesso}`;

    const totalProdutos = data.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
    const totalDesconto = data.itens.reduce((s, i) => s + (i.desconto || 0), 0);
    const vNF = totalProdutos - totalDesconto;

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('NFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe' })
        .ele('infNFe', { versao: '4.00', Id: idNFe });

    buildIde(doc, { cUF, cNF, mod, serie, nNF, dhEmi, tpNF: '1', idDest: '1', cMunFG: data.emitente.cMun, cDV, ambiente: data.ambiente, finalidade: data.finalidade || 1 });
    buildEmitente(doc, data.emitente);
    buildDestinatarioNode(doc, data.cliente);
    data.itens.forEach((item, idx) => buildItem(doc, item, idx + 1, data.emitente.crt));
    buildTotais(doc, totalProdutos, totalDesconto, vNF);
    buildTransporte(doc);
    buildPagamento(doc, vNF);

    if (data.informacoesAdicionais) {
        doc.ele('infAdic').ele('infCpl').txt(data.informacoesAdicionais).up().up();
    }

    const xml = doc.end({ prettyPrint: false });
    return { xml, chaveAcesso, numero: data.numero };
}

function formatDateBr(date: Date): string {
    const iso = date.toISOString();
    return iso.replace(/\.\d{3}Z$/, '-03:00');
}
