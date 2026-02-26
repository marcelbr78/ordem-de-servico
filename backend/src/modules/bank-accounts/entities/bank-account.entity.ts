import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AccountType {
    CHECKING = 'corrente',
    SAVINGS = 'poupanca',
    PAYMENT = 'pagamento',
    CASH = 'caixa',
}

@Entity('bank_accounts')
export class BankAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // Ex: "Conta Bradesco Principal"

    @Column({ nullable: true })
    bank: string; // Ex: "Bradesco", "Nubank", "Itaú"

    @Column({ nullable: true })
    bankCode: string; // Código do banco (237, 341, etc)

    @Column({ type: 'varchar', default: AccountType.CHECKING })
    type: AccountType;

    @Column({ nullable: true })
    agency: string;

    @Column({ nullable: true })
    agencyDigit: string;

    @Column({ nullable: true })
    account: string;

    @Column({ nullable: true })
    accountDigit: string;

    @Column({ nullable: true })
    pixKey: string; // Chave PIX

    @Column({ nullable: true })
    pixKeyType: string; // cpf, cnpj, email, telefone, aleatoria

    @Column({ nullable: true })
    holderName: string; // Nome do titular

    @Column({ nullable: true })
    holderDocument: string; // CPF/CNPJ do titular

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    initialBalance: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    currentBalance: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    color: string; // Cor para identificação visual

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
