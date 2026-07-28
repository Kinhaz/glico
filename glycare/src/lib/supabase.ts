import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// =========================================
// CONFIGURAÇÃO SUPABASE
// =========================================
const SUPABASE_URL = "https://oragsoghgnzvntghktfn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYWdzb2doZ256dm50Z2hrdGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzM5MjAsImV4cCI6MjEwMDcwOTkyMH0.FtSIoy5lXbffNvCvV4h8-RVTb_Yh3Ed3EnbKtWm-rE0";

// Salva a sessão de forma segura no dispositivo
const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:          ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession:   true,   // ← usuário fica logado ao fechar o app
    detectSessionInUrl: false,
  },
});
