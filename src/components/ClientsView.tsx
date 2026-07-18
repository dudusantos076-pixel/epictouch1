import React, { useState } from 'react';
import { Client } from '../types';
import { User, Phone, Mail, MapPin, FileText, Search, Plus, Edit, Trash2, Check, X, ShieldAlert } from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (c: Omit<Client, 'id' | 'createdAt'>) => Promise<any>;
  onUpdateClient: (id: string, c: Partial<Client>) => Promise<any>;
  onDeleteClient: (id: string) => Promise<any>;
}

export default function ClientsView({ clients, onAddClient, onUpdateClient, onDeleteClient }: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpfCnpj.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const openNewForm = () => {
    setEditingClient(null);
    setName('');
    setCpfCnpj('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setNotes('');
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCpfCnpj(client.cpfCnpj);
    setPhone(client.phone);
    setWhatsapp(client.whatsapp);
    setEmail(client.email);
    setAddress(client.address);
    setNotes(client.notes);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !phone) {
      setErrorMessage('Nome e Telefone são campos obrigatórios.');
      return;
    }

    const payload = {
      name,
      cpfCnpj,
      phone,
      whatsapp: whatsapp || phone, // fallback
      email,
      address,
      notes
    };

    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, payload);
      } else {
        await onAddClient(payload);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMessage('Erro ao salvar cliente: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await onDeleteClient(id);
      } catch (err: any) {
        alert('Erro ao excluir cliente: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6" id="clients-view-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Cadastro de Clientes
          </h1>
          <p className="text-xs text-slate-400">Gerencie a carteira de contatos e informações de faturamento</p>
        </div>
        <button
          onClick={openNewForm}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Cliente
        </button>
      </div>

      {/* SEARCH AND BAR */}
      <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-2.5 items-center gap-2 max-w-md shadow-inner">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF/CNPJ, fone ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* FORM OVERLAY/MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {errorMessage && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded text-xs flex items-center gap-2 font-mono">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nome Completo *</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Arthur Pendragon"
                      className="bg-transparent text-xs text-slate-200 outline-none w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CPF ou CNPJ</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      placeholder="Ex: 000.000.000-00"
                      className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">E-mail</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: arthur@exemplo.com"
                      className="bg-transparent text-xs text-slate-200 outline-none w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telefone Comercial *</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">WhatsApp</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Se vazio, usa o telefone"
                      className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Endereço Completo</label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade, Estado"
                      className="bg-transparent text-xs text-slate-200 outline-none w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Observações Internas</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalhes especiais de atendimento do cliente..."
                    rows={3}
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
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white tracking-tight">{client.name}</h3>
                  {client.cpfCnpj && <span className="text-[10px] text-slate-500 font-mono">CPF: {client.cpfCnpj}</span>}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditForm(client)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 rounded-md transition-colors cursor-pointer"
                    title="Editar Cliente"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 hover:text-rose-300 rounded-md transition-colors cursor-pointer"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-400 font-sans">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                    <span className="line-clamp-2">{client.address}</span>
                  </div>
                )}
              </div>
            </div>

            {client.notes && (
              <div className="mt-3 pt-3 border-t border-slate-900 text-[10px] text-slate-500 italic">
                <strong className="text-slate-400 font-sans not-italic block mb-0.5 uppercase tracking-wider font-bold text-[8px]">Obs:</strong>
                {client.notes}
              </div>
            )}
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full bg-slate-950 border border-slate-900 py-12 text-center rounded-xl">
            <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Nenhum cliente cadastrado ou encontrado com esta busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
