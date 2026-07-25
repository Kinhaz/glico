import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList, DrawerParamList } from "./types";
import CustomDrawer from "../components/CustomDrawer";

// ── Screens fora do menu (auth) ──
import InicioScreen    from "../screens/InicioScreen";
import LoginScreen     from "../screens/LoginScreen";
import CadastrarScreen from "../screens/CadastrarScreen";
import RelatoriosScreen from "../screens/RelatoriosScreen";
// ── Screens dentro do menu ──
// import PerfilScreen         from "../screens/PerfilScreen";
// import EspacoFamiliarScreen from "../screens/EspacoFamiliarScreen";
// import MonitorarScreen      from "../screens/MonitorarScreen";
// import RelatoriosScreen     from "../screens/RelatoriosScreen";
// import ConfiguracoesScreen  from "../screens/ConfiguracoesScreen";

// Placeholder temporário até criar as screens reais
import { View, Text } from "react-native";
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
        // ── Botão hambúrguer — aparece em TODAS as telas do drawer ──
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
      {/* ── Registre as screens do menu aqui ── */}
      <Drawer.Screen name="Perfil"         component={Placeholder("Perfil")}         options={{ title: "Perfil" }} />
      <Drawer.Screen name="EspacoFamiliar" component={Placeholder("Espaço Familiar")} options={{ title: "Espaço Familiar" }} />
      <Drawer.Screen name="Monitorar"      component={Placeholder("Monitorar")}      options={{ title: "Monitorar" }} />
      <Drawer.Screen name="Relatorios"     component={RelatoriosScreen}             options={{ title: "Relatórios" }} />
      <Drawer.Screen name="Configuracoes"  component={Placeholder("Configurações")}  options={{ title: "Configurações" }} />

      {/* Quando criar as screens reais, substitua Placeholder() pelo componente:
      <Drawer.Screen name="Perfil" component={PerfilScreen} options={{ title: "Perfil" }} /> */}
    </Drawer.Navigator>
  );
}

// =========================================
// STACK — telas de autenticação (sem menu)
// =========================================
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1E1B4B" },
        animation: "slide_from_right",
      }}
    >
      {/* Telas sem menu lateral */}
      <Stack.Screen name="Inicio"    component={InicioScreen} />
      <Stack.Screen name="Login"     component={LoginScreen} />
      <Stack.Screen name="Cadastrar" component={CadastrarScreen} />

      {/* Depois do login, entra no DrawerNavigator */}
      <Stack.Screen name="MainApp" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}
