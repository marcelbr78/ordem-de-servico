/**
 * Validação de CPF e CNPJ conforme algoritmo oficial da Receita Federal
 */

export function validateCpf(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false; // todos dígitos iguais

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cleaned[10]);
}

export function validateCnpj(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    const calcDigit = (digits: string, weights: number[]): number => {
        let sum = 0;
        for (let i = 0; i < digits.length; i++) sum += parseInt(digits[i]) * weights[i];
        const r = sum % 11;
        return r < 2 ? 0 : 11 - r;
    };

    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const d1 = calcDigit(cleaned.slice(0, 12), w1);
    if (d1 !== parseInt(cleaned[12])) return false;

    const d2 = calcDigit(cleaned.slice(0, 13), w2);
    return d2 === parseInt(cleaned[13]);
}

export function validateCpfOrCnpj(value: string): boolean {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) return validateCpf(cleaned);
    if (cleaned.length === 14) return validateCnpj(cleaned);
    return false;
}

export function formatCpfCnpj(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (cleaned.length === 14) {
        return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
}
