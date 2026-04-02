import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Search, CheckCircle, Clock, XCircle, Wrench, FileText,
  Smartphone, Calendar, MessageCircle,
  ThumbsUp, ThumbsDown, AlertCircle, RefreshCw,
} from 'lucide-react';
import api from '../services/api';

const STATUS: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  aberta:               { label: 'Recebido',         color: '#94a3b8', icon: FileText,    desc: 'Equipamento recebido e aguardando diagnóstico.' },
  em_diagnostico:       { label: 'Em Diagnóstico',   color: '#3b82f6', icon: Search,      desc: 'Nossos técnicos estão analisando o equipamento.' },
  aguardando_aprovacao: { label: 'Orçamento Pronto', color: '#f59e0b', icon: AlertCircle, desc: 'O diagnóstico foi concluído. Aprovação necessária.' },
  aguardando_peca:      { label: 'Aguardando Peça',  color: '#f97316', icon: Clock,       desc: 'Aguardando chegada das peças para o reparo.' },
  em_reparo:            { label: 'Em Reparo',        color: '#a855f7', icon: Wrench,      desc: 'Equipamento em processo de reparo.' },
  testes:               { label: 'Em Testes',        color: '#06b6d4', icon: RefreshCw,   desc: 'Reparo concluído, realizando testes finais.' },
  finalizada:           { label: 'Pronto!',          color: '#22c55e', icon: CheckCircle, desc: 'Equipamento pronto para retirada.' },
  entregue:             { label: 'Entregue',         color: '#10b981', icon: CheckCircle, desc: 'Equipamento entregue ao cliente.' },
  cancelada:            { label: 'Cancelada',        color: '#ef4444', icon: XCircle,     desc: 'Ordem de serviço cancelada.' },
};

const ALL_STEPS = ['aberta','em_diagnostico','aguardando_aprovacao','aguardando_peca','em_reparo','testes','finalizada','entregue'];
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);

// ─── PIXEL AGENT SCENE ───────────────────────────────────────────────────────
// SC=3 → cada pixel lógico = 3 px na tela | canvas: 330×168px

const SC = 3;
const LW = 110;
const LH = 56;
type Ctx = CanvasRenderingContext2D;

// Paleta de cores
const K = {
  // ambiente
  wall:  '#0d0d14', wallS: '#111118', wallL: '#15151e',
  floor: '#181820', floorL: '#141419', floorT: '#101015',
  ceil:  '#09090e',
  // prateleira / bancada
  shelfB:'#2d1a06', shelfT:'#5c3210',
  bTop:  '#78400e', bFace: '#4a2508', bBody: '#3b1a04',
  bSide: '#2a1203',
  // paredes / detalhes
  cable: '#1e293b', cableL:'#334155',
  lamp:  '#fde68a', lampB: '#b45309', lampG: '#1a1a1a',
  // personagem técnico
  hair:  '#1c1917', skin:  '#fbbf24', eye:   '#111827',
  shrt:  '#1d4ed8', shD:   '#1e3a8a', shL:   '#2563eb',
  pant:  '#1e3a5f', pantD: '#162d4a', shoe:  '#111827',
  // dispositivo
  dvc:   '#374151', dvcD:  '#1f2937', dvcL:  '#4b5563',
  scrN:  '#38bdf8', scrA:  '#0c4a6e', scrX:  '#080c10',
  scrG:  '#7dd3fc',
  // moto
  mFrame:'#dc2626', mFrD:  '#991b1b', mEngn: '#6b7280',
  mWheel:'#1f2937', mWRim: '#4b5563', mWTire:'#111827',
  mRider:'#1e3a5f', mHelm: '#dc2626', mBox:  '#d97706', mBoxD: '#92400e',
  mExh:  '#6b7280', mLight:'#fde047',
  // props
  tol1:  '#9ca3af', tol2:  '#6b7280', tol3:  '#d97706',
  magnH: '#d97706', magnG: '#e0f2fe', magnR: '#b45309',
  spk1:  '#fde047', spk2:  '#f97316', spk3:  '#fb923c',
  star:  '#fbbf24', starD: '#d97706',
  chk:   '#22c55e', xMk:   '#ef4444',
  clkF:  '#e5e7eb', clk:   '#4b5563',
  notif: '#f59e0b', notD:  '#92400e',
  smoke: '#374151',
  box1:  '#b45309', box2:  '#78350f', boxT:  '#fbbf24',
  mon:   '#111827', monS:  '#1d4ed8', monF:  '#374151',
  door:  '#2d1a06', doorF: '#1a0e03', doorW: '#38bdf8', doorWD:'#0c4a6e',
  sky:   '#0c1445', skyL:  '#0a0f35',
  road:  '#1a1a1a', roadL: '#374151',
  grass: '#14532d',
};

function rc(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x * SC, y * SC, w * SC, h * SC);
}

