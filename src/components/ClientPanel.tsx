import React, { useState, useEffect, useRef } from 'react';
import { Order, Message, Laudo } from '../types';
import { 
  CheckCircle2, Clock, Smartphone, MessageSquare, Send, DollarSign, ShieldAlert,
  Award, QrCode, Clipboard, Check, Camera, Play, ExternalLink, RefreshCw 
} from 'lucide-react';

interface ClientPanelProps {
  order: Order | null;
  messages: Message[];
  laudos: Laudo[];
  onSendMessage: (text: string) => Promise<any>;
  onTriggerPix: () => Promise<any>;
}

const STATUS_PIPELINE = [
  'Recebido',
  'Em análise',
  'Aguardando aprovação',
  'Aguardando peça',
  'Em reparo',
  'Teste',
  'Finalizado',
  'Pronto para retirada'
];

export default function ClientPanel({ order, messages, laudos, onSendMessage, onTriggerPix }: ClientPanelProps) {
  const [chatText, setChatText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccessConfetti, setIsSuccessConfetti] = useState(false);
  const [activePrintLaudo, setActivePrintLaudo] = useState<Laudo | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handlePrintLaudo = (laudo: Laudo) => {
    setActivePrintLaudo(laudo);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setActivePrintLaudo(null);
      }, 500);
    }, 250);
  };

  const [rating, setRating] = useState(order?.rating || 0);
  const [ratingSubmitted, setRatingSubmitted] = useState(!!order?.rating);

  useEffect(() => {
    if (order) {
      setRating(order.rating || 0);
      setRatingSubmitted(!!order.rating);
    }
  }, [order]);

  const handleRate = async (stars: number) => {
    if (!order) return;
    try {
      const res = await fetch(`/api/orders/${order.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars })
      });
      if (res.ok) {
        setRating(stars);
        setRatingSubmitted(true);
        alert('Obrigado por avaliar nosso atendimento com ' + stars + ' estrelas!');
        window.dispatchEvent(new CustomEvent('reload-orders'));
      } else {
        alert('Falha ao enviar avaliação.');
      }
    } catch (err: any) {
      alert('Erro ao enviar avaliação: ' + err.message);
    }
  };

  const downloadWarranty = () => {
    if (!order) return;
    const text = `================================================
EPIC TOUCH - CERTIFICADO DE GARANTIA PREMIUM
================================================
Aparelho: ${order.brand} ${order.model}
Protocolo: ${order.number}
Cliente: ${order.clientName}
Responsável: ${order.techName}

GARANTIA: ${order.warranty}
Validade: 90 dias a contar de ${order.pixPaidAt ? new Date(order.pixPaidAt).toLocaleDateString() : new Date().toLocaleDateString()}

TERMOS DE GARANTIA:
A Epic Touch garante os serviços de reparação executados no dispositivo acima especificado pelo período indicado, contra defeitos de mão de obra ou de componentes substituídos. Esta garantia não cobre danos por quedas, oxidação por líquidos, mau uso evidente ou lacre de garantia violado.

------------------------------------------------
Epic Touch - Assistência Técnica Avançada
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Garantia_${order.number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadLaudo = () => {
    if (!order) return;
    const text = `================================================
EPIC TOUCH - LAUDO TÉCNICO DE LIBERAÇÃO PERICIAL
================================================
ID Laudo: L-${order.id}
Referência OS: ${order.number}
Aparelho: ${order.brand} ${order.model}
Técnico Certificado: ${order.techName}

ITENS DE VISTORIA:
- Touchscreen: ${hasLaudo?.items?.tela || 'OK'}
- Bateria: ${hasLaudo?.items?.bateria || 'OK'}
- Carregamento: ${hasLaudo?.items?.conector || 'OK'}
- Áudio: ${hasLaudo?.items?.altoFalante || 'OK'}
- Câmeras: ${hasLaudo?.items?.cameras || 'OK'}

NOTAS PERICIAIS TÉCNICAS:
${hasLaudo?.techNotes || 'Aparelho passou nos testes de estresse de bancada. Sem anomalias térmicas ou de barramento. Liberado para uso.'}

------------------------------------------------
Assinatura Digital Técnico: ${order.techName}
Epic Touch - Assistência Técnica Avançada
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LaudoTecnico_${order.number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = () => {
    if (!order) return;
    const text = `================================================
EPIC TOUCH - NOTA FISCAL DE SERVIÇOS (NFS-e)
================================================
Chave de Acesso: ${Math.floor(Math.random() * 9000000000000000) + 1000000000000000}
Número NFS-e: ${1000 + order.id}
Data Emissão: ${new Date().toLocaleDateString()}

PRESTADOR: EPIC TOUCH LTDA.
CNPJ: 45.109.876/0001-23
Inscrição Municipal: 9.876.543-2

TOMADOR: ${order.clientName}
CPF/CNPJ: ***.***.***-**

DISCRIMINAÇÃO DOS SERVIÇOS:
Reparação técnica avançada executada no aparelho ${order.brand} ${order.model} (OS ${order.number}).

Valor Total dos Serviços: R$ ${order.value.toFixed(2)}
Alíquota ISS: 5% (R$ ${(order.value * 0.05).toFixed(2)})
Valor Líquido da Nota: R$ ${order.value.toFixed(2)}

------------------------------------------------
NFS-e emitida eletronicamente em conformidade com as diretrizes fiscais de serviços de telecomunicação.
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NotaFiscal_${order.number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!order) {
    return (
      <div className="bg-slate-950 border border-slate-900 rounded-xl p-12 text-center max-w-lg mx-auto my-12 flex flex-col items-center">
        <Smartphone className="w-12 h-12 text-slate-700 mb-3" />
        <h2 className="text-white font-semibold text-sm">Nenhum Dispositivo Rastreando</h2>
        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
          Para acessar a Área do Cliente, selecione uma Ordem de Serviço ativa para rastrear no seletor de perfil no cabeçalho superior.
        </p>
      </div>
    );
  }

  // Find Associated Laudo
  const hasLaudo = laudos.find(l => l.orderId === order.id);

  const getStatusIndex = (current: string) => {
    return STATUS_PIPELINE.indexOf(current);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    try {
      await onSendMessage(chatText);
      setChatText('');
      
      // Simulated answer after 1.5 seconds
      setTimeout(async () => {
        const autoResponses = [
          "Olá! Recebemos seu contato. Carlos Técnico já está na bancada analisando e retornará em instantes.",
          "Olá! Suas observações foram salvas na Ordem de Serviço de número " + order.number + ". Obrigado!",
          "Entendido. Vamos priorizar a liberação do seu aparelho conforme solicitado. Manteremos você informado pelo WhatsApp!",
          "Sua mensagem foi entregue diretamente ao técnico responsável pelo seu reparo."
        ];
        const randomResponse = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        
        // Post simulated assistant response
        await fetch(`/api/orders/${order.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'tech',
            senderName: order.techName,
            text: randomResponse
          })
        });
        
        // Quick callback to reload messages can be handled via parent poll or quick refresh
        window.dispatchEvent(new CustomEvent('reload-messages'));
      }, 1500);

    } catch (err: any) {
      alert('Erro ao enviar mensagem: ' + err.message);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(`00020101021126580014br.gov.pix.0114+55119876543215204000053039865406${order.value.toFixed(2)}5802BR5913EPIC_CRM_TECH6009SAO_PAULO62070503***6304FC7D`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePixPayment = async () => {
    try {
      setIsPaying(true);
      await onTriggerPix();
      setIsSuccessConfetti(true);
      setTimeout(() => {
        setIsSuccessConfetti(false);
        setIsPaying(false);
      }, 4000);
    } catch (err: any) {
      alert('Erro na liquidação do PIX: ' + err.message);
      setIsPaying(false);
    }
  };

  const currentStatusIdx = getStatusIndex(order.status);

  return (
    <div className="space-y-6" id="client-panel-container">
      {/* HEADER PORTAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Portal do Cliente</span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Acompanhamento do Reparo</h1>
          <p className="text-xs text-slate-500 font-sans">Verifique o status do seu celular, fotos, laudos técnicos e efeteu o pagamento</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Protocolo Rastreamento</span>
          <span className="text-xs font-mono font-bold text-blue-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">{order.number}</span>
        </div>
      </div>

      {/* SUCCESS CONFETTI POPUP MOCK */}
      {isSuccessConfetti && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-2 animate-bounce shadow-md max-w-md mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">✔ PIX Recebido com Sucesso!</h2>
          <p className="text-xs text-slate-600">Seu serviço foi compensado e liberado. O aparelho agora está pronto para ser retirado na assistência técnica!</p>
        </div>
      )}

      {/* HORIZONTAL TIMELINE PROCESSOR */}
      <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600" />
          Progresso Técnico em Tempo Real
        </h2>

        {/* LINE GRID */}
        <div className="relative pt-4 pb-6 hidden md:block">
          <div className="absolute top-7 left-8 right-8 h-1 bg-slate-100 rounded-full">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${(currentStatusIdx / (STATUS_PIPELINE.length - 1)) * 100}%` }}
            />
          </div>

          <div className="flex justify-between relative">
            {STATUS_PIPELINE.map((step, idx) => {
              const isPast = idx < currentStatusIdx;
              const isCurrent = idx === currentStatusIdx;
              
              return (
                <div key={step} className="flex flex-col items-center text-center space-y-2 w-20 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border font-bold text-xs transition-all ${
                    isCurrent 
                      ? 'bg-emerald-650 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20' 
                      : isPast 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {isPast ? '✔' : idx + 1}
                  </div>
                  <span className={`text-[9px] font-sans font-medium line-clamp-2 ${
                    isCurrent ? 'text-slate-900 font-bold' : isPast ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOBILE VERTICAL STATUS */}
        <div className="md:hidden space-y-2.5">
          {STATUS_PIPELINE.map((step, idx) => {
            const isPast = idx < currentStatusIdx;
            const isCurrent = idx === currentStatusIdx;
            if (!isCurrent && !isPast) return null;

            return (
              <div key={step} className="flex items-center gap-3 text-xs">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                  isCurrent ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  {isCurrent ? '●' : '✔'}
                </span>
                <span className={isCurrent ? 'text-slate-900 font-bold' : 'text-slate-500'}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXCLUSIVE TRACKING LINK & SERVICE EVALUATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="client-premium-meta-cards">
        {/* Direct Link Card */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              Link Exclusivo de Rastreamento
            </h3>
            <button
              onClick={() => {
                const directLink = `${window.location.origin}/?os=${order.number}`;
                navigator.clipboard.writeText(directLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
          <p className="text-xs text-indigo-800 leading-relaxed">
            Utilize este link exclusivo para consultar o status do seu aparelho diretamente sem precisar efetuar login ou confirmar dados:
          </p>
          <div className="bg-white/80 border border-indigo-150 px-3 py-2 rounded-lg font-mono text-[10px] text-indigo-900 truncate select-all">
            {window.location.origin}/?os={order.number}
          </div>
        </div>

        {/* Customer Satisfaction Feedback Card */}
        <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            Avalie Nosso Atendimento
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Sua opinião é de extrema importância para melhorarmos constantemente nossa bancada de suporte. Vote abaixo:
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(star)}
                  className="p-1 outline-none transition-transform active:scale-110 cursor-pointer"
                >
                  <svg 
                    className={`w-7 h-7 transition-colors ${isSelected ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} 
                    fill={isSelected ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 11.3c-.773-.57-.375-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                  </svg>
                </button>
              );
            })}
            <span className="text-xs font-bold text-amber-900 ml-2">
              {ratingSubmitted ? `Nota ${rating} enviada!` : 'Selecione uma nota'}
            </span>
          </div>
        </div>
      </div>

      {/* DOCUMENTATION OFFICIAL DOWNLOAD HUB */}
      <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-xl space-y-4" id="documentation-official-download-hub">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-650" />
            Documentação de Garantia, Laudo e Nota Fiscal
          </h3>
          <p className="text-xs text-slate-500 mt-1">Baixe os arquivos e notas de validação do serviço executado no seu celular.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* WARRANTY */}
          <button
            onClick={downloadWarranty}
            className="bg-slate-50 hover:bg-indigo-50/40 text-slate-700 border border-slate-200 hover:border-indigo-200 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Award className="w-4 h-4 text-amber-500" />
            Baixar Certificado de Garantia (.TXT)
          </button>

          {/* LAUDO TÉCNICO */}
          <button
            onClick={() => {
              if (hasLaudo) {
                handlePrintLaudo(hasLaudo);
              } else {
                alert('O Laudo Técnico ainda está sendo elaborado pelo técnico de bancada.');
              }
            }}
            className="bg-slate-50 hover:bg-indigo-50/40 text-slate-700 border border-slate-200 hover:border-indigo-200 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Clipboard className="w-4 h-4 text-blue-500" />
            Baixar Laudo Técnico Oficial (PDF)
          </button>

          {/* NOTA FISCAL */}
          <button
            onClick={downloadInvoice}
            className="bg-slate-50 hover:bg-indigo-50/40 text-slate-700 border border-slate-200 hover:border-indigo-200 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Baixar Nota Fiscal Eletrônica (.TXT)
          </button>
        </div>
      </div>

      {/* CORE INFO & PAYMENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REPAIR PORTRAIT & PAYMENTS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DEVICE DETAILS CARD */}
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Aparelho Registrado</span>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">{order.brand} {order.model}</h3>
                <p className="text-[10px] text-slate-400 font-mono">IMEI/Série: {order.imei || 'Não informado'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Orçamento Total</span>
                  <p className="text-base font-mono font-black text-emerald-600">R$ {order.value.toFixed(2).replace('.', ',')}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Garantia Técnica</span>
                  <p className="text-xs text-slate-700 font-semibold">{order.warranty}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Defeito Reportado</span>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{order.reportedDefect}"</p>
              </div>

              {/* ESTIMATED DAYS LEFT */}
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2.5 text-xs">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-950">Tempo Estimado de Entrega</p>
                  <p className="text-[10px] text-amber-800">Aproximadamente 24-48 horas úteis.</p>
                </div>
              </div>
            </div>
          </div>

          {/* DIAGNOSTIC ASSETS */}
          {(order.photos && order.photos.length > 0 || order.video) && (
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Galeria de Diagnóstico Visual</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {order.photos && order.photos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Camera className="w-4 h-4 text-blue-500" /> Registro Fotográfico Interno
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {order.photos.map((ph, idx) => (
                        <a href={ph} target="_blank" rel="noreferrer" key={idx} className="rounded-lg overflow-hidden border border-slate-200 aspect-video">
                          <img src={ph} alt="Technical analysis asset" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {order.video && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Play className="w-4 h-4 text-emerald-600" /> Gravação de Teste de Bancada
                    </span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-850 font-sans">Vídeo de Inspeção Disponível</p>
                        <p className="text-[10px] text-slate-500">Gravado por {order.techName}</p>
                      </div>
                      <a href={order.video} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 font-semibold cursor-pointer">
                        Assistir <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LAUDO TÉCNICO COMPONENT */}
          {hasLaudo && (
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Laudo de Liberação Pericial</h3>
                  <p className="text-[10px] text-slate-500 font-mono">ID: {hasLaudo.id}</p>
                </div>
                <button
                  onClick={() => handlePrintLaudo(hasLaudo)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs px-3 py-1.5 rounded-lg text-slate-750 font-semibold cursor-pointer transition-colors"
                >
                  Download PDF
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                {Object.entries(hasLaudo.items).map(([key, val]) => (
                  <div key={key} className="p-1 rounded bg-white border border-slate-200 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 capitalize font-medium">{key}</span>
                    <span className={`font-bold ${val === 'OK' || val === 'Não' ? 'text-emerald-650' : 'text-rose-600'}`}>{val}</span>
                  </div>
                ))}
              </div>

              {hasLaudo.techNotes && (
                <div className="text-xs text-slate-600 p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Parecer Pericial Técnico</span>
                  <p className="italic">"{hasLaudo.techNotes}"</p>
                </div>
              )}
            </div>
          )}

          {/* PIX GATEWAY SIMULATION */}
          {order.paymentStatus === 'Pendente' ? (
            <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Pagar com PIX Automático (Gateway de Liberação)
                  </h3>
                  <p className="text-xs text-slate-500">Pague agora para liberar seu dispositivo e atualizar o faturamento da loja instantaneamente</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* QR CODE DRAWING */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 aspect-square max-w-[150px] mx-auto flex items-center justify-center">
                  <div className="relative p-1 bg-white rounded-lg border border-slate-200">
                    {/* Simulated visual QR structure */}
                    <div className="w-28 h-28 bg-slate-100 flex items-center justify-center border-4 border-slate-900 font-mono text-center font-bold text-[8px] text-black">
                      [ QR CODE MOCK ]
                    </div>
                  </div>
                </div>

                {/* COPY CODES & HELP */}
                <div className="md:col-span-2 space-y-3 text-xs">
                  <p className="text-slate-600">
                    Sua ordem de serviço será <strong>automaticamente alterada para "Pronto para retirada"</strong> assim que o PIX for detectado no banco de dados.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyPix}
                      className="bg-slate-55 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer w-full transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                      {copied ? 'Chave Copiada!' : 'Copiar Chave PIX'}
                    </button>
                    
                    <button
                      onClick={handleSimulatePixPayment}
                      disabled={isPaying}
                      className="bg-emerald-650 hover:bg-emerald-600 disabled:bg-slate-100 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-emerald-500/10 cursor-pointer w-full whitespace-nowrap transition-colors"
                    >
                      {isPaying ? 'Liquidando...' : 'Confirmar PIX (Simulado)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">✔ Ordem de Serviço Totalmente Paga</h3>
                <p className="text-xs text-slate-600">Compensado via PIX em {order.pixPaidAt ? new Date(order.pixPaidAt).toLocaleDateString() : 'Hoje'}. Comprovante anexado.</p>
              </div>
              <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded text-xs font-mono">R$ {order.value.toFixed(2)} PAGO</span>
            </div>
          )}

        </div>

        {/* REPAIR CHAT */}
        <div className="lg:col-span-1 bg-white border border-slate-200 p-4 rounded-xl flex flex-col h-[70vh] shadow-sm">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Chat de Atendimento
            </h3>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </div>

          {/* MESSAGE LOGS */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
            {messages.map((m) => {
              const isSys = m.sender === 'system';
              const isMe = m.sender === 'client';
              
              if (isSys) {
                return (
                  <div key={m.id} className="text-center font-mono text-[9px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200 max-w-[90%] mx-auto">
                    {m.text}
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex flex-col max-w-[85%] space-y-0.5 ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  <span className="text-[8px] text-slate-400 font-semibold">{m.senderName}</span>
                  <div className={`p-2.5 rounded-xl ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHAT INPUT FORM */}
          <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Digite sua dúvida para a bancada..."
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg cursor-pointer transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
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
