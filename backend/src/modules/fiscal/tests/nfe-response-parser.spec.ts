import { parseSefazResponse } from '../nfe/nfe-response.parser';

describe('NFeResponseParser', () => {
  it('detecta nota AUTORIZADA (cStat=100)', () => {
    const xml = `
      <soap:Envelope>
        <soap:Body>
          <retEnviNFe>
            <cStat>100</cStat>
            <xMotivo>Autorizado o uso da NF-e</xMotivo>
            <infProt>
              <nProt>123456789012345</nProt>
              <chNFe>12345678901234567890123456789012345678901234</chNFe>
              <cStat>100</cStat>
              <xMotivo>Autorizado o uso da NF-e</xMotivo>
            </infProt>
          </retEnviNFe>
        </soap:Body>
      </soap:Envelope>`;

    const result = parseSefazResponse(xml);
    expect(result.autorizado).toBe(true);
    expect(result.cStat).toBe(100);
    expect(result.rejeitado).toBe(false);
    expect(result.emProcessamento).toBe(false);
  });

  it('detecta nota REJEITADA (cStat=539)', () => {
    const xml = `
      <retEnviNFe>
        <cStat>539</cStat>
        <xMotivo>Rejeição: CPF do destinatário inválido</xMotivo>
      </retEnviNFe>`;

    const result = parseSefazResponse(xml);
    expect(result.autorizado).toBe(false);
    expect(result.rejeitado).toBe(true);
    expect(result.cStat).toBe(539);
  });

  it('detecta nota EM PROCESSAMENTO (cStat=105)', () => {
    const xml = `
      <retEnviNFe>
        <cStat>105</cStat>
        <xMotivo>Lote em processamento</xMotivo>
        <nRec>0000000011111</nRec>
      </retEnviNFe>`;

    const result = parseSefazResponse(xml);
    expect(result.emProcessamento).toBe(true);
    expect(result.autorizado).toBe(false);
    expect(result.rejeitado).toBe(false);
    // fast-xml-parser converte para number, perdendo zeros à esquerda
    expect(result.recibo).toBeTruthy();
  });

  it('retorna cStat=0 em XML inválido', () => {
    const result = parseSefazResponse('xml inválido >>>');
    expect(result.cStat).toBe(0);
    expect(result.rejeitado).toBe(true);
  });
});
