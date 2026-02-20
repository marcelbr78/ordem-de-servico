import { forwardRef } from 'react';
import QRCode from "react-qr-code";

// Interfaces
interface OrderPrintProps {
    order: any;
    settings: any;
    type: 'client' | 'store' | 'term';
}

// Helpers
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

const safeDate = (date: any) => {
    try {
        if (!date) return '-';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '-' : d.toLocaleString('pt-BR');
    } catch { return '-'; }
};

const safeDateOnly = (date: any) => {
    try {
        if (!date) return '-';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
    } catch { return '-'; }
};

const getPhone = (client: any) => {
    try {
        if (client?.contatos && Array.isArray(client.contatos) && client.contatos.length > 0) {
            const principal = client.contatos.find((c: any) => c.principal);
            return principal?.numero || client.contatos[0]?.numero || '-';
        }
        return client?.phone || client?.telefone || client?.celular || '-';
    } catch { return '-'; }
};

// ─── STYLES ───
const s = {
    pageA4: {
        width: '210mm',
        minHeight: '297mm',
        padding: '20px', // Will be overridden in split layout
        margin: '0 auto',
        backgroundColor: 'white',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.3',
    },
    headerBox: {
        border: '1px solid #999',
        padding: '15px',
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
    },
    sectionBox: {
        border: '1px solid #999',
        marginBottom: '10px',
    },
    sectionTitle: {
        backgroundColor: '#eee',
        borderBottom: '1px solid #999',
        padding: '5px 10px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '8px',
        padding: '10px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '11px',
    },
    th: {
        borderBottom: '1px solid #ccc',
        textAlign: 'left' as const,
        padding: '6px',
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        color: '#555',
    },
    td: {
        borderBottom: '1px solid #eee',
        padding: '6px',
        verticalAlign: 'top' as const,
    },
    footerGrid: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '40px',
        marginTop: '40px',
        paddingTop: '20px',
    },
    signatureLine: {
        borderTop: '1px solid black',
        paddingTop: '5px',
        textAlign: 'center' as const,
        flex: 1,
    }
};

// ─── REUSABLE COMPONENTS ───────────────────────────────────────────────────

