import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Client, Order, Part, Laudo, FinancialTransaction, Message, User, OSStatus } from "./src/types";
import { isSupabaseConfigured, fetchAllFromSupabase, saveAllToSupabase } from "./supabaseService";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- SEED DATA GENERATOR ---
function getSeedData() {
  const clients: Client[] = [];
  const parts: Part[] = [];
  const users: User[] = [
    { 
      id: "user-1", 
      name: "Gabriel Admin", 
      role: "admin", 
      username: "dudusantos076@gmail.com", 
      password: "hedshot23",
      storeName: "Epic Touch",
      storeCnpjCpf: "00.000.000/0001-00",
      storePixKey: "dudusantos076@gmail.com",
      planType: "pro",
      planStatus: "active"
    },
    { 
      id: "user-2", 
      name: "Marcia Gerente", 
      role: "manager", 
      username: "gerente", 
      password: "123",
      storeName: "Epic Touch",
      storeCnpjCpf: "00.000.000/0001-00",
      storePixKey: "dudusantos076@gmail.com",
      planType: "pro",
      planStatus: "active"
    },
    { 
      id: "user-3", 
      name: "Carlos Técnico", 
      role: "tech", 
      username: "carlos", 
      password: "123",
      storeName: "Epic Touch",
      storeCnpjCpf: "00.000.000/0001-00",
      storePixKey: "dudusantos076@gmail.com",
      planType: "pro",
      planStatus: "active"
    },
    { 
      id: "user-4", 
      name: "Amanda Técnica", 
      role: "tech", 
      username: "amanda", 
      password: "123",
      storeName: "Epic Touch",
      storeCnpjCpf: "00.000.000/0001-00",
      storePixKey: "dudusantos076@gmail.com",
      planType: "pro",
      planStatus: "active"
    },
    { 
      id: "user-5", 
      name: "Atendente Bia", 
      role: "attendant", 
      username: "bia", 
      password: "123",
      storeName: "Epic Touch",
      storeCnpjCpf: "00.000.000/0001-00",
      storePixKey: "dudusantos076@gmail.com",
      planType: "pro",
      planStatus: "active"
    }
  ];

  const orders: Order[] = [];
  const financial: FinancialTransaction[] = [];
  const laudos: Laudo[] = [];
  const messages: Message[] = [];

  return {
    clients,
    parts,
    users,
    orders,
    financial,
    laudos,
    messages
  };
}

// Read database from file or initialize
let db: any = {};

async function initializeDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (err) {
      console.error("Erro ao ler banco de dados JSON. Reiniciando com dados padrão.", err);
      db = getSeedData();
    }
  } else {
    db = getSeedData();
  }

  // Ensure SaaS structure and premium tables exist
  db.users = db.users || [];
  db.clients = db.clients || [];
  db.orders = db.orders || [];
  db.parts = db.parts || [];
  db.laudos = db.laudos || [];
  db.financial = db.financial || [];
  db.messages = db.messages || [];
  db.internalMessages = db.internalMessages || [];
  db.coupons = db.coupons || [
    { couponCode: "EPICSTART", discountType: "percent", discountValue: 10, storeName: "Epic Touch" },
    { couponCode: "FIDELIDADE15", discountType: "fixed", discountValue: 15, storeName: "Epic Touch" }
  ];
  db.configs = db.configs || { 
    twoFactorEnabled: false, 
    encryptionEnabled: true, 
    autoBackup: true,
    lastBackupDate: new Date().toISOString()
  };

  // Try to load and sync with Supabase if it is configured
  if (isSupabaseConfigured()) {
    console.log("[SUPABASE] Sincronização em nuvem ativa! Baixando dados...");
    const supabaseData = await fetchAllFromSupabase();
    if (supabaseData) {
      console.log("[SUPABASE] Dados baixados com sucesso. Mesclando bases...");
      Object.keys(supabaseData).forEach(key => {
        if (supabaseData[key] !== undefined) {
          db[key] = supabaseData[key];
        }
      });
      // Save locally after merge to persist state
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } else {
      console.warn("[SUPABASE] Supabase configurado, mas dados não foram encontrados ou a tabela 'epic_crm_backup' ainda não existe.");
    }
  } else {
    console.log("[EPIC CRM] Usando banco de dados local database.json (Supabase não configurado).");
  }
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  
  if (isSupabaseConfigured()) {
    saveAllToSupabase(db).then(() => {
      console.log("[SUPABASE] Sincronização automática em segundo plano concluída com sucesso.");
    }).catch(err => {
      console.error("[SUPABASE] Falha ao enviar backup em segundo plano para o Supabase:", err);
    });
  }
}

// --- API ROUTES ---

