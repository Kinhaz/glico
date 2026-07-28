import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// =========================================
// CONFIGURAÇÃO SUPABASE
// =========================================
const SUPABASE_URL = "https://oragsoghgnzvntghktfn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYWdzb2doZ256dm50Z2hrdGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzM5MjAsImV4cCI6MjEwMDcwOTkyMH0.FtSIoy5lXbffNvCvV4h8-RVTb_Yh3Ed3EnbKtWm-rE0";

// Na web usa localStorage; no mobile usa SecureStore
const storage = Platform.OS === "web"
  ? {
      getItem:    (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem:    (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    }
  : {
      getItem:    (key: string) => SecureStore.getItemAsync(key),
      setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});