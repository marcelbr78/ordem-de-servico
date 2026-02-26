import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { FiscalError, FiscalErrorCode } from '../fiscal.errors';
import * as fs from 'fs';

export interface CertificateData {
    certPem: string;
    keyPem: string;
}

/**
 * Carrega certificado A1 (.pfx) e extrai PEM
 */
export function loadCertificateFromPfx(pfxPath: string, password: string): CertificateData {
    try {
        let pfxBuffer: Buffer;
        if (pfxPath.startsWith('base64:')) {
            pfxBuffer = Buffer.from(pfxPath.replace('base64:', ''), 'base64');
        } else {
            pfxBuffer = fs.readFileSync(pfxPath);
        }

        const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
        const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);

        // Extrair certificado
        const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = certBags[forge.pki.oids.certBag]?.[0];
        if (!certBag?.cert) {
            throw new FiscalError('Certificado não encontrado no .pfx', FiscalErrorCode.CERTIFICATE_INVALID);
        }

        const cert = certBag.cert;

        // Verificar validade
        const now = new Date();
        if (now > cert.validity.notAfter) {
            throw new FiscalError(
                `Certificado expirado em ${cert.validity.notAfter.toLocaleDateString('pt-BR')}`,
                FiscalErrorCode.CERTIFICATE_EXPIRED,
            );
        }

        // Extrair chave privada
        const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
        if (!keyBag?.key) {
            throw new FiscalError('Chave privada não encontrada no .pfx', FiscalErrorCode.CERTIFICATE_INVALID);
        }

        const certPem = forge.pki.certificateToPem(cert);
        const keyPem = forge.pki.privateKeyToPem(keyBag.key as forge.pki.rsa.PrivateKey);

        return { certPem, keyPem };
    } catch (err) {
        if (err instanceof FiscalError) throw err;
        throw new FiscalError(
            `Erro ao carregar certificado: ${(err as Error).message}`,
            FiscalErrorCode.CERTIFICATE_INVALID,
            err,
        );
    }
}

/**
 * Assina o XML da NF-e usando XMLDSig SHA-256 com RSA
 * Assina o elemento <infNFe> referenciado pelo atributo Id
 */
export function signNFeXml(xml: string, cert: CertificateData): string {
    try {
        // xml-crypto aceita privateKey no construtor
        const sig = new SignedXml({
            privateKey: cert.keyPem,
            canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
            signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        });

        // Extrair o Id do infNFe para a referência
        const idMatch = xml.match(/Id="(NFe\d{44})"/);
        if (!idMatch) {
            throw new FiscalError('Id do infNFe não encontrado no XML', FiscalErrorCode.XML_BUILD_FAILED);
        }
        const refId = `#${idMatch[1]}`;

        sig.addReference({
            xpath: `//*[@Id='${idMatch[1]}']`,
            transforms: [
                'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
                'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
            ],
            digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
            uri: refId,
            digestValue: '',
        });

        // Adicionar certificado ao KeyInfo
        const certPemClean = cert.certPem
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .replace(/\n/g, '');

        sig.computeSignature(xml, {
            location: {
                reference: `//*[local-name()='infNFe']`,
                action: 'append',
            },
            existingPrefixes: {},
        });

        // Inserir X509Certificate no KeyInfo manualmente se necessário
        let signed = sig.getSignedXml();
        if (!signed.includes('X509Certificate')) {
            signed = signed.replace(
                '</KeyInfo>',
                `<X509Data><X509Certificate>${certPemClean}</X509Certificate></X509Data></KeyInfo>`,
            );
        }

        return signed;
    } catch (err) {
        if (err instanceof FiscalError) throw err;
        throw new FiscalError(
            `Falha ao assinar XML: ${(err as Error).message}`,
            FiscalErrorCode.SIGNATURE_FAILED,
            err,
        );
    }
}
