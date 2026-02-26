import React, { useState, useEffect } from 'react';
import {
    FileText, Loader2, CheckCircle2, XCircle, Clock,
    Download, AlertTriangle, Receipt, Wrench, Package,
} from 'lucide-react';
import api from '../../services/api';
import type { Order } from '../../types';

interface FiscalTabProps {
    order: Order;
}

interface FiscalCliente {
    id: string;
    nome: string;
    cpfCnpj: string;
    cidade: string;
    uf: string;
}

interface FiscalProduto {
    id: string;
    nome: string;
    ncm: string;
    cfop: string;
    valor: number;
    estoque: number;
}

interface FiscalServico {
    id: string;
    descricao: string;
    codigoServico: string;
    aliquotaIss: number;
    valor: number;
}

interface Nota {
    id: string;
    orderId?: string;
    tipo: 'produto' | 'servico';
    status: 'pendente' | 'aguardando' | 'autorizada' | 'rejeitada' | 'cancelada';
    numero?: number;
    serie?: string;
    chaveAcesso?: string;
    protocolo?: string;
    cStat?: number;
    xMotivo?: string;
    valorTotal: number;
    ambiente: number;
    createdAt: string;
    erroDetalhes?: string;
}

const STATUS_NOTA = {
    pendente: { label: 'Pendente', color: '#f59e0b', icon: Clock },
    aguardando: { label: 'Aguardando', color: '#3b82f6', icon: Loader2 },
    autorizada: { label: 'Autorizada', color: '#10b981', icon: CheckCircle2 },
    rejeitada: { label: 'Rejeitada', color: '#ef4444', icon: XCircle },
    cancelada: { label: 'Cancelada', color: '#6b7280', icon: XCircle },
};

const fmtMoney = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtDate = (d: string) =>
    new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─────────────────────────────────────────────────────────────────
