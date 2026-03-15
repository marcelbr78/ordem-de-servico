import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class WebhookPagamentoDto {
    /** ID do evento no gateway */
    @IsString()
    eventId: string;

    /** Tipo: payment.confirmed, payment.failed, etc. */
    @IsString()
    event: string;

    @IsNumber()
    amount: number;

    /** payment, pix, credit_card, boleto */
    @IsString()
    @IsOptional()
    method?: string;

    /** ID do pedido/OS no sistema */
    @IsString()
    @IsOptional()
    orderId?: string;

    /** ID do cliente fiscal */
    @IsString()
    @IsOptional()
    clienteId?: string;

    /** Metadados extras do gateway */
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
