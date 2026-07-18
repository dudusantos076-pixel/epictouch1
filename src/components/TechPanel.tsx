import React, { useState } from 'react';
import { Order, Part, Laudo, OSStatus, PartUsed } from '../types';
import { 
  Wrench, CheckCircle, Clock, AlertTriangle, Play, Smartphone, 
  Camera, FileText, Plus, Check, X, ShieldAlert, Award,
  MessageSquare, Send, Upload
} from 'lucide-react';

interface TechPanelProps {
  orders: Order[];
  parts: Part[];
  laudos: Laudo[];
  currentUser: any;
  onUpdateOrder: (id: number, o: Partial<Order>) => Promise<any>;
  onAddLaudo: (l: Omit<Laudo, 'id' | 'date'>) => Promise<any>;
}

export default function TechPanel({ orders, parts, laudos, currentUser, onUpdateOrder, onAddLaudo }: TechPanelProps) {
  const myOrders = orders.filter(o => o.techId === currentUser.id);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activePrintLaudo, setActivePrintLaudo] = useState<Laudo | null>(null);

  const handlePrintLaudo = (laudo: Laudo) => {
    setActivePrintLaudo(laudo);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setActivePrintLaudo(null);
      }, 500);
    }, 250);
  };

  // Internal Staff Chat States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch internal messages
  const fetchChatMessages = async () => {
    try {
      const storeName = currentUser.storeName || 'Epic Touch';
      const res = await fetch(`/api/internal-chat?storeName=${encodeURIComponent(storeName)}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Erro ao buscar chat interno:', err);
    }
  };

  // Poll for messages periodically on mount
  React.useEffect(() => {
    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    setChatLoading(true);
    try {
      const storeName = currentUser.storeName || 'Epic Touch';
      const res = await fetch('/api/internal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          role: currentUser.role || 'tech',
          text: newMessageText,
          storeName
        })
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages(prev => [...prev, msg]);
        setNewMessageText('');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setChatLoading(false);
    }
  };

  // Status Change State
  const [status, setStatus] = useState<OSStatus>('Recebido');

  // Photo / Video input
  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Laudo State
  const [showLaudoForm, setShowLaudoForm] = useState(false);
  const [tela, setTela] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [placa, setPlaca] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [bateria, setBateria] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [oxidacao, setOxidacao] = useState<'Sim' | 'Não' | 'Não Testado'>('Não');
  const [faceId, setFaceId] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [biometria, setBiometria] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [cameras, setCameras] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [microfone, setMicrofone] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [altoFalante, setAltoFalante] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [conector, setConector] = useState<'OK' | 'Defeito' | 'Não Testado'>('OK');
  const [techNotes, setTechNotes] = useState('');

  // Parts association
  const [selectedPart, setSelectedPart] = useState('');
  const [partQty, setPartQty] = useState(1);

  const handleSelectOrder = (o: Order) => {
    setSelectedOrder(o);
    setStatus(o.status);
    setPhotoUrl('');
    setVideoUrl(o.video || '');
    setShowLaudoForm(false);
    
    // Reset Laudo State
    setTela('OK');
    setPlaca('OK');
    setBateria('OK');
    setOxidacao('Não');
    setFaceId('OK');
    setBiometria('OK');
    setCameras('OK');
    setMicrofone('OK');
    setAltoFalante('OK');
    setConector('OK');
    setTechNotes('');
  };

  const handleUpdateStatus = async (newStatus: OSStatus) => {
    if (!selectedOrder) return;
    try {
      await onUpdateOrder(selectedOrder.id, { status: newStatus });
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      setStatus(newStatus);
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const handleAddPhoto = async () => {
    if (!selectedOrder || !photoUrl) return;
    const updatedPhotos = [...(selectedOrder.photos || []), photoUrl];
    try {
      await onUpdateOrder(selectedOrder.id, { photos: updatedPhotos });
      setSelectedOrder({ ...selectedOrder, photos: updatedPhotos });
      setPhotoUrl('');
    } catch (err: any) {
      alert('Erro ao adicionar foto: ' + err.message);
    }
  };

  const handleSaveVideo = async () => {
    if (!selectedOrder) return;
    try {
      await onUpdateOrder(selectedOrder.id, { video: videoUrl });
      setSelectedOrder({ ...selectedOrder, video: videoUrl });
      alert('Vídeo de diagnóstico salvo!');
    } catch (err: any) {
      alert('Erro ao salvar vídeo: ' + err.message);
    }
  };

  const handleAssociatePart = async () => {
    if (!selectedOrder || !selectedPart) return;
    const part = parts.find(p => p.id === selectedPart);
    if (!part) return;

    if (part.qty < partQty) {
      alert('Quantidade insuficiente em estoque!');
      return;
    }

    const currentParts = selectedOrder.partsUsed || [];
    const existsIdx = currentParts.findIndex(p => p.partId === part.id);
    let updatedParts: PartUsed[] = [];

    if (existsIdx !== -1) {
      updatedParts = [...currentParts];
      updatedParts[existsIdx].qty += partQty;
    } else {
      updatedParts = [...currentParts, {
        partId: part.id,
        name: part.name,
        qty: partQty,
        unitPrice: part.sellingPrice
      }];
    }

    // Auto increment value of OS
    const addedValue = part.sellingPrice * partQty;
    const finalVal = selectedOrder.value + addedValue;

    try {
      await onUpdateOrder(selectedOrder.id, { partsUsed: updatedParts, value: finalVal });
      setSelectedOrder({ ...selectedOrder, partsUsed: updatedParts, value: finalVal });
      setSelectedPart('');
      setPartQty(1);
    } catch (err: any) {
      alert('Erro ao associar peça: ' + err.message);
    }
  };

  const handleSaveLaudo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const payload = {
        orderId: selectedOrder.id,
        orderNumber: selectedOrder.number,
        clientName: selectedOrder.clientName,
        equipment: `${selectedOrder.brand} ${selectedOrder.model}`,
        items: {
          tela,
          placa,
          bateria,
          oxidacao,
          faceId,
          biometria,
          cameras,
          microfone,
          altoFalante,
          conector
        },
        techNotes,
        techSignature: currentUser.name
      };

      const newLaudo = await onAddLaudo(payload);
      setShowLaudoForm(false);
      // Link locally to update badge
      setSelectedOrder({ ...selectedOrder, laudoId: newLaudo.id || 'some-new-laudo' });
      alert('Laudo Técnico Gerado com Sucesso! PDF emitido no sistema.');
      handlePrintLaudo({
        ...payload,
        id: newLaudo.id || 'temp-laudo-id',
        date: new Date().toLocaleDateString()
      } as Laudo);
    } catch (err: any) {
      alert('Erro ao gerar laudo: ' + err.message);
    }
  };

  return (
    <div className="space-y-6" id="tech-panel-container">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Painel do Técnico Responsável
          </h1>
          <p className="text-xs text-slate-400">Ordens de serviço delegadas à sua bancada de manutenção</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold block uppercase">Bancada Ativa</span>
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded font-semibold">{currentUser.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: QUEUE & COLLABORATION CHAT */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* ASSIGNED SERVICES RAIL */}
          <div className="bg-slate-950 border border-slate-800/85 p-4 rounded-xl flex flex-col space-y-4 h-[35vh]">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meus Serviços em Fila</h2>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {myOrders.map(o => (
                <div
                  key={o.id}
                  onClick={() => handleSelectOrder(o)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedOrder?.id === o.id
                      ? 'bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/10'
                      : 'bg-slate-900/30 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-blue-400 text-xs">{o.number}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-950 text-amber-400 border border-slate-800">
                      {o.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-200 text-xs truncate">{o.clientName}</h4>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">{o.brand} {o.model} | {o.equipment}</p>
                </div>
              ))}

              {myOrders.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Nenhum serviço pendente atribuído a você hoje. Bom descanso!
                </div>
              )}
            </div>
          </div>

          {/* STAFF INTERNAL CHAT COLLABORATIVE MODULE */}
          <div className="bg-slate-950 border border-slate-800/85 p-4 rounded-xl flex flex-col space-y-3 h-[30vh]" id="staff-internal-chat">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Chat Interno do Time
              </h2>
              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                Staff Online
              </span>
            </div>

            {/* CHAT MESSAGES PANEL */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-sans text-xs">
              {chatMessages.map((msg: any) => {
                const isMe = msg.senderId === currentUser.id;
                const roleColors: any = {
                  admin: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                  manager: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                  tech: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                  attendant: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                };
                const roleBadge = roleColors[msg.role] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';

                return (
                  <div key={msg.id} className={`p-2 rounded-lg border max-w-[85%] ${
                    isMe 
                      ? 'bg-slate-900 border-indigo-500/20 ml-auto' 
                      : 'bg-slate-900/50 border-slate-850'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="font-bold text-slate-200 text-[9px]">{msg.senderName}</span>
                      <span className={`text-[7px] px-1 rounded uppercase font-extrabold border ${roleBadge}`}>
                        {msg.role}
                      </span>
                      <span className="text-[7px] text-slate-500 font-mono ml-auto">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[10px] whitespace-pre-wrap select-all">{msg.text}</p>
                  </div>
                );
              })}

              {chatMessages.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-[10px] italic">
                  Nenhum aviso registrado hoje. Mande uma mensagem para o time!
                </div>
              )}
            </div>

            {/* CHAT INPUT FORM */}
            <form onSubmit={handleSendMessage} className="flex gap-1.5 border-t border-slate-900 pt-1.5 flex-shrink-0">
              <input
                type="text"
                placeholder="Digite um aviso para a equipe..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/50"
              />
              <button
                type="submit"
                disabled={chatLoading || !newMessageText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ACTIVE REPAIR STATION */}
        <div className="lg:col-span-2 space-y-4">
          {selectedOrder ? (
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-5">
              
              {/* ORDER INFO BAR */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-400">{selectedOrder.number}</span>
                    <span className="text-slate-500 font-bold">&middot;</span>
                    <span className="text-xs font-semibold text-slate-200">{selectedOrder.brand} {selectedOrder.model}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">Proprietário: <strong className="text-slate-300">{selectedOrder.clientName}</strong></p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Diagnóstico Atual:</span>
                  <select
                    value={status}
                    onChange={(e) => handleUpdateStatus(e.target.value as OSStatus)}
                    className="bg-slate-900 border border-slate-800 text-xs text-amber-400 font-bold px-2 py-1.5 rounded outline-none cursor-pointer"
                  >
                    {['Recebido', 'Em análise', 'Aguardando aprovação', 'Aguardando peça', 'Em reparo', 'Teste', 'Finalizado', 'Pronto para retirada'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* REPORTED DEFECT ACCENT */}
              <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-lg text-xs">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Defeito Reclamado</span>
                <p className="text-slate-300 italic">"{selectedOrder.reportedDefect}"</p>
                {selectedOrder.password && (
                  <p className="text-amber-500 font-mono mt-1.5 text-[10px]">Chave de Desbloqueio Informada: <strong className="bg-slate-950 px-1.5 py-0.5 rounded">{selectedOrder.password}</strong></p>
                )}
              </div>

              {/* PARTS USED REGISTRY */}
              <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Utilizar Peças do Estoque</h3>
                <div className="flex gap-2 text-xs">
                  <select
                    value={selectedPart}
                    onChange={(e) => setSelectedPart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                  >
                    <option value="">Selecione uma peça...</option>
                    {parts.map(p => (
                      <option key={p.id} value={p.id} disabled={p.qty <= 0}>
                        {p.name} ({p.qty} un)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={partQty}
                    onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value)))}
                    className="w-14 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 text-center font-mono font-bold"
                  />
                  <button
                    onClick={handleAssociatePart}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Vincular
                  </button>
                </div>

                {selectedOrder.partsUsed && selectedOrder.partsUsed.length > 0 && (
                  <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-900">
                    {selectedOrder.partsUsed.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-400 py-1 border-b border-slate-900/40 last:border-0">
                        <span>{p.name} (x{p.qty})</span>
                        <span className="font-mono text-purple-400">R$ {(p.unitPrice * p.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ASSETS REGISTER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PHOTO SUBMIT */}
                <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Camera className="w-4 h-4 text-blue-400" /> Registrar Foto da Placa / Reparo
                  </span>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Colar URL de imagem técnica ou..."
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none animate-none"
                      />
                      <button onClick={handleAddPhoto} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer shrink-0 transition-colors">
                        Salvar
                      </button>
                    </div>

                    <div className="relative border border-dashed border-slate-800 hover:border-blue-500/50 rounded-lg p-3 bg-slate-950/45 hover:bg-slate-950 transition-colors cursor-pointer text-center group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedOrder) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              if (typeof reader.result === 'string') {
                                const updatedPhotos = [...(selectedOrder.photos || []), reader.result];
                                try {
                                  await onUpdateOrder(selectedOrder.id, { photos: updatedPhotos });
                                  setSelectedOrder({ ...selectedOrder, photos: updatedPhotos });
                                  alert('Foto adicionada e salva com sucesso!');
                                } catch (err: any) {
                                  alert('Erro ao salvar foto: ' + err.message);
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Upload className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition-colors">
                          Selecione Arquivo ou Ative a Câmera
                        </span>
                      </div>
                    </div>

                    {/* Technical Photos Gallery */}
                    {selectedOrder.photos && selectedOrder.photos.length > 0 && (
                      <div className="pt-2 border-t border-slate-900">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Fotos Salvas nesta OS ({selectedOrder.photos.length})</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {selectedOrder.photos.map((ph, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-800 aspect-video">
                              <img src={ph} alt="Technical analysis" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={async () => {
                                  const updatedPhotos = selectedOrder.photos!.filter((_, i) => i !== idx);
                                  try {
                                    await onUpdateOrder(selectedOrder.id, { photos: updatedPhotos });
                                    setSelectedOrder({ ...selectedOrder, photos: updatedPhotos });
                                  } catch (err: any) {
                                    alert('Erro ao remover foto: ' + err.message);
                                  }
                                }}
                                className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* VIDEO SUBMIT */}
                <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Play className="w-4 h-4 text-emerald-400" /> Gravar / Link de Vídeo de Teste
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Colar URL do vídeo de teste (ex: youtube, drive)..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                    />
                    <button onClick={handleSaveVideo} className="bg-emerald-650 text-white font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer">
                      Vincular
                    </button>
                  </div>
                </div>
              </div>

              {/* LAUDO TÉCNICO CHECKLIST SECTION */}
              <div className="border-t border-slate-900 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Laudo Técnico Pericial
                  </h3>
                  
                  {!selectedOrder.laudoId ? (
                    <button
                      onClick={() => setShowLaudoForm(!showLaudoForm)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded cursor-pointer transition-colors"
                    >
                      {showLaudoForm ? 'Ocultar Formulário' : 'Gerar Laudo Pericial'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                        ✔ LAUDO TÉCNICO GERADO
                      </span>
                      {laudos.find(l => l.orderId === selectedOrder.id) && (
                        <button
                          onClick={() => {
                            const l = laudos.find(la => la.orderId === selectedOrder.id);
                            if (l) handlePrintLaudo(l);
                          }}
                          className="bg-purple-900/60 hover:bg-purple-800/60 border border-purple-500/20 text-purple-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer transition-colors"
                        >
                          Imprimir PDF
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {showLaudoForm && (
                  <form onSubmit={handleSaveLaudo} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {/* LAUDO CRITERIAS */}
                      {[
                        { label: 'Tela', val: tela, set: setTela },
                        { label: 'Placa', val: placa, set: setPlaca },
                        { label: 'Bateria', val: bateria, set: setBateria },
                        { label: 'Face ID', val: faceId, set: setFaceId },
                        { label: 'Biometria', val: biometria, set: setBiometria },
                        { label: 'Câmeras', val: cameras, set: setCameras },
                        { label: 'Microfone', val: microfone, set: setMicrofone },
                        { label: 'Alto Falante', val: altoFalante, set: setAltoFalante },
                        { label: 'Conector', val: conector, set: setConector },
                      ].map((crit) => (
                        <div key={crit.label} className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{crit.label}</label>
                          <select
                            value={crit.val}
                            onChange={(e: any) => crit.set(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-[10px] text-slate-300 outline-none"
                          >
                            <option value="OK">Aprovado</option>
                            <option value="Defeito">Reprovado</option>
                            <option value="Não Testado">Não Testado</option>
                          </select>
                        </div>
                      ))}

                      {/* Oxidação is special */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Oxidação</label>
                        <select
                          value={oxidacao}
                          onChange={(e: any) => setOxidacao(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-[10px] text-slate-300 outline-none"
                        >
                          <option value="Sim">Sim (Detectada)</option>
                          <option value="Não">Não</option>
                          <option value="Não Testado">Não Analisado</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Diagnóstico Descritivo & Parecer Pericial</label>
                      <textarea
                        value={techNotes}
                        onChange={(e) => setTechNotes(e.target.value)}
                        placeholder="Escreva detalhadamente o parecer do laudo para gerar o PDF..."
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLaudoForm(false)}
                        className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-1.5 rounded cursor-pointer font-semibold shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Emitir Laudo PDF
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-900 p-12 text-center rounded-xl h-full flex flex-col items-center justify-center">
              <Smartphone className="w-10 h-10 text-slate-700 mb-2" />
              <h3 className="text-slate-300 font-semibold text-sm">Nenhum Serviço Ativo</h3>
              <p className="text-slate-500 text-xs mt-1">Selecione uma das ordens atribuídas a você na fila lateral para iniciar o reparo.</p>
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
