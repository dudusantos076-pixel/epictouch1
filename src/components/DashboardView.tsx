import React from 'react';
import { Order, Part, FinancialTransaction } from '../types';
import { 
  FileText, Play, Clock, CheckCircle, TrendingUp, AlertTriangle, 
  UserPlus, DollarSign, PlusCircle, ShoppingBag, ArrowUpRight, ArrowDownRight, RefreshCw 
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  parts: Part[];
  finance: FinancialTransaction[];
  onNavigate: (view: string) => void;
  onQuickNewOS?: () => void;
}

export default function DashboardView({ orders, parts, finance, onNavigate, onQuickNewOS }: DashboardViewProps) {
  // Stats Calculation
  // 1. Ordens em Aberto (not Finalizado or Pronto para retirada)
  const openStatuses = ['Recebido', 'Em análise', 'Aguardando aprovação', 'Aguardando peça', 'Em reparo', 'Teste'];
  const openOrdersCount = orders.filter(o => openStatuses.includes(o.status)).length;
  
  // 2. Em Andamento (Em reparo + Teste)
  const inProgressCount = orders.filter(o => o.status === 'Em reparo' || o.status === 'Teste').length;
  
  // 3. Aguardando Peça
  const waitingPartsCount = orders.filter(o => o.status === 'Aguardando peça').length;
  
  // 4. Finalizadas Hoje
  // We seeded the ones on "2026-07-16" with "Pronto para retirada" or "Finalizado".
  const todayStr = "2026-07-16"; // Fixed current date from metadata
  const finishedTodayCount = orders.filter(o => 
    o.date === todayStr && (o.status === 'Finalizado' || o.status === 'Pronto para retirada')
  ).length;

  // 5. Faturamento do Mês (Inputs in Current Month, seeded as exactly R$ 28.540,00)
  const totalFaturamento = finance
    .filter(t => t.type === 'input')
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Expenses
  const totalDespesas = finance
    .filter(t => t.type === 'output')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalFaturamento - totalDespesas;

  // Low Stock Alert (parts with qty <= minQty)
  const lowStockParts = parts.filter(p => p.qty <= p.minQty);

  // Recent 5 Orders
  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 5);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Epic CRM <span className="text-xs bg-emerald-55/10 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded font-mono font-medium">SISTEMA ATIVO</span>
          </h1>
          <p className="text-sm text-slate-500">Visão geral em tempo real da sua assistência técnica</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Julho, 2026</span>
          <button 
            onClick={() => window.location.reload()} 
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Atualizar Dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Ordens em Aberto */}
        <div 
          onClick={() => onNavigate('Relatórios')}
          className="bg-white border border-slate-200 shadow-sm hover:border-blue-500/50 p-4 rounded-xl transition-all cursor-pointer group hover:translate-y-[-2px]"
          id="stat-card-open"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Abertas</span>
            <FileText className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-mono font-black text-slate-900 tracking-tight">{openOrdersCount}</div>
          <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" /> Pendentes de reparo
          </p>
        </div>

        {/* Em Andamento */}
        <div 
          onClick={() => onNavigate('Relatórios')}
          className="bg-white border border-slate-200 shadow-sm hover:border-amber-500/50 p-4 rounded-xl transition-all cursor-pointer group hover:translate-y-[-2px]"
          id="stat-card-progress"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Em Reparo</span>
            <Play className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-mono font-black text-slate-900 tracking-tight">{inProgressCount}</div>
          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" /> Na bancada / Testes
          </p>
        </div>

        {/* Aguardando Peça */}
        <div 
          onClick={() => onNavigate('Estoque')}
          className="bg-white border border-slate-200 shadow-sm hover:border-rose-500/50 p-4 rounded-xl transition-all cursor-pointer group hover:translate-y-[-2px]"
          id="stat-card-parts"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Aguardando Peça</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-mono font-black text-slate-900 tracking-tight">{waitingPartsCount}</div>
          <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" /> Falta de componente
          </p>
        </div>

        {/* Finalizadas Hoje */}
        <div 
          onClick={() => onNavigate('Relatórios')}
          className="bg-white border border-slate-200 shadow-sm hover:border-emerald-500/50 p-4 rounded-xl transition-all cursor-pointer group hover:translate-y-[-2px]"
          id="stat-card-finished"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Prontas Hoje</span>
            <CheckCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-mono font-black text-slate-900 tracking-tight">{finishedTodayCount}</div>
          <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3" /> Meta diária superada
          </p>
        </div>

        {/* Faturamento do Mês */}
        <div 
          onClick={() => onNavigate('Financeiro')}
          className="bg-white border border-slate-200 shadow-sm hover:border-emerald-500/50 p-4 rounded-xl transition-all cursor-pointer group col-span-2 lg:col-span-1 hover:translate-y-[-2px]"
          id="stat-card-revenue"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento</span>
            <DollarSign className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-mono font-black text-slate-900 tracking-tight">{formatBRL(totalFaturamento)}</div>
          <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-mono">
            Lucro Líquido: <strong className="text-slate-900">{formatBRL(profit)}</strong>
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => { if (onQuickNewOS) onQuickNewOS(); else onNavigate('Nova Ordem de Serviço'); }}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl transition-colors text-sm font-semibold cursor-pointer shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-emerald-500" />
          Nova OS
        </button>
        <button 
          onClick={() => onNavigate('Clientes')}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl transition-colors text-sm font-semibold cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-blue-500" />
          Novo Cliente
        </button>
        <button 
          onClick={() => onNavigate('Estoque')}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl transition-colors text-sm font-semibold cursor-pointer shadow-sm"
        >
          <ShoppingBag className="w-4 h-4 text-purple-500" />
          Estoque
        </button>
        <button 
          onClick={() => onNavigate('Financeiro')}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl transition-colors text-sm font-semibold cursor-pointer shadow-sm"
        >
          <DollarSign className="w-4 h-4 text-indigo-500" />
          Financeiro
        </button>
      </div>

      {/* CHARTS & RECENT WORKFLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPH & LEDGER */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Histórico de Fluxo Mensal</h2>
              <p className="text-xs text-slate-500 font-mono">Receita total {formatBRL(totalFaturamento)} | Despesas {formatBRL(totalDespesas)}</p>
            </div>
            <span className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 font-mono font-medium">Balanço Líquido: {formatBRL(profit)}</span>
          </div>

          {/* HIGH-QUALITY CUSTOM SVG GRAPH */}
          <div className="h-44 relative bg-slate-50 rounded-lg p-2 border border-slate-200 flex items-end">
            <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradientExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="90" x2="400" y2="90" stroke="#f1f5f9" strokeDasharray="3,3" strokeWidth="0.5" />

              {/* Area path for Revenue */}
              <path 
                d="M 0 120 L 50 110 L 100 80 L 150 50 L 200 45 L 250 30 L 300 35 L 350 20 L 400 15 L 400 120 Z" 
                fill="url(#gradientRevenue)" 
              />
              {/* Line path for Revenue */}
              <path 
                d="M 0 120 L 50 110 L 100 80 L 150 50 L 200 45 L 250 30 L 300 35 L 350 20 L 400 15" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />

              {/* Area path for Expense */}
              <path 
                d="M 0 120 L 50 118 L 100 100 L 150 85 L 200 90 L 250 95 L 300 88 L 350 80 L 400 78 L 400 120 Z" 
                fill="url(#gradientExpense)" 
              />
              {/* Line path for Expense */}
              <path 
                d="M 0 120 L 50 118 L 100 100 L 150 85 L 200 90 L 250 95 L 300 88 L 350 80 L 400 78" 
                fill="none" 
                stroke="#f43f5e" 
                strokeWidth="1.5" 
                strokeDasharray="2,2"
                strokeLinecap="round"
              />

              {/* Milestones / Points */}
              <circle cx="250" cy="30" r="4" fill="#10b981" />
              <circle cx="350" cy="20" r="4" fill="#10b981" />
              <circle cx="400" cy="15" r="4" fill="#10b981" />
            </svg>

            {/* Labels overlay */}
            <div className="absolute top-2 left-2 text-[9px] text-slate-500 font-mono flex flex-col gap-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Receitas</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Despesas</span>
            </div>

            <div className="absolute bottom-1 right-2 text-[9px] text-slate-500 font-mono">
              Projeção Consolidada
            </div>
          </div>

          {/* Quick ledger summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium uppercase font-sans">Total de Entradas</span>
              <div className="text-sm font-mono font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {formatBRL(totalFaturamento)}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium uppercase font-sans">Total de Saídas</span>
              <div className="text-sm font-mono font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {formatBRL(totalDespesas)}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium uppercase font-sans">Margem Operativa</span>
              <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                {((profit / (totalFaturamento || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium uppercase font-sans">Média por OS</span>
              <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                {formatBRL(totalFaturamento / (orders.length || 1))}
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS & STOCK NOTIFICATIONS */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alertas do Estoque
            </h2>

            {lowStockParts.length === 0 ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-lg text-xs space-y-1">
                <p className="font-semibold">Nenhum item em falta!</p>
                <p className="text-slate-500">Todas as peças do estoque estão com níveis seguros de armazenamento.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lowStockParts.map(part => (
                  <div key={part.id} className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-slate-850">{part.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">Fornecedor: {part.supplier}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold font-mono">
                        Qtd: {part.qty}/{part.minQty}
                      </span>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Custo: {formatBRL(part.purchasePrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-150 text-center">
            <button 
              onClick={() => onNavigate('Estoque')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              Ir para Estoque &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Últimas Ordens de Serviço Registradas</h2>
            <p className="text-xs text-slate-500">Ordens cadastradas recentemente no painel</p>
          </div>
          <button 
            onClick={() => onNavigate('Nova Ordem de Serviço')}
            className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
            Nova OS
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[9px] tracking-wider">
                <th className="py-2.5 px-3">Nº OS</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Equipamento</th>
                <th className="py-2.5 px-3">Técnico</th>
                <th className="py-2.5 px-3">Valor</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {recentOrders.map((o) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'Recebido': return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'Em análise': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                    case 'Aguardando aprovação': return 'bg-orange-50 text-orange-700 border-orange-200';
                    case 'Aguardando peça': return 'bg-rose-50 text-rose-700 border-rose-200';
                    case 'Em reparo': return 'bg-amber-50 text-amber-700 border-amber-200';
                    case 'Teste': return 'bg-purple-50 text-purple-700 border-purple-200';
                    case 'Finalizado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    case 'Pronto para retirada': return 'bg-emerald-50 text-emerald-700 border-emerald-200 border-dashed';
                    default: return 'bg-slate-50 text-slate-500 border-slate-200';
                  }
                };

                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{o.number}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{o.clientName}</td>
                    <td className="py-2.5 px-3 text-slate-750">{o.brand} {o.model}</td>
                    <td className="py-2.5 px-3 text-slate-500">{o.techName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatBRL(o.value)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button 
                        onClick={() => {
                          // Navigating to general OS page and passing target id is handled by parent App router
                          onNavigate('Agenda'); // Or general screen view with target
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
