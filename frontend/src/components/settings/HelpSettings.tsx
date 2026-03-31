import React, { useState } from 'react';
import {
    Shield, RotateCcw, DollarSign, ChevronDown, ChevronRight,
    BookOpen, AlertTriangle, CheckCircle, HelpCircle, Lightbulb,
    ArrowRight, ArrowDown, Navigation, Eye, ClipboardList,
} from 'lucide-react';

// ─── Estilos base ───────────────────────────────────────────────────────────

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    overflow: 'hidden',
    marginBottom: '12px',
};

const cardHeader: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', cursor: 'pointer', userSelect: 'none',
};

const cardBody: React.CSSProperties = {
    padding: '0 20px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
};

const badge = (color: string): React.CSSProperties => ({
    display: 'inline-block', fontSize: '11px', fontWeight: 700,
    padding: '3px 10px', borderRadius: '20px',
    background: `${color}18`, color, border: `1px solid ${color}30`,
    marginLeft: '8px', verticalAlign: 'middle',
});

const tag = (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
    borderRadius: '20px', background: `${color}15`, color,
    border: `1px solid ${color}25`,
});

const stepBox = (color: string): React.CSSProperties => ({
    padding: '14px 16px', borderRadius: '12px',
    background: `${color}08`, border: `1px solid ${color}25`,
    borderLeft: `3px solid ${color}`,
    marginBottom: '8px',
});

const infoRow: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px',
    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    alignItems: 'start',
};

const pill = (color: string, text: string) => (
    <span style={tag(color)}>{text}</span>
);

// ─── Accordion ──────────────────────────────────────────────────────────────

const Section: React.FC<{
    icon: React.ReactNode; title: string; subtitle?: string;
    color?: string; children: React.ReactNode; defaultOpen?: boolean;
}> = ({ icon, title, subtitle, color = '#6366f1', children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={card}>
            <div style={cardHeader} onClick={() => setOpen(v => !v)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {icon}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '15px' }}>{title}</p>
                        {subtitle && <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{subtitle}</p>}
                    </div>
                </div>
                {open ? <ChevronDown size={16} color="rgba(255,255,255,0.4)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.4)" />}
            </div>
            {open && <div style={cardBody}><div style={{ paddingTop: '16px' }}>{children}</div></div>}
        </div>
    );
};

// ─── Fluxograma de Garantia ──────────────────────────────────────────────────