// ── FUNDO DA LOJA ─────────────────────────────────────────────────────────────
function drawShop(ctx: Ctx) {
  // Parede de fundo
  rc(ctx, 0, 0, LW, 37, K.wall);
  // Faixa de teto
  rc(ctx, 0, 0, LW, 2, K.ceil);
  // Rodapé da parede (acima da bancada)
  rc(ctx, 0, 35, LW, 2, K.wallS);
  // Chão
  rc(ctx, 0, 37, LW, LH - 37, K.floor);
  // Linhas do chão
  for (let x = 0; x < LW; x += 12) rc(ctx, x, 37, 1, LH - 37, K.floorT);
  rc(ctx, 0, 43, LW, 1, K.floorT);
  rc(ctx, 0, 50, LW, 1, K.floorT);

  // Prateleira superior (parede)
  rc(ctx, 3, 5, 76, 1, K.shelfT);
  rc(ctx, 3, 6, 76, 2, K.shelfB);
  // Itens na prateleira: caixinhas de peças
  const boxes = [[5,2,'#374151'],[9,3,'#1e3a5f'],[14,2,'#4a2508'],[18,2,'#1f2937'],
                  [22,3,'#1e3a5f'],[27,2,'#374151'],[32,3,'#4a2508'],[37,2,'#1f2937'],
                  [42,2,'#374151'],[47,3,'#1e3a5f'],[52,2,'#4a2508'],[57,2,'#374151']];
  boxes.forEach(([bx,bw,bc]) => rc(ctx, bx as number, 3, bw as number, 3, bc as string));

  // Ferramenta na parede (chave de fenda)
  rc(ctx, 65, 3, 1, 6, K.tol2); rc(ctx, 65, 3, 2, 1, K.tol1);
  // Alicate
  rc(ctx, 69, 3, 1, 5, K.tol1); rc(ctx, 70, 3, 1, 5, K.tol1);
  rc(ctx, 69, 5, 2, 1, K.tol2);
  // Fio na parede
  rc(ctx, 74, 4, 2, 1, K.cable);

  // Luminária no teto
  rc(ctx, 30, 0, 1, 3, K.lampG);
  rc(ctx, 29, 3, 3, 2, K.lampB);

  // BANCADA principal
  rc(ctx, 2, 28, 82, 2, K.bTop);    // tampo
  rc(ctx, 2, 30, 82, 1, K.bFace);   // frente do tampo (sombra)
  rc(ctx, 2, 31, 82, 6, K.bBody);   // corpo
  rc(ctx, 2, 31, 3, 6, K.bSide);    // perna esq
  rc(ctx, 81, 31, 3, 6, K.bSide);   // perna dir
  // Gaveta na bancada
  rc(ctx, 20, 32, 14, 4, '#201008');
  rc(ctx, 26, 33, 2, 2, K.tol2);
  // Segunda gaveta
  rc(ctx, 40, 32, 14, 4, '#201008');
  rc(ctx, 46, 33, 2, 2, K.tol2);

  // Ferramentas sobre a bancada (lado direito)
  rc(ctx, 60, 25, 1, 4, K.tol1);  // chave
  rc(ctx, 63, 26, 1, 3, K.tol2);  // screwdriver
  rc(ctx, 66, 26, 3, 1, K.tol3);  // solda

  // Cabinete de peças à esquerda (parede)
  rc(ctx, 88, 8, 18, 20, '#0f0f17');
  rc(ctx, 88, 8, 18, 1, K.shelfB);
  for (let i = 0; i < 4; i++) rc(ctx, 89, 9 + i * 4, 16, 3, '#131320');
}

// ── PORTA / JANELA EXTERIOR (para cena da moto) ───────────────────────────────
function drawDoorExterior(ctx: Ctx) {
  // Parede ao redor da porta
  rc(ctx, 85, 0, 25, 37, K.wall);
  // Moldura da porta
  rc(ctx, 86, 6, 22, 31, K.doorF);
  rc(ctx, 86, 6, 22, 2, K.door);
  rc(ctx, 86, 6, 2, 31, K.door);
  rc(ctx, 106, 6, 2, 31, K.door);
  // Exterior (sky + road)
  rc(ctx, 88, 8, 18, 16, K.sky);
  // Sol/lua
  rc(ctx, 97, 10, 3, 3, '#fde047');
  rc(ctx, 98, 9, 1, 1, '#fde047');
  rc(ctx, 98, 13, 1, 1, '#fde047');
  // Calçada
  rc(ctx, 88, 24, 18, 4, K.road);
  rc(ctx, 88, 26, 18, 2, '#111111');
  // Chão exterior
  rc(ctx, 88, 28, 18, 9, '#0f0f0f');
  // Vidro da porta (parte superior)
  rc(ctx, 88, 8, 18, 4, K.sky);
}

