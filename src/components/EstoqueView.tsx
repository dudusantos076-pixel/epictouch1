import React, { useState } from 'react';
import { Part } from '../types';
import { Search, Plus, Trash2, Edit, Check, X, AlertTriangle, ArrowUp, ArrowDown, Package, Layers } from 'lucide-react';

interface EstoqueViewProps {
  parts: Part[];
  onAddPart: (p: Omit<Part, 'id'>) => Promise<any>;
  onUpdatePart: (id: string, p: Partial<Part>) => Promise<any>;
  onDeletePart: (id: string) => Promise<any>;
}

export default function EstoqueView({ parts, onAddPart, onUpdatePart, onDeletePart }: EstoqueViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [qty, setQty] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [minQty, setMinQty] = useState(3);

  const [errorMessage, setErrorMessage] = useState('');

  // Quick adjustment popup
  const [adjustPart, setAdjustPart] = useState<Part | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  );

  const openNewForm = () => {
    setEditingPart(null);
    setName('');
    setSupplier('');
    setQty(0);
    setPurchasePrice(0);
    setSellingPrice(0);
    setBarcode('');
    setMinQty(3);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (part: Part) => {
    setEditingPart(part);
    setName(part.name);
    setSupplier(part.supplier);
    setQty(part.qty);
    setPurchasePrice(part.purchasePrice);
    setSellingPrice(part.sellingPrice);
    setBarcode(part.barcode);
    setMinQty(part.minQty);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !supplier) {
      setErrorMessage('Nome da Peça e Fornecedor são campos obrigatórios.');
      return;
    }

    const payload = {
      name,
      supplier,
      qty: Number(qty),
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      barcode,
      minQty: Number(minQty)
    };

    try {
      if (editingPart) {
        await onUpdatePart(editingPart.id, payload);
      } else {
        await onAddPart(payload);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMessage('Erro ao salvar item no estoque: ' + err.message);
    }
  };

  const handleQuickAdjust = async () => {
    if (!adjustPart) return;
    const finalQty = adjustType === 'in' 
      ? adjustPart.qty + adjustQty 
      : Math.max(0, adjustPart.qty - adjustQty);

    try {
      await onUpdatePart(adjustPart.id, { qty: finalQty });
      setAdjustPart(null);
      setAdjustQty(1);
    } catch (err: any) {
      alert('Erro ao reajustar estoque: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta peça do estoque?')) {
      try {
        await onDeletePart(id);
      } catch (err: any) {
        alert('Erro ao excluir peça: ' + err.message);
      }
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6" id="inventory-view-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Controle de Estoque & Peças
          </h1>
          <p className="text-xs text-slate-400">Cadastre suprimentos, realize entradas/saídas e acompanhe níveis de estoque</p>
        </div>
        <button
          onClick={openNewForm}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Peça / Componente
        </button>
      </div>

      {/* FILTERS & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-2.5 items-center gap-2 md:col-span-2 shadow-inner">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome de peça, fornecedor ou código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs flex items-center gap-2 text-slate-300">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Total de Itens: <strong className="text-white font-mono">{parts.reduce((sum, p) => sum + p.qty, 0)}</strong></span>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-xs flex items-center gap-2 text-slate-300">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Estoque Baixo: <strong className="text-amber-400 font-mono">{parts.filter(p => p.qty <= p.minQty).length}</strong></span>
        </div>
      </div>

      {/* LIST TABLE OR Bento Grid */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                <th className="py-3 px-4">Peça / Componente</th>
                <th className="py-3 px-4">Código Barras</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4 text-right">Compra (Custo)</th>
                <th className="py-3 px-4 text-right">Venda (Público)</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-sans">
              {filteredParts.map((part) => {
                const isLow = part.qty <= part.minQty;
                return (
                  <tr key={part.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-200">{part.name}</p>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Reposição Necessária
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{part.barcode || 'Sem código'}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{part.supplier}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{formatBRL(part.purchasePrice)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200 font-semibold">{formatBRL(part.sellingPrice)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded font-mono font-bold border ${
                        isLow 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {part.qty} un
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Entrada/Saída Rápida Button */}
                      <button
                        onClick={() => {
                          setAdjustPart(part);
                          setAdjustQty(1);
                          setAdjustType('in');
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-semibold text-slate-300 px-2 py-1 rounded cursor-pointer"
                      >
                        Ajuste Rápido
                      </button>

                      <button
                        onClick={() => openEditForm(part)}
                        className="text-blue-400 hover:text-blue-300 p-1 bg-slate-900 border border-slate-800 rounded inline-flex cursor-pointer"
                        title="Editar Peça"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(part.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 bg-slate-900 border border-slate-800 rounded inline-flex cursor-pointer"
                        title="Excluir Peça"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredParts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum componente ou peça cadastrada em estoque.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK QUANTITY ADJUST POPUP */}
      {adjustPart && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-semibold text-white uppercase tracking-wider">Ajuste de Estoque</h3>
              <button onClick={() => setAdjustPart(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-slate-300 font-semibold mb-1">{adjustPart.name}</p>
              <p className="text-slate-500 font-mono text-[10px]">Qtd Atual: {adjustPart.qty} un</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('in')}
                  className={`py-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    adjustType === 'in'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-850'
                  }`}
                >
                  <ArrowUp className="w-4.5 h-4.5" /> Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('out')}
                  className={`py-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    adjustType === 'out'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-850'
                  }`}
                >
                  <ArrowDown className="w-4.5 h-4.5" /> Baixa (-)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quantidade</label>
              <input
                type="number"
                min={1}
                value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 text-center font-mono font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAdjustPart(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg cursor-pointer font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickAdjust}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold shadow-sm"
              >
                Salvar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                {editingPart ? 'Editar Peça / Componente' : 'Cadastrar Peça de Reposição'}
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
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nome do Componente *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Tela OLED Premium iPhone 13"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fornecedor *</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Ex: China Parts Import"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Código de Barras</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Ex: 789123456..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor de Compra (Custo R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor de Venda (Cobrado R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estoque Inicial (Unidades)</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quantidade de Alerta Mínimo</label>
                  <input
                    type="number"
                    value={minQty}
                    onChange={(e) => setMinQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono font-bold"
                  />
                </div>
              </div>

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
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