//  Modal de emissão NF-e (produto)
// ─────────────────────────────────────────────────────────────────
const NFeModal: React.FC<{
    order: Order;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ order, onClose, onSuccess }) => {
    const [clientes, setClientes] = useState<FiscalCliente[]>([]);
    const [produtos, setProdutos] = useState<FiscalProduto[]>([]);
    const [clienteId, setClienteId] = useState('');
    const [itens, setItens] = useState<Array<{ produtoId: string; quantidade: number; valorUnitario: number }>>([
        { produtoId: '', quantidade: 1, valorUnitario: 0 },
    ]);
    const [ambiente, setAmbiente] = useState(2);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        api.get('/fiscal/clientes').then(r => setClientes(r.data)).catch(() => { });
        api.get('/fiscal/produtos').then(r => setProdutos(r.data)).catch(() => { });
    }, []);

    const total = itens.reduce((s, i) => s + (i.quantidade * i.valorUnitario), 0);

    const addItem = () => setItens(prev => [...prev, { produtoId: '', quantidade: 1, valorUnitario: 0 }]);
    const removeItem = (idx: number) => setItens(prev => prev.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: string, value: any) =>
        setItens(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

    const handleSelectProduto = (idx: number, prodId: string) => {
        const prod = produtos.find(p => p.id === prodId);
        setItens(prev => prev.map((item, i) =>
            i === idx ? { ...item, produtoId: prodId, valorUnitario: prod?.valor || item.valorUnitario } : item
        ));
    };

    const handleEmitir = async () => {
        if (!clienteId) return setErro('Selecione o cliente fiscal.');
        if (itens.some(i => !i.produtoId)) return setErro('Selecione o produto em todos os itens.');
        setErro('');
        setLoading(true);
        try {
            await api.post('/fiscal/nfe', {
                clienteId,
                itens,
                ambiente,
                orderId: order.id,
            });
            onSuccess();
        } catch (e: any) {
            const msg = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao emitir NF-e';
            setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
            <div style={{ background: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} style={{ color: '#6366f1' }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Emitir NF-e de Produto</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>OS #{order.protocol} · Modelo 55</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Ambiente */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Ambiente</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[{ v: 2, l: '🧪 Homologação (Teste)' }, { v: 1, l: '🔴 Produção (Real)' }].map(({ v, l }) => (
                                <button key={v} onClick={() => setAmbiente(v)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${ambiente === v ? (v === 1 ? '#ef4444' : '#3b82f6') : 'rgba(255,255,255,0.1)'}`, background: ambiente === v ? (v === 1 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)') : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        {ambiente === 1 && (
                            <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '12px', color: '#fca5a5' }}>
                                ⚠️ Produção gera nota fiscal REAL com validade juridica.
                            </div>
                        )}
                    </div>

                    {/* Cliente */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Cliente Fiscal com CPF/CNPJ</label>
                        <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}>
                            <option value=''>Selecione o cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nome} — {c.cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</option>
                            ))}
                        </select>
                        {clientes.length === 0 && (
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#f59e0b' }}>
                                ⚠️ Nenhum cliente fiscal cadastrado. Acesse <strong>/fiscal/clientes</strong> para adicionar.
                            </p>
                        )}
                    </div>

                    {/* Itens */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Itens do Produto</label>
                            <button onClick={addItem} style={{ fontSize: '12px', color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Adicionar item</button>
                        </div>

                        {itens.map((item, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <select value={item.produtoId} onChange={e => handleSelectProduto(idx, e.target.value)}
                                    style={{ padding: '9px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}>
                                    <option value=''>Produto...</option>
                                    {produtos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome} — NCM {p.ncm}</option>
                                    ))}
                                </select>
                                <input type='number' min={0.001} step={0.001} value={item.quantidade} onChange={e => updateItem(idx, 'quantidade', parseFloat(e.target.value))}
                                    placeholder='Qtd'
                                    style={{ padding: '9px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', width: '100%' }} />
                                <input type='number' min={0} step={0.01} value={item.valorUnitario} onChange={e => updateItem(idx, 'valorUnitario', parseFloat(e.target.value))}
                                    placeholder='R$ Unit.'
                                    style={{ padding: '9px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', width: '100%' }} />
                                {itens.length > 1 && (
                                    <button onClick={() => removeItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Totais */}
                    <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Total da Nota</span>
                        <span style={{ fontSize: '22px', fontWeight: 700, color: '#6366f1' }}>{fmtMoney(total)}</span>
                    </div>

                    {/* Erro */}
                    {erro && (
                        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            {erro}
                        </div>
                    )}

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                            Cancelar
                        </button>
                        <button onClick={handleEmitir} disabled={loading}
                            style={{ padding: '10px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
                            {loading ? 'Emitindo...' : 'Emitir NF-e'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────
//  Modal de emissão NFS-e (serviço)
// ─────────────────────────────────────────────────────────────────
const NFSeModal: React.FC<{
    order: Order;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ order, onClose, onSuccess }) => {
    const [clientes, setClientes] = useState<FiscalCliente[]>([]);
    const [servicos, setServicos] = useState<FiscalServico[]>([]);
    const [clienteId, setClienteId] = useState('');
    const [servicoId, setServicoId] = useState('');
    const [valor, setValor] = useState(0);
    const [discriminacao, setDiscriminacao] = useState('');
    const [ambiente, setAmbiente] = useState(2);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        api.get('/fiscal/clientes').then(r => setClientes(r.data)).catch(() => { });
        api.get('/fiscal/servicos').then(r => setServicos(r.data)).catch(() => { });

        // Pré-preencher valor com total das peças/serviços da OS
        const totalOS = (order.parts || []).reduce((s, p) => s + Number(p.unitPrice) * p.quantity, 0);
        if (totalOS > 0) setValor(totalOS);

        // Sugerir discriminação com base nos itens da OS
        const itens = (order.parts || []).map((p: any) => p.product?.name || p.productName || '').filter(Boolean).join(', ');
        if (itens) setDiscriminacao(`Serviço de assistência técnica: ${itens}`);
    }, []);

    const handleSelectServico = (id: string) => {
        const s = servicos.find(s => s.id === id);
        setServicoId(id);
        if (s && !valor) setValor(s.valor);
    };

    const handleEmitir = async () => {
        if (!clienteId) return setErro('Selecione o cliente fiscal.');
        if (!servicoId) return setErro('Selecione o serviço.');
        if (!valor || valor <= 0) return setErro('Informe o valor.');
        setErro('');
        setLoading(true);
        try {
            await api.post('/fiscal/nfse', {
                clienteId,
                servicoId,
                valor,
                discriminacao,
                ambiente,
                orderId: order.id,
            });
            onSuccess();
        } catch (e: any) {
            const msg = e?.response?.data?.error || e?.response?.data?.message || 'Erro ao emitir NFS-e';
            setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    const aliquota = servicos.find(s => s.id === servicoId)?.aliquotaIss || 0;
    const iss = valor * aliquota / 100;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
            <div style={{ background: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wrench size={18} style={{ color: '#10b981' }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Emitir NFS-e de Serviço</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>OS #{order.protocol} · Nota de Serviço Municipal</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Ambiente */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Ambiente</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[{ v: 2, l: '🧪 Homologação (Teste)' }, { v: 1, l: '🔴 Produção (Real)' }].map(({ v, l }) => (
                                <button key={v} onClick={() => setAmbiente(v)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${ambiente === v ? (v === 1 ? '#ef4444' : '#10b981') : 'rgba(255,255,255,0.1)'}`, background: ambiente === v ? (v === 1 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)') : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cliente */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Cliente</label>
                        <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}>
                            <option value=''>Selecione o cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.cpfCnpj}</option>)}
                        </select>
                    </div>

                    {/* Serviço */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Tipo de Serviço</label>
                        <select value={servicoId} onChange={e => handleSelectServico(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px' }}>
                            <option value=''>Selecione o serviço...</option>
                            {servicos.map(s => <option key={s.id} value={s.id}>{s.descricao} (ISS {s.aliquotaIss}%)</option>)}
                        </select>
                        {servicos.length === 0 && (
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#f59e0b' }}>
                                ⚠️ Nenhum serviço fiscal cadastrado. Use <strong>POST /fiscal/servicos</strong>.
                            </p>
                        )}
                    </div>

                    {/* Valor */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Valor do Serviço (R$)</label>
                        <input type='number' min={0} step={0.01} value={valor} onChange={e => setValor(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>

                    {/* Discriminação */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Discriminação do Serviço</label>
                        <textarea value={discriminacao} onChange={e => setDiscriminacao(e.target.value)} rows={3}
                            placeholder='Descreva os serviços prestados (aparece na NFS-e)...'
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>

                    {/* Resumo fiscal */}
                    {valor > 0 && (
                        <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                                <span>Valor do Serviço</span>
                                <span>{fmtMoney(valor)}</span>
                            </div>
                            {aliquota > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                                    <span>ISS ({aliquota}%)</span>
                                    <span style={{ color: '#f59e0b' }}>- {fmtMoney(iss)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#10b981', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '8px' }}>
                                <span>Valor Líquido</span>
                                <span>{fmtMoney(valor - iss)}</span>
                            </div>
                        </div>
                    )}

                    {erro && (
                        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '13px', display: 'flex', gap: '8px' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {erro}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                            Cancelar
                        </button>
                        <button onClick={handleEmitir} disabled={loading}
                            style={{ padding: '10px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Wrench size={16} />}
                            {loading ? 'Emitindo...' : 'Emitir NFS-e'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────
//  Aba principal Nota Fiscal
// ─────────────────────────────────────────────────────────────────
export const FiscalTab: React.FC<FiscalTabProps> = ({ order }) => {
    const [notas, setNotas] = useState<Nota[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNFe, setShowNFe] = useState(false);
    const [showNFSe, setShowNFSe] = useState(false);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [cancelJust, setCancelJust] = useState('');
    const [canceling, setCanceling] = useState(false);

    const loadNotas = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<Nota[]>('/fiscal/notas');
            setNotas(data.filter(n => n.orderId === order.id));
        } catch {
            setNotas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadNotas(); }, [order.id]);

    const handleSuccess = () => {
        setShowNFe(false);
        setShowNFSe(false);
        loadNotas();
    };

    const handleDownloadDanfe = async (notaId: string, numero?: number) => {
        try {
            const { data } = await api.get(`/fiscal/nfe/${notaId}/danfe`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `DANFE_${numero || notaId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('DANFE não disponível');
        }
    };

    const handleConsultar = async (notaId: string) => {
        try {
            await api.get(`/fiscal/nfe/${notaId}/consultar`);
            loadNotas();
        } catch { /* ignore */ }
    };

    const handleCancelar = async () => {
        if (!cancelId || !cancelJust.trim()) return;
        setCanceling(true);
        try {
            await api.post(`/fiscal/nfe/${cancelId}/cancelar`, { justificativa: cancelJust });
            setCancelId(null);
            setCancelJust('');
            loadNotas();
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Erro ao cancelar');
        } finally {
            setCanceling(false);
        }
    };

    return (
        <>
            {/* ── Modais ─────────────────────────────── */}
            {showNFe && <NFeModal order={order} onClose={() => setShowNFe(false)} onSuccess={handleSuccess} />}
            {showNFSe && <NFSeModal order={order} onClose={() => setShowNFSe(false)} onSuccess={handleSuccess} />}

            {/* ── Modal cancelamento ─────────────────── */}
            {cancelId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
                    <div style={{ background: '#1a1b26', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px', color: '#ef4444', fontSize: '16px' }}>❌ Cancelar Nota Fiscal</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '16px' }}>
                            Informe a justificativa (mínimo 15 caracteres):
                        </p>
                        <textarea value={cancelJust} onChange={e => setCancelJust(e.target.value)} rows={3}
                            placeholder='Motivo do cancelamento...'
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px' }} />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setCancelId(null)} style={{ padding: '9px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>Voltar</button>
                            <button onClick={handleCancelar} disabled={canceling || cancelJust.trim().length < 15}
                                style={{ padding: '9px 18px', borderRadius: '8px', background: cancelJust.trim().length >= 15 ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.3)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                                {canceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Conteúdo da aba ───────────────────── */}
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>
                {/* Botões de emissão */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowNFSe(true)}
                        style={{ flex: 1, minWidth: '200px', padding: '16px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)', color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <Wrench size={20} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>Emitir NFS-e</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            Nota de Serviço Municipal<br />Para mão de obra / assistência técnica
                        </p>
                    </button>

                    <button onClick={() => setShowNFe(true)}
                        style={{ flex: 1, minWidth: '200px', padding: '16px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.1))', border: '1px solid rgba(99,102,241,0.3)', color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <Package size={20} style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#6366f1' }}>Emitir NF-e</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            Nota Fiscal Eletrônica (Modelo 55)<br />Para venda de peças / produtos
                        </p>
                    </button>
                </div>

                {/* Lista de notas emitidas */}
                <div>
                    <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📄 Notas Emitidas nesta OS
                    </h4>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                            <p>Carregando...</p>
                        </div>
                    ) : notas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                            <Receipt size={40} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
                            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>Nenhuma nota emitida para esta OS ainda.</p>
                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Use os botões acima para emitir.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {notas.map(nota => {
                                const st = STATUS_NOTA[nota.status] || STATUS_NOTA.pendente;
                                const Icon = st.icon;
                                return (
                                    <div key={nota.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                        {/* Tipo */}
                                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: nota.tipo === 'servico' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {nota.tipo === 'servico' ? <Wrench size={16} style={{ color: '#10b981' }} /> : <Package size={16} style={{ color: '#6366f1' }} />}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                                                    {nota.tipo === 'servico' ? 'NFS-e' : 'NF-e'} {nota.numero ? `#${nota.numero}` : ''}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: st.color, background: `${st.color}18`, padding: '2px 8px', borderRadius: '20px' }}>
                                                    <Icon size={11} /> {st.label}
                                                </span>
                                                {nota.ambiente === 2 && (
                                                    <span style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '20px' }}>HOMOLOGAÇÃO</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                                {nota.chaveAcesso ? `Chave: ${nota.chaveAcesso.slice(0, 22)}...` : nota.xMotivo || ''}
                                                {nota.protocolo && ` · Prot: ${nota.protocolo}`}
                                                {' · '}{fmtDate(nota.createdAt)}
                                            </div>
                                            {nota.erroDetalhes && (
                                                <div style={{ marginTop: '4px', fontSize: '11px', color: '#f87171' }}>⚠ {nota.erroDetalhes}</div>
                                            )}
                                        </div>

                                        {/* Valor */}
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: nota.status === 'autorizada' ? '#10b981' : '#fff', flexShrink: 0 }}>
                                            {fmtMoney(nota.valorTotal)}
                                        </div>

                                        {/* Ações */}
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                            {nota.status === 'aguardando' && (
                                                <button onClick={() => handleConsultar(nota.id)} title='Consultar retorno'
                                                    style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                                    Consultar
                                                </button>
                                            )}
                                            {nota.status === 'autorizada' && nota.tipo === 'produto' && (
                                                <button onClick={() => handleDownloadDanfe(nota.id, nota.numero)} title='Baixar DANFE PDF'
                                                    style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                                                    <Download size={12} /> DANFE
                                                </button>
                                            )}
                                            {nota.status === 'autorizada' && nota.tipo === 'produto' && (
                                                <button onClick={() => setCancelId(nota.id)} title='Cancelar nota'
                                                    style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </>
    );
};
