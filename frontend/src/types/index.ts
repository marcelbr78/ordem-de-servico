export interface Client {
    id: string;
    nome: string;
    email?: string;
    cpfCnpj?: string;
    endereco?: string;
    contatos?: { numero: string; principal: boolean; tipo?: string }[];
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    brand?: string;
    category?: string;
    unit: string;
    priceCost: number;
    priceSell: number;
}

export interface OrderEquipment {
    id?: string; // Optional for new creation forms
    type: string;
    brand: string;
    model: string;
    serialNumber?: string;
    reportedDefect: string;
    accessories?: string;
    condition?: string;
    functionalChecklist?: string;
    isMain: boolean;
}

export interface OrderHistory {
    id: string;
    previousStatus: string;
    newStatus: string;
    actionType: 'STATUS_CHANGE' | 'COMMENT' | 'SYSTEM' | 'PHOTO' | 'INTEGRATION';
    comments: string;
    userId: string;
    createdAt: string;
}

export interface OrderPhoto {
    id: string;
    url: string;
    category: string;
    description?: string;
}

export interface OrderPart {
    id: string;
    orderId: string;
    productId: string;
    product: Product;
    quantity: number;
    unitPrice: number;
    unitCost: number;
}

export interface Order {
    id: string;
    protocol: string;
    status: 'ABERTA' | 'EM_DIAGNOSTICO' | 'AGUARDANDO_APROVACAO' | 'AGUARDANDO_PECA' | 'EM_REPARO' | 'TESTES' | 'FINALIZADA' | 'ENTREGUE' | 'CANCELADA';
    priority: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
    clientId: string;
    client?: Client;
    technicianId: string;
    equipments: OrderEquipment[];
    history: OrderHistory[];
    photos: OrderPhoto[];
    entryDate: string;
    exitDate?: string;
    estimatedValue?: number;
    finalValue?: number;
    initialObservations?: string;
    technicalReport?: string;
    parts?: OrderPart[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}