// ── TÉCNICO ────────────────────────────────────────────────────────────────────
// Personagem 6px largo × 13px alto (+ 1px braços cada lado = 8px total)
function drawTech(ctx: Ctx, x: number, y: number, frame: number, action: string, flip = false) {
  const f = Math.floor(frame);

  // Cabelo
  rc(ctx, x + 1, y,     4, 1, K.hair);
  rc(ctx, x,     y + 1, 1, 1, K.hair);
  rc(ctx, x + 5, y + 1, 1, 1, K.hair);
  // Rosto
  rc(ctx, x + 1, y + 1, 4, 3, K.skin);
  rc(ctx, x,     y + 2, 1, 2, K.skin); // bochechas
  rc(ctx, x + 5, y + 2, 1, 2, K.skin);
  // Olhos (2 olhos para vista frontal)
  rc(ctx, x + (flip ? 3 : 2), y + 2, 1, 1, K.eye);
  // Boca (pequena linha quando idle)
  if (action === 'sad') {
    rc(ctx, x + 2, y + 4, 2, 1, '#7f1d1d');
  }
  // Pescoço
  rc(ctx, x + 2, y + 4, 2, 1, K.skin);
  // Corpo / camisa
  rc(ctx, x, y + 5, 6, 4, K.shrt);
  rc(ctx, x + 2, y + 5, 2, 1, K.shD); // gola
  rc(ctx, x, y + 5, 1, 4, K.shD);     // borda esq
  rc(ctx, x + 5, y + 5, 1, 4, K.shD); // borda dir
  // Bolso
  rc(ctx, x + 1, y + 6, 2, 2, K.shD);

  // Braços
  if (action === 'work') {
    const aO = f % 4 < 2 ? 0 : 1;
    rc(ctx, x - 1, y + 5 + aO, 1, 3, K.skin);
    rc(ctx, x + 6, y + 6,      1, 3, K.skin);
  } else if (action === 'hold') {
    rc(ctx, x - 1, y + 4, 1, 3, K.skin);
    rc(ctx, x + 6, y + 4, 1, 3, K.skin);
  } else if (action === 'wave') {
    rc(ctx, x - 1, y + 5, 1, 3, K.skin);
    rc(ctx, x + 6, y + (f % 6 < 3 ? 3 : 4), 1, 3, K.skin);
  } else if (action === 'wait') {
    rc(ctx, x - 1, y + 7, 1, 2, K.skin);
    rc(ctx, x + 6, y + 7, 1, 2, K.skin);
  } else if (action === 'sad') {
    rc(ctx, x - 1, y + 8, 1, 1, K.skin);
    rc(ctx, x + 6, y + 8, 1, 1, K.skin);
  } else {
    rc(ctx, x - 1, y + 5, 1, 3, K.skin);
    rc(ctx, x + 6, y + 5, 1, 3, K.skin);
  }

  // Calça
  rc(ctx, x + 1, y + 9,  2, 4, K.pant);
  rc(ctx, x + 3, y + 9,  2, 4, K.pant);
  rc(ctx, x + 1, y + 9,  4, 1, K.pantD); // cinto
  // Pernas animadas (walk)
  if (action === 'walk') {
    const wf = f % 8;
    rc(ctx, x + 1, y + 10, 2, 3, wf < 4 ? K.pant : K.pantD);
    rc(ctx, x + 3, y + 10, 2, 3, wf < 4 ? K.pantD : K.pant);
    rc(ctx, x + (wf < 4 ? 0 : 1), y + 12, 3, 1, K.shoe);
    rc(ctx, x + (wf < 4 ? 3 : 2), y + 12, 3, 1, K.shoe);
  } else {
    rc(ctx, x + 1, y + 12, 2, 1, K.shoe);
    rc(ctx, x + 3, y + 12, 2, 1, K.shoe);
  }
}

// ── DISPOSITIVO (smartphone) ──────────────────────────────────────────────────
function drawPhone(ctx: Ctx, x: number, y: number, scrColor: string) {
  rc(ctx, x,     y,     4, 8, K.dvcD); // sombra
  rc(ctx, x,     y,     3, 8, K.dvc);  // corpo
  rc(ctx, x + 3, y,     1, 8, K.dvcL); // borda direita
  rc(ctx, x + 1, y + 1, 2, 5, scrColor); // tela
  rc(ctx, x + 1, y + 7, 1, 1, '#4b5563'); // botão home
}

// ── LUPA ─────────────────────────────────────────────────────────────────────
function drawMagnifier(ctx: Ctx, x: number, y: number, frame: number) {
  const b = Math.floor(frame / 8) % 3;
  const by = y + (b === 1 ? 1 : 0);
  // Cabo
  rc(ctx, x + 4, by + 4, 1, 3, K.magnH);
  rc(ctx, x + 5, by + 5, 1, 3, K.magnH);
  rc(ctx, x + 5, by + 7, 2, 1, K.magnR);
  // Aro da lente
  rc(ctx, x + 1, by,     3, 1, K.magnH);
  rc(ctx, x,     by + 1, 1, 3, K.magnH);
  rc(ctx, x + 4, by + 1, 1, 3, K.magnH);
  rc(ctx, x + 1, by + 4, 3, 1, K.magnH);
  // Vidro
  rc(ctx, x + 1, by + 1, 3, 3, K.magnG);
  rc(ctx, x + 1, by + 1, 1, 1, '#fff');  // reflexo
}

