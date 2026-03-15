import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

function isValidCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10))) return false;

    return true;
}

function isValidCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleaned.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleaned.charAt(13))) return false;

    return true;
}

export function IsValidCpfCnpj(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isValidCpfCnpj',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') return false;
                    const cleaned = value.replace(/\D/g, '');
                    const obj = args.object as any;

                    if (obj.tipo === 'PF') {
                        return isValidCPF(cleaned);
                    } else if (obj.tipo === 'PJ') {
                        return isValidCNPJ(cleaned);
                    }

                    // Accept either valid CPF or CNPJ if tipo not specified
                    return isValidCPF(cleaned) || isValidCNPJ(cleaned);
                },
                defaultMessage(args: ValidationArguments) {
                    const obj = args.object as any;
                    if (obj.tipo === 'PF') return 'CPF inválido';
                    if (obj.tipo === 'PJ') return 'CNPJ inválido';
                    return 'CPF/CNPJ inválido';
                },
            },
        });
    };
}

export { isValidCPF, isValidCNPJ };
