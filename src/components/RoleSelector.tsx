import React from 'react';
import { User, UserRole } from '../types';
import { Shield, Settings, User as UserIcon, Wrench, FileText, Smartphone, DollarSign, Users } from 'lucide-react';

interface RoleSelectorProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  users: User[];
  allOrders: any[];
  selectedClientOS: string;
  onClientOSChange: (osNumber: string) => void;
}

export default function RoleSelector({
  currentUser,
  onUserChange,
  users,
  allOrders,
  selectedClientOS,
  onClientOSChange
}: RoleSelectorProps) {
  const handleRoleClick = (role: UserRole) => {
    if (role === 'client') {
      // Find an order to simulate tracking, or default
      const defaultOS = allOrders.length > 0 ? allOrders[0].number : 'OS-1020';
      onUserChange({
        id: 'user-client',
        name: 'Cliente Simulado',
        role: 'client',
        username: 'cliente',
        targetClientOSNumber: selectedClientOS || defaultOS
      });
    } else {
      // If current user already has this role and is a real user, preserve it
      if (currentUser.role === role && !currentUser.id.startsWith('user-simulated-')) {
        return;
      }
      const foundUser = users.find(u => u.role === role);
      if (foundUser) {
        onUserChange(foundUser);
      } else {
        onUserChange({
          id: `user-${role}`,
          name: `Simulado ${role.toUpperCase()}`,
          role,
          username: role
        });
      }
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-rose-500" />;
      case 'manager': return <Settings className="w-4 h-4 text-purple-500" />;
      case 'tech': return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'attendant': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'cashier': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'client': return <Smartphone className="w-4 h-4 text-emerald-500" />;
      default: return <Users className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'tech': return 'Técnico';
      case 'attendant': return 'Atendente';
      case 'cashier': return 'Caixa';
      case 'client': return 'Área do Cliente';
      default: return 'Outro';
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 z-50">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Simular Perfil:</span>
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 gap-1 overflow-x-auto">
          {(['admin', 'manager', 'tech', 'attendant', 'client'] as UserRole[]).map((role) => {
            const isActive = currentUser.role === role;
            return (
              <button
                key={role}
                id={`btn-role-${role}`}
                onClick={() => handleRoleClick(role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {getRoleIcon(role)}
                {getRoleLabel(role)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-400">Usuário Ativo:</span>
        <select
          value={currentUser.id}
          onChange={(e) => {
            const uId = e.target.value;
            const u = users.find(user => user.id === uId);
            if (u) {
              onUserChange(u);
            } else if (uId === 'user-client') {
              const defaultOS = allOrders.length > 0 ? allOrders[0].number : 'OS-1020';
              onUserChange({
                id: 'user-client',
                name: 'Cliente Simulado',
                role: 'client',
                username: 'cliente',
                targetClientOSNumber: selectedClientOS || defaultOS
              });
            }
          }}
          className="bg-slate-950 border border-slate-800 text-white font-semibold rounded-md px-2 py-1 outline-none cursor-pointer"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id} className="bg-slate-950 text-white">
              {u.name} ({getRoleLabel(u.role)}) - {u.storeName || 'Sem Loja'}
            </option>
          ))}
          <option value="user-client" className="bg-slate-950 text-white">Cliente Simulado (Área do Cliente)</option>
        </select>
        
        {currentUser.role === 'client' && (
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Rastrear OS:</span>
            <select
              value={selectedClientOS}
              onChange={(e) => {
                onClientOSChange(e.target.value);
                onUserChange({
                  ...currentUser,
                  targetClientOSNumber: e.target.value
                });
              }}
              className="bg-transparent text-emerald-400 font-mono font-bold outline-none text-xs border-none cursor-pointer"
            >
              {allOrders.map((o) => (
                <option key={o.id} value={o.number} className="bg-slate-950 text-white font-mono">
                  {o.number} - {o.clientName.split(' ')[0]} ({o.equipment})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