// ── FAÍSCAS ───────────────────────────────────────────────────────────────────
function drawSparks(ctx: Ctx, x: number, y: number, frame: number) {
  const pts = [[0,-1,0],[2,-2,2],[-1,-2,1],[3,-3,3],[1,-4,5],[-2,-3,4],[4,-1,6]];
  pts.forEach(([dx, dy, ph]) => {
    if (Math.floor(frame + ph) % 6 < 3) {
      const c = [K.spk1, K.spk2, K.spk3][Math.floor(frame + ph) % 3];
      ctx.fillStyle = c;
      ctx.fillRect((x + dx) * SC, (y + dy) * SC, SC, SC);
    }
  });
}

// ── ESTRELAS ──────────────────────────────────────────────────────────────────
function drawStars(ctx: Ctx, cx: number, cy: number, frame: number) {
  [[-5,-3],[5,-4],[-4,3],[6,2],[1,-6],[-2,4],[7,-1]].forEach(([dx, dy], i) => {
    const on = Math.floor(frame + i * 2) % 6 < 3;
    ctx.fillStyle = on ? K.star : K.starD;
    ctx.fillRect((cx + dx) * SC, (cy + dy) * SC, SC, SC);
  });
}

// ── RELÓGIO DE PAREDE ─────────────────────────────────────────────────────────
function drawClock(ctx: Ctx, x: number, y: number, frame: number) {
  // Caixa
  rc(ctx, x,     y,     7, 7, K.clkF);
  rc(ctx, x,     y,     7, 1, K.clk);
  rc(ctx, x,     y + 6, 7, 1, K.clk);
  rc(ctx, x,     y,     1, 7, K.clk);
  rc(ctx, x + 6, y,     1, 7, K.clk);
  // Números (simplificados como pontos)
  rc(ctx, x + 3, y + 1, 1, 1, K.clk); // 12
  rc(ctx, x + 5, y + 3, 1, 1, K.clk); // 3
  rc(ctx, x + 3, y + 5, 1, 1, K.clk); // 6
  rc(ctx, x + 1, y + 3, 1, 1, K.clk); // 9
  // Centro
  rc(ctx, x + 3, y + 3, 1, 1, '#374151');
  // Ponteiro (animado)
  const t = Math.floor(frame / 5) % 8;
  const handPts: [number,number][] = [[3,2],[4,2],[5,3],[5,4],[4,5],[3,5],[2,4],[2,3]];
  const [hx, hy] = handPts[t];
  rc(ctx, x + hx, y + hy, 1, 1, K.xMk);
}

// ── MONITOR DE COMPUTADOR ─────────────────────────────────────────────────────
function drawMonitor(ctx: Ctx, x: number, y: number, frame: number) {
  // Tela
  rc(ctx, x,     y,     12, 9, K.mon);
  rc(ctx, x + 1, y + 1, 10, 7, K.monS);
  // Conteúdo na tela (orçamento / nota)
  rc(ctx, x + 2, y + 2, 8, 1, '#e0f2fe');
  for (let i = 0; i < 3; i++) rc(ctx, x + 2, y + 3 + i * 2, 6, 1, '#38bdf8');
  // Valor piscando
  if (Math.floor(frame / 6) % 2 === 0) {
    rc(ctx, x + 5, y + 6, 4, 1, '#22c55e');
  }
  // Suporte
  rc(ctx, x + 5, y + 9, 2, 2, K.monF);
  rc(ctx, x + 3, y + 11, 6, 1, K.monF);
}

