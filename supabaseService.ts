import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseKey);
};

// Initialize Supabase Client dynamically
export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
  } catch (err) {
    console.error('Erro ao inicializar o cliente do Supabase:', err);
    return null;
  }
};

/**
 * Saves a single collection to Supabase in a key-value style backup table 'epic_crm_backup'.
 * Automatically handles upserting.
 */
export const saveCollectionToSupabase = async (collectionName: string, data: any): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Since we want to make it super easy for the user, we upsert to epic_crm_backup.
    // If the table doesn't exist, we log a helpful notice.
    const { error } = await client
      .from('epic_crm_backup')
      .upsert(
        { 
          collection_name: collectionName, 
          data: data, 
          updated_at: new Date().toISOString() 
        }, 
        { onConflict: 'collection_name' }
      );

    if (error) {
      console.error(`Erro ao salvar coleção "${collectionName}" no Supabase:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Falha ao sincronizar coleção "${collectionName}" para o Supabase:`, err);
    return false;
  }
};

/**
 * Saves the entire DB state to Supabase.
 */
export const saveAllToSupabase = async (db: any): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  
  const collections = [
    'users', 'clients', 'orders', 'parts', 'laudos', 
    'financial', 'messages', 'internalMessages', 'coupons', 'configs'
  ];

  // Sync each collection asynchronously
  const promises = collections.map(col => {
    if (db[col] !== undefined) {
      return saveCollectionToSupabase(col, db[col]);
    }
    return Promise.resolve(true);
  });

  await Promise.allSettled(promises);
};

/**
 * Downloads all synced collections from Supabase.
 */
export const fetchAllFromSupabase = async (): Promise<any | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('epic_crm_backup')
      .select('collection_name, data');

    if (error) {
      console.warn('Tabela "epic_crm_backup" não pôde ser acessada no Supabase (pode não estar criada ainda):', error.message);
      return null;
    }

    if (data && data.length > 0) {
      const dbObj: any = {};
      data.forEach((row: any) => {
        dbObj[row.collection_name] = row.data;
      });
      return dbObj;
    }
    return {};
  } catch (err) {
    console.error('Erro de conexão ao baixar dados do Supabase:', err);
    return null;
  }
};

/**
 * Helper SQL definition that users can execute in their Supabase dashboard's SQL Editor
 */
export const SUPABASE_SQL_CREATION_SCRIPT = `
-- Execute este script no SQL Editor do seu painel do Supabase para criar a tabela de sincronização de dados:

CREATE TABLE IF NOT EXISTS epic_crm_backup (
  collection_name TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilite o acesso público ou crie políticas de RLS para a tabela epic_crm_backup (opcional, ou simplesmente use a Service Role Key do Supabase):
ALTER TABLE epic_crm_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura e escrita para todos" ON epic_crm_backup FOR ALL USING (true) WITH CHECK (true);
`;
