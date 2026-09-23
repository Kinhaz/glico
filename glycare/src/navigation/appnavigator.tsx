import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { TouchableOpacity, View, ActivityIndicator, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList, DrawerParamList } from "./types";
import CustomDrawer from "../components/CustomDrawer";
import { supabase } from "../lib/supabase";

import InicioScreen        from "../screens/InicioScreen";
import LoginScreen         from "../screens/LoginScreen";
import CadastrarScreen     from "../screens/CadastrarScreen";
import QuestionarioScreen  from "../screens/QuestionarioScreen";
import ResultadoScreen     from "../screens/ResultadoScreen";
import HomeScreen          from "../screens/HomeScreen";
import RelatoriosScreen    from "../screens/RelatoriosScreen";
import RegistrarScreen     from "../screens/RegistrarScreen";
import RecipesScreen       from "../screens/RecipesScreen";
import ExercisesScreen     from "../screens/ExercisesScreen";
import RecipeDetailScreen  from "../screens/RecipeDetailScreen";
import ConfiguracoesScreen from "../screens/ConfiguracoesScreen";
import MonitorarScreen     from "../screens/MonitorarScreen";
import PerfilScreen        from "../screens/PerfilScreen";
import EvIMCScreen         from "../screens/EvIMCScreen";
import EspacoFamiliarScreen from "../screens/EspacoFamiliarScreen";
import SaudeScreen         from "../screens/SaudeScreen";
import AnaliseScreen       from "../screens/AnaliseScreen";

const Placeholder = (label: string) => () => (
  <View style={{ flex: 1, backgroundColor: "#0B0A24", alignItems: "center", justifyContent: "center" }}>
    <Text style={{ color: "#A5B4FC", fontSize: 18, fontFamily: "Arial" }}>{label}</Text>
  </View>
);

const Drawer = createDrawerNavigator<DrawerParamList>();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: "#0B0A24" },
        headerTintColor: "#FFFFFF",
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "Arial" },
        headerLeft: () => (
          <TouchableOpacity style={{ paddingLeft: 16, paddingRight: 8 }} onPress={() => navigation.toggleDrawer()}>
            <Ionicons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        drawerStyle: { backgroundColor: "#1E1B4B", width: 260 },
      })}
    >
      <Drawer.Screen name="Home"           component={HomeScreen}           options={{ title: "Início",         headerShown: false }} />
      <Drawer.Screen name="Perfil"         component={PerfilScreen}         options={{ title: "Perfil" }} />
      <Drawer.Screen name="EspacoFamiliar" component={EspacoFamiliarScreen} options={{ title: "Espaço Familiar" }} />
      <Drawer.Screen name="Registrar"      component={RegistrarScreen}      options={{ title: "Registrar",      headerShown: false }} />
      <Drawer.Screen name="Monitorar"      component={MonitorarScreen}      options={{ title: "Monitorar" }} />
      <Drawer.Screen name="Relatorios"     component={RelatoriosScreen}     options={{ title: "Relatórios" }} />
      <Drawer.Screen name="EvIMC"          component={EvIMCScreen}          options={{ title: "Evolução do IMC" }} />
      <Drawer.Screen name="Configuracoes"  component={ConfiguracoesScreen}  options={{ title: "Configurações" }} />
    </Drawer.Navigator>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch((err) => console.log("Erro ao buscar sessão:", err))
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1E1B4B", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#A5B4FC" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={session ? "Home" : "Inicio"}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#1E1B4B" }, animation: "slide_from_right" }}
    >
      <Stack.Screen name="Inicio"       component={InicioScreen} />
      <Stack.Screen name="Login"        component={LoginScreen} />
      <Stack.Screen name="Cadastrar"    component={CadastrarScreen} />
      <Stack.Screen name="Questionario" component={QuestionarioScreen} />
      <Stack.Screen name="Resultado"    component={ResultadoScreen} />
      <Stack.Screen name="Home"         component={DrawerNavigator} />
      <Stack.Screen name="Receitas"     component={RecipesScreen} />
      <Stack.Screen name="Exercicios"   component={ExercisesScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="Saude"        component={SaudeScreen} />
      <Stack.Screen name="Analise"      component={AnaliseScreen} />
    </Stack.Navigator>
  );
}
