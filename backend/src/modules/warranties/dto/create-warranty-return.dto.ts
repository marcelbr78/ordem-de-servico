export class CreateWarrantyReturnDto {
    originalOrderId: string;
    defectDescription: string;
}

export class EvaluateWarrantyReturnDto {
    techEvaluation: string;
    isSameDefect: boolean;
}

export class DecideWarrantyReturnDto {
    warrantyValid: boolean;
    resolution?: string;
    denialReason?: string;
}
