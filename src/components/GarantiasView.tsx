import React from 'react';
import { Order } from '../types';
import { ShieldCheck, Calendar, ShieldAlert, Award, Smartphone, User } from 'lucide-react';

interface GarantiasViewProps {
  orders: Order[];
}

export default function GarantiasView({ orders }: GarantiasViewProps) {
  // We check orders that are 'Finalizado' or 'Pronto para retirada' and calculate their active warranty
  const warrantedOrders = orders.filter(o => 
    ['Finalizado', 'Pronto para retirada'].includes(o.status)
  );

  const calculateDaysRemaining = (orderDate: string) => {
    // Standard warranty seeded is 90 days
    const dateOfEntrance = new Date(orderDate);
    const expirationDate = new Date(dateOfEntrance);
    expirationDate.setDate(expirationDate.getDate() + 90);

    const today = new Date("2026-07-16"); // Fixed current date
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      daysLeft: diffDays,
      expiryDateStr: expirationDate.toLocaleDateString('pt-BR'),
      isActive: diffDays > 0
    };
  };

  return (
    <div className="space-y-6" id="garantias-view-container">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Controle de Garantias Ativas
        </h1>
        <p className="text-xs text-slate-500 font-sans">Acompanhamento automático de vencimento de garantias, dias restantes de cobertura e histórico pericial</p>
      </div>

      {/* GRID SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warrantedOrders.map((o) => {
          const { daysLeft, expiryDateStr, isActive } = calculateDaysRemaining(o.date);
          
          return (
            <div 
              key={o.id}
              className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-4 hover:border-blue-500/50 transition-all hover:translate-y-[-2px]"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-600 text-xs">{o.number}</span>
                    <span className="text-slate-800 font-bold text-xs">{o.brand} {o.model}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Entrada: {o.date}</span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {isActive ? 'Ativa' : 'Expirada'}
                </span>
              </div>

              {/* STATS PROGRESS BAR */}
              <div className="space-y-1 text-xs font-sans">
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Vencimento:</span>
                  <span className="font-semibold text-slate-800">{expiryDateStr}</span>
                </div>
                
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Cobertura Restante:</span>
                  <span className={`font-mono font-bold ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isActive ? `${daysLeft} dias restantes` : 'Sem cobertura'}
                  </span>
                </div>
              </div>

              {/* PROGRESS SLIDER */}
              {isActive && (
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(daysLeft / 90) * 100}%` }}
                  />
                </div>
              )}

              {/* CLIENT DETAILS AT BOTTOM */}
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                <span className="truncate max-w-[120px]">Cliente: <strong className="text-slate-700">{o.clientName}</strong></span>
                <span>Téc: <strong className="text-slate-700">{o.techName.split(' ')[0]}</strong></span>
              </div>
            </div>
          );
        })}

        {warrantedOrders.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 py-12 text-center rounded-xl shadow-sm">
            <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Nenhuma ordem de serviço finalizada ou com termo de garantia emitido no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
