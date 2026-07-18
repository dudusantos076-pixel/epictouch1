import React from 'react';
import { Order, Part, FinancialTransaction } from '../types';
import { TrendingUp, FileText, Package, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RelatoriosViewProps {
  orders: Order[];
  parts: Part[];
  finance: FinancialTransaction[];
}

export default function RelatoriosView({ orders, parts, finance }: RelatoriosViewProps) {
  const totalFaturamento = finance
    .filter(t => t.type === 'input')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = finance
    .filter(t => t.type === 'output')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalFaturamento - totalDespesas;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6" id="reports-view-container">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Relatórios & Métricas Consolidadas
        </h1>
        <p className="text-xs text-slate-400 font-sans">Análise abrangente de desempenho comercial, margens de lucro, saída de estoque e indicadores chave</p>
      </div>

      {/* BIG SCORECARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Faturamento Líquido</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{formatBRL(totalFaturamento)}</div>
          <span className="text-[9px] text-slate-500 font-mono mt-1 block">Receitas de serviços / vendas</span>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Gasto Operacional</span>
          <div className="text-xl font-mono font-bold text-rose-400 mt-1">{formatBRL(totalDespesas)}</div>
          <span className="text-[9px] text-slate-500 font-mono mt-1 block">Custos operacionais e peças</span>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Lucratividade Bruta</span>
          <div className="text-xl font-mono font-bold text-white mt-1">{formatBRL(profit)}</div>
          <span className="text-[9px] text-slate-500 font-mono mt-1 block">Lucro líquido das operações</span>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Ordens de Serviço</span>
          <div className="text-xl font-mono font-bold text-blue-400 mt-1">{orders.length}</div>
          <span className="text-[9px] text-slate-500 font-mono mt-1 block">Total de chamados abertos</span>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 1: FINANCES SPLIT */}
        <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Análise de Balanço Mensal</h3>
            <p className="text-xs text-slate-500">Representação visual do saldo operativo do caixa</p>
          </div>

          <div className="h-56 bg-slate-900/40 border border-slate-900 rounded-lg p-4 flex flex-col justify-between">
            {/* Visual SVG chart bar comparing income vs expenses */}
            <div className="flex h-40 items-end justify-center gap-12 pt-4">
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-16 bg-emerald-500 hover:opacity-90 rounded-t-lg transition-all duration-500 flex items-end justify-center font-mono text-[9px] text-slate-950 font-bold pb-2"
                  style={{ height: `${(totalFaturamento / Math.max(totalFaturamento, 1)) * 120}px` }}
                >
                  100%
                </div>
                <span className="text-xs text-slate-300 font-semibold uppercase">Faturamento</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-16 bg-rose-500 hover:opacity-90 rounded-t-lg transition-all duration-500 flex items-end justify-center font-mono text-[9px] text-slate-950 font-bold pb-2"
                  style={{ height: `${(totalDespesas / Math.max(totalFaturamento, 1)) * 120}px` }}
                >
                  {((totalDespesas / (totalFaturamento || 1)) * 100).toFixed(0)}%
                </div>
                <span className="text-xs text-slate-300 font-semibold uppercase">Despesas</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-16 bg-blue-500 hover:opacity-90 rounded-t-lg transition-all duration-500 flex items-end justify-center font-mono text-[9px] text-slate-950 font-bold pb-2"
                  style={{ height: `${(profit / Math.max(totalFaturamento, 1)) * 120}px` }}
                >
                  {((profit / (totalFaturamento || 1)) * 100).toFixed(0)}%
                </div>
                <span className="text-xs text-slate-300 font-semibold uppercase">Lucro</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-mono">
              Projeções em tempo real atualizadas conforme faturamento ativo.
            </div>
          </div>
        </div>

        {/* GRAPH 2: WORK DISTRIBUTION BY STATUS */}
        <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Carga Operacional de Ordens</h3>
            <p className="text-xs text-slate-500">Distribuição volumétrica por status</p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {[
              { label: 'Abertas / Em Análise', count: orders.filter(o => ['Recebido', 'Em análise'].includes(o.status)).length, color: 'bg-blue-500' },
              { label: 'Aguardando Peça / Aprovação', count: orders.filter(o => ['Aguardando peça', 'Aguardando aprovação'].includes(o.status)).length, color: 'bg-rose-500' },
              { label: 'Em Execução / Reparo', count: orders.filter(o => ['Em reparo', 'Teste'].includes(o.status)).length, color: 'bg-amber-500' },
              { label: 'Finalizadas / Entregues', count: orders.filter(o => ['Finalizado', 'Pronto para retirada'].includes(o.status)).length, color: 'bg-emerald-500' },
            ].map((stat) => {
              const total = orders.length || 1;
              const percentage = (stat.count / total) * 100;
              return (
                <div key={stat.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{stat.label}</span>
                    <span className="font-mono text-slate-400">{stat.count} un ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full ${stat.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
