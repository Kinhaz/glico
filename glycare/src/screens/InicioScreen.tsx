import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

// =========================================
// CORES
// =========================================
const COLORS = {
  bg:         "#1E1B4B",
  bgCard:     "#2D2A6E",
  btnPrimary: "#3730A3",
  btnBorder:  "#3D3A7E",
  text:       "#FFFFFF",
  textMuted:  "#A5B4FC",
  white:      "#FFFFFF",
};

// =========================================
// CONFIGURAÇÕES
// =========================================
const LOGO_URL = "https://snipboard.io/dGebyq.jpg";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Inicio">;
};

export default function InicioScreen({ navigation }: Props) {
  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Logo card central */}
      <View style={styles.logoCard}>
        <Image
          source={{ uri: LOGO_URL }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Botões */}
      <View style={styles.btnGroup}>
        <TouchableOpacity
          style={styles.btnOutline}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Cadastrar")}
        >
          <Text style={styles.btnOutlineText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.btnOutlineText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 48,
  },

  // Logo card
  logoCard: {
    width: 160,
    height: 160,
    backgroundColor: COLORS.bgCard,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 110,
    height: 90,
  },

  // Botões
  btnGroup: {
    width: "100%",
    gap: 14,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: COLORS.btnBorder,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  btnOutlineText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});