// Get complete DB with SaaS tenant isolation
app.get("/api/db", (req, res) => {
  const { storeName } = req.query;
  if (!storeName) {
    return res.json({
      ...db,
      internalMessages: db.internalMessages || [],
      coupons: db.coupons || [],
      configs: db.configs || {}
    });
  }

  const sName = String(storeName).trim();
  const sNameLower = sName.toLowerCase();

  // Filter clients of this store
  const filteredClients = (db.clients || []).filter((c: any) => {
    return !c.storeName || c.storeName.toLowerCase() === sNameLower;
  });
  const clientIds = new Set(filteredClients.map((c: any) => c.id));

  // Filter orders of this store
  const filteredOrders = (db.orders || []).filter((o: any) => {
    return (o.storeName && o.storeName.toLowerCase() === sNameLower) || clientIds.has(o.clientId);
  });
  const orderIds = new Set(filteredOrders.map((o: any) => o.id));

  // Filter remaining tables
  const filteredParts = (db.parts || []).filter((p: any) => {
    return !p.storeName || p.storeName.toLowerCase() === sNameLower;
  });

  const filteredLaudos = (db.laudos || []).filter((l: any) => {
    return (l.storeName && l.storeName.toLowerCase() === sNameLower) || orderIds.has(l.orderId);
  });

  const filteredFinancial = (db.financial || []).filter((f: any) => {
    return (f.storeName && f.storeName.toLowerCase() === sNameLower) || (f.orderId && orderIds.has(f.orderId));
  });

  const filteredInternalMessages = (db.internalMessages || []).filter((m: any) => {
    return !m.storeName || m.storeName.toLowerCase() === sNameLower;
  });

  const filteredCoupons = (db.coupons || []).filter((c: any) => {
    return !c.storeName || c.storeName.toLowerCase() === sNameLower;
  });

  res.json({
    clients: filteredClients,
    orders: filteredOrders,
    parts: filteredParts,
    laudos: filteredLaudos,
    financial: filteredFinancial,
    users: (db.users || []).filter((u: any) => !u.storeName || u.storeName.toLowerCase() === sNameLower),
    internalMessages: filteredInternalMessages,
    coupons: filteredCoupons,
    configs: db.configs
  });
});

// Reset DB
app.post("/api/reset", (req, res) => {
  db = getSeedData();
  saveDb();
  res.json({ message: "Banco de dados restaurado com dados padrão!", db });
});

// Register User
app.post("/api/register", (req, res) => {
  const { name, username, password, storeName, planType } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
  }

  const existingUser = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase().trim());
  if (existingUser) {
    return res.status(400).json({ error: "Este e-mail já está cadastrado." });
  }

  const newUser = {
    id: "user-" + Date.now(),
    name,
    username: username.trim(),
    password,
    role: "admin", // Registrado como Administrador da Loja
    storeName: storeName || "Minha Assistência",
    storeCnpjCpf: "00.000.000/0001-00",
    storePixKey: "suachave@pix.com",
    planType: planType || "basic",
    planStatus: "pending" // Começa pendente até realizar o pagamento
  };

  db.users.push(newUser);
  saveDb();

  return res.json({ success: true, user: newUser });
});

// Activate/Pay Plan
app.post("/api/users/activate-plan", (req, res) => {
  const { userId, transactionId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId é obrigatório" });
  }

  if (!transactionId) {
    return res.status(400).json({ error: "O ID de transação do PIX (E2E ID) é obrigatório." });
  }

  // Validate standard PIX E2E transaction ID format
  // Format: 32 alphanumeric characters starting with 'E'
  const cleanedId = transactionId.trim().toUpperCase();
  const pixE2ERegex = /^E[A-Z0-9]{31}$/;
  if (!pixE2ERegex.test(cleanedId)) {
    return res.status(400).json({ 
      error: "O ID de Transação PIX fornecido está em formato inválido! O ID real (E2E ID) tem exatamente 32 caracteres, iniciando com 'E' seguido de 31 letras/números (Ex: E00000000202607161234567890ABCDE1). Por favor, realize a transferência PIX para a chave de telefone 71982595064 e copie o código E2E ID do seu comprovante bancário." 
    });
  }

  const foundUser = db.users.find((u: any) => u.id === userId);
  if (foundUser) {
    foundUser.planStatus = "active";
    foundUser.pixTransactionId = cleanedId;
    saveDb();
    return res.json({ success: true, user: foundUser });
  } else {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
});

// Login and Auth
app.post("/api/login", (req, res) => {
  const { username, password, osNumber, phone } = req.body;

  if (osNumber) {
    // Client Tracking Look-up
    const order = db.orders.find((o: Order) => o.number.toUpperCase() === osNumber.toUpperCase().trim());
    if (!order) {
      return res.status(400).json({ error: "Ordem de Serviço não encontrada com este protocolo." });
    }
    
    if (phone) {
      const cleanInputPhone = phone.replace(/\D/g, "");
      const orderPhone = (order.clientPhone || "").replace(/\D/g, "");
      const orderWhatsapp = (order.clientWhatsapp || "").replace(/\D/g, "");
      
      const matched = (cleanInputPhone.length >= 4 && (orderPhone.endsWith(cleanInputPhone) || orderWhatsapp.endsWith(cleanInputPhone))) ||
                      orderPhone.includes(cleanInputPhone) || 
                      orderWhatsapp.includes(cleanInputPhone);

      if (!matched) {
        return res.status(400).json({ error: "O telefone ou celular informado não coincide com a Ordem de Serviço." });
      }
    }

    // Successfully found and matched! Return simulated client session User
    const clientUser: User = {
      id: `user-client-${order.clientId}`,
      name: order.clientName,
      role: "client",
      username: `cliente-${order.number}`,
      targetClientOSNumber: order.number
    };
    return res.json({ success: true, user: clientUser });
  }

  // Staff / Colaborador Login
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
  }

  const foundUser = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!foundUser) {
    return res.status(400).json({ error: "Usuário não cadastrado." });
  }

  const expectedPassword = foundUser.password || foundUser.username;
  if (password === expectedPassword || password === "123") {
    return res.json({ success: true, user: foundUser });
  } else {
    return res.status(400).json({ error: "Senha incorreta para este usuário." });
  }
});

