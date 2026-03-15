import React from 'react';

interface CurrencyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    style?: React.CSSProperties;
    id?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * Input de moeda brasileira (R$) que formata automaticamente enquanto o usuário digita.
 * O usuário digita apenas números, e o componente formata automaticamente.
 * Ex: digitar "30000" → exibe "300,00"
 *
 * O valor retornado pelo onChange é uma string numérica limpa (ex: "300.00")
 * para facilitar o uso com parseFloat().
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    placeholder = 'R$ 0,00',
    style,
    id,
    disabled = false,
    className,
}) => {
    // Formata um valor numérico para exibição em BRL
    const formatDisplay = (numericValue: string | number): string => {
        const raw = String(numericValue).replace(/\D/g, ''); // Remove tudo que não é dígito
        if (!raw || raw === '0') return '';
        const cents = parseInt(raw, 10); // Trata como centavos
        const reais = cents / 100;
        return reais.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Converte o valor atual para exibição
    const getDisplayValue = (): string => {
        if (!value && value !== 0) return '';
        // Se já é um número float (ex: 300.00), converte para centavos para exibir
        const asFloat = parseFloat(String(value));
        if (isNaN(asFloat)) return '';
        const centavos = Math.round(asFloat * 100);
        return formatDisplay(String(centavos));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, ''); // Só dígitos
        if (!raw) {
            onChange('');
            return;
        }
        const cents = parseInt(raw, 10);
        const reais = cents / 100;
        onChange(reais.toFixed(2)); // Retorna string no formato "300.00"
    };

    return (
        <input
            id={id}
            type="text"
            inputMode="numeric"
            value={getDisplayValue()}
            onChange={handleChange}
            placeholder={placeholder}
            style={style}
            disabled={disabled}
            className={className}
        />
    );
};