const HeaderA4 = ({ settings, order, title, compact }: { settings: any, order: any, title?: string, compact?: boolean }) => (
    <div style={{ ...s.headerBox, padding: compact ? '8px' : '15px', marginBottom: compact ? '4px' : '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {settings?.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" style={{ height: compact ? '40px' : '70px', maxWidth: '120px', objectFit: 'contain' }} />
            )}
            <div>
                <h1 style={{ fontSize: compact ? '14px' : '18px', fontWeight: 'bold', margin: '0 0 2px 0', textTransform: 'uppercase' }}>
                    {settings?.print_use_fantasy_name === 'true'
                        ? (settings?.company_fantasy_name || settings?.company_name || 'MINHA ASSISTÊNCIA')
                        : (settings?.company_name || 'MINHA ASSISTÊNCIA')
                    }
                </h1>
                <div style={{ fontSize: compact ? '10px' : '12px', color: '#444', lineHeight: '1.2' }}>
                    {settings?.print_show_address !== 'false' && (
                        <div>
                            {settings?.company_address_street}, {settings?.company_address_number}
                            {settings?.company_address_neighborhood ? ` - ${settings.company_address_neighborhood}` : ''}
                            {settings?.company_address_city ? ` - ${settings.company_address_city}/${settings.company_address_state}` : ''}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {settings?.print_show_cnpj !== 'false' && (
                            <>
                                {settings?.company_cnpj && <span><strong>CNPJ:</strong> {settings.company_cnpj}</span>}
                                {settings?.company_ie && <span><strong>IE:</strong> {settings.company_ie}</span>}
                            </>
                        )}
                        {settings?.print_show_phone !== 'false' && settings?.company_phone && (
                            <span><strong>Tel:</strong> {settings.company_phone}</span>
                        )}
                        {settings?.print_show_email !== 'false' && settings?.company_email && (
                            <span><strong>E-mail:</strong> {settings.company_email}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: compact ? '16px' : '24px', fontWeight: '900', margin: '0 0 2px 0', color: '#111' }}>
                {title || (settings?.print_header_text ? settings.print_header_text : "ORDEM DE SERVIÇO")}
            </h2>
            <div style={{ fontSize: compact ? '12px' : '16px', fontWeight: 'bold', color: '#666', marginBottom: '2px' }}>
                Nº {order.protocol || order.id?.toString().padStart(6, '0')}
            </div>
            <div style={{ fontSize: compact ? '9px' : '10px', fontWeight: 'bold' }}>
                Entrada: {safeDate(order.entryDate)}
            </div>
            <div style={{ fontSize: compact ? '9px' : '10px', fontWeight: 'bold' }}>
                Saída: {safeDateOnly(order.exitDate)}
            </div>
        </div>
    </div>
);

const ReceiptContent = ({ order, settings, type, isCopy }: { order: any, settings: any, type: string, isCopy?: boolean }) => {
    const isTerm = type === 'term';

    // Compact styles for half-page
    const cs = {
        ...s,
        sectionBox: { ...s.sectionBox, marginBottom: '5px' },
        sectionTitle: { ...s.sectionTitle, padding: '2px 5px', fontSize: '10px' },
        th: { ...s.th, padding: '2px 4px', fontSize: '10px' },
        td: { ...s.td, padding: '2px 4px', fontSize: '10px' },
        signatureLine: { ...s.signatureLine, paddingTop: '2px' },
        footerGrid: { ...s.footerGrid, marginTop: '5px', paddingTop: '5px', gap: '20px' }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <HeaderA4 settings={settings} order={order} title={isTerm ? "TERMO DE GARANTIA" : undefined} compact />

            <div style={{ flex: 1 }}>
                {/* DADOS DO CLIENTE */}
                <div style={cs.sectionBox}>
                    <div style={cs.sectionTitle}>Dados do Cliente</div>
                    <div style={{ ...cs.grid, gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', padding: '5px' }}>
                        <div style={{ gridColumn: 'span 8' }}>
                            <span style={{ fontWeight: 'bold' }}>{order.client?.nome || order.client?.name || 'Cliente'}</span>
                            <span style={{ fontSize: '10px', marginLeft: '8px', color: '#666' }}>CPF: {order.client?.cpfCnpj || '-'}</span>
                        </div>
                        <div style={{ gridColumn: 'span 4', textAlign: 'right' }}>
                            <span style={{ fontWeight: 'bold' }}>Tel: {getPhone(order.client)}</span>
                        </div>
                        <div style={{ gridColumn: 'span 12', fontSize: '10px', color: '#444' }}>
                            Endereço: {order.client?.rua || ''}, {order.client?.numero || ''} {order.client?.bairro ? `- ${order.client.bairro}` : ''} {order.client?.cidade ? `- ${order.client.cidade}/${order.client.estado}` : ''}
                        </div>
                    </div>
                </div>

                {/* EQUIPAMENTO & DEFEITO (Compactado) */}
                <div style={cs.sectionBox}>
                    <div style={cs.sectionTitle}>Equipamento & Defeito</div>
                    <div style={{ padding: '5px' }}>
                        {order.equipments?.map((eq: any, i: number) => (
                            <div key={i} style={{ marginBottom: '4px', fontSize: '11px' }}>
                                <strong>{eq.type} {eq.brand} {eq.model}</strong>
                                {eq.serial && <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>SN: {eq.serial}</span>}
                                <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>
                                    <strong>Defeito:</strong> {order.reportedDefect || '-'}
                                </div>
                                <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>
                                    <strong>Acessórios:</strong> {eq.accessories || 'Nenhum'} | <strong>Condição:</strong> {eq.condition || 'Padrão'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* LAUDO TÉCNICO */}
                {order.diagnosis && (
                    <div style={cs.sectionBox}>
                        <div style={cs.sectionTitle}  >Diagnóstico Técnico</div>
                        <div style={{ padding: '5px', fontSize: '11px' }}>{order.diagnosis}</div>
                    </div>
                )}


                {/* SERVIÇOS E PEÇAS */}
                {!isTerm && (
                    <div style={cs.sectionBox}>
                        <div style={cs.sectionTitle}>Serviços e Peças</div>
                        <table style={cs.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...cs.th, width: '50%' }}>Item</th>
                                    <th style={{ ...cs.th, width: '15%', textAlign: 'right' }}>Qtd</th>
                                    <th style={{ ...cs.th, width: '20%', textAlign: 'right' }}>Unit.</th>
                                    <th style={{ ...cs.th, width: '15%', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...(order.services || []), ...(order.parts || [])].map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td style={cs.td}>{item.name}</td>
                                        <td style={{ ...cs.td, textAlign: 'right' }}>{item.quantity}</td>
                                        <td style={{ ...cs.td, textAlign: 'right' }}>{formatCurrency(item.unitPrice || item.price)}</td>
                                        <td style={{ ...cs.td, textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency((item.unitPrice || item.price) * (item.quantity || 1))}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ backgroundColor: '#f9f9f9' }}>
                                    <td colSpan={3} style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', fontSize: '10px' }}>TOTAL:</td>
                                    <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>{formatCurrency(order.total || 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* TERMOS RESUMIDOS */}
                <div style={{ fontSize: '9px', color: '#666', textAlign: 'justify', lineHeight: '1.2', marginBottom: '5px', border: '1px solid #eee', padding: '4px' }}>
                    <strong>Termos e Condições:</strong> {settings?.service_terms?.slice(0, 250) || "Garantia de 90 dias para mão de obra. Equipamentos não retirados em 90 dias serão vendidos para custeio."}...
                </div>
            </div>

            {/* ASSINATURAS */}
            <div style={{ ...cs.footerGrid, marginTop: 'auto' }}>
                <div style={cs.signatureLine}>
                    <p style={{ fontWeight: 'bold', fontSize: '10px', margin: 0 }}>{order.client?.nome || 'Cliente'}</p>
                    <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>Cliente</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#888' }}>{isCopy ? '2ª VIA (LOJA)' : '1ª VIA (CLIENTE)'}</div>
                    <div style={{ fontSize: '9px', color: '#ccc' }}>{safeDate(new Date())}</div>
                </div>
                <div style={cs.signatureLine}>
                    <p style={{ fontWeight: 'bold', fontSize: '10px', margin: 0 }}>{settings?.storeName || 'Loja'}</p>
                    <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>Técnico</p>
                </div>
            </div>
        </div>
    );
};

const StandardTemplateA4 = ({ order, settings, type }: { order: any, settings: any, type: string }) => {
    // A4 Portrait: 210mm x 297mm. Half is ~148mm.
    return (
        <div style={{ ...s.pageA4, padding: 0, height: '297mm', display: 'flex', flexDirection: 'column' }}>
            {/* First Copy (Top) */}
            <div style={{
                height: '148.5mm',
                padding: '15px 20px',
                borderBottom: '1px dashed #999',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                <ReceiptContent order={order} settings={settings} type={type} />
            </div>

            {/* Second Copy (Bottom) */}
            <div style={{
                height: '148.5mm',
                padding: '15px 20px',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                <ReceiptContent order={order} settings={settings} type={type} isCopy />
            </div>
        </div>
    );
};

// ─── THERMAL COMPONENTS ──────────────────────────────────────────────────────

const ThermalTemplate = ({ order, settings, width }: { order: any, settings: any, width: string }) => {
    // 80mm ~ 300px, 58mm ~ 200px (approx visual width for screen preview, print driver handles actual scale)
    const containerStyle = {
        width: width === '80mm' ? '280px' : '180px', // slightly smaller to be safe
        margin: '0 auto',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: width === '80mm' ? '12px' : '10px',
        lineHeight: '1.2',
        color: 'black',
        backgroundColor: 'white',
        padding: '5px',
    };

    const separator = "----------------------------------------".slice(0, width === '80mm' ? 32 : 22);
    const center = (text: string) => <div style={{ textAlign: 'center' }}>{text}</div>;
    const row = { display: 'flex', justifyContent: 'space-between', marginBottom: '2px' };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>
                <div style={{ fontSize: '14px', textTransform: 'uppercase' }}>
                    {settings?.print_use_fantasy_name === 'true'
                        ? (settings?.company_fantasy_name || settings?.company_name || 'LOJA')
                        : (settings?.company_name || 'LOJA')
                    }
                </div>
                {settings?.print_show_address !== 'false' && (
                    <div style={{ fontWeight: 'normal', fontSize: '10px' }}>
                        {settings?.company_address_street}, {settings?.company_address_number}
                    </div>
                )}
                <div style={{ fontWeight: 'normal', fontSize: '10px' }}>
                    {settings?.print_show_phone !== 'false' && settings?.company_phone && <span>{settings.company_phone} </span>}
                    {settings?.print_show_email !== 'false' && settings?.company_email && <span>{settings.company_email}</span>}
                </div>
                {settings?.print_show_cnpj !== 'false' && settings?.company_cnpj && (
                    <div style={{ fontWeight: 'normal', fontSize: '10px' }}>CNPJ: {settings.company_cnpj}</div>
                )}
            </div>

            {center(separator)}

            <div style={{ margin: '5px 0' }}>
                <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>OS: {order.protocol}</div>
                <div style={{ textAlign: 'center', fontSize: '10px' }}>{safeDate(order.entryDate)}</div>
            </div>

            {center(separator)}

            {/* Client */}
            <div style={{ marginBottom: '5px' }}>
                <div><strong>CLI:</strong> {order.client?.nome || order.client?.name}</div>
                <div><strong>TEL:</strong> {getPhone(order.client)}</div>
            </div>

            {center(separator)}

            {/* Equipment */}
            <div style={{ marginBottom: '5px' }}>
                {order.equipments?.map((eq: any, i: number) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                        <div><strong>EQP:</strong> {eq.type} {eq.brand}</div>
                        <div><strong>MOD:</strong> {eq.model}</div>
                        <div><strong>DEF:</strong> {order.reportedDefect}</div>
                    </div>
                ))}
            </div>

            {center(separator)}

            {/* Items */}
            <div style={{ marginBottom: '5px' }}>
                {[...(order.services || []), ...(order.parts || [])].map((item: any, i: number) => (
                    <div key={i} style={row}>
                        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                            {item.quantity}x {item.name}
                        </span>
                        <span style={{ whiteSpace: 'nowrap' }}>
                            {formatCurrency((item.unitPrice || item.price) * (item.quantity || 1))}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: '1px dashed black', paddingTop: '4px', marginTop: '4px', ...row, fontWeight: 'bold' }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(order.total || 0)}</span>
            </div>

            <div style={{ margin: '15px 0', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', backgroundColor: 'white', padding: '2px' }}>
                    <QRCode value={`${window.location.origin}/status/${order.id}`} size={width === '80mm' ? 100 : 80} />
                </div>
                <div style={{ fontSize: '9px', marginTop: '2px' }}>Acompanhe sua OS</div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '15px' }}>
                <div style={{ borderBottom: '1px solid black', width: '80%', margin: '0 auto 5px auto' }}></div>
                <div>Assinatura Cliente</div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '15px', marginBottom: '10px' }}>
                {settings?.print_footer_text || "Obrigado pela preferência!"}
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const OrderPrint = forwardRef<HTMLDivElement, OrderPrintProps>(({ order, settings, type }, ref) => {
    const format = settings?.print_format || 'a4'; // 'a4', '80mm', '58mm'

    return (
        <div ref={ref} style={{ backgroundColor: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }}>
            <style type="text/css" media="print">
                {`
                    @page { size: auto; margin: ${format === 'a4' ? '0' : '0'}; }
                    body { background-color: white !important; -webkit-print-color-adjust: exact; }
                    * { color: black !important; border-color: black !important; }
                    .print-hidden { display: none !important; }
                `}
            </style>

            {format === 'a4'
                ? <StandardTemplateA4 order={order} settings={settings} type={type} />
                : <ThermalTemplate order={order} settings={settings} width={format} />
            }
        </div>
    );
});

OrderPrint.displayName = 'OrderPrint';
