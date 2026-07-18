import React, { useState } from 'react';
import { Order } from '../types';
import { Search, Smartphone, ShieldCheck, ShieldAlert, Wrench, RefreshCw, Layers } from 'lucide-react';

interface EquipamentosViewProps {
  orders: Order[];
}

export default function EquipamentosView({ orders }: EquipamentosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all active equipments
  const activeEquipments = orders.filter(o => 
    o.status !== 'Finalizado' && o.status !== 'Pronto para retirada'
  );

  const filteredEquipments = activeEquipments.filter(e => {
    const brandModel = `${e.brand || ''} ${e.model || ''}`.toLowerCase();
    const imei = (e.imei || '').toLowerCase();
    const clientName = (e.clientName || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return brandModel.includes(search) || imei.includes(search) || clientName.includes(search);
  });

  return (
    <div className="space-y-6" id="equipamentos-view-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Dispositivos & Equipamentos em Laboratório
          </h1>
          <p className="text-xs text-slate-400">Todos os aparelhos eletrônicos atualmente em processo de análise, reparo ou testes na bancada</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono">
          Equipamentos Ativos: <strong className="text-amber-400">{activeEquipments.length}</strong>
        </div>
      </div>

      {/* FILTER SEARCH */}
      <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-2.5 items-center gap-2 max-w-md shadow-inner">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por marca, modelo, IMEI ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
        />
      </div>

      {/* GRID DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipments.map((eq) => {
          const isLackingParts = eq.status === 'Aguardando peça';
          
          return (
            <div 
              key={eq.id}
              className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white tracking-tight">{eq.brand} {eq.model}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Nº OS: {eq.number}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  isLackingParts 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {eq.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-sans text-slate-400">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">IMEI/Série:</span>
                  <span className="font-mono text-slate-300">{eq.imei || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">Defeito:</span>
                  <span className="text-slate-300 italic truncate max-w-[150px]">{eq.reportedDefect}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">Proprietário:</span>
                  <span className="text-slate-200 font-semibold">{eq.clientName}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" /> Técnico:
                  </span>
                  <span className="text-amber-400 font-semibold">{eq.techName}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEquipments.length === 0 && (
          <div className="col-span-full bg-slate-950 border border-slate-900 py-12 text-center rounded-xl">
            <Smartphone className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nenhum equipamento em laboratório no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