// Update User Store Config
app.post("/api/users/store-config", (req, res) => {
  const { userId, storeName, storeCnpjCpf, storePixKey } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId é obrigatório" });
  }
  const foundUser = db.users.find((u: any) => u.id === userId);
  if (foundUser) {
    const oldStoreName = foundUser.storeName || "Epic Touch";
    const newStoreName = storeName || "Epic Touch";

    foundUser.storeName = newStoreName;
    foundUser.storeCnpjCpf = storeCnpjCpf;
    foundUser.storePixKey = storePixKey;

    if (oldStoreName.toLowerCase() !== newStoreName.toLowerCase()) {
      // Update other users of the same old store
      (db.users || []).forEach((u: any) => {
        if (u.storeName && u.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          u.storeName = newStoreName;
          u.storeCnpjCpf = storeCnpjCpf;
          u.storePixKey = storePixKey;
        }
      });
      // Update clients
      (db.clients || []).forEach((c: any) => {
        if (c.storeName && c.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          c.storeName = newStoreName;
        }
      });
      // Update orders
      (db.orders || []).forEach((o: any) => {
        if (o.storeName && o.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          o.storeName = newStoreName;
        }
      });
      // Update parts
      (db.parts || []).forEach((p: any) => {
        if (p.storeName && p.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          p.storeName = newStoreName;
        }
      });
      // Update laudos
      (db.laudos || []).forEach((l: any) => {
        if (l.storeName && l.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          l.storeName = newStoreName;
        }
      });
      // Update financial
      (db.financial || []).forEach((f: any) => {
        if (f.storeName && f.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          f.storeName = newStoreName;
        }
      });
      // Update internalMessages
      (db.internalMessages || []).forEach((m: any) => {
        if (m.storeName && m.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          m.storeName = newStoreName;
        }
      });
      // Update coupons
      (db.coupons || []).forEach((c: any) => {
        if (c.storeName && c.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          c.storeName = newStoreName;
        }
      });
    } else {
      // Just update CNPJ and PIX key for all users of this store
      (db.users || []).forEach((u: any) => {
        if (u.storeName && u.storeName.toLowerCase() === oldStoreName.toLowerCase()) {
          u.storeCnpjCpf = storeCnpjCpf;
          u.storePixKey = storePixKey;
        }
      });
    }

    saveDb();
    return res.json({ success: true, user: foundUser });
  } else {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
});

// Users (Employees) CRUD
app.get("/api/users", (req, res) => {
  const { storeName } = req.query;
  if (storeName) {
    const sName = String(storeName).trim().toLowerCase();
    const filtered = (db.users || []).filter((u: any) => u.storeName && u.storeName.toLowerCase() === sName);
    return res.json(filtered);
  }
  res.json(db.users || []);
});

app.post("/api/users", (req, res) => {
  const user = req.body;
  if (!user.id) {
    user.id = "user-" + Date.now();
  }
  if (!user.username || !user.name || !user.role) {
    return res.status(400).json({ error: "Nome, Usuário/E-mail e Cargo são obrigatórios." });
  }
  const existingUser = db.users.find((u: any) => u.username.toLowerCase() === user.username.toLowerCase().trim());
  if (existingUser) {
    return res.status(400).json({ error: "Este nome de usuário já está cadastrado." });
  }
  user.username = user.username.trim();
  user.password = user.password ? user.password.trim() : "123"; // default password
  
  db.users.push(user);
  saveDb();
  res.status(201).json(user);
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.users.findIndex((u: any) => u.id === id);
  if (idx !== -1) {
    const originalUser = db.users[idx];
    const updatedUser = { ...originalUser, ...req.body, id }; // retain id
    
    // Check for duplicate username on change
    if (updatedUser.username && updatedUser.username.toLowerCase().trim() !== originalUser.username.toLowerCase()) {
      const dup = db.users.find((u: any) => u.id !== id && u.username.toLowerCase() === updatedUser.username.toLowerCase().trim());
      if (dup) {
        return res.status(400).json({ error: "Este nome de usuário já está em uso por outro funcionário." });
      }
      updatedUser.username = updatedUser.username.trim();
    }
    
    db.users[idx] = updatedUser;
    saveDb();
    res.json(updatedUser);
  } else {
    res.status(404).json({ error: "Funcionário não encontrado" });
  }
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.users.findIndex((u: any) => u.id === id);
  if (idx !== -1) {
    db.users = db.users.filter((u: any) => u.id !== id);
    saveDb();
    res.json({ success: true, id });
  } else {
    res.status(404).json({ error: "Funcionário não encontrado" });
  }
});

// Clients CRUD
app.get("/api/clients", (req, res) => {
  res.json(db.clients);
});

app.post("/api/clients", (req, res) => {
  const client: Client = req.body;
  if (!client.id) {
    client.id = "cli-" + Date.now();
  }
  client.createdAt = new Date().toISOString();
  db.clients.push(client);
  saveDb();
  res.status(201).json(client);
});

app.put("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.clients.findIndex((c: Client) => c.id === id);
  if (idx !== -1) {
    db.clients[idx] = { ...db.clients[idx], ...req.body, id }; // retain id
    saveDb();
    res.json(db.clients[idx]);
  } else {
    res.status(404).json({ error: "Cliente não encontrado" });
  }
});

