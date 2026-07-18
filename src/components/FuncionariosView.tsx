import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, Search, Plus, Edit, Trash2, Check, X, Shield, Settings, 
  Wrench, FileText, DollarSign, Lock, Mail, Eye, EyeOff
} from 'lucide-react';

interface FuncionariosViewProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (u: Omit<User, 'id'>) => Promise<any>;
  onUpdateUser: (id: string, u: Partial<User>) => Promise<any>;
  onDeleteUser: (id: string) => Promise<any>;
}

export default function FuncionariosView({ 
  users, 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}: FuncionariosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tech');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
            <Shield className="w-3 h-3" /> Administrador
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
            <Settings className="w-3 h-3" /> Gerente
          </span>
        );
      case 'tech':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
            <Wrench className="w-3 h-3" /> Técnico
          </span>
        );
      case 'attendant':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
            <FileText className="w-3 h-3" /> Atendente
          </span>
        );
      case 'cashier':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
            <DollarSign className="w-3 h-3" /> Caixa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
            <Users className="w-3 h-3" /> Outro ({r})
          </span>
        );
    }
  };

  const openNewForm = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('tech');
    setErrorMessage('');
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setErrorMessage('');
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !username.trim()) {
      setErrorMessage('Nome e Usuário/E-mail são obrigatórios.');
      return;
    }

    const payload = {
      name: name.trim(),
      username: username.trim(),
      password: password.trim() || '123',
      role,
      storeName: currentUser?.storeName
    };

    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, payload);
      } else {
        await onAddUser(payload);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar funcionário.');
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Você não pode excluir o seu próprio perfil ativo.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o funcionário ${user.name}?`)) {
      try {
        await onDeleteUser(user.id);
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir funcionário.');
      }
    }
  };

  return (
    <div className="space-y-6" id="funcionarios-view-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 font-sans">Funcionários</h1>
          <p className="text-slate-500 text-xs mt-0.5">Gerencie os técnicos, atendentes, caixas e administradores da sua loja.</p>
        </div>
        <button
          onClick={openNewForm}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Funcionário
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, usuário ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/80 transition-all font-sans"
          />
        </div>
        <span className="text-slate-400 text-xs hidden md:inline">
          Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> funcionários
        </span>
      </div>

      {/* MAIN DATA TABLE / GRID */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Nenhum funcionário encontrado</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Nenhum registro coincide com a busca ou nenhum colaborador foi adicionado.</p>
          </div>
          <button
            onClick={openNewForm}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer"
          >
            Adicionar Primeiro Funcionário
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome completo</th>
                  <th className="px-6 py-4">Usuário / E-mail</th>
                  <th className="px-6 py-4">Cargo / Função</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredUsers.map((user) => {
                  const isMe = user.id === currentUser?.id;
                  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {user.name}
                            {isMe && (
                              <span className="bg-blue-500/10 text-blue-600 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                                Você
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditForm(user)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Editar Funcionário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={isMe}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isMe 
                                ? 'text-slate-300 cursor-not-allowed opacity-50' 
                                : 'hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                            }`}
                            title={isMe ? 'Você não pode se excluir' : 'Excluir Funcionário'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW/EDIT EMPLOYEE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingUser ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h3>
                <p className="text-[10px] text-slate-400">Preencha as credenciais de acesso do colaborador.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans text-xs text-slate-700">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-600 font-medium flex items-start gap-2">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva da Cunha"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/80 transition-all"
                />
              </div>

              {/* Usuário / Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Usuário de Login ou E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: joaosilva ou joao@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/80 transition-all"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? 'Senha antiga mantida se vazio' : 'Padrão "123" se em branco'}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/80 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cargo / Role */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cargo / Função</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/80 transition-all cursor-pointer font-sans"
                >
                  <option value="tech">Técnico (Bancada de Reparos)</option>
                  <option value="attendant">Atendente (Cadastro de OS/Clientes)</option>
                  <option value="cashier">Caixa (Operador Financeiro)</option>
                  <option value="manager">Gerente (Gestão Parcial)</option>
                  <option value="admin">Administrador (Controle Total)</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-4 py-2 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
