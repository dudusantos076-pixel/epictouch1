export interface Client {
  id: string;
  name: string;
  cpfCnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
}

export type OSStatus =
  | 'Recebido'
  | 'Em análise'
  | 'Aguardando aprovação'
  | 'Aguardando peça'
  | 'Em reparo'
  | 'Teste'
  | 'Finalizado'
  | 'Pronto para retirada';

export interface PartUsed {
  partId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  number: string;
  date: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientWhatsapp?: string;
  equipment: string;
  brand: string;
  model: string;
  imei: string;
  password?: string;
  reportedDefect: string;
  checklist: {
    ligando: boolean;
    touchScreen: boolean;
    wifi: boolean;
    bluetooth: boolean;
    cameras: boolean;
    altoFalante: boolean;
    microfone: boolean;
    conectorCarga: boolean;
    botoes: boolean;
    riscosTrincos: boolean;
  };
  physicalState: string;
  photos: string[];
  video?: string;
  techId: string;
  techName: string;
  value: number;
  status: OSStatus;
  warranty: string; // e.g. "90 dias", "Sem garantia"
  warrantyExpiry?: string;
  notes: string;
  partsUsed: PartUsed[];
  paymentStatus: 'Pendente' | 'Pago';
  paymentMethod?: 'PIX' | 'Cartão' | 'Dinheiro' | 'Parcelamento';
  pixPaidAt?: string;
  laudoId?: string;
  rating?: number;
  ratingComment?: string;
}

export interface Part {
  id: string;
  name: string;
  supplier: string;
  qty: number;
  purchasePrice: number;
  sellingPrice: number;
  barcode: string;
  minQty: number; // para alertas de estoque baixo
}

export interface Laudo {
  id: string;
  orderId: number;
  orderNumber: string;
  clientName: string;
  equipment: string;
  date: string;
  items: {
    tela: 'OK' | 'Defeito' | 'Não Testado';
    placa: 'OK' | 'Defeito' | 'Não Testado';
    bateria: 'OK' | 'Defeito' | 'Não Testado';
    oxidacao: 'Sim' | 'Não' | 'Não Testado';
    faceId: 'OK' | 'Defeito' | 'Não Testado';
    biometria: 'OK' | 'Defeito' | 'Não Testado';
    cameras: 'OK' | 'Defeito' | 'Não Testado';
    microfone: 'OK' | 'Defeito' | 'Não Testado';
    altoFalante: 'OK' | 'Defeito' | 'Não Testado';
    conector: 'OK' | 'Defeito' | 'Não Testado';
  };
  techNotes: string;
  techSignature: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'input' | 'output'; // entrada ou saída
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: 'PIX' | 'Cartão' | 'Dinheiro' | 'Parcelamento';
  orderId?: number;
}

export type UserRole = 'admin' | 'manager' | 'tech' | 'attendant' | 'cashier' | 'client' | 'other';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
  targetClientOSNumber?: string; // se for cliente, qual OS ele acompanha
  storeName?: string;
  storeCnpjCpf?: string;
  storePixKey?: string;
  planType?: 'basic' | 'pro';
  planStatus?: 'pending' | 'active';
  pixTransactionId?: string;
}

export interface Message {
  id: string;
  orderId: number;
  sender: 'tech' | 'client' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}
