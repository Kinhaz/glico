import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  Animated, Easing, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, Camera } from "expo-camera";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = {
  bg: "#000000", surface: "#0F0F0F", card: "#1A1A1A",
  border: "rgba(255,255,255,0.1)", accent: "#4FD1A5",
  text: "#FFFFFF", muted: "#888888", red: "#FF6B6B",
};

type Mode = "menu" | "qrcode" | "codigo";
type Status = "idle" | "conectando" | "sucesso" | "erro";

// ── Cantos do viewfinder (estilo Google Lens) ──────────────────────────────
function Viewfinder() {
  const size = 200;
  const thick = 3;
  const len = 24;
  const color = C.accent;
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Superior esquerdo */}
      <View style={{ position: "absolute", top: 0, left: 0, width: len, height: thick, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ position: "absolute", top: 0, left: 0, width: thick, height: len, backgroundColor: color, borderRadius: 2 }} />
      {/* Superior direito */}
      <View style={{ position: "absolute", top: 0, right: 0, width: len, height: thick, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ position: "absolute", top: 0, right: 0, width: thick, height: len, backgroundColor: color, borderRadius: 2 }} />
      {/* Inferior esquerdo */}
      <View style={{ position: "absolute", bottom: 0, left: 0, width: len, height: thick, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, width: thick, height: len, backgroundColor: color, borderRadius: 2 }} />
      {/* Inferior direito */}
      <View style={{ position: "absolute", bottom: 0, right: 0, width: len, height: thick, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ position: "absolute", bottom: 0, right: 0, width: thick, height: len, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

// ── Linha de scan animada ──────────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-96, 96] });
  return (
    <Animated.View style={{ position: "absolute", left: 8, right: 8, height: 2, backgroundColor: C.accent, opacity: 0.8, transform: [{ translateY }] }} />
  );
}

export default function GlycareOneScreen({ navigation }: { navigation?: any }) {
  const [mode,          setMode]          = useState<Mode>("menu");
  const [status,        setStatus]        = useState<Status>("idle");
  const [codigo,        setCodigo]        = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned,       setScanned]       = useState(false);
  const [popupVis,      setPopupVis]      = useState(false);
  const [glicemiaResult, setGlicemiaResult] = useState<number | null>(null);

  useEffect(() => {
    if (mode === "qrcode") {
      Camera.requestCameraPermissionsAsync().then(({ status }) => {
        setHasPermission(status === "granted");
      });
    }
  }, [mode]);

  // ── Processa conexão via token (QR ou código) ──────────────────────────
  async function processarConexao(token: string) {
    setStatus("conectando");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Busca medição pendente no Supabase associada ao token
      const { data: medicao, error } = await supabase
        .from("leituras_glicemia")
        .select("valor, medido_em")
        .eq("device_token", token)
        .order("medido_em", { ascending: false })
        .limit(1)
        .single();

      if (error || !medicao) {
        // Token não encontrado — simula recebimento (dispositivo real envia para o Supabase)
        // Em produção, o GlyCare One registra a leitura no Supabase com o token
        throw new Error("Token inválido ou medição não encontrada. Certifique-se de que o dispositivo está conectado.");
      }

      // Associa a medição ao usuário logado
      await supabase.from("leituras_glicemia")
        .update({ user_id: user.id, device_token: null })
        .eq("device_token", token);

      setGlicemiaResult(medicao.valor);
      setStatus("sucesso");
      setPopupVis(true);
    } catch (err: any) {
      setStatus("erro");
      Alert.alert("Erro de conexão", err.message ?? "Não foi possível conectar ao GlyCare One.");
      setStatus("idle");
    }
  }

  // ── QR Code escaneado ──────────────────────────────────────────────────
  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    // GlyCare One gera tokens no formato GC-LOGIN-XXXXXXXX ou QR JSON
    let token = data;
    try {
      const parsed = JSON.parse(data);
      if (parsed.token) token = parsed.token;
    } catch {}
    processarConexao(token);
  }

  // ── Código manual ──────────────────────────────────────────────────────
  function handleConfirmarCodigo() {
    const clean = codigo.trim().toUpperCase();
    if (!clean) { Alert.alert("Erro", "Digite o código exibido no dispositivo."); return; }
    processarConexao(clean);
  }

  return (
    <View style={styles.root}>
      {/* Câmera de fundo quando no modo QR */}
      {mode === "qrcode" && hasPermission && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Botão voltar */}
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (mode !== "menu") { setMode("menu"); setScanned(false); setStatus("idle"); } else { navigation?.goBack?.(); } }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>

        {/* ── MENU ── */}
        {mode === "menu" && (
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Ionicons name="hardware-chip-outline" size={40} color={C.accent} style={{ marginBottom: 12 }} />
              <Text style={styles.menuTitle}>GlyCare One</Text>
              <Text style={styles.menuSub}>Conecte seu dispositivo para sincronizar medições automaticamente</Text>
            </View>

            <View style={styles.menuCards}>
              <TouchableOpacity style={styles.methodCard} activeOpacity={0.85} onPress={() => setMode("qrcode")}>
                <View style={[styles.methodIcon, { backgroundColor: "rgba(79,209,165,0.15)" }]}>
                  <Ionicons name="qr-code-outline" size={28} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>QR Code</Text>
                  <Text style={styles.methodSub}>Aponte a câmera para o QR exibido no dispositivo</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.methodCard} activeOpacity={0.85} onPress={() => setMode("codigo")}>
                <View style={[styles.methodIcon, { backgroundColor: "rgba(96,165,250,0.15)" }]}>
                  <Ionicons name="keypad-outline" size={28} color="#60A5FA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Código do dispositivo</Text>
                  <Text style={styles.methodSub}>Digite o código exibido na tela do GlyCare One</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.menuHint}>O GlyCare One enviará a medição de glicemia diretamente para sua conta.</Text>
          </View>
        )}

        {/* ── QR CODE ── */}
        {mode === "qrcode" && (
          <View style={styles.qrContainer}>
            {!hasPermission ? (
              <View style={styles.permissionBox}>
                <Ionicons name="camera-outline" size={40} color={C.muted} style={{ marginBottom: 12 }} />
                <Text style={styles.permissionText}>Permissão de câmera necessária</Text>
                <TouchableOpacity style={styles.permBtn} onPress={() => Camera.requestCameraPermissionsAsync().then(({ status }) => setHasPermission(status === "granted"))}>
                  <Text style={styles.permBtnText}>Permitir câmera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Overlay escuro nas laterais */}
                <View style={styles.qrOverlayTop} />
                <View style={styles.qrMiddleRow}>
                  <View style={styles.qrOverlaySide} />
                  <View style={styles.viewfinderBox}>
                    <Viewfinder />
                    <ScanLine />
                  </View>
                  <View style={styles.qrOverlaySide} />
                </View>
                <View style={styles.qrOverlayBottom}>
                  <Text style={styles.qrLabel}>Aponte para o QR Code do GlyCare One</Text>
                  {status === "conectando" && <ActivityIndicator color={C.accent} style={{ marginTop: 12 }} />}
                  {scanned && status !== "conectando" && (
                    <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { setScanned(false); setStatus("idle"); }}>
                      <Text style={styles.scanAgainText}>Escanear novamente</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── CÓDIGO MANUAL ── */}
        {mode === "codigo" && (
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.codigoContainer}>
            <Ionicons name="keypad-outline" size={40} color="#60A5FA" style={{ marginBottom: 16 }} />
            <Text style={styles.menuTitle}>Código do dispositivo</Text>
            <Text style={styles.menuSub}>Digite o código exibido na tela do GlyCare One</Text>
            <TextInput
              style={styles.codigoInput}
              value={codigo}
              onChangeText={v => setCodigo(v.toUpperCase())}
              placeholder="GC-XXXXXXXX"
              placeholderTextColor={C.muted}
              autoCapitalize="characters"
              maxLength={12}
              keyboardType="default"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.connectBtn, status === "conectando" && { opacity: 0.6 }]}
              onPress={handleConfirmarCodigo}
              disabled={status === "conectando"}
              activeOpacity={0.85}
            >
              {status === "conectando"
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.connectBtnText}>Conectar</Text>
              }
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      {/* ── POPUP DE SUCESSO ── */}
      <Modal visible={popupVis} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color={C.accent} />
            </View>
            <Text style={styles.popupTitle}>Conectado!</Text>
            <Text style={styles.popupSub}>GlyCare One sincronizado com sucesso.</Text>
            {glicemiaResult !== null && (
              <View style={styles.glicemiaBox}>
                <Text style={styles.glicemiaLabel}>Glicemia medida</Text>
                <Text style={styles.glicemiaValue}>{glicemiaResult} <Text style={styles.glicemiaUnit}>mg/dL</Text></Text>
              </View>
            )}
            <Text style={styles.popupNote}>Os dados foram salvos na sua conta.</Text>
            <TouchableOpacity style={styles.popupBtn} onPress={() => { setPopupVis(false); navigation?.goBack?.(); }}>
              <Text style={styles.popupBtnText}>Voltar para o início</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },
  safeArea:        { flex: 1 },
  backBtn:         { margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  // Menu
  menuContainer:   { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  menuHeader:      { alignItems: "center", marginBottom: 40 },
  menuTitle:       { fontFamily: A, fontWeight: "800", fontSize: 24, color: C.text, marginBottom: 8, textAlign: "center" },
  menuSub:         { fontFamily: A, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20 },
  menuCards:       { gap: 14, marginBottom: 28 },
  methodCard:      { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, gap: 14 },
  methodIcon:      { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  methodTitle:     { fontFamily: A, fontWeight: "700", fontSize: 16, color: C.text, marginBottom: 4 },
  methodSub:       { fontFamily: A, fontSize: 12, color: C.muted, lineHeight: 17 },
  menuHint:        { fontFamily: A, fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 },
  // QR
  qrContainer:     { flex: 1 },
  qrOverlayTop:    { flex: 2, backgroundColor: "rgba(0,0,0,0.6)" },
  qrMiddleRow:     { flexDirection: "row", height: 220 },
  qrOverlaySide:   { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  viewfinderBox:   { width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  qrOverlayBottom: { flex: 3, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", paddingTop: 32, paddingHorizontal: 24 },
  qrLabel:         { fontFamily: A, fontSize: 16, color: C.text, textAlign: "center" },
  scanAgainBtn:    { marginTop: 16, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  scanAgainText:   { fontFamily: A, fontWeight: "700", fontSize: 14, color: "#000" },
  permissionBox:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permissionText:  { fontFamily: A, fontSize: 16, color: C.text, textAlign: "center", marginBottom: 20 },
  permBtn:         { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  permBtnText:     { fontFamily: A, fontWeight: "700", fontSize: 14, color: "#000" },
  // Código
  codigoContainer: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  codigoInput:     { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, height: 60, width: "100%", textAlign: "center", fontFamily: A, fontSize: 22, fontWeight: "700", color: C.text, letterSpacing: 3, marginTop: 28, marginBottom: 20 },
  connectBtn:      { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, width: "100%", alignItems: "center" },
  connectBtnText:  { fontFamily: A, fontWeight: "700", fontSize: 16, color: "#000" },
  // Popup
  popupOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 24 },
  popupCard:       { backgroundColor: "#1A1A1A", borderRadius: 24, padding: 28, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "rgba(79,209,165,0.3)" },
  popupIconWrap:   { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(79,209,165,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  popupTitle:      { fontFamily: A, fontWeight: "800", fontSize: 22, color: C.text, marginBottom: 8 },
  popupSub:        { fontFamily: A, fontSize: 14, color: C.muted, textAlign: "center", marginBottom: 20 },
  glicemiaBox:     { backgroundColor: "rgba(79,209,165,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(79,209,165,0.2)", padding: 16, width: "100%", alignItems: "center", marginBottom: 16 },
  glicemiaLabel:   { fontFamily: A, fontSize: 12, color: C.muted, marginBottom: 4 },
  glicemiaValue:   { fontFamily: A, fontWeight: "800", fontSize: 36, color: C.accent },
  glicemiaUnit:    { fontSize: 16, color: C.muted, fontWeight: "400" },
  popupNote:       { fontFamily: A, fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 20 },
  popupBtn:        { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  popupBtnText:    { fontFamily: A, fontWeight: "700", fontSize: 15, color: "#000" },
});