// ── MOTO DE ENTREGA ───────────────────────────────────────────────────────────
// Moto movendo da direita pra esquerda (chegando)
function drawMotorcycle(ctx: Ctx, x: number, y: number, frame: number) {
  const f = Math.floor(frame);
  const wheelSpin = f % 4;

  // Escapamento / fumaça (atrás = direita da moto)
  if (f % 8 < 4) {
    rc(ctx, x + 21, y + 4, 2, 2, K.smoke);
    rc(ctx, x + 23, y + 3, 2, 2, K.smoke);
  }

  // Escapamento
  rc(ctx, x + 18, y + 5, 4, 1, K.mExh);
  rc(ctx, x + 21, y + 4, 1, 2, K.mExh);

  // ── Roda traseira (direita)
  rc(ctx, x + 14, y + 5, 6, 6, K.mWTire);
  rc(ctx, x + 15, y + 4, 4, 1, K.mWTire);
  rc(ctx, x + 14, y + 10, 6, 1, K.mWTire);
  rc(ctx, x + 13, y + 5, 1, 6, K.mWTire);
  rc(ctx, x + 20, y + 5, 1, 6, K.mWTire);
  // Aro roda traseira
  rc(ctx, x + 15, y + 5, 4, 4, K.mWRim);
  // Raios (animados)
  if (wheelSpin < 2) {
    rc(ctx, x + 17, y + 5, 1, 4, K.mWheel);
    rc(ctx, x + 15, y + 7, 4, 1, K.mWheel);
  } else {
    rc(ctx, x + 15, y + 6, 4, 2, K.mWRim);
    rc(ctx, x + 16, y + 5, 2, 4, K.mWRim);
  }

  // ── Roda dianteira (esquerda)
  rc(ctx, x + 1, y + 5, 6, 6, K.mWTire);
  rc(ctx, x + 2, y + 4, 4, 1, K.mWTire);
  rc(ctx, x + 1, y + 10, 6, 1, K.mWTire);
  rc(ctx, x,     y + 5, 1, 6, K.mWTire);
  rc(ctx, x + 7, y + 5, 1, 6, K.mWTire);
  // Aro roda dianteira
  rc(ctx, x + 2, y + 5, 4, 4, K.mWRim);
  if (wheelSpin < 2) {
    rc(ctx, x + 4, y + 5, 1, 4, K.mWheel);
    rc(ctx, x + 2, y + 7, 4, 1, K.mWheel);
  } else {
    rc(ctx, x + 2, y + 6, 4, 2, K.mWRim);
    rc(ctx, x + 3, y + 5, 2, 4, K.mWRim);
  }

  // ── Garfo dianteiro
  rc(ctx, x + 4, y + 2, 1, 4, K.mFrD);
  rc(ctx, x + 5, y + 2, 1, 4, K.mFrD);

  // ── Chassi / quadro
  rc(ctx, x + 5, y + 3, 10, 2, K.mFrame);
  rc(ctx, x + 6, y + 2, 8, 1, K.mFrD);

  // ── Motor
  rc(ctx, x + 8, y + 5, 5, 3, K.mEngn);
  rc(ctx, x + 9, y + 4, 3, 1, K.mFrD);

  // ── Tanque / assento
  rc(ctx, x + 7, y + 1, 8, 3, K.mFrame);
  rc(ctx, x + 8, y, 6, 2, K.mFrD);  // tanque topo

  // ── Guidão
  rc(ctx, x + 4, y + 1, 3, 1, K.mEngn);
  rc(ctx, x + 4, y,     1, 2, K.mEngn);
  rc(ctx, x + 6, y,     1, 2, K.mEngn);
  // Luz dianteira
  rc(ctx, x,     y + 4, 2, 2, K.mLight);

  // ── Caixa de entrega (no bagageiro)
  rc(ctx, x + 15, y - 3, 6, 5, K.mBox);
  rc(ctx, x + 15, y - 3, 6, 1, K.mBoxD);
  rc(ctx, x + 15, y - 3, 1, 5, K.mBoxD);
  rc(ctx, x + 17, y - 2, 2, 1, K.boxT);  // logo/fita

  // ── Entregador (piloto)
  rc(ctx, x + 9, y - 5, 4, 3, K.mHelm); // capacete
  rc(ctx, x + 8, y - 4, 1, 2, K.skin);  // rosto
  rc(ctx, x + 10, y - 2, 4, 3, K.mRider); // corpo
  rc(ctx, x + 9, y,     2, 2, K.mRider); // perna
  rc(ctx, x + 13, y,    2, 2, K.mRider); // perna
  // Braço no guidão
  rc(ctx, x + 7, y - 1, 3, 1, K.mRider);
}

// ── BARRA DE SINAL ────────────────────────────────────────────────────────────
function drawSignalBars(ctx: Ctx, x: number, y: number, frame: number) {
  const lvl = Math.floor(frame / 10) % 6;
  for (let i = 0; i < 5; i++) {
    const h = i * 2 + 2;
    rc(ctx, x + i * 3, y + (8 - h), 2, h, i < lvl ? K.chk : '#1e293b');
  }
}

// ── CHECK GRANDE ──────────────────────────────────────────────────────────────
function drawBigCheck(ctx: Ctx, x: number, y: number) {
  rc(ctx, x,     y + 4, 2, 2, K.chk);
  rc(ctx, x + 2, y + 6, 2, 2, K.chk);
  rc(ctx, x + 4, y + 2, 2, 6, K.chk);
  rc(ctx, x + 6, y,     2, 4, K.chk);
}

// ── X GRANDE ─────────────────────────────────────────────────────────────────
function drawBigX(ctx: Ctx, x: number, y: number, frame: number) {
  if (Math.floor(frame / 5) % 2 === 0) {
    rc(ctx, x,     y,     3, 3, K.xMk); rc(ctx, x + 5, y,     3, 3, K.xMk);
    rc(ctx, x + 2, y + 2, 4, 4, K.xMk);
    rc(ctx, x,     y + 5, 3, 3, K.xMk); rc(ctx, x + 5, y + 5, 3, 3, K.xMk);
  }
}

// ── NOTIFICAÇÃO PISCANDO ──────────────────────────────────────────────────────
function drawNotif(ctx: Ctx, x: number, y: number, frame: number) {
  const on = Math.floor(frame / 8) % 2 === 0;
  rc(ctx, x,     y,     3, 3, on ? K.notif : K.notD);
  rc(ctx, x + 4, y + 1, 3, 3, on ? K.notif : K.notD);
  rc(ctx, x + 8, y,     3, 3, on ? K.notif : K.notD);
}

// ── SOLDA / FERRO DE SOLDA ────────────────────────────────────────────────────
function drawSolderIron(ctx: Ctx, x: number, y: number, frame: number) {
  const aOff = Math.floor(frame / 4) % 2;
  rc(ctx, x,     y + aOff, 1, 6, K.tol2);
  rc(ctx, x + 1, y + aOff, 4, 1, K.tol1);
  rc(ctx, x,     y + aOff, 1, 1, K.spk1); // ponta quente
  // Fio de solda
  rc(ctx, x + 5, y,       1, 3, K.tol2);
  rc(ctx, x + 6, y + 3,   1, 3, K.tol2);
}