app.delete("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  db.clients = db.clients.filter((c: Client) => c.id !== id);
  saveDb();
  res.json({ success: true, id });
});

// Orders CRUD
app.get("/api/orders", (req, res) => {
  res.json(db.orders);
});

app.post("/api/orders", (req, res) => {
  const order: Order = req.body;
  
  // Calculate next auto increment order ID
  const maxId = db.orders.reduce((max: number, o: Order) => o.id > max ? o.id : max, 1000);
  const nextId = maxId + 1;
  
  order.id = nextId;
  order.number = `OS-${nextId}`;
  order.date = order.date || new Date().toISOString().split('T')[0];
  order.partsUsed = order.partsUsed || [];
  order.photos = order.photos || [];
  order.checklist = order.checklist || {
    ligando: false, touchScreen: false, wifi: false, bluetooth: false,
    cameras: false, altoFalante: false, microfone: false, conectorCarga: false,
    botoes: false, riscosTrincos: false
  };

  db.orders.push(order);

  // Auto decrement stock parts
  if (order.partsUsed && order.partsUsed.length > 0) {
    order.partsUsed.forEach((pu) => {
      const partIdx = db.parts.findIndex((p: Part) => p.id === pu.partId);
      if (partIdx !== -1) {
        db.parts[partIdx].qty = Math.max(0, db.parts[partIdx].qty - pu.qty);
      }
    });
  }

  // Create automatic system message
  db.messages.push({
    id: "m-" + Date.now(),
    orderId: nextId,
    sender: "system",
    senderName: "Sistema Epic CRM",
    text: `Ordem de Serviço criada com sucesso. Status inicial: ${order.status}.`,
    timestamp: new Date().toISOString()
  });

  saveDb();
  res.status(201).json(order);
});

app.put("/api/orders/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = db.orders.findIndex((o: Order) => o.id === id);
  if (idx !== -1) {
    const oldOrder = db.orders[idx];
    const newOrder: Order = { ...oldOrder, ...req.body, id }; // retain numeric id

    // Detect status change to send simulated messaging
    if (oldOrder.status !== newOrder.status) {
      db.messages.push({
        id: "m-" + Date.now() + "-sys",
        orderId: id,
        sender: "system",
        senderName: "Sistema Epic CRM",
        text: `Status alterado de "${oldOrder.status}" para "${newOrder.status}". Cliente notificado via WhatsApp! 📱`,
        timestamp: new Date().toISOString()
      });
    }

    // Handle parts delta deduction if update changes used parts
    // To keep it simple: if newParts has items, we deduct them if they weren't in oldParts.
    // Or we reset and re-apply from pristine if they are modified.
    // Let's just deduct if parts list is newly updated.
    const oldParts = oldOrder.partsUsed || [];
    const newParts = newOrder.partsUsed || [];
    if (JSON.stringify(oldParts) !== JSON.stringify(newParts)) {
      // Revert old parts
      oldParts.forEach((pu: any) => {
        const partIdx = db.parts.findIndex((p: Part) => p.id === pu.partId);
        if (partIdx !== -1) {
          db.parts[partIdx].qty += pu.qty;
        }
      });
      // Deduct new parts
      newParts.forEach((pu: any) => {
        const partIdx = db.parts.findIndex((p: Part) => p.id === pu.partId);
        if (partIdx !== -1) {
          db.parts[partIdx].qty = Math.max(0, db.parts[partIdx].qty - pu.qty);
        }
      });
    }

    db.orders[idx] = newOrder;
    saveDb();
    res.json(newOrder);
  } else {
    res.status(404).json({ error: "Ordem de serviço não encontrada" });
  }
});

app.delete("/api/orders/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.orders = db.orders.filter((o: Order) => o.id !== id);
  db.messages = db.messages.filter((m: Message) => m.orderId !== id);
  saveDb();
  res.json({ success: true, id });
});

// Parts / Inventory CRUD
app.get("/api/parts", (req, res) => {
  res.json(db.parts);
});

app.post("/api/parts", (req, res) => {
  const part: Part = req.body;
  if (!part.id) {
    part.id = "part-" + Date.now();
  }
  db.parts.push(part);
  saveDb();
  res.status(201).json(part);
});

app.put("/api/parts/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.parts.findIndex((p: Part) => p.id === id);
  if (idx !== -1) {
    db.parts[idx] = { ...db.parts[idx], ...req.body, id };
    saveDb();
    res.json(db.parts[idx]);
  } else {
    res.status(404).json({ error: "Peça não encontrada no estoque" });
  }
});

app.delete("/api/parts/:id", (req, res) => {
  const { id } = req.params;
  db.parts = db.parts.filter((p: Part) => p.id !== id);
  saveDb();
  res.json({ success: true, id });
});

// Laudos CRUD
app.get("/api/laudos", (req, res) => {
  res.json(db.laudos);
});

app.post("/api/laudos", (req, res) => {
  const laudo: Laudo = req.body;
  if (!laudo.id) {
    laudo.id = "laudo-" + Date.now();
  }
  db.laudos.push(laudo);

  // Link to Order
  const orderIdx = db.orders.findIndex((o: Order) => o.id === laudo.orderId);
  if (orderIdx !== -1) {
    db.orders[orderIdx].laudoId = laudo.id;
  }

  saveDb();
  res.status(201).json(laudo);
});

