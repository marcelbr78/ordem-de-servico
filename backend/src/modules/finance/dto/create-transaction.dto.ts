export class CreateTransactionDto {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    paymentMethod?: string;
    category?: string;
    description?: string;
    orderId?: string;
    bankAccountId?: string;
    status?: string;
    dueDate?: string;
    paidDate?: string;
    competenceDate?: string;
    supplier?: string;
    costCenter?: string;
    notes?: string;
    documentNumber?: string;
    isRecurring?: boolean;
    recurrenceType?: string;
    recurrenceId?: string;
}
