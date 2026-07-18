import React, { useState, useEffect } from 'react';
import { Client, Order, Part, OSStatus, PartUsed } from '../types';
import { 
  FileText, User, Smartphone, Lock, AlertCircle, CheckSquare, Camera, Wrench, 
  DollarSign, Clock, ShieldCheck, Printer, Send, Download, Plus, Trash, Check, X,
  Sparkles
} from 'lucide-react';

interface OSViewProps {
  orders: Order[];
  clients: Client[];
  parts: Part[];
  currentUser: any;
  onAddOrder: (o: Omit<Order, 'id' | 'number'>) => Promise<any>;
  onUpdateOrder: (id: number, o: Partial<Order>) => Promise<any>;
  onNavigate: (view: string) => void;
  initialSelectedOrder?: Order | null;
}

const ALL_STATUSES: OSStatus[] = [
  'Recebido',
  'Em análise',
  'Aguardando aprovação',
  'Aguardando peça',
  'Em reparo',
  'Teste',
  'Finalizado',
  'Pronto para retirada'
];

export default function OSView({ 
  orders, 
  clients, 
  parts, 
  currentUser,
  onAddOrder, 
  onUpdateOrder, 
  onNavigate,
  initialSelectedOrder 
}: OSViewProps) {
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(initialSelectedOrder || null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [clientId, setClientId] = useState('');
  const [equipment, setEquipment] = useState('Celular');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [password, setPassword] = useState('');
  const [reportedDefect, setReportedDefect] = useState('');
  const [physicalState, setPhysicalState] = useState('');
  const [techId, setTechId] = useState('user-3'); // Carlos as default tech
  const [techName, setTechName] = useState('Carlos Técnico');
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<OSStatus>('Recebido');
  const [warranty, setWarranty] = useState('90 dias');
  const [notes, setNotes] = useState('');
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Checklist
  const [checklist, setChecklist] = useState({
    ligando: true,
    touchScreen: true,
    wifi: true,
    bluetooth: true,
    cameras: true,
    altoFalante: true,
    microfone: true,
    conectorCarga: true,
    botoes: true,
    riscosTrincos: false
  });

  // Used parts
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [selectedPartToAdd, setSelectedPartToAdd] = useState('');
  const [partToAddQty, setPartToAddQty] = useState(1);

  const [errorMessage, setErrorMessage] = useState('');

  // Print Job State (for reliable, iframe-safe window.print without window.open popups)
  const [activePrintJob, setActivePrintJob] = useState<{
    type: 'receipt' | 'label' | 'term';
    order: Order;
  } | null>(null);

  const triggerPrintJob = (type: 'receipt' | 'label' | 'term', order: Order) => {
    setActivePrintJob({ type, order });
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setActivePrintJob(null);
      }, 500);
    }, 250);
  };

  // AI Diagnostic States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    possibleCauses: string[];
    recommendedSteps: string[];
    suggestedParts: string[];
    difficulty: string;
    estimatedCost: string;
  } | null>(null);

  const handleAIDiagnose = async () => {
    if (!reportedDefect.trim()) {
      alert('Por favor, informe primeiro o Defeito Relatado pelo Cliente para que a IA possa analisar.');
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedDefect,
          brand,
          model
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na resposta do diagnóstico IA.');
      setAiResult(data);
    } catch (err: any) {
      alert('Erro na análise da IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (initialSelectedOrder) {
      setSelectedOrder(initialSelectedOrder);
    }
  }, [initialSelectedOrder]);

  const openNewOSForm = () => {
    setSelectedOrder(null);
    setClientId(clients[0]?.id || '');
    setEquipment('Celular');
    setBrand('');
    setModel('');
    setImei('');
    setPassword('');
    setReportedDefect('');
    setPhysicalState('');
    setTechId('user-3');
    setTechName('Carlos Técnico');
    setValue(0);
    setStatus('Recebido');
    setWarranty('90 dias');
    setNotes('');
    setPhotos([]);
    setChecklist({
      ligando: true,
      touchScreen: true,
      wifi: true,
      bluetooth: true,
      cameras: true,
      altoFalante: true,
      microfone: true,
      conectorCarga: true,
      botoes: true,
      riscosTrincos: false
    });
    setPartsUsed([]);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditOSForm = (order: Order) => {
    setSelectedOrder(order);
    setClientId(order.clientId);
    setEquipment(order.equipment);
    setBrand(order.brand);
    setModel(order.model);
    setImei(order.imei);
    setPassword(order.password || '');
    setReportedDefect(order.reportedDefect);
    setPhysicalState(order.physicalState);
    setTechId(order.techId);
    setTechName(order.techName);
    setValue(order.value);
    setStatus(order.status);
    setWarranty(order.warranty);
    setNotes(order.notes);
    setPhotos(order.photos || []);
    setChecklist(order.checklist);
    setPartsUsed(order.partsUsed || []);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleAddPart = () => {
    if (!selectedPartToAdd) return;
    const part = parts.find(p => p.id === selectedPartToAdd);
    if (!part) return;

    if (part.qty < partToAddQty) {
      alert(`Quantidade insuficiente em estoque! Disponível: ${part.qty}`);
      return;
    }

    const existsIdx = partsUsed.findIndex(p => p.partId === part.id);
    if (existsIdx !== -1) {
      const updated = [...partsUsed];
      updated[existsIdx].qty += partToAddQty;
      setPartsUsed(updated);
    } else {
      setPartsUsed([...partsUsed, {
        partId: part.id,
        name: part.name,
        qty: partToAddQty,
        unitPrice: part.sellingPrice
      }]);
    }

    // Auto update Order total price
    const addedValue = part.sellingPrice * partToAddQty;
    setValue(v => v + addedValue);
    setSelectedPartToAdd('');
    setPartToAddQty(1);
  };

  const handleRemovePart = (idx: number) => {
    const part = partsUsed[idx];
    setValue(v => Math.max(0, v - (part.unitPrice * part.qty)));
    setPartsUsed(partsUsed.filter((_, i) => i !== idx));
  };

  const handleAddPhoto = () => {
    if (newPhotoUrl) {
      setPhotos([...photos, newPhotoUrl]);
      setNewPhotoUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      setErrorMessage('Por favor, selecione um cliente cadastrado.');
      return;
    }

    if (!brand || !model || !reportedDefect) {
      setErrorMessage('Marca, Modelo e Defeito Informado são obrigatórios.');
      return;
    }

    const payload = {
      date: selectedOrder ? selectedOrder.date : new Date().toISOString().split('T')[0],
      clientId,
      clientName: client.name,
      clientPhone: client.phone,
      clientWhatsapp: client.whatsapp,
      equipment,
      brand,
      model,
      imei,
      password,
      reportedDefect,
      checklist,
      physicalState,
      photos,
      techId,
      techName,
      value: Number(value),
      status,
      warranty,
      notes,
      partsUsed,
      paymentStatus: selectedOrder ? selectedOrder.paymentStatus : 'Pendente' as any
    };

    try {
      if (selectedOrder) {
        await onUpdateOrder(selectedOrder.id, payload);
      } else {
        await onAddOrder(payload);
      }
      setIsFormOpen(false);
      setSelectedOrder(null);
    } catch (err: any) {
      setErrorMessage('Erro ao salvar Ordem de Serviço: ' + err.message);
    }
  };

  const handleSimulateWhatsApp = (order: Order) => {
    const rawPhone = order.clientWhatsapp || order.clientPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    
    let finalPhone = cleanPhone;
    if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
      finalPhone = '55' + cleanPhone;
    }

    const storeNameDisplay = currentUser?.storeName || 'Epic Touch';
    const messageText = `Olá, *${order.clientName}*!
Aqui é da *${storeNameDisplay}*.
O status da sua Ordem de Serviço *${order.number}* (${order.equipment} - ${order.brand} ${order.model}) foi atualizado para: *${order.status}*.

Você pode acompanhar os detalhes e o andamento do seu reparo em tempo real acessando nosso portal do cliente:
${window.location.origin}/?os=${order.number}

Caso tenha alguma dúvida, estamos à disposição!`;

    const waUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Ordem de Serviço ${order.number}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
            th { bg-color: #f2f2f2; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .footer { border-top: 1px solid #ddd; margin-top: 40px; padding-top: 10px; font-size: 11px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>EPIC CRM - Assistência Técnica | OS ${order.number}</h1>
          <p><strong>Data de Entrada:</strong> ${order.date}</p>
          <div class="grid">
            <div>
              <h3>Dados do Cliente</h3>
              <p><strong>Cliente:</strong> ${order.clientName}</p>
              <p><strong>Fone:</strong> ${order.clientPhone || 'Não informado'}</p>
            </div>
            <div>
              <h3>Dados do Dispositivo</h3>
              <p><strong>Aparelho:</strong> ${order.equipment} ${order.brand} ${order.model}</p>
              <p><strong>IMEI/Série:</strong> ${order.imei || 'Não informado'}</p>
            </div>
          </div>
          <h3>Defeito Informado</h3>
          <p>${order.reportedDefect}</p>
          <h3>Status Atual</h3>
          <p><strong>${order.status}</strong></p>
          <h3>Valor do Serviço</h3>
          <p><strong>R$ ${order.value.toFixed(2).replace('.', ',')}</strong></p>
          <h3>Garantia</h3>
          <p>${order.warranty}</p>
          <div class="footer">
            <p>Epic CRM - Soluções Integradas de Assistência Técnica</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintLabel = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const trackingUrl = `${window.location.origin}/?os=${order.number}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta ${order.number}</title>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              padding: 4px; 
              width: 50mm; 
              height: 30mm; 
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              background-color: #fff;
              color: #000;
            }
            .info {
              width: 60%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding-right: 2px;
            }
            .title {
              font-size: 7px;
              font-weight: 900;
              text-transform: uppercase;
              border-bottom: 1.5px solid #000;
              padding-bottom: 1px;
              margin-bottom: 2px;
              letter-spacing: 0.2px;
            }
            .protocol {
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 0.5px;
              line-height: 1.1;
            }
            .device {
              font-size: 8px;
              font-weight: 700;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-top: 1px;
            }
            .date {
              font-size: 6px;
              margin-top: 2px;
              font-weight: 550;
              color: #222;
            }
            .qr-container {
              width: 38%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-image {
              width: 26mm;
              height: 26mm;
              object-fit: contain;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="info">
            <div class="title">EPIC TOUCH CRM</div>
            <div class="protocol">${order.number}</div>
            <div class="device">${order.brand} ${order.model}</div>
            <div class="date">Reg: ${order.date}</div>
          </div>
          <div class="qr-container">
            <img class="qr-image" src="${qrUrl}" alt="QR Code" referrerpolicy="no-referrer" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Recebido': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'Em análise': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20';
      case 'Aguardando aprovação': return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
      case 'Aguardando peça': return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
      case 'Em reparo': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'Teste': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
      case 'Finalizado': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'Pronto para retirada': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border-dashed';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6" id="os-view-container">
      {/* OS ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Controle de Ordens de Serviço</h1>
          <p className="text-xs text-slate-400 font-sans">Acompanhamento completo de reparos, checklists e faturamentos</p>
        </div>
        <button
          onClick={openNewOSForm}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem de Serviço
        </button>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                {selectedOrder ? `Editar Ordem de Serviço ${selectedOrder.number}` : 'Abrir Nova Ordem de Serviço'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
              {errorMessage && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* CLIENT & EQUIPMENT SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Cliente Beneficiário
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    required
                  >
                    <option value="" disabled>Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tipo de Equipamento</label>
                  <select
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="Celular">Celular</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Smartwatch">Smartwatch</option>
                    <option value="Console">Console de Videogame</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Apple, Samsung"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Modelo</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: iPhone 13 Pro"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">IMEI ou Nº de Série</label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="Ex: 358941205..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 col-span-1 md:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Senha ou Padrão de Desbloqueio
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Deixe em branco se sem senha"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* DEFECT & CHECKLIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Defeito Informado pelo Cliente *</label>
                    <textarea
                      value={reportedDefect}
                      onChange={(e) => setReportedDefect(e.target.value)}
                      placeholder="Relato detalhado do sintoma..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* COGNITIVE GEMINI AI ASSISTANT PANEL */}
                  <div className="bg-slate-950 border border-indigo-500/20 rounded-xl p-4.5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.05)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400">Bancada Cognitiva Gemini IA</h4>
                          <p className="text-[9px] text-slate-500">Predição de causas e passo-a-passo de resolução</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={handleAIDiagnose}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {aiLoading ? 'Analisando...' : 'Analisar com IA'}
                      </button>
                    </div>

                    {aiResult && (
                      <div className="text-xs space-y-3 pt-2 border-t border-slate-900/80 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-[9px] uppercase font-bold text-rose-400">Possíveis Causas</span>
                            <ul className="list-disc pl-3 mt-1 space-y-1 text-slate-300 text-[10px]">
                              {aiResult.possibleCauses.map((cause, i) => (
                                <li key={i}>{cause}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-[9px] uppercase font-bold text-purple-400">Componentes Sugeridos</span>
                            <ul className="list-disc pl-3 mt-1 space-y-1 text-slate-300 text-[10px]">
                              {aiResult.suggestedParts.map((part, i) => (
                                <li key={i}>{part}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-emerald-400">Procedimento de Resolução Recomendado</span>
                          <ol className="list-decimal pl-3 space-y-1 text-slate-300 text-[10px]">
                            {aiResult.recommendedSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Complexidade: <strong className="text-slate-200">{aiResult.difficulty}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              const advice = `[Diagnóstico IA Gemini]
Causas Prováveis: ${aiResult.possibleCauses.join(', ')}
Componentes Recomendados: ${aiResult.suggestedParts.join(', ')}
Passo-a-passo:
${aiResult.recommendedSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;
                              setNotes(prev => prev ? `${prev}\n\n${advice}` : advice);
                              alert('Diagnóstico IA copiado e anexado às Notas Internas da OS!');
                            }}
                            className="text-indigo-450 hover:text-indigo-300 font-bold underline cursor-pointer"
                          >
                            Inserir nas Notas Internas
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estado de Conservação Físico</label>
                    <input
                      type="text"
                      value={physicalState}
                      onChange={(e) => setPhysicalState(e.target.value)}
                      placeholder="Ex: Riscado na tampa traseira, tela intacta"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* VISUAL CHECKLIST */}
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2.5">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <CheckSquare className="w-4 h-4 text-emerald-400" /> Checklist de Entrada
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    {Object.entries(checklist).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors capitalize font-sans">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-slate-800 text-emerald-600 bg-slate-900 focus:ring-0 focus:ring-offset-0"
                        />
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* TECHNICAL PARTS & PHOTOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PARTS SELECTOR */}
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Wrench className="w-4 h-4 text-purple-400" /> Peças Utilizadas (Baixa Automática)
                  </h3>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedPartToAdd}
                      onChange={(e) => setSelectedPartToAdd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="">Selecione para adicionar...</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id} disabled={p.qty <= 0}>
                          {p.name} ({p.qty} un) - R$ {p.sellingPrice.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={partToAddQty}
                      onChange={(e) => setPartToAddQty(Math.max(1, parseInt(e.target.value)))}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddPart}
                      className="bg-purple-650 hover:bg-purple-650/90 text-white p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {partsUsed.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {partsUsed.map((pu, i) => (
                        <div key={pu.partId} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded border border-slate-850">
                          <span className="text-slate-300 font-sans truncate pr-2">{pu.name} (x{pu.qty})</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-purple-400">R$ {(pu.unitPrice * pu.qty).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePart(i)}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PHOTOS LIST */}
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Camera className="w-4 h-4 text-blue-400" /> Registro Fotográfico Técnico
                  </h3>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cole a URL ou selecione uma foto abaixo..."
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhoto}
                        className="bg-slate-850 hover:bg-slate-750 border border-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Inserir
                      </button>
                    </div>

                    <div className="relative border border-dashed border-slate-800 hover:border-blue-500/50 rounded-lg p-3 bg-slate-900/35 hover:bg-slate-900 transition-colors cursor-pointer text-center group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setPhotos(prev => [...prev, reader.result]);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-15"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Camera className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        <span className="text-[10px] font-medium text-slate-300 group-hover:text-slate-100 transition-colors">
                          Selecione Arquivo ou Ative a Câmera
                        </span>
                        <span className="text-[8px] text-slate-500">
                          (Carregamento automático de foto técnica)
                        </span>
                      </div>
                    </div>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.map((ph, i) => (
                        <div key={i} className="relative group rounded-md overflow-hidden aspect-video border border-slate-800">
                          <img src={ph} alt="Technical record" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* STAFF & VALUE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Técnico Responsável</label>
                  <select
                    value={techId}
                    onChange={(e) => {
                      setTechId(e.target.value);
                      setTechName(e.target.value === 'user-3' ? 'Carlos Técnico' : 'Amanda Técnica');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="user-3">Carlos Técnico</option>
                    <option value="user-4">Amanda Técnica</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor Cobrado (R$)</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Atual do Reparo</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OSStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-semibold outline-none"
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prazo de Garantia</label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="Ex: 90 dias"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notas Internas & Diagnóstico Técnico</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descrição da resolução, peças usadas extras, observações..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
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
                  Salvar OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED OS SUMMARY SPLIT VIEW OR LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OS LIST RAIL */}
        <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-4 lg:col-span-1 h-[70vh] flex flex-col">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Ordens de Serviço</span>
            <span className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono text-slate-400">{orders.length}</span>
          </h2>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {orders.map(o => (
              <div
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedOrder?.id === o.id
                    ? 'bg-slate-900 border-blue-500/60 shadow-md ring-1 ring-blue-500/10'
                    : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-blue-400 text-xs">{o.number}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium border ${getStatusBadge(o.status)}`}>
                    {o.status}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-200 text-xs truncate">{o.clientName}</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{o.brand} {o.model} | R$ {o.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE INSPECTION CARD */}
        <div className="lg:col-span-2 space-y-4">
          {selectedOrder ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
              {/* TOP ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-400 text-lg">{selectedOrder.number}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                    {selectedOrder.paymentStatus === 'Pago' ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">PAGO PIX</span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">AGUARDANDO PAGAMENTO</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">Entrada: {selectedOrder.date}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditOSForm(selectedOrder)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-200 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => triggerPrintJob('receipt', selectedOrder)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-200 font-semibold cursor-pointer flex items-center gap-1"
                    title="Imprimir OS"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" /> Impressão
                  </button>
                  <button
                    onClick={() => handleSimulateWhatsApp(selectedOrder)}
                    className="bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 text-xs px-3 py-1.5 rounded-lg text-emerald-400 font-semibold cursor-pointer flex items-center gap-1"
                    title="Enviar WhatsApp Notificação"
                  >
                    <Send className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => triggerPrintJob('term', selectedOrder)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-200 font-semibold cursor-pointer flex items-center gap-1"
                    title="Baixar PDF do Termo"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" /> PDF
                  </button>
                  <button
                    onClick={() => triggerPrintJob('label', selectedOrder)}
                    className="bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/20 text-xs px-3 py-1.5 rounded-lg text-indigo-400 font-semibold cursor-pointer flex items-center gap-1"
                    title="Imprimir Etiqueta Térmica QR Code"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Etiqueta QR
                  </button>
                </div>
              </div>

              {/* CORE METRICS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Informações do Proprietário</h3>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs space-y-1">
                      <p className="font-semibold text-slate-100">{selectedOrder.clientName}</p>
                      {selectedOrder.clientPhone && <p className="text-slate-400 font-mono">Celular: {selectedOrder.clientPhone}</p>}
                      {selectedOrder.clientWhatsapp && <p className="text-slate-400 font-mono">WhatsApp: {selectedOrder.clientWhatsapp}</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Identificação do Dispositivo</h3>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{selectedOrder.equipment} - {selectedOrder.brand} {selectedOrder.model}</p>
                      {selectedOrder.imei && <p className="text-slate-400 font-mono">IMEI/Série: {selectedOrder.imei}</p>}
                      {selectedOrder.password && <p className="text-amber-400 font-mono">Senha informada: {selectedOrder.password}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Defeito & Condições</h3>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs space-y-2">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Defeito Informado</span>
                        <p className="text-slate-300 italic">{selectedOrder.reportedDefect}</p>
                      </div>
                      {selectedOrder.physicalState && (
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase">Aspecto Visual</span>
                          <p className="text-slate-400">{selectedOrder.physicalState}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Informações Comerciais</h3>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Orçamento Final</span>
                        <p className="text-sm font-mono font-bold text-emerald-400">R$ {selectedOrder.value.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Prazo de Garantia</span>
                        <p className="text-xs text-slate-300 font-semibold">{selectedOrder.warranty}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHECKLISTS & PARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-900">
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Checklist Verificado</h3>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {Object.entries(selectedOrder.checklist || {}).map(([key, value]) => (
                      <span key={key} className="flex items-center gap-1.5 text-slate-400 capitalize">
                        {value ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Peças e Mão de Obra</h3>
                  {selectedOrder.partsUsed && selectedOrder.partsUsed.length > 0 ? (
                    <div className="space-y-1">
                      {selectedOrder.partsUsed.map((part, idx) => (
                        <div key={idx} className="bg-slate-900/60 p-2 rounded border border-slate-850 flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{part.name} (x{part.qty})</span>
                          <span className="font-mono text-purple-400">R$ {(part.unitPrice * part.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nenhuma peça de estoque associada a esta OS.</p>
                  )}
                </div>
              </div>

              {/* TECHNICAL PHOTOS */}
              {selectedOrder.photos && selectedOrder.photos.length > 0 && (
                <div className="border-t border-slate-900 pt-4">
                  <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Registros de Imagem</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {selectedOrder.photos.map((ph, idx) => (
                      <a href={ph} target="_blank" rel="noreferrer" key={idx} className="rounded-md overflow-hidden aspect-video border border-slate-850">
                        <img src={ph} alt="OS report asset" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-900 p-12 text-center rounded-xl h-full flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-slate-700 mb-3" />
              <h3 className="text-slate-300 font-semibold text-sm">Nenhuma OS Selecionada</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-xs">Selecione uma ordem de serviço na barra lateral para inspecionar fotos, checklists, laudos e faturamentos.</p>
            </div>
          )}
        </div>
      </div>

      {/* PRINT-ONLY AREA (Controlled dynamically by activePrintJob) */}
      {activePrintJob && (
        <div id="print-area" className="hidden print:block p-8 bg-white text-black font-sans leading-normal">
          {activePrintJob.type === 'receipt' && (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight">{currentUser?.storeName || 'Epic Touch'}</h1>
                  <p className="text-xs text-gray-600 mt-1">CNPJ/CPF: {currentUser?.storeCnpjCpf || '00.000.000/0001-00'}</p>
                  <p className="text-xs text-gray-600">PIX: {currentUser?.storePixKey || 'dudusantos076@gmail.com'}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-mono font-bold text-gray-900">{activePrintJob.order.number}</h2>
                  <p className="text-xs text-gray-600 mt-1">Data: {activePrintJob.order.date}</p>
                  <p className="text-xs text-gray-600">Status: {activePrintJob.order.status}</p>
                </div>
              </div>

              {/* Client & Device Grid */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="border border-gray-300 p-3 rounded">
                  <h3 className="font-bold border-b border-gray-300 pb-1 mb-1.5 uppercase text-[10px] text-gray-500">Dados do Cliente</h3>
                  <p className="font-semibold text-gray-900">{activePrintJob.order.clientName}</p>
                  <p className="mt-1">Fone: {activePrintJob.order.clientPhone || 'Não informado'}</p>
                  <p>WhatsApp: {activePrintJob.order.clientWhatsapp || 'Não informado'}</p>
                </div>
                <div className="border border-gray-300 p-3 rounded">
                  <h3 className="font-bold border-b border-gray-300 pb-1 mb-1.5 uppercase text-[10px] text-gray-500">Identificação do Dispositivo</h3>
                  <p className="font-semibold text-gray-900">{activePrintJob.order.equipment} - {activePrintJob.order.brand} {activePrintJob.order.model}</p>
                  <p className="mt-1">IMEI/Série: {activePrintJob.order.imei || 'Não informado'}</p>
                  <p>Senha: {activePrintJob.order.password || 'Não fornecida'}</p>
                </div>
              </div>

              {/* Defects & Diagnostics */}
              <div className="text-xs border border-gray-300 p-3 rounded space-y-2">
                <div>
                  <h4 className="font-bold uppercase text-[9px] text-gray-500">Defeito Informado pelo Cliente:</h4>
                  <p className="text-gray-900 mt-0.5 italic">"{activePrintJob.order.reportedDefect}"</p>
                </div>
                {activePrintJob.order.notes && (
                  <div>
                    <h4 className="font-bold uppercase text-[9px] text-gray-500">Diagnóstico & Parecer Técnico:</h4>
                    <p className="text-gray-900 mt-0.5">{activePrintJob.order.notes}</p>
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="border border-gray-300 p-3 rounded text-xs">
                <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-[10px] text-gray-500">Checklist de Entrada</h3>
                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  {Object.entries(activePrintJob.order.checklist || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5 capitalize">
                      <span className={val ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                        {val ? "✔" : "✘"}
                      </span>
                      <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parts & Financial summary */}
              <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="p-2 font-bold">Item/Serviço</th>
                      <th className="p-2 font-bold text-center w-20">Quant.</th>
                      <th className="p-2 font-bold text-right w-28">Preço Unit.</th>
                      <th className="p-2 font-bold text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activePrintJob.order.partsUsed || []).map((pu, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="p-2">{pu.name}</td>
                        <td className="p-2 text-center">{pu.qty}</td>
                        <td className="p-2 text-right">R$ {pu.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right">R$ {(pu.unitPrice * pu.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!activePrintJob.order.partsUsed || activePrintJob.order.partsUsed.length === 0) && (
                      <tr className="border-b border-gray-200">
                        <td className="p-2 text-gray-500 italic" colSpan={4}>Mão de Obra e Assistência Técnica Geral</td>
                      </tr>
                    )}
                    <tr className="bg-gray-55">
                      <td className="p-2 font-bold text-right" colSpan={3}>VALOR TOTAL DOS SERVIÇOS:</td>
                      <td className="p-2 font-black text-right text-gray-900 text-sm">R$ {activePrintJob.order.value.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Terms & Signatures */}
              <div className="space-y-6 pt-4">
                <div className="text-[10px] text-gray-500 leading-relaxed text-justify border-t border-gray-200 pt-3">
                  1. O prazo de garantia legal de reparo é de 90 dias, válido única e exclusivamente sobre as peças substituídas descritas neste termo. Quedas, riscos, oxidação ou abertura por terceiros invalidam qualquer garantia automática.<br />
                  2. Aparelhos não retirados em até 90 dias após a notificação de término do reparo serão sujeitos a descarte ou venda para cobrir custos operacionais de armazenagem, conforme Artigo 1.275 do Código Civil.
                </div>

                <div className="grid grid-cols-2 gap-12 pt-8 text-xs text-center">
                  <div className="space-y-1">
                    <div className="border-b border-black w-48 mx-auto h-6"></div>
                    <p className="font-bold text-gray-700">Assinatura do Cliente</p>
                    <p className="text-[9px] text-gray-400">{activePrintJob.order.clientName}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-b border-black w-48 mx-auto h-6"></div>
                    <p className="font-bold text-gray-700">Responsável Técnico</p>
                    <p className="text-[9px] text-gray-400">{activePrintJob.order.techName}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePrintJob.type === 'term' && (
            <div className="space-y-6">
              {/* Official Document Header */}
              <div className="text-center border-b-2 border-black pb-4 space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tight">{currentUser?.storeName || 'Epic Touch'}</h1>
                <p className="text-xs uppercase font-bold text-gray-600">Termo de Garantia e Entrega de Equipamento</p>
                <p className="text-[10px] text-gray-500">CNPJ/CPF: {currentUser?.storeCnpjCpf || '00.000.000/0001-00'} | Contato PIX: {currentUser?.storePixKey || 'dudusantos076@gmail.com'}</p>
              </div>

              {/* OS Meta */}
              <div className="bg-gray-100 p-3 rounded text-xs flex justify-between font-mono">
                <span>Protocolo de OS: <strong>{activePrintJob.order.number}</strong></span>
                <span>Data de Entrega: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></span>
                <span>Garantia: <strong>{activePrintJob.order.warranty || '90 dias'}</strong></span>
              </div>

              {/* Terms of Acceptance Body */}
              <div className="space-y-4 text-xs text-gray-800 leading-relaxed text-justify">
                <p>
                  Por meio deste instrumento, a empresa <strong>{currentUser?.storeName || 'Epic Touch'}</strong> declara entregue o dispositivo <strong>{activePrintJob.order.equipment} {activePrintJob.order.brand} {activePrintJob.order.model}</strong> (IMEI/Série: {activePrintJob.order.imei || 'Não informado'}) devidamente revisado, testado e reparado para o cliente beneficiário <strong>{activePrintJob.order.clientName}</strong>.
                </p>

                <h3 className="font-bold text-sm text-gray-900 border-b border-gray-300 pb-1 uppercase">Cláusulas de Cobertura de Garantia</h3>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li>
                    <strong>Abrangência:</strong> A garantia legal cobre única e exclusivamente o correto funcionamento dos componentes substituídos listados nesta Ordem de Serviço, bem como falhas decorrentes da prestação do serviço técnico, durante o prazo expresso de <strong>{activePrintJob.order.warranty || '90 dias'}</strong>.
                  </li>
                  <li>
                    <strong>Perda Automática de Garantia:</strong> A garantia perde totalmente sua validade técnica em qualquer um dos seguintes cenários:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-[11px] text-gray-600">
                      <li>Constatação de avarias mecânicas como trincos, arranhões severos, amassados ou deformações na carcaça e tela.</li>
                      <li>Sinais claros de umidade, contato direto ou indireto com água, suor excessivo ou qualquer tipo de substância líquida (oxidação).</li>
                      <li>Abertura, rompimento de selos de segurança ou intervenção de hardware realizada por terceiros ou pelo próprio usuário.</li>
                      <li>Sobrecarga elétrica decorrente de carregadores falsificados ou picos de tensão na rede.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Prazos Operacionais:</strong> Havendo necessidade de acionamento de garantia, o dispositivo deverá ser deixado na bancada para nova análise diagnóstica, tendo o laboratório o prazo legal de até 30 dias para a devida reparação conforme preconiza o Código de Defesa do Consumidor (CDC).
                  </li>
                </ol>

                <div className="bg-gray-50 border border-gray-300 p-3 rounded space-y-1">
                  <p className="font-bold">Declaração de Recebimento:</p>
                  <p className="italic text-gray-600">
                    "Declaro ter recebido o equipamento descrito acima em perfeito estado de funcionamento físico e lógico, com todos os recursos contratados ativos. Concordo integralmente com as condições operacionais e prazos de garantia expressos neste termo."
                  </p>
                </div>

                {/* Values table */}
                <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Forma de Liquidação:</p>
                    <p className="text-xs text-gray-800 font-semibold">{activePrintJob.order.paymentStatus === 'Pago' ? 'Pago via PIX Bancário Compensado' : 'Aguardando Compensação Financeira'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Investimento Total:</p>
                    <p className="text-base font-black text-gray-900">R$ {activePrintJob.order.value.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-12 text-center">
                  <div className="space-y-1">
                    <div className="border-b border-black w-48 mx-auto h-6"></div>
                    <p className="font-bold text-gray-700">Assinatura do Cliente / Recebedor</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-b border-black w-48 mx-auto h-6"></div>
                    <p className="font-bold text-gray-700">Responsável Técnico Autorizado</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePrintJob.type === 'label' && (
            <>
              <style dangerouslySetInnerHTML={{__html: `
                @page {
                  size: 50mm 30mm !important;
                  margin: 0 !important;
                }
                #print-area {
                  padding: 2px !important;
                  width: 50mm !important;
                  height: 30mm !important;
                  overflow: hidden !important;
                }
              `}} />
              <div className="w-[50mm] h-[30mm] bg-white text-black p-1 flex flex-row items-center justify-between font-sans overflow-hidden">
                <div className="w-[60%] flex flex-col justify-center pr-1 text-left space-y-0.5">
                  <div className="text-[7px] font-black uppercase border-b border-black pb-0.5 tracking-tight">
                    {currentUser?.storeName || 'Epic Touch'}
                  </div>
                  <div className="text-xs font-black tracking-tight leading-none">
                    {activePrintJob.order.number}
                  </div>
                  <div className="text-[8px] font-bold text-gray-700 truncate">
                    {activePrintJob.order.brand} {activePrintJob.order.model}
                  </div>
                  <div className="text-[6px] text-gray-500 font-medium">
                    Reg: {activePrintJob.order.date}
                  </div>
                </div>
                <div className="w-[38%] flex items-center justify-center">
                  <img 
                    className="w-[26mm] h-[26mm] object-contain" 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/?os=${activePrintJob.order.number}`)}`} 
                    alt="QR Code" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