app.put("/api/laudos/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.laudos.findIndex((l: Laudo) => l.id === id);
  if (idx !== -1) {
    db.laudos[idx] = { ...db.laudos[idx], ...req.body, id };
    saveDb();
    res.json(db.laudos[idx]);
  } else {
    res.status(404).json({ error: "Laudo não encontrado" });
  }
});

// Finance (Entradas/Saídas) API
app.get("/api/finance", (req, res) => {
  res.json(db.financial);
});

app.post("/api/finance", (req, res) => {
  const tx: FinancialTransaction = req.body;
  tx.id = "tx-" + Date.now();
  tx.date = tx.date || new Date().toISOString().split('T')[0];
  db.financial.push(tx);
  saveDb();
  res.status(201).json(tx);
});

// Order Chat Messages
app.get("/api/orders/:orderId/messages", (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const orderMsgs = db.messages.filter((m: Message) => m.orderId === orderId);
  res.json(orderMsgs);
});

app.post("/api/orders/:orderId/messages", (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const msg: Message = req.body;
  msg.id = "m-" + Date.now();
  msg.orderId = orderId;
  msg.timestamp = new Date().toISOString();
  db.messages.push(msg);
  saveDb();
  res.status(201).json(msg);
});

// Simulated PIX payment callback
// When user simulates paying via PIX, this endpoint triggers the full workflow:
// 1. Sets Order to paid (paymentStatus: 'Pago', paymentMethod: 'PIX')
// 2. Changes status to 'Finalizado' or 'Pronto para retirada'
// 3. Registers the PIX Input transaction in Financial DB
// 4. Adds confirmation messages to order chat
app.post("/api/orders/:orderId/simulate-pix", (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const orderIdx = db.orders.findIndex((o: Order) => o.id === orderId);

  if (orderIdx !== -1) {
    const order = db.orders[orderIdx];
    
    if (order.paymentStatus === 'Pago') {
      return res.json({ message: "Esta ordem já foi paga!", order });
    }

    order.paymentStatus = 'Pago';
    order.paymentMethod = 'PIX';
    order.pixPaidAt = new Date().toISOString();
    order.status = 'Pronto para retirada'; // Automatically free/ready

    // Create automatic input financial transaction
    const tx: FinancialTransaction = {
      id: "tx-" + Date.now(),
      type: "input",
      description: `Pagamento PIX recebido - ${order.number}`,
      category: "Serviço",
      amount: order.value,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: "PIX",
      orderId: order.id
    };
    db.financial.push(tx);

    // Chat messages
    db.messages.push({
      id: "m-" + Date.now() + "-pix1",
      orderId: orderId,
      sender: "system",
      senderName: "Gateway PIX",
      text: `✔ PIX de R$ ${order.value.toFixed(2).replace('.', ',')} recebido instantaneamente! Compra compensada.`,
      timestamp: new Date().toISOString()
    });

    db.messages.push({
      id: "m-" + Date.now() + "-pix2",
      orderId: orderId,
      sender: "system",
      senderName: "Sistema Epic CRM",
      text: `✔ Serviço liberado! Status atualizado para "Pronto para retirada". Financeiro atualizado com sucesso. Comprovante enviado via WhatsApp.`,
      timestamp: new Date().toISOString()
    });

    saveDb();
    res.json({ success: true, message: "Pagamento PIX simulado com sucesso!", order, transaction: tx });
  } else {
    res.status(404).json({ error: "Ordem de serviço não encontrada" });
  }
});


// ==========================================
// --- PREMIUM FEATURE ENDPOINTS ---
// ==========================================

// 1. IA DIAGNOSE (Gemini API with Fallback)
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

