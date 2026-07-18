import React, { useState } from 'react';
import { Order } from '../types';
import { Calendar as CalendarIcon, Clock, CheckCircle, Smartphone, User, PlusCircle } from 'lucide-react';

interface AgendaViewProps {
  orders: Order[];
}

export default function AgendaView({ orders }: AgendaViewProps) {
  // We can filter orders that are ready or in testing and list them as "Scheduled Pickups" or "Diagnose Deadlines"
  const pickups = orders.filter(o => o.status === 'Pronto para retirada' || o.status === 'Finalizado');
  const activeRepairs = orders.filter(o => o.status === 'Em reparo' || o.status === 'Teste');

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6" id="agenda-view-container">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          Agenda & Compromissos de Entrega
        </h1>
        <p className="text-xs text-slate-500 font-sans">Organize as saídas de equipamentos, agendamentos de retiradas com clientes e metas de bancada</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RETIRADAS AGENDADAS */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Retiradas Pendentes (Aparelhos Prontos)
              </h2>
              <p className="text-[10px] text-slate-500">Dispositivos aguardando faturamento ou cliente na recepção</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
              {pickups.length} un
            </span>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {pickups.map(o => (
              <div 
                key={o.id}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100/50 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-600">{o.number}</span>
                    <span className="text-slate-800 font-bold">{o.brand} {o.model}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {o.clientName}
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-600">{formatBRL(o.value)}</p>
                  <span className="inline-block bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 border border-emerald-200 rounded">
                    PRONTO
                  </span>
                </div>
              </div>
            ))}

            {pickups.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhum equipamento aguardando retirada no momento.
              </div>
            )}
          </div>
        </div>

        {/* METAS DE REPARO DIÁRIO */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Metas de Bancada (Manutenções Ativas)
              </h2>
              <p className="text-[10px] text-slate-500">Aparelhos em manutenção ou fase de calibração/testes</p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold">
              {activeRepairs.length} un
            </span>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {activeRepairs.map(o => (
              <div 
                key={o.id}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100/50 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-600">{o.number}</span>
                    <span className="text-slate-800 font-bold">{o.brand} {o.model}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Responsável: <strong className="text-amber-700 font-semibold ml-0.5">{o.techName}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-medium text-slate-700">{formatBRL(o.value)}</p>
                  <span className="inline-block bg-amber-50 text-amber-700 text-[8px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 border border-amber-200 rounded">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}

            {activeRepairs.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhum aparelho sob bancada ativa no momento.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
