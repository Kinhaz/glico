import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { TouchableOpacity, View, ActivityIndicator, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList, DrawerParamList } from "./types";
import CustomDrawer from "../components/CustomDrawer";
import { supabase } from "../lib/supabase";

// ── Screens fora do menu (auth) ──
import InicioScreen    from "../screens/InicioScreen";
import LoginScreen     from "../screens/LoginScreen";
import CadastrarScreen from "../screens/CadastrarScreen";
import RelatoriosScreen from "../screens/RelatoriosScreen";

// Placeholder temporário até criar as screens reais
const Placeholder = (label: string) => () => (
  <View style={{ flex: 1, backgroundColor: "#1E1B4B", alignItems: "center", justifyContent: "center" }}>
    <Text style={{ color: "#A5B4FC", fontSize: 18 }}>{label}</Text>
  </View>
);

// =========================================
// DRAWER — telas do menu lateral
// =========================================
const Drawer = createDrawerNavigator<DrawerParamList>();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: "#1E1B4B" },
        headerTintColor: "#FFFFFF",
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: undefined },
        headerLeft: () => (
          <TouchableOpacity
            style={{ paddingLeft: 16, paddingRight: 8 }}
            onPress={() => navigation.toggleDrawer()}
          >
            <Ionicons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        drawerStyle: {
          backgroundColor: "#1E1B4B",
          width: 260,
        },
      })}
    >
      <Drawer.Screen name="Perfil"         component={Placeholder("Perfil")}          options={{ title: "Perfil" }} />
      <Drawer.Screen name="EspacoFamiliar" component={Placeholder("Espaço Familiar")} options={{ title: "Espaço Familiar" }} />
      <Drawer.Screen name="Monitorar"      component={Placeholder("Monitorar")}       options={{ title: "Monitorar" }} />
      <Drawer.Screen name="Relatorios"     component={RelatoriosScreen}               options={{ title: "Relatórios" }} />
      <Drawer.Screen name="Configuracoes"  component={Placeholder("Configurações")}   options={{ title: "Configurações" }} />
    </Drawer.Navigator>
  );
}

// =========================================
// STACK — telas de autenticação (sem menu)
// =========================================
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se já existe sessão salva no dispositivo
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuta mudanças de login/logout em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tela de carregamento enquanto verifica sessão
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1E1B4B", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#A5B4FC" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      // Se já tiver sessão salva → vai direto para MainApp, senão → Inicio
      initialRouteName={session ? "MainApp" : "Inicio"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1E1B4B" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Inicio"    component={InicioScreen} />
      <Stack.Screen name="Login"     component={LoginScreen} />
      <Stack.Screen name="Cadastrar" component={CadastrarScreen} />
      <Stack.Screen name="MainApp"   component={DrawerNavigator} />
    </Stack.Navigator>
  );
}