const FlowChart: React.FC = () => {
    const node = (text: string, color: string, icon?: string, sub?: string): React.CSSProperties => ({});

    const FlowNode: React.FC<{ text: string; color: string; icon?: string; sub?: string; w?: string }> =
        ({ text, color, icon, sub, w = '200px' }) => (
            <div style={{
                width: w, padding: '12px 16px', borderRadius: '12px',
                background: `${color}12`, border: `2px solid ${color}40`,
                textAlign: 'center', position: 'relative',
            }}>
                {icon && <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>}
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff' }}>{text}</p>
                {sub && <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
            </div>
        );

    const Arrow: React.FC<{ label?: string; color?: string }> = ({ label, color = '#94a3b8' }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
            {label && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px', fontWeight: 600 }}>{label}</span>}
            <ArrowDown size={18} color={color} />
        </div>
    );

    const HArrow: React.FC<{ label?: string; dir?: 'left' | 'right' }> = ({ label, dir = 'right' }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {dir === 'left' && <ArrowRight size={16} color="#94a3b8" style={{ transform: 'rotate(180deg)' }} />}
            {label && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>}
            {dir === 'right' && <ArrowRight size={16} color="#94a3b8" />}
        </div>
    );

    return (
        <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
            <div style={{ minWidth: '560px' }}>

                {/* Entrada */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FlowNode text="Cliente retorna com defeito" color="#3b82f6" icon="👤" sub="Atendente abre o retorno" />
                    <Arrow />

                    {/* Verificação de prazo */}
                    <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', border: '2px dashed rgba(99,102,241,0.4)', textAlign: 'center', width: '220px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#a5b4fc', fontWeight: 700 }}>⚙️ Sistema verifica automaticamente</p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Está dentro do prazo de garantia?</p>
                    </div>
                    <Arrow />

                    <FlowNode text="Retorno criado" color="#f59e0b" icon="📋" sub="Status: PENDENTE" />
                    <Arrow />

                    {/* Avaliação técnica */}
                    <FlowNode text="Técnico avalia o aparelho" color="#8b5cf6" icon="🔧" sub="Preenche avaliação técnica" />
                    <Arrow />
                    <FlowNode text="Em Avaliação" color="#3b82f6" icon="" sub="Status: EM AVALIAÇÃO" w="160px" />
                    <Arrow />

                    {/* Decisão */}
                    <div style={{ padding: '14px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>🤔 Decisão do Responsável</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>A garantia é válida para este defeito?</p>
                    </div>
                </div>

                {/* Bifurcação SIM / NÃO */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginTop: '16px' }}>

                    {/* Caminho SIM */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ ...tag('#22c55e'), fontSize: '13px', padding: '5px 16px' }}>✓ SIM — Válida</div>
                        <ArrowDown size={16} color="#22c55e" />
                        <FlowNode text="Garantia Aprovada" color="#22c55e" icon="✅" sub="Status: APROVADA" w="170px" />
                        <ArrowDown size={16} color="#22c55e" />
                        <FlowNode text="Reparo realizado" color="#10b981" icon="🔨" sub="(fora do sistema por enquanto)" w="170px" />
                        <ArrowDown size={16} color="#10b981" />
                        <FlowNode text="Marcar como Concluído" color="#10b981" icon="🏁" sub="Status: CONCLUÍDA" w="170px" />
                        <ArrowDown size={16} color="#10b981" />
                        <FlowNode text="Aparelho entregue ao cliente" color="#22c55e" icon="🤝" sub="Processo encerrado" w="170px" />
                    </div>

                    {/* Caminho NÃO */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ ...tag('#ef4444'), fontSize: '13px', padding: '5px 16px' }}>✗ NÃO — Negada</div>
                        <ArrowDown size={16} color="#ef4444" />
                        <FlowNode text="Garantia Negada" color="#ef4444" icon="❌" sub="Status: NEGADA" w="170px" />
                        <ArrowDown size={16} color="#ef4444" />
                        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center', width: '150px' }}>
                            <p style={{ margin: 0, fontSize: '11px', color: '#fca5a5' }}>Motivo registrado</p>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Cliente é informado</p>
                        </div>
                        <ArrowDown size={16} color="#94a3b8" />
                        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', width: '150px' }}>
                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Cliente decide:</p>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Pagar reparo avulso<br />ou retirar o aparelho</p>
                        </div>
                    </div>
                </div>

                {/* Nota sobre estorno */}
                <div style={{ marginTop: '24px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '18px' }}>💰</span>
                    <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>Estorno (caminho paralelo)</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            Em qualquer etapa, se o cliente tiver pago e a garantia for válida, é possível abrir um <strong style={{ color: '#fff' }}>Estorno</strong> separado — financeiro (devolver dinheiro) ou de serviço (refazer sem custo).
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

// ─── Módulo de Garantia ──────────────────────────────────────────────────────

const WarrantyHelp: React.FC = () => (
    <div>

        {/* Visão Geral */}
        <Section icon={<Eye size={16} color="#22c55e" />} title="1. Visão Geral" subtitle="Para que serve este módulo" color="#22c55e" defaultOpen={true}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 14px' }}>
                O módulo de <strong style={{ color: '#fff' }}>Garantia</strong> serve para registrar e acompanhar quando um cliente retorna à assistência com o mesmo problema após ter recebido o equipamento. Ele organiza todo o processo — desde a entrada até a decisão final (aprovar ou negar a garantia).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {[
                    { icon: '🎯', title: 'Para que serve', text: 'Registrar retornos de clientes que alegam defeito no prazo de garantia' },
                    { icon: '⏰', title: 'Quando usar', text: 'Quando um cliente volta com o mesmo problema após a entrega da OS' },
                    { icon: '👥', title: 'Quem usa', text: 'Atendente (abre o retorno) + Técnico (avalia) + Admin (decide)' },
                ].map(item => (
                    <div key={item.title} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>{item.title}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{item.text}</p>
                    </div>
                ))}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#93c5fd' }}>
                    💡 <strong>Importante:</strong> O módulo de garantia é separado da OS normal. Ele não altera a OS original — apenas a vincula e registra o que aconteceu no retorno.
                </p>
            </div>
        </Section>

        {/* Caminho até o módulo */}
        <Section icon={<Navigation size={16} color="#3b82f6" />} title="2. Como Chegar até a Tela" subtitle="Passo a passo de navegação" color="#3b82f6">
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 14px' }}>Existem <strong style={{ color: '#fff' }}>dois caminhos</strong> para acessar o módulo de garantia:</p>

            <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>Caminho 1 — Página central de Garantias:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {['Menu lateral', '🛡️ Garantias', 'Aba "Retornos"', 'Botão "Novo Retorno"'].map((step, i, arr) => (
                        <React.Fragment key={step}>
                            <span style={{ padding: '5px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', fontSize: '12px', fontWeight: 600, color: '#a5b4fc' }}>{step}</span>
                            {i < arr.length - 1 && <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
                        </React.Fragment>
                    ))}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Use quando não tiver a OS em mãos — você busca pelo protocolo na hora.</p>
            </div>

            <div>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>Caminho 2 — Direto pela OS original (recomendado):</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {['Ordens de Serviço', 'Abrir a OS', 'Aba "Garantia 🛡️"', 'Botão "Abrir Retorno"'].map((step, i, arr) => (
                        <React.Fragment key={step}>
                            <span style={{ padding: '5px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '12px', fontWeight: 600, color: '#4ade80' }}>{step}</span>
                            {i < arr.length - 1 && <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
                        </React.Fragment>
                    ))}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Use quando o cliente já trouxe o aparelho e você sabe qual OS é.</p>
            </div>
        </Section>

        {/* Fluxograma */}
        <Section icon={<ArrowDown size={16} color="#8b5cf6" />} title="3. Fluxo Completo (Passo a Passo Visual)" subtitle="Do início ao fim — todos os caminhos possíveis" color="#8b5cf6">
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 16px' }}>
                Veja abaixo o caminho completo que uma garantia percorre no sistema, incluindo os dois desfechos possíveis:
            </p>
            <FlowChart />
        </Section>

        {/* Campos */}
        <Section icon={<ClipboardList size={16} color="#f59e0b" />} title="4. Explicação de Cada Campo" subtitle="O que preencher em cada etapa" color="#f59e0b">

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 16px', fontWeight: 600 }}>ETAPA 1 — ABERTURA DO RETORNO</p>
            {[
                {
                    name: 'Protocolo da OS Original',
                    required: true,
                    who: 'Atendente',
                    what: 'O número da OS que gerou a garantia (ex: OS-0042)',
                    why: 'Vincula o retorno à OS original para buscar todas as informações do cliente e equipamento',
                    when: 'Sempre — é o primeiro campo a preencher',
                    example: 'O cliente diz que consertou o celular na semana passada. Você digita o protocolo que está no recibo dele: OS-0042',
                },
                {
                    name: 'Descrição do Defeito',
                    required: true,
                    who: 'Atendente',
                    what: 'O que o cliente está relatando que está errado',
                    why: 'Registra a versão do cliente antes da avaliação técnica',
                    when: 'Ao abrir o retorno, ouvindo o cliente',
                    example: '"Tela voltou a piscar igual antes do conserto" ou "Aparelho desliga sozinho quando a bateria chega a 30%"',
                },
            ].map(field => (
                <div key={field.name} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{field.name}</span>
                        {field.required && <span style={badge('#ef4444')}>Obrigatório</span>}
                        <span style={badge('#94a3b8')}>{field.who}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', fontSize: '13px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>O que é:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.what}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Para que:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.why}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Quando:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.when}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Exemplo:</span>
                        <span style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: '12px' }}>{field.example}</span>
                    </div>
                </div>
            ))}

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '16px 0 12px', fontWeight: 600 }}>ETAPA 2 — AVALIAÇÃO TÉCNICA (preenche o técnico)</p>
            {[
                {
                    name: 'Avaliação Técnica',
                    required: true,
                    who: 'Técnico',
                    what: 'O laudo do técnico após examinar o equipamento',
                    why: 'Documenta tecnicamente o que foi encontrado no aparelho',
                    when: 'Após o técnico examinar o equipamento',
                    example: '"Display apresenta falha na linha de dados — componente X danificado por oxidação"',
                },
                {
                    name: 'É o mesmo defeito?',
                    required: true,
                    who: 'Técnico',
                    what: 'Confirmação se o problema relatado é o mesmo que foi corrigido na OS original',
                    why: 'Ajuda o responsável a tomar a decisão sobre a garantia',
                    when: 'Sempre — após examinar o aparelho',
                    example: 'A OS original foi "troca de tela". O cliente voltou dizendo que a tela está piscando. O técnico confirma: Sim, é o mesmo defeito.',
                },
            ].map(field => (
                <div key={field.name} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{field.name}</span>
                        {field.required && <span style={badge('#ef4444')}>Obrigatório</span>}
                        <span style={badge('#8b5cf6')}>{field.who}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', fontSize: '13px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>O que é:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.what}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Para que:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.why}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Quando:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.when}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Exemplo:</span>
                        <span style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: '12px' }}>{field.example}</span>
                    </div>
                </div>
            ))}

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '16px 0 12px', fontWeight: 600 }}>ETAPA 3 — DECISÃO (preenche o responsável / admin)</p>
            {[
                {
                    name: 'Garantia Válida?',
                    required: true,
                    who: 'Admin',
                    what: 'Botão de escolha: "Garantia Válida" ou "Negar Garantia"',
                    why: 'Define o desfecho do retorno',
                    when: 'Após ler a avaliação do técnico',
                    example: 'O técnico confirmou que é o mesmo defeito e que a peça trocada falhou → escolha "Garantia Válida"',
                },
                {
                    name: 'Resolução (se aprovada)',
                    required: true,
                    who: 'Admin',
                    what: 'O que será feito para resolver o problema',
                    why: 'Documenta o comprometimento da assistência com o cliente',
                    when: 'Quando a garantia for aprovada',
                    example: '"Troca da tela novamente com peça nova. Serviço sem custo para o cliente."',
                },
                {
                    name: 'Motivo da Negação (se negada)',
                    required: true,
                    who: 'Admin',
                    what: 'Justificativa para não cobrir a garantia',
                    why: 'Protege legalmente a assistência e informa o cliente',
                    when: 'Quando a garantia for negada',
                    example: '"Aparelho apresenta sinais de queda física. Dano mecânico não coberto pela garantia de serviço."',
                },
            ].map(field => (
                <div key={field.name} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{field.name}</span>
                        {field.required && <span style={badge('#ef4444')}>Obrigatório</span>}
                        <span style={badge('#3b82f6')}>{field.who}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px', fontSize: '13px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>O que é:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.what}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Para que:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.why}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Quando:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{field.when}</span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Exemplo:</span>
                        <span style={{ color: '#fbbf24', fontStyle: 'italic', fontSize: '12px' }}>{field.example}</span>
                    </div>
                </div>
            ))}
        </Section>

        {/* Status */}
        <Section icon={<CheckCircle size={16} color="#10b981" />} title="5. Status do Retorno" subtitle="O que cada status significa" color="#10b981">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                    { status: 'PENDENTE', color: '#f59e0b', icon: '⏳', desc: 'Retorno foi aberto, aguardando o técnico examinar o aparelho.', quem: 'Sistema atribui automaticamente ao criar' },
                    { status: 'EM AVALIAÇÃO', color: '#3b82f6', icon: '🔍', desc: 'Técnico já registrou a avaliação técnica. Aguardando decisão do responsável.', quem: 'Sistema atribui após técnico preencher avaliação' },
                    { status: 'APROVADA', color: '#22c55e', icon: '✅', desc: 'Garantia aceita. O reparo será feito sem custo para o cliente.', quem: 'Responsável aprova na aba Decisão' },
                    { status: 'NEGADA', color: '#ef4444', icon: '❌', desc: 'Garantia recusada. Motivo registrado no sistema.', quem: 'Responsável nega na aba Decisão' },
                    { status: 'CONCLUÍDA', color: '#94a3b8', icon: '🏁', desc: 'Reparo de garantia foi realizado e aparelho entregue ao cliente.', quem: 'Responsável marca como concluído' },
                ].map(s => (
                    <div key={s.status} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '10px', background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                            <span style={badge(s.color)}>{s.status}</span>
                            <p style={{ margin: '6px 0 2px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{s.desc}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>👤 {s.quem}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Section>

        {/* Regras */}
        <Section icon={<AlertTriangle size={16} color="#ef4444" />} title="6. Regras Importantes" subtitle="O que o sistema valida automaticamente" color="#ef4444">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                    { icon: '🔒', title: 'OS original obrigatória', desc: 'Não é possível abrir um retorno de garantia sem informar a OS original. O sistema busca os dados do cliente e equipamento automaticamente.' },
                    { icon: '📅', title: 'Verificação automática do prazo', desc: 'Ao criar o retorno, o sistema verifica se o equipamento ainda está dentro do prazo de garantia. Isso fica registrado no retorno — mas não impede a abertura. Um retorno fora do prazo pode ser aberto, porém fica marcado com aviso "⚠ Fora da garantia".' },
                    { icon: '🔄', title: 'Sequência dos status', desc: 'Os status seguem uma ordem: PENDENTE → EM AVALIAÇÃO → APROVADA ou NEGADA → CONCLUÍDA. Não é possível pular etapas — por exemplo, não dá para marcar como Concluída sem ter aprovado antes.' },
                    { icon: '🏁', title: 'Concluir exige estar APROVADA', desc: 'O botão "Marcar como Concluído" só aparece quando o retorno está com status APROVADA.' },
                    { icon: '🔗', title: 'Estornos são independentes', desc: 'Um estorno (financeiro ou de serviço) pode ser criado a qualquer momento, mesmo sem um retorno de garantia vinculado.' },
                ].map(r => (
                    <div key={r.title} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{r.icon}</span>
                        <div>
                            <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>{r.title}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{r.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Section>

        {/* Dicas */}
        <Section icon={<Lightbulb size={16} color="#fbbf24" />} title="7. Dicas Práticas" subtitle="Para o dia a dia da assistência" color="#fbbf24">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                    'Ao receber um cliente em retorno, abra o retorno diretamente pela aba "Garantia 🛡️" dentro da OS — assim os dados já vêm preenchidos automaticamente.',
                    'Sempre documente bem o defeito na linguagem do cliente ("tela piscando") e o laudo na linguagem técnica ("falha na linha de dados do LCD"). Isso protege a assistência em caso de disputa.',
                    'Se o técnico identificar que o defeito NÃO é o mesmo da OS original (ex: queda física), registre isso no campo "É o mesmo defeito? → Não" e depois negue a garantia com justificativa clara.',
                    'Use a aba "Garantias Ativas" no menu Garantias para monitorar equipamentos próximos do vencimento e entrar em contato com o cliente preventivamente.',
                    'Estornos financeiros devem ser registrados assim que a decisão for tomada — não deixe acumular. Use Garantias → Estornos → Novo Estorno.',
                    'A descrição do defeito e a avaliação técnica ficam salvas permanentemente. Isso serve como prova em caso de reclamação do cliente.',
                ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 14px', borderRadius: '10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{tip}</p>
                    </div>
                ))}
            </div>
        </Section>

        {/* FAQ */}
        <Section icon={<HelpCircle size={16} color="#a78bfa" />} title="8. Perguntas Frequentes (FAQ)" subtitle="Dúvidas comuns respondidas" color="#a78bfa">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                    {
                        q: 'Posso abrir um retorno de garantia sem OS vinculada?',
                        a: 'Não. O retorno sempre precisa estar vinculado a uma OS original. Você precisa informar o protocolo da OS para abrir o retorno.',
                    },
                    {
                        q: 'O que acontece se a garantia já venceu quando o cliente volta?',
                        a: 'O sistema detecta automaticamente e marca o retorno com aviso "⚠ Fora da garantia". Você ainda pode abrir o retorno normalmente, mas o responsável deve levar isso em conta na decisão.',
                    },
                    {
                        q: 'Qualquer funcionário pode aprovar ou negar uma garantia?',
                        a: 'Não obrigatoriamente. Recomendamos que apenas o admin ou gerente tome a decisão de aprovar/negar, pois isso tem impacto financeiro. Você pode configurar isso em Configurações → Permissões.',
                    },
                    {
                        q: 'O cliente pode ver o histórico de retornos?',
                        a: 'Ainda não diretamente. O registro fica interno no sistema. Em breve, o retorno aparecerá no histórico da OS original para rastreabilidade completa.',
                    },
                    {
                        q: 'Posso fazer um estorno sem ter um retorno de garantia?',
                        a: 'Sim. Estornos são independentes. Vá em Garantias → Estornos → Novo Estorno e informe a OS. Não é obrigatório ter um retorno vinculado.',
                    },
                    {
                        q: 'O que é a diferença entre "Retorno de Garantia" e "Estorno"?',
                        a: 'Retorno de Garantia = cliente voltou com defeito físico no aparelho. Estorno = devolução de dinheiro ou refazer um serviço sem custo. São processos separados, mas podem estar relacionados.',
                    },
                    {
                        q: 'O sistema cria uma nova OS quando a garantia é aprovada?',
                        a: 'Ainda não automaticamente. Quando a garantia é aprovada, você precisa criar uma nova OS manualmente para registrar o reparo. Em breve haverá um botão "Criar OS de Reparo" direto na tela de decisão.',
                    },
                ].map((item, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#c4b5fd' }}>❓ {item.q}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>→ {item.a}</p>
                    </div>
                ))}
            </div>
        </Section>

        {/* Exemplo Completo */}
        <Section icon={<BookOpen size={16} color="#06b6d4" />} title="9. Exemplo Real de Uso" subtitle="Passo a passo de uma garantia do início ao fim" color="#06b6d4">
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#67e8f9', fontWeight: 700 }}>CENÁRIO:</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    João trouxe um iPhone 12 na semana passada para troca de tela (OS-0087). Hoje ele voltou dizendo que a tela está piscando. O prazo de garantia é de 90 dias e ele está dentro do prazo.
                </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                    { step: '1', who: 'Atendente', color: '#3b82f6', action: 'Abre a OS-0087 → aba "Garantia 🛡️" → clica em "Abrir Retorno de Garantia"' },
                    { step: '2', who: 'Atendente', color: '#3b82f6', action: 'Preenche o defeito: "Cliente relata que tela voltou a piscar, principalmente quando aperta na parte inferior"' },
                    { step: '3', who: 'Sistema', color: '#6366f1', action: 'Verifica automaticamente: OS-0087, entregue há 6 dias, garantia de 90 dias → ✓ Dentro do prazo. Cria retorno com status PENDENTE.' },
                    { step: '4', who: 'Técnico', color: '#8b5cf6', action: 'Examina o aparelho → vai em Garantias → Retornos → clica no retorno → aba "Avaliação Técnica"' },
                    { step: '5', who: 'Técnico', color: '#8b5cf6', action: 'Preenche: "Conector do display com mau contato. Mesmo defeito que motivou a troca original." → Mesmo defeito: SIM → Salva.' },
                    { step: '6', who: 'Admin', color: '#f59e0b', action: 'Vê o retorno → aba "Decisão" → escolhe "✓ Garantia Válida"' },
                    { step: '7', who: 'Admin', color: '#f59e0b', action: 'Preenche resolução: "Reposicionamento e fixação do conector do display. Sem custo para o cliente."' },
                    { step: '8', who: 'Técnico', color: '#8b5cf6', action: 'Realiza o reparo. Após concluir, admin volta ao retorno → aba "Informações" → "Marcar como Concluído"' },
                    { step: '9', who: 'Atendente', color: '#3b82f6', action: 'Entrega o aparelho ao João. Retorno fica com status CONCLUÍDA. Histórico preservado no sistema.' },
                ].map(s => (
                    <div key={s.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${s.color}25`, border: `2px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: s.color }}>{s.step}</span>
                        </div>
                        <div style={{ flex: 1, paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={badge(s.color)}>{s.who}</span>
                            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{s.action}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#4ade80' }}>
                    ✅ <strong>Resultado:</strong> João saiu satisfeito, a garantia foi cumprida, e toda a trajetória ficou documentada no sistema — quem fez o quê, quando, e por quê.
                </p>
            </div>
        </Section>

    </div>
);

// ─── Componente Principal ────────────────────────────────────────────────────

type HelpModule = 'warranty' | 'refund';

const MODULES = [
    { key: 'warranty' as HelpModule, icon: <Shield size={16} color="#22c55e" />, label: 'Garantia & Retornos', color: '#22c55e', ready: true },
    { key: 'refund' as HelpModule, icon: <DollarSign size={16} color="#f59e0b" />, label: 'Estornos', color: '#f59e0b', ready: false },
];

export const HelpSettings: React.FC = () => {
    const [activeModule, setActiveModule] = useState<HelpModule>('warranty');

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={19} color="#818cf8" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Central de Ajuda</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Guias, fluxos e explicações de cada módulo do sistema</p>
                    </div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#a5b4fc' }}>
                        💡 Esta área é atualizada sempre que novas funcionalidades são adicionadas ao sistema. Se tiver dúvidas, consulte aqui primeiro.
                    </p>
                </div>
            </div>

            {/* Seletor de módulo */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {MODULES.map(m => (
                    <button key={m.key} onClick={() => m.ready && setActiveModule(m.key)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 16px', borderRadius: '10px', cursor: m.ready ? 'pointer' : 'default',
                        background: activeModule === m.key ? `${m.color}15` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${activeModule === m.key ? m.color + '40' : 'rgba(255,255,255,0.1)'}`,
                        color: activeModule === m.key ? m.color : 'rgba(255,255,255,0.4)',
                        fontWeight: activeModule === m.key ? 700 : 500, fontSize: '13px',
                        opacity: m.ready ? 1 : 0.5,
                        transition: 'all 0.15s',
                    }}>
                        {m.icon}
                        {m.label}
                        {!m.ready && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: '2px' }}>(em breve)</span>}
                    </button>
                ))}
            </div>

            {/* Conteúdo do módulo */}
            {activeModule === 'warranty' && <WarrantyHelp />}
        </div>
    );
};
