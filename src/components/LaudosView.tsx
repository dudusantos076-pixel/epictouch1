import React, { useState } from 'react';
import { Laudo } from '../types';
import { FileText, Search, Printer, FileDown, Eye, CheckCircle2, AlertTriangle, X, Wrench, Edit3 } from 'lucide-react';

interface LaudosViewProps {
  laudos: Laudo[];
  onUpdateLaudo?: (id: string, updatedFields: Partial<Laudo>) => Promise<Laudo>;
}

export default function LaudosView({ laudos, onUpdateLaudo }: LaudosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLaudo, setSelectedLaudo] = useState<Laudo | null>(null);
  const [activePrintLaudo, setActivePrintLaudo] = useState<Laudo | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editSignature, setEditSignature] = useState('');
  const [editItems, setEditItems] = useState<Laudo['items']>({
    tela: 'Não Testado',
    placa: 'Não Testado',
    bateria: 'Não Testado',
    oxidacao: 'Não Testado',
    faceId: 'Não Testado',
    biometria: 'Não Testado',
    cameras: 'Não Testado',
    microfone: 'Não Testado',
    altoFalante: 'Não Testado',
    conector: 'Não Testado',
  });

  const startEditing = (laudo: Laudo) => {
    setEditNotes(laudo.techNotes || '');
    setEditSignature(laudo.techSignature || '');
    setEditItems({ ...laudo.items });
    setIsEditing(true);
  };

  const filteredLaudos = laudos.filter(l =>
    l.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.orderNumber.includes(searchTerm) ||
    l.equipment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintLaudo = (laudo: Laudo) => {
    setActivePrintLaudo(laudo);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setActivePrintLaudo(null);
      }, 500);
    }, 250);
  };

  return (
    <div className="space-y-6" id="laudos-view-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Laudos Técnicos Emitidos
          </h1>
          <p className="text-xs text-slate-400">Banco de laudos periciais de entrada/saída de dispositivos eletrônicos</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono">
          Laudos Consolidados: <strong className="text-purple-400">{laudos.length}</strong>
        </div>
      </div>

      {/* FILTER SEARCH */}
      <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-2.5 items-center gap-2 max-w-md shadow-inner">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filtrar por cliente, OS ou equipamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
        />
      </div>

      {/* LIST TABLE AND CARD DETAIL SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LIST */}
        <div className="lg:col-span-1 bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col space-y-4 h-[60vh]">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Emissões</h2>
          
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {filteredLaudos.map(l => (
              <div
                key={l.id}
                onClick={() => {
                  setSelectedLaudo(l);
                  setIsEditing(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedLaudo?.id === l.id
                    ? 'bg-slate-900 border-purple-500/60 shadow-md ring-1 ring-purple-500/10'
                    : 'bg-slate-900/30 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-blue-400 text-[10px]">{l.orderNumber}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{l.date}</span>
                </div>
                <h4 className="font-semibold text-slate-200 text-xs truncate">{l.clientName}</h4>
                <p className="text-[10px] text-slate-400 truncate mt-1">{l.equipment}</p>
              </div>
            ))}

            {filteredLaudos.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum laudo técnico pericial encontrado.
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE INSPECTOR */}
        <div className="lg:col-span-2">
          {selectedLaudo ? (
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-5 shadow-sm">
              {isEditing ? (
                <div className="space-y-5">
                  {/* EDIT HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div>
                      <h3 className="font-mono font-bold text-blue-400">Editando Laudo {selectedLaudo.orderNumber}</h3>
                      <p className="text-[10px] text-slate-500 font-mono font-sans mt-0.5">Modifique as informações técnicas do laudo pericial</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (onUpdateLaudo) {
                            try {
                              const updated = await onUpdateLaudo(selectedLaudo.id, {
                                items: editItems,
                                techNotes: editNotes,
                                techSignature: editSignature
                              });
                              setSelectedLaudo(updated);
                              setIsEditing(false);
                            } catch (err) {
                              console.error(err);
                              alert("Erro ao salvar laudo.");
                            }
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Salvar Alterações
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-3.5 py-1.5 rounded-lg text-slate-300 font-semibold cursor-pointer transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>

                  {/* EDIT METRICS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 space-y-1">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Cliente e Beneficiário</p>
                      <p className="font-semibold text-slate-400">{selectedLaudo.clientName} <span className="text-[9px] font-normal text-slate-600">(Não editável)</span></p>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 space-y-1">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Aparelho sob Diagnóstico</p>
                      <p className="font-semibold text-slate-400">{selectedLaudo.equipment} <span className="text-[9px] font-normal text-slate-600">(Não editável)</span></p>
                    </div>
                  </div>

                  {/* EDIT ITEMS CHECKLIST */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status das Peças Verificadas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {Object.entries(editItems).map(([key, value]) => {
                        const isOxidacao = key === 'oxidacao';
                        const options = isOxidacao 
                          ? ['Sim', 'Não', 'Não Testado'] 
                          : ['OK', 'Defeito', 'Não Testado'];
                        
                        return (
                          <div key={key} className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-slate-300 capitalize text-xs font-semibold">{key}</span>
                            <div className="flex gap-1 shrink-0">
                              {options.map((opt) => {
                                const isSelected = value === opt;
                                let colorClass = 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700';
                                if (isSelected) {
                                  if (opt === 'OK' || opt === 'Não') colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/10 font-bold';
                                  else if (opt === 'Defeito' || opt === 'Sim') colorClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/10 font-bold';
                                  else colorClass = 'bg-slate-800 text-slate-200 border-slate-700 font-bold';
                                }
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      setEditItems(prev => ({
                                        ...prev,
                                        [key]: opt as any
                                      }));
                                    }}
                                    className={`px-2 py-1 rounded text-[10px] border transition-all cursor-pointer ${colorClass}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EDIT TECH NOTES */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Parecer Técnico Descritivo</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-slate-700 outline-none resize-none font-sans"
                      placeholder="Descreva detalhadamente o diagnóstico do aparelho..."
                    />
                  </div>

                  {/* EDIT SIGNATURE */}
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assinado Eletronicamente por</label>
                    <input
                      type="text"
                      value={editSignature}
                      onChange={(e) => setEditSignature(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-slate-700 outline-none font-sans"
                      placeholder="Nome do Técnico Responsável"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div>
                      <h3 className="font-mono font-bold text-blue-400">Laudo {selectedLaudo.orderNumber}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Emissão em {selectedLaudo.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(selectedLaudo)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar Laudo
                      </button>
                      <button
                        onClick={() => handlePrintLaudo(selectedLaudo)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-850 text-xs px-3 py-1.5 rounded-lg text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir Laudo
                      </button>
                      <button
                        onClick={() => handlePrintLaudo(selectedLaudo)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-850 text-xs px-3 py-1.5 rounded-lg text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Salvar PDF
                      </button>
                    </div>
                  </div>

                  {/* DETAILS METRICS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 space-y-1">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Cliente e Beneficiário</p>
                      <p className="font-semibold text-slate-200">{selectedLaudo.clientName}</p>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 space-y-1">
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Aparelho sob Diagnóstico</p>
                      <p className="font-semibold text-slate-200">{selectedLaudo.equipment}</p>
                    </div>
                  </div>

                  {/* GRID CHECKLIST SPLIT */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status das Peças Verificadas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                      {Object.entries(selectedLaudo.items).map(([key, value]) => {
                        const isOk = value === 'OK' || value === 'Não';
                        return (
                          <div key={key} className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 flex flex-col justify-between items-center text-center">
                            <span className="text-slate-500 capitalize text-[9px] font-bold block mb-1.5">{key}</span>
                            {isOk ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> {value}
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px]">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" /> {value}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DESCRIPTION NOTE */}
                  {selectedLaudo.techNotes && (
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-xs">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Diagnóstico Pericial Consolidado</span>
                      <p className="text-slate-300 italic">"{selectedLaudo.techNotes}"</p>
                    </div>
                  )}

                  {/* TECHNICAL SIGNATURE */}
                  <div className="text-right pt-2 border-t border-slate-900/60">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Assinado Eletronicamente por</span>
                    <strong className="text-slate-300 text-xs">{selectedLaudo.techSignature}</strong>
                    <span className="text-[10px] text-slate-500 block font-mono">Registro Técnico de Bancada</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-900 p-12 text-center rounded-xl h-full flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-slate-700 mb-2" />
              <h3 className="text-slate-300 font-semibold text-sm">Nenhum Laudo Selecionado</h3>
              <p className="text-slate-500 text-xs mt-1">Selecione um laudo na lista lateral para inspecionar checklists e observações periciais.</p>
            </div>
          )}
        </div>
      </div>

      {activePrintLaudo && (
        <div id="print-area" className="hidden print:block p-8 bg-white text-black font-sans leading-normal">
          <div className="space-y-6">
            {/* Report Header */}
            <div className="text-center border-b-2 border-black pb-4 space-y-1">
              <h1 className="text-2xl font-black uppercase tracking-tight">EPIC TOUCH CRM</h1>
              <p className="text-xs uppercase font-bold text-gray-600">Laudo Técnico Pericial de Eletrônicos</p>
              <p className="text-[10px] text-gray-500">Laudo de Liberação e Vistoria de Hardware</p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold border-b border-gray-300 pb-1 mb-1.5 uppercase text-[10px] text-gray-500">Dados do Atendimento</h3>
                <p><strong>Nº Ordem:</strong> {activePrintLaudo.orderNumber}</p>
                <p className="mt-1"><strong>Proprietário:</strong> {activePrintLaudo.clientName}</p>
              </div>
              <div className="border border-gray-300 p-3 rounded">
                <h3 className="font-bold border-b border-gray-300 pb-1 mb-1.5 uppercase text-[10px] text-gray-500">Equipamento Analisado</h3>
                <p><strong>Aparelho:</strong> {activePrintLaudo.equipment}</p>
                <p className="mt-1"><strong>Emissão:</strong> {activePrintLaudo.date}</p>
              </div>
            </div>

            {/* Checklist */}
            <div className="border border-gray-300 p-3 rounded text-xs">
              <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-[10px] text-gray-500">Avaliação Técnica de Componentes</h3>
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                {Object.entries(activePrintLaudo.items).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center border-b border-gray-100 pb-1 capitalize">
                    <span className="text-gray-600">{key}:</span>
                    <span className={val === 'OK' || val === 'Não' ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parecer Técnico */}
            <div className="border border-gray-300 p-4 rounded text-xs space-y-1.5 bg-gray-50">
              <h3 className="font-bold uppercase text-[10px] text-gray-500">Parecer Técnico Descritivo & Parecer Pericial</h3>
              <p className="text-gray-900 italic leading-relaxed">"{activePrintLaudo.techNotes}"</p>
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-gray-500 leading-relaxed text-justify border-t border-gray-200 pt-3">
              Este documento certifica a inspeção, teste e revisão técnica avançada efetuada no dispositivo acima mencionado pelo profissional habilitado de nossa equipe. Os testes realizados seguem rigorosos padrões de conformidade técnica para liberação e segurança operacional do hardware.
            </div>

            {/* Signature */}
            <div className="pt-12 text-center text-xs space-y-1">
              <div className="border-b border-black w-64 mx-auto h-6"></div>
              <p className="font-bold text-gray-750">{activePrintLaudo.techSignature}</p>
              <p className="text-[10px] text-gray-400">Técnico de Bancada Responsável</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
