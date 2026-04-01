import React, { useState, useRef } from 'react';
import api from '../../services/api';
import {
    X, CheckCircle, Download, RefreshCw, Pen, Trash2,
    FileText,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────
interface DeliveryReceiptProps {
    order: any;
    onClose: () => void;
    onSuccess: () => void;
    settings: Record<string, string>;
}

// ── Utils ────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = (d?: any) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const now = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Canvas de assinatura ─────────────────────────────────────
const SignaturePad: React.FC<{ onChange: (dataUrl: string | null) => void }> = ({ onChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing   = useRef(false);
    const hasDrawn  = useRef(false);

    const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            const t = e.touches[0];
            return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
        }
        return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current!;
        const ctx = getCtx()!;
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        drawing.current = true;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!drawing.current) return;
        const canvas = canvasRef.current!;
        const ctx = getCtx()!;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1a1a2e';
        const pos = getPos(e, canvas);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.moveTo(pos.x, pos.y);
        hasDrawn.current = true;
    };

    const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        drawing.current = false;
        if (hasDrawn.current) onChange(canvasRef.current!.toDataURL('image/png'));
    };

    const clear = () => {
        const canvas = canvasRef.current!;
        const ctx = getCtx()!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn.current = false;
        onChange(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '10px', overflow: 'hidden', background: '#f8f9fa', touchAction: 'none' }}>
                <canvas
                    ref={canvasRef}
                    width={500} height={150}
                    style={{ width: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                />
                <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', color: 'rgba(0,0,0,0.2)', pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    Assine aqui
                </div>
            </div>
            <button onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                <Trash2 size={12}/> Limpar
            </button>
        </div>
    );
};

