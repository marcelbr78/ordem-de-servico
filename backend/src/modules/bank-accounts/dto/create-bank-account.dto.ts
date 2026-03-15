import { Transform } from 'class-transformer';

// Helper: convert empty strings to undefined so optional fields work correctly
const trimOrUndefined = ({ value }: { value: unknown }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
    }
    return value;
};

/**
 * DTO for creating / updating a bank account.
 * We intentionally skip strict class-validator decorators on optional string
 * fields because the global ValidatorPipe has `forbidNonWhitelisted: true` and
 * the frontend sends empty strings for unfilled optional fields.
 * The @Transform decorators normalise those empty strings to undefined.
 */
export class CreateBankAccountDto {
    // Required
    name: string;

    @Transform(trimOrUndefined)
    bank?: string;

    @Transform(trimOrUndefined)
    bankCode?: string;

    @Transform(trimOrUndefined)
    type?: string;

    @Transform(trimOrUndefined)
    agency?: string;

    @Transform(trimOrUndefined)
    agencyDigit?: string;

    @Transform(trimOrUndefined)
    account?: string;

    @Transform(trimOrUndefined)
    accountDigit?: string;

    @Transform(trimOrUndefined)
    pixKey?: string;

    @Transform(trimOrUndefined)
    pixKeyType?: string;

    @Transform(trimOrUndefined)
    holderName?: string;

    @Transform(trimOrUndefined)
    holderDocument?: string;

    @Transform(({ value }) => {
        if (value === undefined || value === '' || value === null) return 0;
        const n = parseFloat(String(value));
        return isNaN(n) ? 0 : n;
    })
    initialBalance?: number;

    isActive?: boolean;

    @Transform(trimOrUndefined)
    description?: string;

    @Transform(trimOrUndefined)
    color?: string;
}
