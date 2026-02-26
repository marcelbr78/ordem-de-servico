import { buildNFeXmlComplete } from '../nfe/nfe-xml.builder';
import { FiscalCliente } from '../entities/fiscal-cliente.entity';
import { FiscalProduto } from '../entities/fiscal-produto.entity';

describe('NFeXmlBuilder', () => {
    const emitente = {
        cnpj: '11222333000181',
        razaoSocial: 'EMPRESA TESTE LTDA',
        logradouro: 'Rua Teste',
        numero: '100',
        bairro: 'Centro',
        cMun: '4205407',
        xMun: 'Florianopolis',
        uf: 'SC',
        cep: '88010100',
        cPais: '1058',
        xPais: 'Brasil',
        ie: '111111111',
        crt: '1',
    };

    const cliente: Partial<FiscalCliente> = {
        nome: 'FULANO DE TAL',
        cpfCnpj: '52998224725',
        endereco: 'Rua Cliente',
        numero: '200',
        bairro: 'Bairro',
        cidade: 'Florianopolis',
        uf: 'SC',
        cep: '88000000',
        codigoIbge: '4205407',
    };

    const produto: Partial<FiscalProduto> = {
        id: 'prod-uuid-test-123456789012',
        nome: 'PRODUTO TESTE',
        ncm: '85044090',
        cfop: '5102',
        csosn: '400',
        aliquotaIcms: 0,
        aliquotaPis: 0.65,
        aliquotaCofins: 3,
        unidade: 'UN',
        valor: 100,
        estoque: 10,
    };

    it('gera XML com chave de 44 dígitos', () => {
        const result = buildNFeXmlComplete({
            numero: 1,
            serie: '001',
            ambiente: 2,
            emitente,
            cliente: cliente as FiscalCliente,
            itens: [{ produto: produto as FiscalProduto, quantidade: 1, valorUnitario: 100 }],
        });

        expect(result.chaveAcesso).toHaveLength(44);
        expect(/^\d{44}$/.test(result.chaveAcesso)).toBe(true);
    });

    it('gera XML contendo nfeProc ou NFe', () => {
        const result = buildNFeXmlComplete({
            numero: 2,
            serie: '001',
            ambiente: 2,
            emitente,
            cliente: cliente as FiscalCliente,
            itens: [{ produto: produto as FiscalProduto, quantidade: 2, valorUnitario: 50 }],
        });

        expect(result.xml).toContain('infNFe');
        expect(result.xml).toContain('versao="4.00"');
        expect(result.xml).toContain('<ide>');
        expect(result.xml).toContain('<emit>');
        expect(result.xml).toContain('<dest>');
    });

    it('calcula número da nota corretamente', () => {
        const result = buildNFeXmlComplete({
            numero: 42,
            serie: '001',
            ambiente: 2,
            emitente,
            cliente: cliente as FiscalCliente,
            itens: [{ produto: produto as FiscalProduto, quantidade: 1, valorUnitario: 200 }],
        });

        expect(result.numero).toBe(42);
        expect(result.xml).toContain('<nNF>000000042</nNF>');
    });
});