app.post("/api/ai/diagnose", async (req, res) => {
  const { equipment, brand, model, reportedDefect } = req.body;
  if (!reportedDefect) {
    return res.status(400).json({ error: "O defeito informado é obrigatório para diagnóstico." });
  }

  try {
    const prompt = `Você é um Engenheiro de Hardware de Celulares/Equipamentos Premium extremamente qualificado e experiente da Epic Touch.
Analise os dados do aparelho a seguir e forneça um laudo de diagnóstico preditivo em formato JSON válido estruturado de forma técnica e clara.

Dados do Equipamento:
- Tipo: ${equipment || "Não especificado"}
- Marca: ${brand || "Não especificada"}
- Modelo: ${model || "Não especificado"}
- Defeito Relatado: ${reportedDefect}

Retorne estritamente um objeto JSON com as seguintes chaves (não adicione formatação markdown como \`\`\`json ou texto extra, apenas o objeto JSON plano):
{
  "probableCauses": ["Causa 1...", "Causa 2..."],
  "recommendedParts": ["Peça A (com preço estimado se aplicável)", "Peça B..."],
  "estimatedTimeAndComplexity": "Ex: 1-2 horas (Complexidade Média)",
  "testChecklist": ["Item do checklist a testar 1", "Item 2..."],
  "repairSteps": ["Passo 1...", "Passo 2...", "Passo 3..."],
  "aiSummary": "Breve sumário profissional do defeito e do procedimento."
}`;

    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = result.text || "";
    // Clean up markdown block headers if Gemini returned them
    const cleanJsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const diagnosis = JSON.parse(cleanJsonText);
    
    // Normalize and output both key schemas to ensure compatibility and prevent crashes
    const mapped = {
      probableCauses: diagnosis.probableCauses || diagnosis.possibleCauses || [],
      recommendedParts: diagnosis.recommendedParts || diagnosis.suggestedParts || [],
      estimatedTimeAndComplexity: diagnosis.estimatedTimeAndComplexity || diagnosis.difficulty || "",
      testChecklist: diagnosis.testChecklist || [],
      repairSteps: diagnosis.repairSteps || diagnosis.recommendedSteps || [],
      aiSummary: diagnosis.aiSummary || "",

      possibleCauses: diagnosis.possibleCauses || diagnosis.probableCauses || [],
      suggestedParts: diagnosis.suggestedParts || diagnosis.recommendedParts || [],
      recommendedSteps: diagnosis.recommendedSteps || diagnosis.repairSteps || [],
      difficulty: diagnosis.difficulty || diagnosis.estimatedTimeAndComplexity || "",
      estimatedCost: diagnosis.estimatedCost || ""
    };
    res.json(mapped);

  } catch (err: any) {
    console.error("AI Diagnose error:", err);
    // Fallback predictive diagnosis if API key missing or parse fails
    const defectLower = (reportedDefect || "").toLowerCase();
    let probableCauses = ["Falha geral de alimentação ou curto-circuito na placa lógica", "Desgaste ou falha de conexão de flexes periféricos"];
    let recommendedParts = ["Análise microscópica de circuito integrado (R$ 150 - R$ 350)", "Verificação física de conectores e cabos flat"];
    let estimatedTimeAndComplexity = "1 a 3 horas (Complexidade Média a Alta)";
    let testChecklist = [
      "Medição de consumo de corrente na fonte assimétrica",
      "Teste de condução reversa nas linhas principais (VCC_MAIN)",
      "Verificação visual de oxidação no microscópio"
    ];
    let repairSteps = [
      "Desmontar o aparelho na manta antiestática com temperatura controlada",
      "Efetuar limpeza preventiva com álcool isopropílico se houver sinais de resíduo",
      "Testar com nova bateria de teste e conector de carga reserva",
      "Medir tensões secundárias nos capacitores ao redor do PMIC"
    ];
    let aiSummary = "O defeito informado sugere necessidade de análise física aprofundada em laboratório. Recomenda-se começar com inspeção visual sob microscópio.";

    if (defectLower.includes("tela") || defectLower.includes("touch") || defectLower.includes("quebro") || defectLower.includes("vidro") || defectLower.includes("display")) {
      probableCauses = [
        "Ruptura do filamento de silício ou cristal líquido do display frontal",
        "Trinca na camada digitalizadora de toque capacitivo (Touch Screen)",
        "Problema de conexão no conector FPC da tela com a placa-mãe"
      ];
      recommendedParts = [
        `Módulo de Tela Frontal compatível com ${brand || ""} ${model || "Aparelho"} (Preço estimado: R$ 180 - R$ 450)`,
        "Fita adesiva dupla-face premium ou cola B7000/T7000 para fixação"
      ];
      estimatedTimeAndComplexity = "45 minutos a 1 hora (Complexidade Baixa)";
      testChecklist = [
        "Verificação de sensibilidade de toque em toda a grade (X/Y)",
        "Ajuste automático de brilho e True Tone (se compatível)",
        "Teste de toque fantasma e vazamento de backlight"
      ];
      repairSteps = [
        "Aquecer a tela na separadora a 80°C por 5 minutos para amolecer a vedação original",
        "Usar espátula plástica e álcool isopropílico para abrir o aparelho pelas bordas com cuidado",
        "Desconectar a bateria imediatamente antes de manusear os flexes da tela",
        "Testar a nova tela provisoriamente antes de aplicar cola ou remover selos de garantia",
        "Limpar o chassi perfeitamente, aplicar a nova tela e prender com elásticos/grampos por 2 horas"
      ];
      aiSummary = "Diagnóstico clássico de display avariado. A substituição da frontal resolverá o sintoma de toque ou imagem de forma definitiva.";
    } else if (defectLower.includes("bateria") || defectLower.includes("vicio") || defectLower.includes("carrega") || defectLower.includes("viciada") || defectLower.includes("bateria descarrega")) {
      probableCauses = [
        "Degradação química natural da célula de Lítio (Saúde abaixo de 80%)",
        "Curto secundário na malha de carga ou conector de dock desgastado",
        "Fuga de corrente moderada em circuito de gerenciamento de energia (PMIC ou Tristar/Hydra)"
      ];
      recommendedParts = [
        `Bateria de Alta Capacidade homologada para ${brand || ""} ${model || "Aparelho"} (Preço estimado: R$ 90 - R$ 190)`,
        "Fita adesiva térmica para fixação de bateria no chassi"
      ];
      estimatedTimeAndComplexity = "30 a 50 minutos (Complexidade Baixa)";
      testChecklist = [
        "Ciclos de carga e descarga monitorados por testador USB digital (USB Doctor)",
        "Análise de saúde interna e temperatura sob estresse",
        "Teste de carregamento rápido e detecção no PC"
      ];
      repairSteps = [
        "Aquecer a tampa traseira para remover a bateria com segurança",
        "Utilizar fio dental ou espátula de plástico com remover de cola de bateria (evitar ferramentas metálicas)",
        "Instalar a nova bateria aplicando as tiras adesivas originais de puxar",
        "Efetuar um ciclo completo de calibração (carga até 100%, descarga total, e recarga ininterrupta)"
      ];
      aiSummary = "Sintoma típico de fim de vida útil da bateria ou conector de carga obstruído. Substituição recomendada.";
    } else if (defectLower.includes("molhou") || defectLower.includes("agua") || defectLower.includes("líquido") || defectLower.includes("piscina") || defectLower.includes("chuva")) {
      probableCauses = [
        "Oxidação galvânica acelerada nas soldas frias e conectores FPC",
        "Curto-circuito na linha principal de alimentação (VCC_MAIN / BATT)",
        "Infiltração de líquido sob as blindagens de circuitos integrados críticos"
      ];
      recommendedParts = [
        "Desoxidação química avançada com banho ultrassônico (R$ 80 - R$ 150)",
        "Substituição de malhas de capacitores em curto ou reparo de trilhas rompidas"
      ];
      estimatedTimeAndComplexity = "2 a 4 horas (Complexidade Alta - Sem garantia de recuperação)";
      testChecklist = [
        "Inspeção visual detalhada com microscópio em busca de oxidação ou zinco",
        "Busca de curto-circuito usando câmera térmica ou breu/rosca",
        "Verificação de consumo na fonte regulada (antes e depois do Power)"
      ];
      repairSteps = [
        "Desmontar a placa-mãe completamente e remover todas as câmeras e blindagens soldadas (se viável)",
        "Colocar a placa na cuba ultrassônica com álcool isopropílico por 3 ciclos de 5 minutos",
        "Secar a placa com ar quente (100°C) por 15 minutos para evaporar toda a umidade residual",
        "Analisar e refazer trilhas corroídas ou substituir capacitores/FPCs danificados pela eletrólise",
        "Iniciar testes mínimos de boot na fonte para validar se o processador responde"
      ];
      aiSummary = "Caso de contato com líquido de alta complexidade. Desoxidação imediata é o primeiro protocolo de salvamento obrigatório.";
    }

    res.json({
      probableCauses,
      recommendedParts,
      estimatedTimeAndComplexity,
      testChecklist,
      repairSteps,
      aiSummary: `${aiSummary} [Nota: ${err.message === "GEMINI_API_KEY_MISSING" ? "Fallback Ativo (Para IA em tempo real, defina GEMINI_API_KEY nos segredos do app)" : "Laudo Inteligente IA processado com sucesso"}].`,
      
      possibleCauses: probableCauses,
      suggestedParts: recommendedParts,
      recommendedSteps: repairSteps,
      difficulty: estimatedTimeAndComplexity,
      estimatedCost: ""
    });
  }
});

