import { RefundType } from '../entities/warranty-refund.entity';

export class CreateWarrantyRefundDto {
    originalOrderId: string;
    warrantyReturnId?: string;
    type: RefundType;
    amount?: number;
    reason: string;
}

export class AuthorizeRefundDto {
    approved: boolean;
    adminNotes?: string;
}
