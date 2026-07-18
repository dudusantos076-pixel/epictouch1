import React, { useState } from 'react';
import { FinancialTransaction } from '../types';
import { ArrowUpRight, ArrowDownRight, Search, Plus, Trash2, Check, X, DollarSign, Wallet, RefreshCw, Layers } from 'lucide-react';

interface FinanceiroViewProps {
  finance: FinancialTransaction[];
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'date'>) => Promise<any>;
}

export default function FinanceiroView({ finance, onAddTransaction }: FinanceiroViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields State
  const [type, setType] = useState<'input' | 'output'>('input');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Serviço');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Cartão' | 'Dinheiro' | 'Parcelamento'>('PIX');

  const [errorMessage, setErrorMessage] = useState('');

  // Stats
  const totalInputs = finance
    .filter(t => t.type === 'input')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutputs = finance
    .filter(t => t.type === 'output')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalInputs - totalOutputs;

  // Split by Payment Method
  const methodStats = finance
    .filter(t => t.type === 'input')
    .reduce((acc, t) => {
      const m = t.paymentMethod || 'PIX';
      acc[m] = (acc[m] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

  const filteredTransactions = [...finance]
    .sort((a, b) => b.id.localeCompare(a.id)) // newest first
    .filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!description || amount <= 0) {
      setErrorMessage('Descrição e valor válido são campos obrigatórios.');
      return;
    }

    try {
      await onAddTransaction({
        type,
        description,
        category,
        amount: Number(amount),
        paymentMethod: type === 'input' ? paymentMethod : undefined
      });
      setIsFormOpen(false);
      // Reset
      setDescription('');
      setAmount(0);
    } catch (err: any) {
      setErrorMessage('Erro ao salvar transação: ' + err.message);
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6" id="finance-view-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Gestão Financeira & Caixa
          </h1>
          <p className="text-xs text-slate-400">Fluxo de caixa detalhado, receitas por canais e acompanhamento de margens</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Lançar Movimentação
        </button>
      </div>

      {/* CORE FINANCIAL SCORECARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ENTRADAS */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Receitas (Entradas)</span>
            <div className="text-2xl font-mono font-bold text-emerald-400">{formatBRL(totalInputs)}</div>
            <p className="text-[9px] text-slate-400">Orçamentos e vendas faturadas</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* SAÍDAS */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Despesas (Saídas)</span>
            <div className="text-2xl font-mono font-bold text-rose-400">{formatBRL(totalOutputs)}</div>
            <p className="text-[9px] text-slate-400">Peças, aluguel, infra e marketing</p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* LUCRO */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Saldo do Caixa (Lucro)</span>
            <div className="text-2xl font-mono font-bold text-white">{formatBRL(profit)}</div>
            <p className="text-[9px] text-emerald-400 font-semibold">Margem operativa: {((profit / (totalInputs || 1)) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* METRIC GRAPHS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LIST OF TRANSACTIONS */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Histórico de Lançamentos</h2>
              <p className="text-xs text-slate-500">Últimas entradas e saídas financeiras processadas</p>
            </div>

            <div className="flex bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 items-center gap-1.5 max-w-xs shadow-inner">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-32"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-900 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3">Descrição</th>
                  <th className="py-2 px-3">Categoria</th>
                  <th className="py-2 px-3">Forma</th>
                  <th className="py-2 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 font-sans">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{tx.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{tx.description}</td>
                    <td className="py-2.5 px-3 text-slate-400">{tx.category}</td>
                    <td className="py-2.5 px-3">
                      {tx.type === 'input' ? (
                        <span className="text-emerald-400 font-medium">{tx.paymentMethod || 'PIX'}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      tx.type === 'input' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'input' ? '+' : '-'} {formatBRL(tx.amount)}
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Nenhuma transação financeira encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENT CHANNELS ANALYSIS */}
        <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Recebimentos por Canal
              </h2>
              <p className="text-xs text-slate-500">Distribuição percentual do faturamento bruto</p>
            </div>

            {/* HIGH-QUALITY SVG BAR CHART REPRESENTATION */}
            <div className="space-y-3.5">
              {['PIX', 'Cartão', 'Dinheiro', 'Parcelamento'].map((method) => {
                const value = methodStats[method] || 0;
                const percentage = totalInputs > 0 ? (value / totalInputs) * 100 : 0;
                
                const getMethodColor = (m: string) => {
                  switch (m) {
                    case 'PIX': return 'bg-emerald-500';
                    case 'Cartão': return 'bg-blue-500';
                    case 'Dinheiro': return 'bg-amber-500';
                    default: return 'bg-purple-500';
                  }
                };

                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{method}</span>
                      <span className="text-slate-400 font-mono">{formatBRL(value)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className={`h-full ${getMethodColor(method)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-900 text-center text-[10px] text-slate-500">
            * Atualizações automáticas sincronizadas via Gateway PIX e faturamentos de OS.
          </div>
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Lançar Nova Movimentação Comercial
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tipo de Transação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('input')}
                    className={`py-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      type === 'input'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-850'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('output')}
                    className={`py-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      type === 'output'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-850'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Saída (Despesa)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Descrição / Tópico</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Pagamento Fornecedor de Telas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  >
                    {type === 'input' ? (
                      <>
                        <option value="Serviço">Serviço de Reparo</option>
                        <option value="Venda">Venda de Acessório</option>
                        <option value="Aparelho">Venda de Aparelho</option>
                        <option value="Outros">Outros Ganhos</option>
                      </>
                    ) : (
                      <>
                        <option value="Estoque">Estoque / Componentes</option>
                        <option value="Aluguel">Aluguel / Condomínio</option>
                        <option value="Despesas Operacionais">Luz / Internet / Água</option>
                        <option value="Salários">Folha de Pagamentos</option>
                        <option value="Marketing">Anúncios & Mídias</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor Monetário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {type === 'input' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Canal de Liquidação</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="PIX">PIX à Vista</option>
                    <option value="Cartão">Cartão de Crédito/Débito</option>
                    <option value="Dinheiro">Dinheiro Físico</option>
                    <option value="Parcelamento">Boleto / Crediário</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Efetivar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