// ── Componente principal ─────────────────────────────────────
export const DeliveryReceiptModal: React.FC<DeliveryReceiptProps> = ({ order, onClose, onSuccess, settings }) => {
    const [step, setStep]           = useState<'review' | 'sign' | 'done'>('review');
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [signerName, setSignerName]       = useState(order?.client?.nome || '');
    const [signerDoc, setSignerDoc]         = useState(order?.client?.cpfCnpj || '');
    const [notes, setNotes]                 = useState('');
    const [saving, setSaving]               = useState(false);
    const [receiptId, setReceiptId]         = useState<string | null>(null);

    // Dados do recibo
    const parts = order?.parts || [];
    const totalParts = parts.reduce((s: number, p: any) => s + (Number(p.unitPrice) * Number(p.quantity)), 0);
    const totalValue = Number(order?.finalValue) || totalParts || Number(order?.estimatedValue) || 0;
    const equip = order?.equipments?.[0];
    const warrantyDays = order?.warrantyDays || 90;
    const warrantyExpiry = new Date(); warrantyExpiry.setDate(warrantyExpiry.getDate() + warrantyDays);

    const submit = async () => {
        setSaving(true);
        try {
            // Salvar assinatura e dados do recibo como metadado da OS
            const payload = {
                receiptSignature: signatureData,
                receiptSignerName: signerName,
                receiptSignerDoc: signerDoc,
                receiptNotes: notes,
                receiptAt: new Date().toISOString(),
            };
            await api.patch(`/orders/${order.id}`, payload);
            setReceiptId(order.id);
            setStep('done');
            onSuccess();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Erro ao salvar recibo.');
        } finally {
            setSaving(false);
        }
    };

    const printReceipt = () => {
        const win = window.open('', '_blank', 'width=800,height=700');
        if (!win) return;

        const companyName = settings.print_use_fantasy_name === 'true'
            ? (settings.company_fantasy_name || settings.company_name || 'Assistência Técnica')
            : (settings.company_name || 'Assistência Técnica');

        const showAddress = settings.print_show_address !== 'false';
        const showCnpj    = settings.print_show_cnpj !== 'false';
        const showPhone   = settings.print_show_phone !== 'false';
        const showEmail   = settings.print_show_email !== 'false';

        const addressLine = showAddress && settings.company_address_street
            ? `${settings.company_address_street}${settings.company_address_number ? `, ${settings.company_address_number}` : ''}${settings.company_address_neighborhood ? ` - ${settings.company_address_neighborhood}` : ''}${settings.company_address_city ? ` - ${settings.company_address_city}/${settings.company_address_state}` : ''}`
            : '';

        const infoLine = [
            showCnpj && settings.company_cnpj ? `CNPJ: ${settings.company_cnpj}` : '',
            showPhone && settings.company_phone ? `Tel: ${settings.company_phone}` : '',
            showEmail && settings.company_email ? settings.company_email : '',
        ].filter(Boolean).join(' · ');

        const termsText = settings.terms_delivery || settings.terms_warranty || 'Garantia de 90 dias para mão de obra.';

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Termo de Entrega — ${order.protocol}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
  body { padding: 24px; font-size: 13px; color: #111; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 16px; gap: 16px; }
  .company { font-size: 17px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; }
  .company-info { font-size: 10px; color: #555; margin-top: 3px; line-height: 1.4; }
  .title { font-size: 15px; font-weight: 700; text-align: right; white-space: nowrap; }
  .badge { display: inline-block; background: #e0f2fe; color: #0369a1; font-weight: 700; padding: 3px 10px; border-radius: 20px; font-size: 12px; }
  section { margin-bottom: 14px; }
  section h3 { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; background: #f1f5f9; padding: 5px 8px; border-radius: 4px; margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field label { display: block; font-size: 10px; color: #9ca3af; font-weight: 700; text-transform: uppercase; margin-bottom: 1px; }
  .field span { font-size: 13px; font-weight: 500; color: #111; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; padding: 5px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  td { padding: 6px 8px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
  .total { text-align: right; font-size: 16px; font-weight: 800; color: #1d4ed8; margin-top: 6px; }
  .terms { font-size: 10px; color: #555; border: 1px solid #eee; padding: 8px; border-radius: 4px; line-height: 1.5; white-space: pre-wrap; }
  .sig-block { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
  .sig-line { border-top: 1px solid #374151; margin-top: 60px; padding-top: 4px; font-size: 10px; text-align: center; color: #6b7280; }
  .sig-img { margin: 0 auto; display: block; max-height: 80px; }
  .approved { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; padding: 8px 12px; color: #166534; font-size: 11px; margin-top: 8px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<div class="header">
  <div>
    ${settings.company_logo_url ? `<img src="${settings.company_logo_url}" alt="Logo" style="height:40px;max-width:120px;object-fit:contain;display:block;margin-bottom:4px"/>` : ''}
    <div class="company">${companyName}</div>
    ${addressLine ? `<div class="company-info">${addressLine}</div>` : ''}
    ${infoLine ? `<div class="company-info">${infoLine}</div>` : ''}
  </div>
  <div style="text-align:right">
    <div class="title">${settings.print_header_text || 'TERMO DE ENTREGA'}</div>
    <div style="margin-top:4px"><span class="badge">#${order.protocol}</span></div>
    <div style="font-size:11px;color:#6b7280;margin-top:3px">${now()}</div>
  </div>
</div>

<section>
  <h3>Dados do Cliente</h3>
  <div class="grid">
    <div class="field"><label>Nome</label><span>${signerName || order?.client?.nome || '—'}</span></div>
    <div class="field"><label>CPF/CNPJ</label><span>${signerDoc || order?.client?.cpfCnpj || '—'}</span></div>
  </div>
</section>

<section>
  <h3>Equipamento</h3>
  <div class="grid">
    <div class="field"><label>Equipamento</label><span>${equip ? `${equip.brand || equip.marca || '?'} ${equip.model || equip.modelo || '?'}` : '—'}</span></div>
    <div class="field"><label>Serial / IMEI</label><span>${equip?.serial || '—'}</span></div>
    ${order?.reportedDefect ? `<div class="field" style="grid-column:1/-1"><label>Defeito Relatado</label><span>${order.reportedDefect}</span></div>` : ''}
    ${order?.diagnosis ? `<div class="field" style="grid-column:1/-1"><label>Diagnóstico / Serviço</label><span>${order.diagnosis}</span></div>` : ''}
  </div>
</section>

${parts.length > 0 ? `<section>
  <h3>Peças e Serviços</h3>
  <table>
    <thead><tr><th>Descrição</th><th style="text-align:center">Qtd</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>
      ${parts.map((p: any) => `<tr><td>${p.product?.name || 'Peça'}</td><td style="text-align:center">${p.quantity}</td><td style="text-align:right">R$ ${(Number(p.unitPrice) * Number(p.quantity)).toFixed(2)}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="total">Total: ${R$(totalValue)}</div>
</section>` : `<section><h3>Valor do Serviço</h3><div class="total">${R$(totalValue)}</div></section>`}

<section>
  <h3>Garantia</h3>
  <div class="grid">
    <div class="field"><label>Dias de Garantia</label><span>${warrantyDays} dias</span></div>
    <div class="field"><label>Válida até</label><span>${warrantyExpiry.toLocaleDateString('pt-BR')}</span></div>
  </div>
</section>

${notes ? `<section><h3>Observações</h3><p style="font-size:12px;color:#374151">${notes}</p></section>` : ''}

<section>
  <h3>Termos e Condições</h3>
  <div class="terms">${termsText}</div>
</section>

<div class="approved">
  ✓ Equipamento retirado e em bom estado. O cliente declara estar ciente dos serviços realizados e das condições de garantia.
</div>

<div class="sig-block">
  <div>
    <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:4px">Assinatura do Cliente</div>
    ${signatureData ? `<img src="${signatureData}" class="sig-img"/>` : ''}
    <div class="sig-line">${signerName || order?.client?.nome || '—'}</div>
  </div>
  <div>
    <div class="sig-line">Responsável pela Entrega — ${companyName}</div>
  </div>
</div>
</body></html>`;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
            <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', width: '100%', maxWidth: '620px', maxHeight: '94dvh', overflowY: 'auto' }}>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

                {/* Header */}
                <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={17} color="#22c55e"/>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Recibo de Entrega Digital</h3>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>OS #{order.protocol}</div>
                        </div>
                    </div>
                    {step !== 'done' && (
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={15}/></button>
                    )}
                </div>

                <div style={{ padding: '18px 22px' }}>
                    {/* Steps */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '20px' }}>
                        {[['1', 'Revisar'], ['2', 'Assinar'], ['3', 'Concluído']].map(([num, label], i) => {
                            const isActive = (i === 0 && step === 'review') || (i === 1 && step === 'sign') || (i === 2 && step === 'done');
                            const isDone = (i === 0 && step !== 'review') || (i === 1 && step === 'done');
                            return (
                                <React.Fragment key={num}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, background: isDone ? '#22c55e' : isActive ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: isDone || isActive ? '#fff' : 'rgba(255,255,255,0.3)', border: `2px solid ${isDone ? '#22c55e' : isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.2s' }}>
                                            {isDone ? '✓' : num}
                                        </div>
                                        <span style={{ fontSize: '11px', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                                    </div>
                                    {i < 2 && <div style={{ flex: 1, height: '2px', background: isDone ? '#22c55e' : 'rgba(255,255,255,0.08)', margin: '0 8px 18px', transition: 'all 0.2s' }}/>}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* ── STEP 1: REVISÃO ── */}
                    {step === 'review' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Equipamento */}
                            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px' }}>📱 Equipamento</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Modelo:</span> <strong style={{ color: '#fff' }}>{equip ? `${equip.brand || equip.marca} ${equip.model || equip.modelo}` : '—'}</strong></div>
                                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Serial:</span> <strong style={{ color: '#fff' }}>{equip?.serial || '—'}</strong></div>
                                    {order?.reportedDefect && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>Defeito:</span> <strong style={{ color: '#fff' }}>{order.reportedDefect}</strong></div>}
                                </div>
                            </div>

                            {/* Valor */}
                            <div style={{ padding: '14px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>💰 Valor Cobrado</div>
                                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#22c55e', letterSpacing: '-0.5px' }}>{R$(totalValue)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>🛡️ Garantia</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>{warrantyDays} dias</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>até {warrantyExpiry.toLocaleDateString('pt-BR')}</div>
                                </div>
                            </div>

                            {/* Dados do signatário */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome de quem retira *</label>
                                    <input value={signerName} onChange={e => setSignerName(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="Nome completo" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CPF / Documento</label>
                                    <input value={signerDoc} onChange={e => setSignerDoc(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="000.000.000-00" />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Observações (opcional)</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', minHeight: '56px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Acessórios entregues, avaria pré-existente..." />
                                </div>
                            </div>

                            <button onClick={() => setStep('sign')} disabled={!signerName.trim()} style={{ padding: '13px', borderRadius: '11px', background: signerName.trim() ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: signerName.trim() ? 'pointer' : 'not-allowed', opacity: signerName.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Pen size={16}/> Ir para Assinatura →
                            </button>
                        </div>
                    )}

                    {/* ── STEP 2: ASSINATURA ── */}
                    {step === 'sign' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '12px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', fontSize: '13px', color: '#93c5fd' }}>
                                <strong>{signerName}</strong> — confirme a entrega com assinatura digital abaixo, ou imprima o recibo para assinar no papel.
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                                    ✍️ Assinatura digital <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>(opcional)</span>
                                </label>
                                <SignaturePad onChange={setSignatureData}/>
                            </div>

                            {/* Separador */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>OU</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
                            </div>

                            {/* Botão imprimir no papel */}
                            <button
                                onClick={async () => { printReceipt(); await submit(); }}
                                disabled={saving}
                                style={{ padding: '11px', borderRadius: '9px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Download size={14}/> Imprimir para assinar no papel
                            </button>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setStep('review')} style={{ flex: 1, padding: '11px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>← Voltar</button>
                                <button onClick={submit} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: '9px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
                                    {saving ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }}/> Salvando...</> : <><CheckCircle size={15}/> Confirmar Entrega</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: CONCLUÍDO ── */}
                    {step === 'done' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(34,197,94,0.3)' }}>
                                <CheckCircle size={32} color="#22c55e"/>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#22c55e', margin: '0 0 6px' }}>Entrega Confirmada!</h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                                    Recibo assinado por <strong style={{ color: '#fff' }}>{signerName}</strong> em {now()}
                                </p>
                            </div>

                            {signatureData && (
                                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', width: '100%' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Assinatura capturada:</div>
                                    <img src={signatureData} alt="Assinatura" style={{ maxHeight: '80px', filter: 'invert(1)', display: 'block', margin: '0 auto' }}/>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                                <button onClick={printReceipt} style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', borderRadius: '9px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                                    <Download size={14}/> Imprimir / PDF
                                </button>
                                <button onClick={onClose} style={{ flex: 1, minWidth: '140px', padding: '11px', borderRadius: '9px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
