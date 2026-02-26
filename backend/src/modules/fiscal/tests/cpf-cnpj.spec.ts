import { validateCpf, validateCnpj, validateCpfOrCnpj } from '../validators/cpf-cnpj.validator';

describe('CPF/CNPJ Validator', () => {
    describe('CPF', () => {
        it('valida CPF correto', () => {
            expect(validateCpf('529.982.247-25')).toBe(true);
            expect(validateCpf('52998224725')).toBe(true);
        });

        it('rejeita CPF inválido', () => {
            expect(validateCpf('123.456.789-00')).toBe(false);
            expect(validateCpf('111.111.111-11')).toBe(false);
            expect(validateCpf('000.000.000-00')).toBe(false);
        });

        it('rejeita CPF com tamanho errado', () => {
            expect(validateCpf('123')).toBe(false);
            expect(validateCpf('')).toBe(false);
        });
    });

    describe('CNPJ', () => {
        it('valida CNPJ correto', () => {
            expect(validateCnpj('11.222.333/0001-81')).toBe(true);
            expect(validateCnpj('11222333000181')).toBe(true);
        });

        it('rejeita CNPJ inválido', () => {
            expect(validateCnpj('11.111.111/1111-11')).toBe(false);
            expect(validateCnpj('00.000.000/0000-00')).toBe(false);
        });
    });

    describe('validateCpfOrCnpj', () => {
        it('aceita CPF válido', () => {
            expect(validateCpfOrCnpj('529.982.247-25')).toBe(true);
        });

        it('aceita CNPJ válido', () => {
            expect(validateCpfOrCnpj('11.222.333/0001-81')).toBe(true);
        });

        it('rejeita documento inválido', () => {
            expect(validateCpfOrCnpj('123456')).toBe(false);
        });
    });
});