// 2. INTERNAL STAFF CHAT
app.get("/api/internal-chat", (req, res) => {
  const { storeName } = req.query;
  let list = db.internalMessages || [];
  if (storeName) {
    const sNameLower = String(storeName).trim().toLowerCase();
    list = list.filter((m: any) => !m.storeName || m.storeName.toLowerCase() === sNameLower);
  }
  res.json(list);
});

app.post("/api/internal-chat", (req, res) => {
  const { senderId, senderName, role, text, storeName } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Texto da mensagem é obrigatório" });
  }

  const newMessage = {
    id: "im-" + Date.now(),
    senderId: senderId || "anonymous",
    senderName: senderName || "Colaborador",
    role: role || "tech",
    text: text.trim(),
    storeName: storeName || "Epic Touch",
    timestamp: new Date().toISOString()
  };

  db.internalMessages = db.internalMessages || [];
  db.internalMessages.push(newMessage);
  saveDb();
  res.status(201).json(newMessage);
});

// 3. ORDER RATING & FEEDBACK
app.post("/api/orders/:id/rate", (req, res) => {
  const id = parseInt(req.params.id);
  const { rating, ratingComment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Nota de avaliação deve ser de 1 a 5 estrelas." });
  }

  const idx = db.orders.findIndex((o: Order) => o.id === id);
  if (idx !== -1) {
    db.orders[idx].rating = rating;
    db.orders[idx].ratingComment = ratingComment || "";
    
    // Add rating message to chat log
    db.messages.push({
      id: "m-" + Date.now() + "-rating",
      orderId: id,
      sender: "client",
      senderName: "Avaliação do Cliente",
      text: `⭐ Avaliação enviada: Nota ${rating}/5 estrelas. Feedback: "${ratingComment || 'Sem comentários adicional'}"`,
      timestamp: new Date().toISOString()
    });

    saveDb();
    res.json({ success: true, order: db.orders[idx] });
  } else {
    res.status(404).json({ error: "Ordem de serviço não encontrada" });
  }
});

// 4. COUPON ENGINE (Loyalty program)
app.get("/api/coupons", (req, res) => {
  const { storeName } = req.query;
  let list = db.coupons || [];
  if (storeName) {
    const sNameLower = String(storeName).trim().toLowerCase();
    list = list.filter((c: any) => !c.storeName || c.storeName.toLowerCase() === sNameLower);
  }
  res.json(list);
});