// ─── CENA PRINCIPAL ───────────────────────────────────────────────────────────
function renderScene(ctx: Ctx, status: string, frame: number) {
  ctx.clearRect(0, 0, LW * SC, LH * SC);

  if (status === 'aguardando_peca') {
    // Cena especial: interior da loja + porta/exterior com moto chegando
    drawShop(ctx);
    drawDoorExterior(ctx);

    // Técnico dentro, esperando perto da porta
    drawTech(ctx, 62, 15, frame, 'wait');
    // Relógio na parede
    drawClock(ctx, 18, 10, frame);

    // Moto chegando pela porta (animada da direita para esquerda)
    const motoX = 130 - Math.floor(frame * 1.2) % 60;
    const clampedX = Math.max(88, Math.min(115, motoX));
    if (clampedX <= 108) {
      drawMotorcycle(ctx, clampedX, 16, frame);
    }

    // Seta de direção
    if (Math.floor(frame / 8) % 2 === 0) {
      rc(ctx, 72, 20, 6, 1, K.notif);
      rc(ctx, 70, 19, 2, 3, K.notif);
    }
    return;
  }

  drawShop(ctx);
  const f = frame;

  switch (status) {
    case 'aberta': {
      // Técnico no balcão recebendo o aparelho
      drawTech(ctx, 52, 15, f, 'idle');
      // Cliente (personagem simples à esquerda)
      // Cabeça do cliente
      rc(ctx, 8, 16, 4, 4, K.skin);
      rc(ctx, 8, 15, 4, 1, '#111827'); // cabelo
      rc(ctx, 9, 17, 1, 1, K.eye);
      // Corpo do cliente
      rc(ctx, 7, 20, 6, 4, '#16a34a'); // camisa verde
      // Braços do cliente entregando o phone
      rc(ctx, 6, 20, 1, 3, K.skin);
      rc(ctx, 13, 20, 1, 2, K.skin);
      // Telefone sendo entregue
      const phoneX = 17 + Math.min(6, Math.floor(f / 8) % 12 < 6 ? Math.floor(f / 8) % 6 : 5);
      drawPhone(ctx, phoneX, 22, K.scrA);
      // Seta de entrega
      if (phoneX < 22 && Math.floor(f / 6) % 2 === 0) {
        rc(ctx, phoneX + 5, 23, 2, 1, '#94a3b8');
        rc(ctx, phoneX + 6, 22, 1, 3, '#94a3b8');
      }
      break;
    }

    case 'em_diagnostico': {
      // Técnico curvado sobre a bancada examinando o aparelho
      drawTech(ctx, 30, 15, f, 'work');
      drawPhone(ctx, 20, 23, K.scrA);
      // Lupa na mão do técnico
      drawMagnifier(ctx, 22, 14, f);
      // Osciloscópio em cima da bancada (fundo)
      rc(ctx, 55, 18, 18, 10, '#0a0a10');
      rc(ctx, 55, 18, 18, 1, K.shelfB);
      rc(ctx, 56, 19, 16, 8, '#0d1117');
      // Linha do osciloscópio animada
      ctx.strokeStyle = K.chk;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let ox = 0; ox < 14; ox++) {
        const oy = 4 + Math.round(Math.sin((ox + Math.floor(f)) * 0.8) * 2);
        if (ox === 0) ctx.moveTo((57 + ox) * SC, (20 + oy) * SC);
        else ctx.lineTo((57 + ox) * SC, (20 + oy) * SC);
      }
      ctx.stroke();
      break;
    }

    case 'aguardando_aprovacao': {
      // Técnico ao lado do monitor esperando resposta do cliente
      drawTech(ctx, 50, 15, f, 'wait');
      drawPhone(ctx, 20, 23, f % 14 < 7 ? K.scrN : K.scrA);
      drawMonitor(ctx, 28, 14, f);
      drawNotif(ctx, 40, 11, f);
      break;
    }

    case 'em_reparo': {
      // Técnico trabalhando com ferramentas
      drawTech(ctx, 28, 15, f, 'work');
      drawPhone(ctx, 18, 23, K.scrX);
      drawSolderIron(ctx, 20, 18, f);
      drawSparks(ctx, 22, 22, f);
      // PCB / placa na bancada
      rc(ctx, 40, 24, 14, 3, '#064e3b');
      rc(ctx, 41, 24, 12, 3, '#065f46');
      for (let i = 0; i < 6; i++) rc(ctx, 42 + i * 2, 25, 1, 1, K.spk1);
      // Segundo técnico à direita (detalhe extra)
      drawTech(ctx, 58, 15, f + 5, 'idle');
      break;
    }

    case 'testes': {
      // Técnico segurando o aparelho testando
      drawTech(ctx, 35, 15, f, 'hold');
      // Aparelho nas mãos (na frente do corpo)
      drawPhone(ctx, 28, 13, f % 8 < 4 ? K.scrN : K.scrG);
      drawSignalBars(ctx, 50, 17, f);
      // Bateria
      rc(ctx, 54, 17, 8, 4, '#1e293b');
      rc(ctx, 54, 17, Math.floor(f / 6) % 5 * 2, 4, K.chk);
      rc(ctx, 62, 18, 1, 2, '#1e293b'); // pino
      break;
    }

    case 'finalizada': {
      // Técnico levantando o aparelho com estrelas
      drawTech(ctx, 38, 15, f, 'hold');
      drawPhone(ctx, 31, 10, K.scrN);
      drawStars(ctx, 33, 13, f);
      // Balão "PRONTO!" acima
      rc(ctx, 20, 8, 16, 5, '#16161a');
      rc(ctx, 20, 8, 16, 1, K.chk);
      rc(ctx, 20, 8, 1, 5, K.chk);
      rc(ctx, 35, 8, 1, 5, K.chk);
      rc(ctx, 20, 12, 16, 1, K.chk);
      // Letras P-R-O (simplificadas como retângulos)
      rc(ctx, 22, 9, 2, 3, K.chk);
      rc(ctx, 25, 9, 2, 3, K.chk);
      rc(ctx, 28, 9, 2, 3, K.chk);
      break;
    }

    case 'entregue': {
      // Cliente e técnico no balcão trocando o aparelho
      drawPhone(ctx, 34, 23, K.scrN);
      // Técnico estendendo o phone
      drawTech(ctx, 40, 15, f, 'hold');
      // Cliente recebendo (simples)
      rc(ctx, 18, 16, 4, 4, K.skin);
      rc(ctx, 18, 15, 4, 1, '#111827');
      rc(ctx, 19, 17, 1, 1, K.eye);
      rc(ctx, 17, 20, 6, 4, '#16a34a');
      rc(ctx, 16, 20, 1, 3, K.skin);
      rc(ctx, 23, 20, 1, 3, K.skin);
      drawBigCheck(ctx, 60, 14);
      break;
    }

    case 'cancelada': {
      drawTech(ctx, 40, 17, f, 'sad');
      drawPhone(ctx, 24, 23, K.scrX);
      drawBigX(ctx, 14, 14, f);
      // Nuvem cinza de desânimo
      if (Math.floor(f / 10) % 2 === 0) {
        rc(ctx, 38, 10, 12, 4, '#1e293b');
        rc(ctx, 36, 11, 16, 2, '#1e293b');
        rc(ctx, 40, 14, 1, 1, '#334155');
        rc(ctx, 43, 15, 1, 1, '#334155');
        rc(ctx, 46, 14, 1, 1, '#334155');
      }
      break;
    }

    default:
      drawTech(ctx, 38, 15, f, 'idle');
  }
}

