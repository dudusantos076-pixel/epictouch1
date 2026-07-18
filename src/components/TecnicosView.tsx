import React from 'react';
import { Order } from '../types';
import { Wrench, CheckCircle, Clock, Award, Star, Activity } from 'lucide-react';

interface TecnicosViewProps {
  orders: Order[];
}

export default function TecnicosView({ orders }: TecnicosViewProps) {
  // Hardcoded seeded technicians list
  const techs = [
    { id: 'user-3', name: 'Carlos Técnico', specialty: 'Reparos em Placa e Solda Micro', rating: 4.9 },
    { id: 'user-4', name: 'Amanda Técnica', specialty: 'Recondicionamento de Telas & Vidros', rating: 4.8 },
    { id: 'user-roberto', name: 'Roberto Dias', specialty: 'Software, Desbloqueios e Configurações', rating: 4.7 }
  ];

  const getTechStats = (techId: string) => {
    const techOrders = orders.filter(o => o.techId === techId);
    const active = techOrders.filter(o => !['Finalizado', 'Pronto para retirada'].includes(o.status)).length;
    const completed = techOrders.filter(o => ['Finalizado', 'Pronto para retirada'].includes(o.status)).length;
    return {
      total: techOrders.length,
      active,
      completed
    };
  };

  return (
    <div className="space-y-6" id="tecnicos-view-container">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-500" />
          Produtividade e Corpo Técnico
        </h1>
        <p className="text-xs text-slate-500 font-sans">Acompanhe a eficiência da bancada, distribuição de carga horária de reparos e índices de satisfação</p>
      </div>

      {/* TECHS SCORE LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {techs.map((tech) => {
          const stats = getTechStats(tech.id);
          const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
          
          return (
            <div 
              key={tech.id}
              className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 hover:border-blue-500/50 transition-all hover:translate-y-[-2px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 tracking-tight">{tech.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono italic block mt-0.5">{tech.specialty}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {tech.rating}
                </div>
              </div>

              {/* THREE CORE METRICS */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-150">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                  <div className="text-sm font-mono font-bold text-slate-700 mt-0.5">{stats.total}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-150">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Bancada</span>
                  <div className="text-sm font-mono font-bold text-amber-600 mt-0.5">{stats.active}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-150">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Prontos</span>
                  <div className="text-sm font-mono font-bold text-emerald-600 mt-0.5">{stats.completed}</div>
                </div>
              </div>

              {/* COMPLETION RATE BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Índice de Resolução</span>
                  <span className="font-mono text-slate-600 font-bold">{completionRate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BENCH DISTRIBUTIONS */}
      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <Activity className="w-4 h-4 text-blue-500" />
          Carga de Trabalho em Tempo Real (Bancada de Manutenção)
        </h2>

        <div className="space-y-3 text-xs">
          {techs.map((tech) => {
            const stats = getTechStats(tech.id);
            const totalActiveOSInLab = orders.filter(o => !['Finalizado', 'Pronto para retirada'].includes(o.status)).length || 1;
            const percentageLoad = (stats.active / totalActiveOSInLab) * 100;

            return (
              <div key={tech.id} className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-semibold">{tech.name}</span>
                  <span className="text-slate-400 font-mono">{stats.active} aparelhos ativos ({percentageLoad.toFixed(0)}% da carga)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${percentageLoad}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