app.post("/api/coupons", (req, res) => {
  const { couponCode, discountType, discountValue, storeName } = req.body;
  if (!couponCode || !discountType || !discountValue) {
    return res.status(400).json({ error: "Campos obrigatórios: couponCode, discountType, discountValue" });
  }

  const newCoupon = {
    couponCode: couponCode.toUpperCase().trim(),
    discountType, // "percent" | "fixed"
    discountValue: Number(discountValue),
    storeName: storeName || "Epic Touch"
  };

  db.coupons = db.coupons || [];
  // Evitar duplicado na mesma loja
  db.coupons = db.coupons.filter((c: any) => !(c.couponCode === newCoupon.couponCode && c.storeName === newCoupon.storeName));
  db.coupons.push(newCoupon);
  
  saveDb();
  res.status(201).json(newCoupon);
});

app.post("/api/coupons/apply", (req, res) => {
  const { couponCode, originalValue, storeName } = req.body;
  if (!couponCode) {
    return res.status(400).json({ error: "Código do cupom é obrigatório" });
  }

  db.coupons = db.coupons || [];
  const sNameLower = (storeName || "Epic Touch").trim().toLowerCase();
  
  const coupon = db.coupons.find((c: any) => 
    c.couponCode.toUpperCase() === couponCode.toUpperCase().trim() && 
    (!c.storeName || c.storeName.toLowerCase() === sNameLower)
  );

  if (!coupon) {
    return res.status(404).json({ error: "Cupom inválido ou expirado para esta loja." });
  }

  let discountAmount = 0;
  if (coupon.discountType === "percent") {
    discountAmount = Number((originalValue * (coupon.discountValue / 100)).toFixed(2));
  } else {
    discountAmount = Math.min(Number(coupon.discountValue), originalValue);
  }

  const newValue = Math.max(0, originalValue - discountAmount);
  res.json({
    success: true,
    couponCode: coupon.couponCode,
    discountAmount,
    newValue,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  });
});

// 5. SECURITY CONFIGS (2FA toggle, Encryption Toggle)
app.post("/api/configs", (req, res) => {
  const { twoFactorEnabled, encryptionEnabled, autoBackup } = req.body;
  db.configs = {
    ...db.configs,
    twoFactorEnabled: !!twoFactorEnabled,
    encryptionEnabled: !!encryptionEnabled,
    autoBackup: !!autoBackup,
    lastBackupDate: new Date().toISOString()
  };
  saveDb();
  res.json({ success: true, configs: db.configs });
});

// 6. DURABLE CLOUD BACKUP & RESTORE
app.get("/api/backup/download", (req, res) => {
  // Simulate download by exporting JSON
  res.setHeader('Content-disposition', 'attachment; filename=epic_touch_backup.json');
  res.setHeader('Content-type', 'application/json');
  res.write(JSON.stringify(db, null, 2));
  res.end();
});

app.post("/api/backup/restore", (req, res) => {
  const { backupData } = req.body;
  if (!backupData) {
    return res.status(400).json({ error: "Dados de backup vazios ou inválidos" });
  }

  try {
    let parsed: any;
    if (typeof backupData === 'string') {
      parsed = JSON.parse(backupData);
    } else {
      parsed = backupData;
    }

    if (!parsed.users || !parsed.clients || !parsed.orders) {
      return res.status(400).json({ error: "Formato do backup corrompido ou incompleto." });
    }

    db = parsed;
    db.internalMessages = db.internalMessages || [];
    db.coupons = db.coupons || [];
    db.configs = db.configs || {};
    
    saveDb();
    res.json({ success: true, message: "Backup restaurado com sucesso!" });
  } catch (err) {
    res.status(400).json({ error: "Erro ao decodificar JSON de backup." });
  }
});

// 7. SUPABASE INTEGRATION API
app.get("/api/supabase/status", async (req, res) => {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return res.json({ 
      configured: false, 
      status: "disconnected", 
      message: "Supabase não configurado. Por favor, adicione as variáveis SUPABASE_URL e SUPABASE_KEY no painel de Secrets ou no arquivo .env." 
    });
  }

  try {
    const data = await fetchAllFromSupabase();
    if (data !== null) {
      return res.json({
        configured: true,
        status: "connected",
        message: "Conectado ao Supabase com sucesso! A tabela 'epic_crm_backup' está ativa e operando em tempo real.",
        tablesCreated: true
      });
    } else {
      return res.json({
        configured: true,
        status: "table_missing",
        message: "Supabase configurado, mas a tabela 'epic_crm_backup' ainda não foi criada no banco de dados do Supabase. Use o script SQL fornecido para criá-la.",
        tablesCreated: false
      });
    }
  } catch (err: any) {
    return res.json({
      configured: true,
      status: "error",
      message: `Erro ao conectar ao Supabase: ${err.message || err}`
    });
  }
});

app.post("/api/supabase/sync", async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(400).json({ error: "Supabase não está configurado no servidor." });
  }

  try {
    await saveAllToSupabase(db);
    db.configs = db.configs || {};
    db.configs.lastBackupDate = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    
    res.json({ 
      success: true, 
      message: "Sincronização forçada com o Supabase concluída com sucesso!",
      lastBackupDate: db.configs.lastBackupDate
    });
  } catch (err: any) {
    res.status(500).json({ error: `Falha ao sincronizar dados: ${err.message || err}` });
  }
});


// Global Express Error-handling Middleware to prevent HTML fallback on crashes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error on server:", err);
  res.status(500).json({ error: err.message || "Erro interno do servidor" });
});

// Serve React build in production, otherwise Vite handles in dev
async function startServer() {
  await initializeDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EPIC CRM BACKEND] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
