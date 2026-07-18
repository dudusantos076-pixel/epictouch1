import React, { useState, useEffect } from 'react';
import { 
  Settings, RefreshCw, MessageSquare, ShieldAlert, Check, X, 
  ShieldCheck, Store, Save, Shield, Database, Lock, Key, 
  Tag, Download, Upload, Percent, DollarSign, Trash, Copy, AlertCircle
} from 'lucide-react';

interface ConfigsViewProps {
  onResetDb: () => Promise<any>;
  currentUser: any;
  onUserChange: (user: any) => void;
}

export default function ConfigsView({ onResetDb, currentUser, onUserChange }: ConfigsViewProps) {
  const [waTemplate, setWaTemplate] = useState('Olá {cliente}! O status do seu aparelho {aparelho} mudou para: *{status}*. Rastreie em tempo real no link: {link}');
  const [smsTemplate, setSmsTemplate] = useState('Epic Touch: Seu aparelho {aparelho} mudou de status para: {status}. Acesse o link para acompanhar: {link}');
  
  // Store details local state
  const [storeName, setStoreName] = useState(currentUser?.storeName || 'Epic Touch');
  const [storeCnpjCpf, setStoreCnpjCpf] = useState(currentUser?.storeCnpjCpf || '00.000.000/0001-00');
  const [storePixKey, setStorePixKey] = useState(currentUser?.storePixKey || 'dudusantos076@gmail.com');
  
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeSaveSuccess, setStoreSaveSuccess] = useState(false);

  // Supabase state
  const [supabaseStatus, setSupabaseStatus] = useState({
    configured: false,
    status: 'disconnected',
    message: '',
    tablesCreated: false
  });
  const [checkingSupabase, setCheckingSupabase] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [showSqlScript, setShowSqlScript] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  
  // Security configs states
  const [configs, setConfigs] = useState({
    twoFactorEnabled: false,
    encryptionEnabled: true,
    autoBackup: true,
    lastBackupDate: ''
  });
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [savingConfigs, setSavingConfigs] = useState(false);

  // Supabase Status check and sync handlers
  const checkSupabaseStatus = async () => {
    try {
      setCheckingSupabase(true);
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus({
          configured: !!data.configured,
          status: data.status || 'disconnected',
          message: data.message || '',
          tablesCreated: !!data.tablesCreated
        });
      }
    } catch (err) {
      console.error('Erro ao verificar status do Supabase:', err);
    } finally {
      setCheckingSupabase(false);
    }
  };

  const handleSupabaseSyncNow = async () => {
    try {
      setSyncingSupabase(true);
      setSupabaseSyncMessage(null);
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupabaseSyncMessage('Sincronização manual concluída com sucesso!');
        setSupabaseStatus(prev => ({ ...prev, status: 'connected', tablesCreated: true }));
        if (data.lastBackupDate) {
          setConfigs(prev => ({ ...prev, lastBackupDate: data.lastBackupDate }));
        }
      } else {
        setSupabaseSyncMessage(data.error || 'Erro ao sincronizar dados com o Supabase.');
      }
    } catch (err) {
      setSupabaseSyncMessage('Erro de rede ao sincronizar com o servidor.');
    } finally {
      setSyncingSupabase(false);
    }
  };

  const copySqlScript = () => {
    const scriptText = `CREATE TABLE IF NOT EXISTS epic_crm_backup (
  collection_name TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE epic_crm_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura e escrita para todos" ON epic_crm_backup FOR ALL USING (true) WITH CHECK (true);`;
    
    navigator.clipboard.writeText(scriptText);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  // Coupon States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Sync state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setStoreName(currentUser.storeName || 'Epic Touch');
      setStoreCnpjCpf(currentUser.storeCnpjCpf || '00.000.000/0001-00');
      setStorePixKey(currentUser.storePixKey || 'dudusantos076@gmail.com');
    }
  }, [currentUser]);

  // Fetch configs and coupons
  const fetchConfigsAndCoupons = async () => {
    try {
      setLoadingConfigs(true);
      setLoadingCoupons(true);
      const sName = currentUser?.storeName || 'Epic Touch';
      const res = await fetch(`/api/db?storeName=${encodeURIComponent(sName)}`);
      if (res.ok) {
        const data = await res.json();
        
        // set configs
        if (data.configs) {
          setConfigs({
            twoFactorEnabled: !!data.configs.twoFactorEnabled,
            encryptionEnabled: !!data.configs.encryptionEnabled,
            autoBackup: !!data.configs.autoBackup,
            lastBackupDate: data.configs.lastBackupDate || ''
          });
        }
        
        // set coupons
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados da loja:', err);
    } finally {
      setLoadingConfigs(false);
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchConfigsAndCoupons();
    checkSupabaseStatus();
  }, [currentUser?.storeName]);

  const handleToggleSetting = async (field: string, val: boolean) => {
    const updated = {
      ...configs,
      [field]: val
    };
    setConfigs(updated);
    try {
      setSavingConfigs(true);
      const res = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.configs) {
          setConfigs({
            twoFactorEnabled: !!data.configs.twoFactorEnabled,
            encryptionEnabled: !!data.configs.encryptionEnabled,
            autoBackup: !!data.configs.autoBackup,
            lastBackupDate: data.configs.lastBackupDate || ''
          });
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
    } finally {
      setSavingConfigs(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || discountValue <= 0) return;
    try {
      setSavingCoupon(true);
      const storeNameVal = currentUser?.storeName || 'Epic Touch';
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: couponCode.toUpperCase().trim(),
          discountType,
          discountValue,
          storeName: storeNameVal
        })
      });
      if (res.ok) {
        setCouponCode('');
        setDiscountValue(10);
        // refresh
        const sName = currentUser?.storeName || 'Epic Touch';
        const resDb = await fetch(`/api/db?storeName=${encodeURIComponent(sName)}`);
        if (resDb.ok) {
          const data = await resDb.json();
          setCoupons(data.coupons || []);
        }
      }
    } catch (err) {
      console.error('Erro ao salvar cupom:', err);
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (!text) return;
        const backupData = JSON.parse(text as string);
        
        setIsResetting(true);
        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData })
        });
        const data = await res.json();
        if (data.success) {
          setShowSuccessToast(true);
          fetchConfigsAndCoupons();
          alert('Backup importado com sucesso! Redirecionando e atualizando dados...');
          window.location.reload();
        } else {
          alert(data.error || 'Erro ao restaurar backup.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON de backup.');
      } finally {
        setIsResetting(false);
      }
    };
    reader.readAsText(file);
  };

  // Custom safe states for the Iframe environment instead of window.confirm / alert
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setErrorMessage(null);
      await onResetDb();
      setShowConfirmModal(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 4000);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro desconhecido ao resetar o banco de dados.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingStore(true);
      const res = await fetch('/api/users/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          storeName,
          storeCnpjCpf,
          storePixKey
        })
      });
      const data = await res.json();
      if (data.success) {
        onUserChange(data.user);
        setStoreSaveSuccess(true);
        setTimeout(() => {
          setStoreSaveSuccess(false);
        }, 3000);
      } else {
        setErrorMessage(data.error || 'Erro ao salvar dados da loja.');
      }
    } catch (err: any) {
      setErrorMessage('Erro de conexão ao salvar dados da loja.');
    } finally {
      setIsSavingStore(false);
    }
  };

  return (
    <div className="space-y-6" id="configs-view-container">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Configurações Administrativas do Sistema
          </h1>
          <p className="text-xs text-slate-500 font-sans">Ajuste chaves de liquidação, ative segurança 2FA, configure backups diários e crie cupons de fidelidade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* SECURE SYSTEM PREFERENCES & 2FA & BACKUP */}
          <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-indigo-600" />
              Segurança, 2FA & Criptografia
            </h2>

            <div className="space-y-4">
              
              {/* TWO FACTOR AUTH */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">Login com Dois Fatores (2FA)</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Exige token SMS/Email no login para reforço de segurança (Senha extra: 123456).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={configs.twoFactorEnabled}
                    onChange={(e) => handleToggleSetting('twoFactorEnabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* DATA ENCRYPTION */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">Criptografia dos Dados Armazenados</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Codificação avançada ponta-a-ponta (AES-256) na base de faturamento e notas.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={configs.encryptionEnabled}
                    onChange={(e) => handleToggleSetting('encryptionEnabled', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* AUTOMATIC BACKUP DAILY */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">Backup Automático Diário (Nuvem)</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Salva snapshots em tempo real no banco de dados isolado da Epic Touch.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={configs.autoBackup}
                    onChange={(e) => handleToggleSetting('autoBackup', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

            </div>

            {/* DURABLE BACKUP ACTIONS */}
            <div className="border-t border-slate-100 pt-3.5 space-y-3">
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Serviços de Dump & Restauração</h3>
              
              <div className="grid grid-cols-2 gap-3">
                
                {/* BACKUP EXPORT */}
                <a 
                  href="/api/backup/download" 
                  download="epic_crm_backup.json"
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-xs text-center"
                >
                  <Download className="w-4 h-4" />
                  Gerar & Baixar Backup
                </a>

                {/* BACKUP RESTORE */}
                <label className="flex items-center justify-center gap-1.5 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-xs text-center">
                  <Upload className="w-4 h-4" />
                  Importar Backup (.json)
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleFileRestore} 
                    className="hidden" 
                  />
                </label>

              </div>
              {configs.lastBackupDate && (
                <p className="text-[9px] text-slate-400 text-center">
                  Último backup sincronizado na nuvem: <strong>{new Date(configs.lastBackupDate).toLocaleString()}</strong>
                </p>
              )}
            </div>
          </div>

          {/* SUPABASE CONNECTION & SYNC */}
          <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-sky-600" />
                Conexão Supabase (Banco de Dados Nuvem)
              </span>
              <button 
                type="button"
                onClick={checkSupabaseStatus}
                disabled={checkingSupabase}
                className="text-[10px] text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 bg-sky-50 px-2 py-1 rounded cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${checkingSupabase ? 'animate-spin' : ''}`} />
                Atualizar Status
              </button>
            </h2>

            {/* STATUS SHIELD */}
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-lg border flex flex-col gap-2 bg-slate-50 border-slate-200">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {supabaseStatus.status === 'connected' ? (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    ) : supabaseStatus.status === 'table_missing' ? (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                    ) : supabaseStatus.status === 'error' ? (
                      <span className="flex h-3 w-3 bg-red-500 rounded-full"></span>
                    ) : (
                      <span className="flex h-3 w-3 bg-slate-400 rounded-full"></span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      {supabaseStatus.status === 'connected' && 'Supabase Conectado & Sincronizado'}
                      {supabaseStatus.status === 'table_missing' && 'Supabase Configurado, Sem Tabela'}
                      {supabaseStatus.status === 'error' && 'Erro na Conexão do Supabase'}
                      {supabaseStatus.status === 'disconnected' && 'Supabase Desconectado'}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      {supabaseStatus.message || 'O sistema está rodando localmente no arquivo database.json. Para conectar com o Supabase e salvar seus dados na nuvem com 100% de segurança, configure as credenciais.'}
                    </p>
                  </div>
                </div>

                {supabaseStatus.configured && (
                  <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">Armazenamento seguro em tempo real</span>
                    <button
                      type="button"
                      disabled={syncingSupabase || supabaseStatus.status === 'error'}
                      onClick={handleSupabaseSyncNow}
                      className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-[10px] px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {syncingSupabase ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <Database className="w-3 h-3" />
                          Forçar Sincronização Agora
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {supabaseSyncMessage && (
                <div className={`p-2.5 border rounded-lg text-[10px] font-semibold flex items-center gap-2 ${supabaseSyncMessage.includes('sucesso') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{supabaseSyncMessage}</span>
                </div>
              )}

              {/* INSTRUCTIONS */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Como configurar o Supabase?</h3>
                <ul className="list-decimal list-inside text-[10px] text-slate-500 space-y-1.5 pl-0.5 leading-relaxed">
                  <li>
                    Acesse seu painel do <strong className="text-slate-700">Supabase</strong> e crie um novo projeto.
                  </li>
                  <li>
                    Vá em <strong className="text-slate-700">Project Settings &gt; API</strong> e copie a <strong className="text-slate-700">Project URL</strong> e a <strong className="text-slate-700">service_role key</strong> (recomendada para pular regras RLS).
                  </li>
                  <li>
                    Guarde-as no painel <strong className="text-slate-700">Secrets</strong> da barra lateral esquerda do Google AI Studio com os nomes <code className="bg-slate-100 p-0.5 rounded font-mono text-[9px] text-sky-700">SUPABASE_URL</code> e <code className="bg-slate-100 p-0.5 rounded font-mono text-[9px] text-sky-700">SUPABASE_KEY</code>.
                  </li>
                  <li>
                    Clique no botão abaixo para ver o script SQL e execute-o no <strong className="text-slate-700">SQL Editor</strong> do Supabase para criar a tabela necessária.
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSqlScript(!showSqlScript)}
                    className="w-full text-center text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    {showSqlScript ? 'Ocultar Script SQL de Inicialização' : 'Visualizar Script SQL de Inicialização'}
                  </button>

                  {showSqlScript && (
                    <div className="mt-2.5 bg-slate-900 rounded-lg p-3 text-[9px] font-mono text-slate-200 relative group border border-slate-800">
                      <button
                        type="button"
                        onClick={copySqlScript}
                        className="absolute right-2 top-2 bg-slate-800 hover:bg-slate-700 text-white rounded p-1 cursor-pointer transition-all border border-slate-700"
                        title="Copiar Script SQL"
                      >
                        {sqlCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <pre className="overflow-x-auto whitespace-pre leading-relaxed pr-8">
{`CREATE TABLE IF NOT EXISTS epic_crm_backup (
  collection_name TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilite o acesso RLS ou use a chave Service Role para acesso direto
ALTER TABLE epic_crm_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura e escrita para todos" ON epic_crm_backup FOR ALL USING (true) WITH CHECK (true);`}
                      </pre>
                      {sqlCopied && (
                        <p className="text-[8px] text-emerald-400 mt-1.5 font-sans font-bold">✓ Script SQL copiado para a área de transferência!</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* TEMPLATES NOTIFICATIONS */}
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Notificações de WhatsApp Automatizadas
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Template WhatsApp Notificação</label>
                <textarea
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-800 outline-none transition-all"
                />
                <span className="text-[9px] text-slate-400 block">Variáveis utilizáveis: {'{cliente}, {aparelho}, {status}, {link}'}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Template SMS Notificação</label>
                <textarea
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-800 outline-none transition-all"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* STORE CONFIG */}
          <form onSubmit={handleSaveStore} className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Store className="w-4 h-4 text-blue-600" />
              Dados da Loja ({currentUser?.name})
            </h2>
            
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nome da Loja</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-800 outline-none transition-all"
                  placeholder="Ex: Epic Touch"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">CNPJ ou CPF da Loja</label>
                <input
                  type="text"
                  required
                  value={storeCnpjCpf}
                  onChange={(e) => setStoreCnpjCpf(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-800 outline-none transition-all"
                  placeholder="Ex: 00.000.000/0001-00 ou CPF"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Chave PIX de Recebimento</label>
                <input
                  type="text"
                  required
                  value={storePixKey}
                  onChange={(e) => setStorePixKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-800 outline-none font-mono transition-all"
                  placeholder="Ex: dudusantos076@gmail.com"
                />
                <span className="text-[9px] text-slate-400 block">Esta chave é utilizada na geração automática do Copy-Paste e QR Code de faturamento.</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {storeSaveSuccess ? (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Salvo com sucesso!
                </span>
              ) : (
                <span />
              )}
              
              <button
                type="submit"
                disabled={isSavingStore}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {isSavingStore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Salvar Dados da Loja
                  </>
                )}
              </button>
            </div>
          </form>

          {/* COUPONS MANAGEMENT INTERFACE */}
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Tag className="w-4 h-4 text-amber-500" />
              Gestão de Cupons de Desconto
            </h2>

            {/* CREATE COUPON FORM */}
            <form onSubmit={handleAddCoupon} className="p-3 bg-slate-55 rounded-lg border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Código</label>
                <input 
                  type="text"
                  placeholder="EX: REC15"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none uppercase font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Desconto</label>
                <div className="flex rounded border border-slate-200 bg-white overflow-hidden">
                  <input 
                    type="number"
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs outline-none text-right font-semibold"
                    required
                  />
                  <select 
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="bg-slate-100 border-l border-slate-200 text-[10px] px-1.5 outline-none font-bold"
                  >
                    <option value="percent">%</option>
                    <option value="fixed">R$</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingCoupon || !couponCode.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1.5 rounded cursor-pointer transition-colors disabled:opacity-50"
              >
                {savingCoupon ? 'Salvando...' : 'Adicionar'}
              </button>
            </form>

            {/* COUPONS LIST */}
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {coupons.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                      {c.couponCode}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Desconto de {c.discountType === 'percent' ? `${c.discountValue}%` : `R$ ${c.discountValue.toFixed(2)}`}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">Restrito: {c.storeName}</span>
                </div>
              ))}

              {coupons.length === 0 && (
                <p className="text-center py-4 text-slate-400 text-[10px] italic">Nenhum cupom cadastrado ainda.</p>
              )}
            </div>
          </div>

          {/* HARD RESET SYSTEM DB */}
          <div className="bg-white border border-slate-200 border-rose-100 bg-rose-50/10 shadow-sm p-5 rounded-xl space-y-3">
            <h2 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-rose-100/50 pb-3">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Zona de Segurança
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja restaurar as configurações padrão de fábrica e redefinir o banco de dados? Todas as alterações serão perdidas. Os valores originais do dashboard (R$ 28.540,00 de faturamento, 35 ordens abertas, etc.) serão restaurados.
            </p>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors w-full shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Resetar Banco de Dados
            </button>
          </div>

        </div>
      </div>

      {/* CUSTOM SAFE DIALOG OVERLAY (Replaces blocked window.confirm) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-full shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Restauração de Fábrica?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tem certeza absoluta que deseja apagar todos os lançamentos manuais, novos clientes e laudos criados nesta sessão? Isso irá redefinir a base de dados de demonstração com as 35 ordens padrão e faturamento original.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-150 rounded text-[11px] font-mono">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={isResetting}
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isResetting}
                onClick={handleReset}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sim, Redefinir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS TOAST NOTIFICATION (Replaces blocked window.alert) */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white shadow-lg border border-emerald-500 rounded-xl px-4 py-3 flex items-center gap-2.5 animate-slide-up">
          <ShieldCheck className="w-5 h-5 text-emerald-100 shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold">Base de Dados Sincronizada!</h4>
            <p className="text-[10px] text-emerald-100">As configurações e dados foram redefinidos com sucesso.</p>
          </div>
          <button 
            onClick={() => setShowSuccessToast(false)}
            className="text-emerald-200 hover:text-white ml-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
