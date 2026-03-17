import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum TransactionType {
    INCOME  = 'INCOME',
    EXPENSE = 'EXPENSE',
}

export enum TransactionStatus {
    PENDING  = 'pending',   // a pagar / a receber
    PAID     = 'paid',      // pago / recebido
    OVERDUE  = 'overdue',   // atrasado
    CANCELED = 'canceled',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'text' }) type: TransactionType;

    @Column({ type: 'decimal', precision: 10, scale: 2 }) amount: number;

    @Column({ default: 'PIX' }) paymentMethod: string;

    @Column({ default: 'Outros' }) category: string;

    @Column({ nullable: true }) description: string;

    @Column({ nullable: true }) tenantId: string;

    @Column({ nullable: true }) orderId: string;

    @Column({ nullable: true }) bankAccountId: string;

    // Campos novos
    @Column({ type: 'text', default: TransactionStatus.PAID }) status: TransactionStatus;

    @Column({ nullable: true }) dueDate: string;        // data de vencimento
    @Column({ nullable: true }) paidDate: string;       // data de pagamento
    @Column({ nullable: true }) competenceDate: string; // competência (para DRE)
    @Column({ nullable: true }) supplier: string;       // fornecedor/cliente
    @Column({ nullable: true }) costCenter: string;     // centro de custo
    @Column({ nullable: true }) notes: string;          // observações
    @Column({ nullable: true }) documentNumber: string; // nº boleto/nota
    @Column({ nullable: true }) recurrenceId: string;   // agrupador de recorrência
    @Column({ default: false }) isRecurring: boolean;
    @Column({ nullable: true }) recurrenceType: string; // monthly, weekly, yearly

    @ManyToOne('BankAccount', { nullable: true })
    @JoinColumn({ name: 'bankAccountId' })
    bankAccount: any;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
