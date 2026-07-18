import React, { useState } from 'react';
import { User } from '../types';
import { 
  Lock, User as UserIcon, Smartphone, Key, AlertCircle, Eye, EyeOff, CheckCircle2, ChevronRight,
  Copy, Check, CreditCard, QrCode, Sparkles, ShieldCheck, ArrowLeft, CheckCircle
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'paywall'>('login');
  const [activeTab, setActiveTab] = useState<'staff' | 'client'>('staff');
  
  // Staff credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Client credentials state
  const [osNumber, setOsNumber] = useState('');
  const [phone, setPhone] = useState('');

  // 2FA state for staff
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingStaffUser, setPendingStaffUser] = useState<User | null>(null);

  // Direct exclusive tracking link handler
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const osParam = params.get('os') || params.get('osNumber');
    if (osParam) {
      setActiveTab('client');
      setOsNumber(osParam);
      
      const autoTrace = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ osNumber: osParam })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Protocolo de link exclusivo inválido.');
          }
          setSuccess(`Link exclusivo localizado! Acessando status da ${osParam}...`);
          setTimeout(() => {
            onLoginSuccess(data.user);
          }, 1200);
        } catch (err: any) {
          setError(err.message || 'Erro ao rastrear OS via link direto.');
        } finally {
          setLoading(false);
        }
      };
      autoTrace();
    }
  }, []);

  // Register account state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regPlanType, setRegPlanType] = useState<'basic' | 'pro'>('basic');

  // Registered user reference for paywall
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const [pixTxId, setPixTxId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      // Check if 2FA is enabled in system configs
      const dbRes = await fetch(`/api/db?storeName=${encodeURIComponent(data.user.storeName || '')}`);
      const dbData = await dbRes.json();
      const twoFactorActive = dbData.configs?.twoFactorEnabled;

      if (twoFactorActive) {
        setTwoFactorRequired(true);
        setPendingStaffUser(data.user);
        setSuccess('Credenciais corretas! Por favor, insira o Token 2FA.');
        return;
      }

      // Check if plan is pending payment
      if (data.user.planStatus === 'pending') {
        setSuccess('Acesso autenticado! Prossiga para o pagamento do seu plano.');
        setRegisteredUser(data.user);
        setTimeout(() => {
          setAuthMode('paywall');
          setSuccess(null);
        }, 1200);
      } else {
        setSuccess(`Bem-vindo de volta, ${data.user.name}!`);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado no servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      setError('Por favor, insira o código 2FA.');
      return;
    }

    setLoading(true);
    setError(null);

    // Dynamic minute-based OTP token for simulation + standard backdoor pin
    const currentOtp = String(Math.floor(Date.now() / 60000) % 1000000).padStart(6, '0');

    if (twoFactorCode.trim() === '123456' || twoFactorCode.trim() === currentOtp) {
      setSuccess('Autenticação de Dois Fatores efetuada! Entrando no CRM...');
      setError(null);
      setTimeout(() => {
        if (pendingStaffUser) {
          // Check if plan is pending payment
          if (pendingStaffUser.planStatus === 'pending') {
            setRegisteredUser(pendingStaffUser);
            setAuthMode('paywall');
          } else {
            onLoginSuccess(pendingStaffUser);
          }
        }
      }, 1000);
    } else {
      setError('Token 2FA inválido ou expirado. Use o Token simulado ativo nas configurações ou "123456".');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regStoreName.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          username: regEmail,
          password: regPassword,
          storeName: regStoreName,
          planType: regPlanType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar conta.');
      }

      setSuccess('Sua conta foi criada! Redirecionando para o pagamento do plano...');
      setRegisteredUser(data.user);
      setTimeout(() => {
        setAuthMode('paywall');
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!registeredUser) return;

    if (!pixTxId.trim()) {
      setError('O ID de Transação PIX (E2E ID) é obrigatório para validação automática da transferência real.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/users/activate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: registeredUser.id,
          transactionId: pixTxId.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao confirmar pagamento.');
      }

      setSuccess('Pagamento confirmado e plano ativado com sucesso! Seja bem-vindo à Epic Touch.');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar ativação.');
    } finally {
      setLoading(false);
    }
  };

  const handleClientTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osNumber.trim()) {
      setError('Por favor, digite o número da Ordem de Serviço (Ex: OS-1020).');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ osNumber, phone })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Protocolo ou telefone inválido.');
      }

      setSuccess(`Ordem de Serviço localizada! Carregando dados de ${data.user.name}...`);
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao rastrear protocolo.');
    } finally {
      setLoading(false);
    }
  };

  // PIX Copy & Paste string generator matching user's selected plan with phone key 71982595064
  const calculateCRC16 = (str: string): string => {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
      const charCode = str.charCodeAt(c);
      crc ^= (charCode << 8);
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const getPixCode = () => {
    const amount = registeredUser?.planType === 'pro' ? '49.99' : '19.99';
    const key = '+5571982595064';
    
    // Tag 26 has subtag 00 (GUI) and subtag 01 (Key)
    const subtag00 = '0014br.gov.bcb.pix';
    const subtag01 = `01${key.length.toString().padStart(2, '0')}${key}`;
    const tag26Value = `${subtag00}${subtag01}`;
    const tag26 = `26${tag26Value.length.toString().padStart(2, '0')}${tag26Value}`;
    
    const part1 = `000201${tag26}520400005303986`;
    const part2 = `54${amount.length.toString().padStart(2, '0')}${amount}5802BR5910Epic Touch6009Sao Paulo62070503***6304`;
    
    const payloadBeforeCRC = `${part1}${part2}`;
    const crc = calculateCRC16(payloadBeforeCRC);
    return `${payloadBeforeCRC}${crc}`;
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(getPixCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans" id="login-container-root">
      {/* Background radial ambient light glows (More colorful and catchy) */}
      <div className="absolute -top-10 -left-10 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        
        {/* LOGO AND BRAND HEADER */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-linear-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-3xl text-white shadow-[0_0_40px_rgba(139,92,246,0.4)] border border-white/20 animate-pulse relative group">
            <Smartphone className="w-9 h-9 relative z-10" />
            <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 z-20 animate-bounce" />
            <div className="absolute inset-0 bg-linear-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter bg-linear-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent font-mono uppercase">Epic Touch</h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wide flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Bancada de Assistência e Atendimento Premium
            </p>
          </div>
        </div>

        {/* CONTAINER CARD - CONDITIONAL CHANNELS */}
        {authMode === 'login' && (
          <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-500 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden">
            {/* TAB HEADERS */}
            <div className="flex border-b border-slate-800/80 bg-slate-950/50">
              <button
                onClick={() => {
                  setActiveTab('staff');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-4 text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'staff'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Equipe Técnica
              </button>
              <button
                onClick={() => {
                  setActiveTab('client');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-4 text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === 'client'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Acompanhar OS
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* ALERT BOXES */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-400 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* TAB CONTENT: STAFF LOGIN */}
              {activeTab === 'staff' && (
                twoFactorRequired ? (
                  <form onSubmit={handleTwoFactorVerify} className="space-y-5 animate-fadeIn">
                    <div className="text-center pb-2">
                      <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 mb-2 border border-indigo-500/20">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Verificação de Dois Fatores (2FA)</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Sua conta exige verificação adicional por segurança.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Token de 6 Dígitos</label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                        <input
                          type="text"
                          maxLength={6}
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 disabled:from-slate-800 disabled:to-slate-850 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5 mt-2"
                    >
                      {loading ? 'Validando...' : 'Confirmar Token 2FA'}
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorRequired(false);
                        setPendingStaffUser(null);
                        setTwoFactorCode('');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="w-full text-slate-500 hover:text-slate-300 text-[10px] uppercase font-bold tracking-wider pt-2 text-center outline-none cursor-pointer"
                    >
                      Voltar ao Login por Senha
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleStaffLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Usuário (E-mail)</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Ex: dudusantos076@gmail.com"
                          className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Senha de Acesso</label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-indigo-400 outline-none cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-850 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-2"
                    >
                      {loading ? 'Acessando...' : 'Entrar no CRM'}
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* CREATE ACCOUNT SWITCH */}
                    <div className="pt-4 border-t border-slate-900/60 text-center">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('register'); setError(null); setSuccess(null); }}
                        className="text-xs text-transparent bg-linear-to-r from-cyan-400 to-indigo-300 bg-clip-text font-black hover:text-white cursor-pointer underline decoration-dotted transition-colors"
                      >
                        Não tem uma conta? Cadastre-se e escolha um plano!
                      </button>
                    </div>
                  </form>
                )
              )}

              {/* TAB CONTENT: CLIENT TRACKING */}
              {activeTab === 'client' && (
                <form onSubmit={handleClientTracking} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Número do Protocolo (OS)</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={osNumber}
                        onChange={(e) => setOsNumber(e.target.value)}
                        placeholder="Ex: OS-1020"
                        className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Celular / WhatsApp (Opcional)</label>
                      <span className="text-[8px] text-slate-500 uppercase tracking-wider">Segurança Adicional</span>
                    </div>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Digite os números ou telefone da OS"
                        className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-850 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    {loading ? 'Consultando...' : 'Consultar Ordem de Serviço'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

        {/* REGISTER ACCOUNT CHANNEL */}
        {authMode === 'register' && (
          <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-500 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-800/80 bg-slate-950/50 flex items-center gap-2.5">
              <button 
                onClick={() => { setAuthMode('login'); setError(null); setSuccess(null); }}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-extrabold text-white uppercase tracking-wider bg-linear-to-r from-white to-slate-300 bg-clip-text text-transparent">Criar Nova Conta</h2>
                <p className="text-[10px] text-slate-400">Inscreva-se e ative seu painel de bancada</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* ALERT BOXES */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-400 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-mail de Login</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="exemplo@gmail.com"
                      className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Senha de Acesso</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome da Assistência</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={regStoreName}
                      onChange={(e) => setRegStoreName(e.target.value)}
                      placeholder="Ex: Epic Touch, João Assistência"
                      className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* PLAN CHOICE */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selecione Seu Plano</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* PLAN BASIC */}
                    <div 
                      onClick={() => setRegPlanType('basic')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        regPlanType === 'basic' 
                          ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-white">Básico</span>
                          {regPlanType === 'basic' && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal">Ideal para técnicos individuais ou bancadas pequenas.</p>
                      </div>
                      <div className="pt-2 flex items-baseline gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400">R$ </span>
                        <span className="text-lg font-black text-white">19,99</span>
                        <span className="text-[8px] text-slate-500">/mês</span>
                      </div>
                    </div>

                    {/* PLAN PRO */}
                    <div 
                      onClick={() => setRegPlanType('pro')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                        regPlanType === 'pro' 
                          ? 'border-pink-500 bg-pink-500/10 text-white' 
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="absolute -top-1 -right-1 bg-pink-500 text-slate-950 text-[7px] font-black uppercase px-2 py-1 rotate-12 rounded-bl-lg tracking-wider">
                        Recomendado
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-white">Pro</span>
                          {regPlanType === 'pro' && <CheckCircle className="w-3.5 h-3.5 text-pink-400" />}
                        </div>
                        <p className="text-[9px] text-slate-500 leading-normal">Suporte multi-usuários, finanças, relatórios e controle total.</p>
                      </div>
                      <div className="pt-2 flex items-baseline gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400">R$ </span>
                        <span className="text-lg font-black text-white">49,99</span>
                        <span className="text-[8px] text-slate-500">/mês</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-850 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-3"
                >
                  {loading ? 'Cadastrando...' : 'Criar Conta e Pagar'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center text-xs">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('login'); setError(null); setSuccess(null); }}
                  className="text-slate-400 hover:text-slate-300 font-medium cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Já tem uma conta? Fazer Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAYWALL PLAN ACTIVATION CHANNEL */}
        {authMode === 'paywall' && (
          <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-500 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden animate-fadeIn">
            <div className="p-5 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-pink-400 animate-pulse" />
                <div>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider bg-linear-to-r from-white to-slate-300 bg-clip-text text-transparent">Ativação de Licença</h2>
                  <p className="text-[10px] text-slate-400">Aguardando transferência via PIX</p>
                </div>
              </div>
              <button 
                onClick={() => { setAuthMode('login'); setRegisteredUser(null); setError(null); setSuccess(null); }}
                className="text-[10px] text-slate-400 hover:text-white font-black border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-all"
              >
                Sair
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* ALERT BOXES */}
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-400 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* PLAN DETAIL CARD */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                    <span className="text-xs font-black text-transparent bg-linear-to-r from-pink-400 to-indigo-300 bg-clip-text uppercase tracking-wide">
                      Plano {registeredUser?.planType === 'pro' ? 'Pro' : 'Básico'}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-400">Usuário: {registeredUser?.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Valor do plano</p>
                  <p className="text-lg font-black text-transparent bg-linear-to-r from-cyan-400 to-pink-400 bg-clip-text">
                    R$ {registeredUser?.planType === 'pro' ? '49,99' : '19,99'}
                  </p>
                </div>
              </div>

              {/* PIX QR CODE REPRESENTATION */}
              <div className="flex flex-col items-center justify-center py-4 bg-slate-900/30 border border-slate-900/40 rounded-2xl space-y-3">
                <div className="bg-white p-3 rounded-2xl shadow-md flex items-center justify-center relative">
                  <div className="w-36 h-36 border-2 border-slate-200 bg-slate-100 flex flex-wrap p-1 relative overflow-hidden">
                    {/* Visual simulation of a high tech QR code */}
                    <div className="absolute inset-0 flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-4 border-slate-950 rounded-xs" />
                        <div className="w-8 h-8 border-4 border-slate-950 rounded-xs" />
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 border-4 border-slate-950 rounded-xs" />
                        <div className="w-8 h-8 bg-slate-950 rounded-xs flex items-center justify-center text-[7px] font-black text-white">PIX</div>
                      </div>
                    </div>
                    {/* Pattern Dots */}
                    <div className="w-full h-full opacity-30 grid grid-cols-12 gap-1 pointer-events-none">
                      {Array.from({ length: 144 }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1 h-1 rounded-full ${
                            (idx * 7) % 5 === 0 || (idx * 3) % 4 === 0 ? 'bg-slate-950' : 'bg-transparent'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Escaneie o QR Code para pagar
                </span>
              </div>

              {/* PIX COPY AND PASTE */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código PIX Copia e Cola</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPixCode()}
                    className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-[9px] text-slate-300 font-mono select-all outline-none"
                  />
                  <button
                    onClick={copyPixCode}
                    className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[9px] uppercase">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PIX TRANSACTION ID INPUT (MANDATORY REQUIREMENT) */}
              <div className="space-y-2 bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl">
                <label className="text-[10px] font-black text-transparent bg-linear-to-r from-cyan-400 to-indigo-300 bg-clip-text uppercase tracking-wider block">
                  ID de Transação do PIX (E2E ID)
                </label>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  Insira o ID/E2E ID da transação presente no seu comprovante (ex: inicia com <strong className="text-white">E</strong> seguido por letras e números, totalizando 32 caracteres).
                </p>
                <input
                  type="text"
                  value={pixTxId}
                  onChange={(e) => setPixTxId(e.target.value)}
                  placeholder="Ex: E00000000202607161234abcd5678efgh"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-slate-600 outline-none uppercase tracking-wide"
                  required
                />
              </div>

              <div className="pt-1 text-center text-[9px] text-slate-500 leading-relaxed">
                🔔 O sistema valida a transação em tempo real na chave real de telefone <strong className="text-slate-400">(71) 98259-5064</strong>. Cole o ID do comprovante real para liberar.
              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={loading || !pixTxId.trim()}
                className="w-full bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-850 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  'Verificando transação...'
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Liberar Meu Acesso (Confirmar PIX)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM SUBTITLE */}
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-mono">Epic Touch &copy; 2026 - Conectividade & Gestão em reparo de smartphones.</p>
        </div>

      </div>
    </div>
  );
}
