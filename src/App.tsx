import React, { useState, useEffect } from 'react';
import { 
  Client, Order, Part, Laudo, FinancialTransaction, Message, User, UserRole, OSStatus 
} from './types';
import RoleSelector from './components/RoleSelector';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import OSView from './components/OSView';
import EquipamentosView from './components/EquipamentosView';
import TecnicosView from './components/TecnicosView';
import EstoqueView from './components/EstoqueView';
import FinanceiroView from './components/FinanceiroView';
import AgendaView from './components/AgendaView';
import GarantiasView from './components/GarantiasView';
import LaudosView from './components/LaudosView';
import RelatoriosView from './components/RelatoriosView';
import ConfigsView from './components/ConfigsView';
import TechPanel from './components/TechPanel';
import ClientPanel from './components/ClientPanel';
import LoginView from './components/LoginView';
import FuncionariosView from './components/FuncionariosView';

import { 
  LayoutDashboard, PlusCircle, Users, Smartphone, Wrench, Package, 
  DollarSign, Calendar, Award, FileText, TrendingUp, Settings, 
  Menu, X, ShieldAlert, LogOut 
} from 'lucide-react';

export default function App() {
  // DB States
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [finance, setFinance] = useState<FinancialTransaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Simulation Session States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('epic_crm_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  const [selectedClientOS, setSelectedClientOS] = useState('OS-1020');
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Pre-load OS selection for form editing
  const [targetOSForEdit, setTargetOSForEdit] = useState<Order | null>(null);

  // Load complete Database from REST backend API with SaaS store isolation
  const fetchDb = async () => {
    try {
      const queryParam = currentUser?.storeName ? `?storeName=${encodeURIComponent(currentUser.storeName)}` : '';
      const res = await fetch(`/api/db${queryParam}`);
      const data = await res.json();
      setClients(data.clients || []);
      setOrders(data.orders || []);
      setParts(data.parts || []);
      setLaudos(data.laudos || []);
      setFinance(data.financial || []);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching database:', err);
    }
  };

  const fetchMessages = async (orderIdNum: number) => {
    try {
      const res = await fetch(`/api/orders/${orderIdNum}/messages`);
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchDb();
  }, [currentUser?.storeName]);

  // Poll messages if client role is active
  useEffect(() => {
    if (currentUser?.role === 'client' && currentUser?.targetClientOSNumber) {
      const numericId = parseInt(currentUser.targetClientOSNumber.replace('OS-', ''));
      if (!isNaN(numericId)) {
        fetchMessages(numericId);
        // Interval poll for simulated chat updates
        const intv = setInterval(() => {
          fetchMessages(numericId);
        }, 3000);
        return () => clearInterval(intv);
      }
    }
  }, [currentUser?.role, currentUser?.targetClientOSNumber, selectedClientOS]);

  // Listener to refresh messages instantly on simulation callback
  useEffect(() => {
    const handleReload = () => {
      if (currentUser?.targetClientOSNumber) {
        const numericId = parseInt(currentUser.targetClientOSNumber.replace('OS-', ''));
        if (!isNaN(numericId)) {
          fetchMessages(numericId);
          fetchDb(); // refresh orders to show pay status change
        }
      }
    };
    window.addEventListener('reload-messages', handleReload);
    return () => window.removeEventListener('reload-messages', handleReload);
  }, [currentUser?.targetClientOSNumber]);

  // Sync active view based on role
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'client') {
      setActiveMenu('Área do Cliente');
    } else if (currentUser.role === 'tech') {
      setActiveMenu('Bancada Técnico');
    } else {
      if (activeMenu === 'Área do Cliente' || activeMenu === 'Bancada Técnico') {
        setActiveMenu('Dashboard');
      }
    }
  }, [currentUser?.role]);

  // --- API OPERATIONS ---
  
  const handleAddClient = async (c: Omit<Client, 'id' | 'createdAt'>) => {
    const dataToSend = { ...c, storeName: currentUser?.storeName };
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });
    const newCli = await res.json();
    setClients([...clients, newCli]);
    return newCli;
  };

  const handleUpdateClient = async (id: string, c: Partial<Client>) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    const updated = await res.json();
    setClients(clients.map(item => item.id === id ? updated : item));
    return updated;
  };

  const handleDeleteClient = async (id: string) => {
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    setClients(clients.filter(item => item.id !== id));
  };

  const handleAddOrder = async (o: Omit<Order, 'id' | 'number'>) => {
    const dataToSend = { ...o, storeName: currentUser?.storeName };
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });
    const newOrd = await res.json();
    setOrders([...orders, newOrd]);
    return newOrd;
  };

  const handleUpdateOrder = async (id: number, o: Partial<Order>) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o)
    });
    const updated = await res.json();
    setOrders(orders.map(item => item.id === id ? updated : item));
    return updated;
  };

  const handleAddPart = async (p: Omit<Part, 'id'>) => {
    const dataToSend = { ...p, storeName: currentUser?.storeName };
    const res = await fetch('/api/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });
    const newPart = await res.json();
    setParts([...parts, newPart]);
    return newPart;
  };

  const handleUpdatePart = async (id: string, p: Partial<Part>) => {
    const res = await fetch(`/api/parts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    const updated = await res.json();
    setParts(parts.map(item => item.id === id ? updated : item));
    return updated;
  };

  const handleDeletePart = async (id: string) => {
    await fetch(`/api/parts/${id}`, { method: 'DELETE' });
    setParts(parts.filter(item => item.id !== id));
  };

  const handleAddLaudo = async (l: Omit<Laudo, 'id' | 'date'>) => {
    const dataToSend = { ...l, storeName: currentUser?.storeName };
    const res = await fetch('/api/laudos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });
    const newLaudo = await res.json();
    setLaudos([...laudos, newLaudo]);
    fetchDb(); // reload orders to associate correctly
    return newLaudo;
  };

  const handleUpdateLaudo = async (id: string, updatedFields: Partial<Laudo>) => {
    const res = await fetch(`/api/laudos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    const updated = await res.json();
    setLaudos(laudos.map(item => item.id === id ? updated : item));
    return updated;
  };

  const handleAddUser = async (u: Omit<User, 'id'>) => {
    const dataToSend = { ...u, storeName: currentUser?.storeName };
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Erro ao cadastrar funcionário.');
    }
    const newUserObj = await res.json();
    setUsers([...users, newUserObj]);
    return newUserObj;
  };

  const handleUpdateUser = async (id: string, u: Partial<User>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Erro ao atualizar funcionário.');
    }
    const updated = await res.json();
    setUsers(users.map(item => item.id === id ? updated : item));
    
    // If the edited user is the current logged-in user, update local session
    if (currentUser && currentUser.id === id) {
      const mergedUser = { ...currentUser, ...updated };
      setCurrentUser(mergedUser);
      localStorage.setItem('epic_crm_user', JSON.stringify(mergedUser));
    }
    return updated;
  };

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Erro ao excluir funcionário.');
    }
    setUsers(users.filter(item => item.id !== id));
  };

  const handleAddTransaction = async (tx: Omit<FinancialTransaction, 'id' | 'date'>) => {
    const dataToSend = { ...tx, storeName: currentUser?.storeName };
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });
    const newTx = await res.json();
    setFinance([...finance, newTx]);
    return newTx;
  };

  const handleSendMessageFromClient = async (text: string) => {
    const numericId = parseInt(selectedClientOS.replace('OS-', ''));
    if (isNaN(numericId)) return;

    const res = await fetch(`/api/orders/${numericId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: 'client',
        senderName: 'Cliente ' + (currentUser?.name || 'Anônimo'),
        text
      })
    });
    const newMsg = await res.json();
    setMessages([...messages, newMsg]);
    return newMsg;
  };

  const handleTriggerPixCompensation = async () => {
    const numericId = parseInt(selectedClientOS.replace('OS-', ''));
    if (isNaN(numericId)) return;

    const res = await fetch(`/api/orders/${numericId}/simulate-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    fetchDb(); // reload completely to reflect financial and OS updates!
    return data;
  };

  const handleResetDb = async () => {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) {
      throw new Error('Falha no servidor ao redefinir o banco de dados.');
    }
    const data = await res.json();
    if (data && data.db) {
      setClients(data.db.clients || []);
      setOrders(data.db.orders || []);
      setParts(data.db.parts || []);
      setLaudos(data.db.laudos || []);
      setFinance(data.db.financial || []);
      setUsers(data.db.users || []);
    } else {
      await fetchDb();
    }
  };

  // --- RENDERING ROUTER ---

  const getMenuOptionStyle = (menuName: string) => {
    const isSelected = activeMenu === menuName;
    return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
      isSelected 
        ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500/10' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;
  };

  const getActiveView = () => {
    switch (activeMenu) {
      case 'Dashboard':
        return (
          <DashboardView 
            orders={orders} 
            parts={parts} 
            finance={finance} 
            onNavigate={(view) => setActiveMenu(view)}
            onQuickNewOS={() => {
              setTargetOSForEdit(null);
              setActiveMenu('Nova Ordem de Serviço');
            }}
          />
        );
      case 'Nova Ordem de Serviço':
        return (
          <OSView 
            orders={orders}
            clients={clients}
            parts={parts}
            currentUser={currentUser}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onNavigate={(view) => setActiveMenu(view)}
            initialSelectedOrder={targetOSForEdit}
          />
        );
      case 'Clientes':
        return (
          <ClientsView 
            clients={clients}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
          />
        );
      case 'Equipamentos':
        return <EquipamentosView orders={orders} />;
      case 'Técnicos':
        return <TecnicosView orders={orders} />;
      case 'Funcionários':
        return (
          <FuncionariosView
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'Estoque':
        return (
          <EstoqueView 
            parts={parts}
            onAddPart={handleAddPart}
            onUpdatePart={handleUpdatePart}
            onDeletePart={handleDeletePart}
          />
        );
      case 'Financeiro':
        return (
          <FinanceiroView 
            finance={finance}
            onAddTransaction={handleAddTransaction}
          />
        );
      case 'Agenda':
        return <AgendaView orders={orders} />;
      case 'Garantias':
        return <GarantiasView orders={orders} />;
      case 'Laudos Técnicos':
        return <LaudosView laudos={laudos} onUpdateLaudo={handleUpdateLaudo} />;
      case 'Relatórios':
        return <RelatoriosView orders={orders} parts={parts} finance={finance} />;
      case 'Configurações':
        return (
          <ConfigsView 
            onResetDb={handleResetDb} 
            currentUser={currentUser}
            onUserChange={(user) => {
              setCurrentUser(user);
              localStorage.setItem('epic_crm_user', JSON.stringify(user));
            }}
          />
        );
      case 'Bancada Técnico':
        return (
          <TechPanel 
            orders={orders}
            parts={parts}
            laudos={laudos}
            currentUser={currentUser}
            onUpdateOrder={handleUpdateOrder}
            onAddLaudo={handleAddLaudo}
          />
        );
      case 'Área do Cliente':
        const clientOS = orders.find(o => o.number === selectedClientOS) || null;
        return (
          <ClientPanel 
            order={clientOS}
            messages={messages}
            laudos={laudos}
            onSendMessage={handleSendMessageFromClient}
            onTriggerPix={handleTriggerPixCompensation}
          />
        );
      default:
        return <div className="text-slate-500">View em construção.</div>;
    }
  };

  // Role Access Filtering for Sidebar Menu
  const isAccessible = (menuName: string) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'admin' || role === 'manager') return true;
    
    if (role === 'attendant') {
      return ['Dashboard', 'Nova Ordem de Serviço', 'Clientes', 'Equipamentos', 'Agenda'].includes(menuName);
    }
    
    if (role === 'tech') {
      return ['Bancada Técnico', 'Equipamentos', 'Laudos Técnicos', 'Estoque'].includes(menuName);
    }
    
    if (role === 'client') {
      return ['Área do Cliente'].includes(menuName);
    }

    return false;
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => {
      setCurrentUser(u);
      localStorage.setItem('epic_crm_user', JSON.stringify(u));
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-blue-500/10 selection:text-blue-700">
      {/* 1. TOP ROLE SELECTOR (Allows instant reviewer testing) */}
      <RoleSelector 
        currentUser={currentUser} 
        onUserChange={(user) => {
          setCurrentUser(user);
          localStorage.setItem('epic_crm_user', JSON.stringify(user));
        }} 
        users={users}
        allOrders={orders}
        selectedClientOS={selectedClientOS}
        onClientOSChange={setSelectedClientOS}
      />

      {/* 2. CORE LAYOUT SPLIT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-50px)] overflow-y-auto">
            <div className="space-y-6">
              {/* BRAND HEADER */}
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm tracking-tight text-white uppercase font-mono">{currentUser?.storeName || 'Epic Touch'}</h2>
                  <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">Assistência Técnica</span>
                </div>
              </div>

              {/* NAVIGATION MENU */}
              <nav className="space-y-1">
                {[
                  { name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                  { name: 'Nova Ordem de Serviço', icon: <PlusCircle className="w-4 h-4" /> },
                  { name: 'Clientes', icon: <Users className="w-4 h-4" /> },
                  { name: 'Equipamentos', icon: <Smartphone className="w-4 h-4" /> },
                  { name: 'Técnicos', icon: <Wrench className="w-4 h-4" /> },
                  { name: 'Funcionários', icon: <Users className="w-4 h-4" /> },
                  { name: 'Estoque', icon: <Package className="w-4 h-4" /> },
                  { name: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
                  { name: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
                  { name: 'Garantias', icon: <Award className="w-4 h-4" /> },
                  { name: 'Laudos Técnicos', icon: <FileText className="w-4 h-4" /> },
                  { name: 'Relatórios', icon: <TrendingUp className="w-4 h-4" /> },
                  { name: 'Configurações', icon: <Settings className="w-4 h-4" /> }
                ].map((menu) => {
                  if (!isAccessible(menu.name)) return null;
                  return (
                    <button
                      key={menu.name}
                      onClick={() => setActiveMenu(menu.name)}
                      className={getMenuOptionStyle(menu.name)}
                    >
                      {menu.icon}
                      {menu.name}
                    </button>
                  );
                })}

                {/* Simulated Special views for Tech / Client roles */}
                {currentUser.role === 'tech' && (
                  <button onClick={() => setActiveMenu('Bancada Técnico')} className={getMenuOptionStyle('Bancada Técnico')}>
                    <Wrench className="w-4 h-4 text-amber-400" />
                    Bancada do Técnico
                  </button>
                )}

                {currentUser.role === 'client' && (
                  <button onClick={() => setActiveMenu('Área do Cliente')} className={getMenuOptionStyle('Área do Cliente')}>
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Portal do Cliente
                  </button>
                )}

                {/* Sair / Logout */}
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('epic_crm_user');
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 w-full text-left mt-6"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Sair do Sistema
                </button>
              </nav>
            </div>

            {/* LOWER STATS / FOOTER */}
            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono space-y-1 px-2">
              <p>{currentUser?.storeName || 'Epic Touch'} &copy; 2026</p>
              <p>Bancada v4.12.0</p>
            </div>
          </aside>
        )}

        {/* MAIN WORKSPACE RENDER */}
        <main className="flex-1 bg-slate-50 p-6 overflow-y-auto h-[calc(100vh-50px)] text-slate-800">
          {getActiveView()}
        </main>

      </div>
    </div>
  );
}