// ─── COMPONENTE PIXEL SCENE ───────────────────────────────────────────────────
function PixelAgentScene({ status }: { status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const animate = () => {
      frameRef.current += 0.2;
      renderScene(ctx, status, frameRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [status]);

  const cfg = STATUS[status] || STATUS.aberta;

  return (
    <div style={{ background: '#0d0d14', border: `1px solid ${cfg.color}35`, borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', boxShadow: `0 0 20px ${cfg.color}12` }}>
      <canvas
        ref={canvasRef}
        width={LW * SC}
        height={LH * SC}
        style={{ display: 'block', width: '100%', imageRendering: 'pixelated' }}
      />
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: `${cfg.color}08` }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
        <span style={{ fontSize: '11px', color: cfg.color, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{cfg.label}</span>
      </div>
    </div>
  );
}

// ─── PÁGINA PÚBLICA ───────────────────────────────────────────────────────────
export const PublicStatusPixel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder]               = useState<any | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [approving, setApproving]       = useState(false);
  const [approvalDone, setApprovalDone] = useState<{ approved: boolean; message: string } | null>(null);
  const [clientNote, setClientNote]     = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  const fetchOrder = async (orderId: string) => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/orders/public/${orderId}`);
      setOrder(res.data);
    } catch {
      setError('Ordem não encontrada. Verifique o protocolo e tente novamente.');
      setOrder(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchOrder(id); }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) fetchOrder(search.trim());
  };

  const handleApproval = async (approved: boolean) => {
    if (!order) return;
    setApproving(true);
    try {
      const res = await api.post(`/orders/public/${order.id}/approve`, { approved, clientNote });
      setApprovalDone({ approved, message: res.data.message });
      await fetchOrder(order.protocol);
    } catch {
      alert('Erro ao processar aprovação. Tente novamente.');
    } finally { setApproving(false); }
  };

  const currentStep  = order ? ALL_STEPS.indexOf(order.status) : -1;
  const cfg          = order ? (STATUS[order.status] || STATUS.aberta) : null;
  const displayValue = order ? (Number(order.finalValue) > 0 ? Number(order.finalValue) : Number(order.estimatedValue) || 0) : 0;
  const pub          = order?.publicSettings ?? { showPrice: true, showTimeline: true, showTechnician: false, customMessage: '', accentColor: '#3b82f6' };
  const accentColor  = pub.accentColor || '#3b82f6';

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0c', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg, ${accentColor}, #7c3aed)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Smartphone size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Status da OS</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Acompanhe o andamento do seu equipamento</p>
        </div>

        {/* Busca */}
        {!id && (
          <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  placeholder="Digite o número do protocolo..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '13px 12px 13px 38px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" style={{ padding: '0 20px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', minHeight: '48px' }}>
                Buscar
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Buscando...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', textAlign: 'center', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {order && cfg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── CENA PIXEL AGENT ── */}
            <PixelAgentScene status={order.status} />

            {pub.customMessage && (
              <div style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30`, borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', textAlign: 'center' }}>
                {pub.customMessage}
              </div>
            )}

            {/* Card status */}
            <div style={{ background: '#16161a', border: `1px solid ${cfg.color}40`, borderRadius: '16px', padding: '20px', borderTop: `3px solid ${cfg.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>Protocolo</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'monospace' }}>#{order.protocol}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, borderRadius: '10px', padding: '8px 14px' }}>
                  <cfg.icon size={16} color={cfg.color} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 14px' }}>{cfg.desc}</p>
              {order.equipments?.[0] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <Smartphone size={15} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    {order.equipments[0].brand} {order.equipments[0].model}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                <Calendar size={12} /> Abertura: {fmtDate(order.entryDate)}
              </div>
            </div>

            {/* Timeline */}
            {order.status !== 'cancelada' && pub.showTimeline && (
              <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progresso</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {ALL_STEPS.map((step, i) => {
                    const s = STATUS[step];
                    const done = i < currentStep, active = i === currentStep, future = i > currentStep;
                    return (
                      <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done ? s.color : active ? s.color : 'rgba(255,255,255,0.08)', border: `2px solid ${active ? s.color : done ? s.color : 'transparent'}`, boxShadow: active ? `0 0 0 3px ${s.color}30` : 'none' }}>
                            {done ? <CheckCircle size={12} color="#fff" /> : active ? <s.icon size={11} color="#fff" /> : null}
                          </div>
                          {i < ALL_STEPS.length - 1 && <div style={{ width: '2px', height: '24px', background: done ? s.color : 'rgba(255,255,255,0.06)', margin: '2px 0' }} />}
                        </div>
                        <div style={{ paddingBottom: i < ALL_STEPS.length - 1 ? '4px' : '0', paddingTop: '3px' }}>
                          <p style={{ fontSize: '13px', fontWeight: active ? 700 : 400, color: future ? 'rgba(255,255,255,0.25)' : active ? '#fff' : 'rgba(255,255,255,0.6)', margin: 0 }}>{s.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diagnóstico */}
            {(order.diagnosis || (pub.showPrice && displayValue > 0)) && (
              <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnóstico</p>
                {order.diagnosis && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px', lineHeight: 1.6 }}>{order.diagnosis}</p>}
                {pub.showPrice && displayValue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Valor do Serviço</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#22c55e' }}>{fmtCurrency(displayValue)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Aprovação */}
            {order.showBudget && !approvalDone && (
              <div style={{ background: '#16161a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <AlertCircle size={18} color="#f59e0b" />
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', margin: 0 }}>Aprovação Necessária</p>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.6 }}>
                  O diagnóstico foi concluído. Deseja aprovar o serviço pelo valor de <strong style={{ color: '#22c55e' }}>{fmtCurrency(displayValue)}</strong>?
                </p>
                {!showApprovalForm ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowApprovalForm(true)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <ThumbsUp size={16} /> Aprovar
                    </button>
                    <button onClick={() => setShowApprovalForm(true)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <ThumbsDown size={16} /> Rejeitar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      placeholder="Observação (opcional)..."
                      value={clientNote} onChange={e => setClientNote(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', resize: 'vertical', minHeight: '72px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApproval(true)} disabled={approving} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: approving ? 0.7 : 1 }}>
                        <ThumbsUp size={16} /> {approving ? 'Aguarde...' : 'Confirmar Aprovação'}
                      </button>
                      <button onClick={() => handleApproval(false)} disabled={approving} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: approving ? 0.7 : 1 }}>
                        <ThumbsDown size={16} /> {approving ? 'Aguarde...' : 'Rejeitar'}
                      </button>
                    </div>
                    <button onClick={() => setShowApprovalForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                  </div>
                )}
              </div>
            )}

            {approvalDone && (
              <div style={{ background: approvalDone.approved ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${approvalDone.approved ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                {approvalDone.approved ? <ThumbsUp size={28} color="#22c55e" style={{ marginBottom: '8px' }} /> : <ThumbsDown size={28} color="#ef4444" style={{ marginBottom: '8px' }} />}
                <p style={{ fontSize: '15px', fontWeight: 700, color: approvalDone.approved ? '#22c55e' : '#ef4444', margin: '0 0 6px' }}>
                  {approvalDone.approved ? 'Aprovado!' : 'Rejeitado'}
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{approvalDone.message}</p>
              </div>
            )}

            {order.shopPhone && (
              <a
                href={`https://wa.me/${order.shopPhone.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá! Estou acompanhando minha OS #${order.protocol}.`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '14px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}
              >
                <MessageCircle size={18} /> Falar com a Assistência
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
