export class FiscalError extends Error {
    constructor(
        message: string,
        public readonly code: FiscalErrorCode,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'FiscalError';
    }
}

export enum FiscalErrorCode {
    INVALID_CPF_CNPJ = 'INVALID_CPF_CNPJ',
    INVALID_SCHEMA = 'INVALID_SCHEMA',
    CERTIFICATE_EXPIRED = 'CERTIFICATE_EXPIRED',
    CERTIFICATE_INVALID = 'CERTIFICATE_INVALID',
    SEFAZ_TIMEOUT = 'SEFAZ_TIMEOUT',
    SEFAZ_REJECTION = 'SEFAZ_REJECTION',
    SEFAZ_ERROR = 'SEFAZ_ERROR',
    NOTA_NOT_FOUND = 'NOTA_NOT_FOUND',
    STOCK_INSUFFICIENT = 'STOCK_INSUFFICIENT',
    NFSE_UNSUPPORTED_CITY = 'NFSE_UNSUPPORTED_CITY',
    EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
    XML_BUILD_FAILED = 'XML_BUILD_FAILED',
    SIGNATURE_FAILED = 'SIGNATURE_FAILED',
}
