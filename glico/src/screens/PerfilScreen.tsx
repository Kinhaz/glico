import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Modal, TextInput, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", accentBg:"rgba(124,92,255,0.14)", green:"#4FD1A5", red:"#FF6B6B", text:"#F5F3FF", muted:"#A5A3C7" };

interface Perfil { nome_completo:string; email:string; data_nascimento:string; genero:string|null; tipo_sanguineo:string|null; telefone:string|null; cpf:string|null; }
interface Questionario { respostas: Record<string,string>; }

function iniciais(n:string) { const p=n?.trim().split(" "); if(!p?.length)return "?"; if(p.length===1)return p[0][0].toUpperCase(); return(p[0][0]+p[p.length-1][0]).toUpperCase(); }

function InfoRow({ icon, label, value }: { icon:string; label:string; value:string }) {
  return (
    <View style={ir.row}>
      <View style={ir.icon}><Ionicons name={icon as any} size={16} color={C.accent} /></View>
      <Text style={ir.lbl}>{label}</Text>
      <Text style={ir.val}>{value||"—"}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:  { flexDirection:"row", alignItems:"center", paddingVertical:12, gap:12 },
  icon: { width:30, height:30, borderRadius:8, backgroundColor:C.accentBg, alignItems:"center", justifyContent:"center" },
  lbl:  { fontFamily:A, fontSize:13, color:C.muted, flex:1 },
  val:  { fontFamily:A, fontSize:13, color:C.text },
});

const EDIT_FIELDS = [
  { key:"nome_completo",   label:"Nome completo",      placeholder:"Seu nome",        cap:"words"       as const },
  { key:"telefone",        label:"Telefone",            placeholder:"(00) 00000-0000", cap:"none"        as const, keyboard:"phone-pad" },
  { key:"cpf",             label:"CPF",                 placeholder:"000.000.000-00",  cap:"none"        as const, keyboard:"numeric"   },
  { key:"data_nascimento", label:"Data de nascimento",  placeholder:"DD/MM/AAAA",      cap:"none"        as const, keyboard:"numeric"   },
];

export default function PerfilScreen({ navigation }: { navigation?:any }) {
  const [perfil,       setPerfil]       = useState<Perfil|null>(null);
  const [questionario, setQuestionario] = useState<Questionario|null>(null);
  const [carregando,   setCarregando]   = useState(true);
  const [editModal,    setEditModal]    = useState(false);
  const [editData,     setEditData]     = useState<Record<string,string>>({});
  const [salvando,     setSalvando]     = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [pRes, qRes] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", user.id).single(),
        supabase.from("questionarios").select("respostas").eq("user_id", user.id).order("created_at",{ascending:false}).limit(1).single(),
      ]);
      if (pRes.data)  setPerfil(pRes.data as Perfil);
      if (qRes.data)  setQuestionario(qRes.data as Questionario);
    } catch(e){ console.error(e); }
    finally { setCarregando(false); }
  }

  function abrirEdicao() {
    setEditData({ nome_completo:perfil?.nome_completo??"", telefone:perfil?.telefone??"", cpf:perfil?.cpf??"", data_nascimento:perfil?.data_nascimento??"" });
    setEditModal(true);
  }

  async function salvarEdicao() {
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const update = { nome_completo:editData.nome_completo, telefone:editData.telefone||null, cpf:editData.cpf||null, data_nascimento:editData.data_nascimento||null, updated_at:new Date().toISOString() };
      const { error } = await supabase.from("perfis").update(update).eq("id", user.id);
      if (error) { Alert.alert("Erro", error.message); return; }
      setPerfil(prev => prev ? { ...prev, ...update } as Perfil : prev);
      setEditModal(false);
      Alert.alert("Sucesso","Perfil atualizado!");
    } catch { Alert.alert("Erro","Não foi possível salvar."); }
    finally { setSalvando(false); }
  }

  if (carregando) return <View style={{ flex:1, backgroundColor:C.bg, alignItems:"center", justifyContent:"center" }}><ActivityIndicator color={C.accent} /></View>;

  const nome=perfil?.nome_completo??"Usuário", email=perfil?.email??"—";
  const dataNasc=perfil?.data_nascimento??"—", genero=perfil?.genero??questionario?.respostas?.genero??"—";
  const tipoSang=perfil?.tipo_sanguineo??questionario?.respostas?.tipo_sanguineo??"—";
  const tipoDiab=questionario?.respostas?.tipo_diabetes??"—";
  const telefone=perfil?.telefone??"—", cpf=perfil?.cpf??"—";

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Perfil</Text>
          <Text style={s.pageSub}>Suas informações e preferências</Text>
        </View>

        <View style={s.identityCard}>
          <View style={s.avatarRow}>
            <View style={s.avatar}><Text style={s.avatarText}>{iniciais(nome)}</Text></View>
            <View style={{ flex:1 }}>
              <Text style={s.userName}>{nome}</Text>
              <View style={s.infoLine}><Ionicons name="mail-outline" size={13} color={C.muted} /><Text style={s.infoLineText}>{email}</Text></View>
              <View style={s.infoLine}><Ionicons name="call-outline" size={13} color={C.muted} /><Text style={s.infoLineText}>{telefone}</Text></View>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={abrirEdicao}>
              <Ionicons name="pencil-outline" size={14} color={C.accent} />
              <Text style={s.editBtnText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>INFORMAÇÕES PESSOAIS</Text>
          <View style={s.card}>
            <InfoRow icon="calendar-outline" label="Data de nascimento:" value={dataNasc} />
            <View style={s.divider} />
            <InfoRow icon="person-outline"   label="Gênero:"             value={genero} />
            <View style={s.divider} />
            <InfoRow icon="water-outline"    label="Tipo sanguíneo:"     value={tipoSang} />
            <View style={s.divider} />
            <InfoRow icon="card-outline"     label="CPF:"                value={cpf} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>DIAGNÓSTICO</Text>
          <View style={s.diagRow}>
            <View style={[s.diagCard,{borderColor:`${C.red}30`}]}>
              <Text style={s.diagLabel}>Tipo de diabetes</Text>
              <Text style={[s.diagVal,{color:C.red}]}>{tipoDiab}</Text>
            </View>
            <View style={[s.diagCard,{borderColor:`${C.green}30`}]}>
              <Text style={s.diagLabel}>Tipos de diagnósticos</Text>
              <Text style={[s.diagVal,{color:C.green}]}>{questionario?"1":"—"}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>CONFIGURAÇÕES DA CONTA</Text>
          {[
            { icon:"shield-outline", label:"Segurança e privacidade" },
            { icon:"notifications-outline", label:"Notificações" },
            { icon:"time-outline", label:"Lembretes de medicamentos" },
          ].map(l => (
            <TouchableOpacity key={l.label} style={s.quickLink} onPress={() => navigation?.navigate?.("Configuracoes")}>
              <Ionicons name={l.icon as any} size={16} color={C.accent} />
              <Text style={s.quickLinkText}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.accent} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={async () => { await supabase.auth.signOut(); navigation?.reset?.({index:0,routes:[{name:"Inicio"}]}); }}>
          <Ionicons name="log-out-outline" size={16} color={C.red} style={{ marginRight:8 }} />
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
        <View style={{ height:32 }} />
      </ScrollView>

      {/* Modal edição */}
      <Modal visible={editModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setEditModal(false)}>
          <View style={s.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"}>
              <TouchableWithoutFeedback>
                <View style={s.modalCard}>
                  <Text style={s.modalTitle}>Editar Perfil</Text>
                  <Text style={s.modalSub}>O e-mail não pode ser alterado</Text>
                  {EDIT_FIELDS.map(f => (
                    <View key={f.key} style={{ marginBottom:14 }}>
                      <Text style={s.modalLabel}>{f.label}</Text>
                      <TextInput style={s.modalInput} value={editData[f.key]??""} onChangeText={v => setEditData(p=>({...p,[f.key]:v}))}
                        placeholder={f.placeholder} placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardType={(f.keyboard??"default") as any} autoCapitalize={f.cap} />
                    </View>
                  ))}
                  <TouchableOpacity style={[s.modalBtn, salvando&&{opacity:0.6}]} onPress={salvarEdicao} disabled={salvando}>
                    <Text style={s.modalBtnText}>{salvando?"Salvando...":"Salvar alterações"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditModal(false)} style={{ alignItems:"center", marginTop:12 }}>
                    <Text style={{ fontFamily:A, color:C.muted, fontSize:13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.bg },
  scroll:       { paddingHorizontal:20, paddingTop:16 },
  pageHeader:   { marginBottom:20 },
  pageTitle:    { fontFamily:A, fontWeight:"800", fontSize:26, color:C.text, marginBottom:4 },
  pageSub:      { fontFamily:A, fontSize:13, color:C.muted },
  identityCard: { backgroundColor:C.surface, borderRadius:20, borderWidth:1, borderColor:C.border, padding:16, marginBottom:20 },
  avatarRow:    { flexDirection:"row", alignItems:"flex-start", gap:14 },
  avatar:       { width:56, height:56, borderRadius:28, backgroundColor:C.accent, alignItems:"center", justifyContent:"center" },
  avatarText:   { fontFamily:A, fontWeight:"800", fontSize:20, color:"#FFF" },
  userName:     { fontFamily:A, fontWeight:"700", fontSize:17, color:C.text, marginBottom:6 },
  infoLine:     { flexDirection:"row", alignItems:"center", gap:6, marginBottom:4 },
  infoLineText: { fontFamily:A, fontSize:12, color:C.muted },
  editBtn:      { flexDirection:"row", alignItems:"center", backgroundColor:C.accentBg, borderRadius:10, paddingHorizontal:10, paddingVertical:6, gap:5 },
  editBtnText:  { fontFamily:A, fontSize:12, color:C.accent },
  section:      { marginBottom:20 },
  sectionTitle: { fontFamily:A, fontWeight:"700", fontSize:11, color:C.muted, letterSpacing:0.5, textTransform:"uppercase", marginBottom:10 },
  card:         { backgroundColor:C.surface, borderRadius:18, borderWidth:1, borderColor:C.border, paddingHorizontal:16 },
  divider:      { height:1, backgroundColor:C.border },
  diagRow:      { flexDirection:"row", gap:12 },
  diagCard:     { flex:1, backgroundColor:C.surface, borderRadius:16, borderWidth:1, padding:16 },
  diagLabel:    { fontFamily:A, fontSize:11, color:C.muted, marginBottom:8 },
  diagVal:      { fontFamily:A, fontWeight:"800", fontSize:18 },
  quickLink:    { flexDirection:"row", alignItems:"center", backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, paddingHorizontal:14, paddingVertical:12, gap:10, marginBottom:8 },
  quickLinkText:{ fontFamily:A, fontSize:13, color:C.accent, flex:1 },
  logoutBtn:    { flexDirection:"row", alignItems:"center", justifyContent:"center", backgroundColor:"rgba(255,107,107,0.1)", borderRadius:16, borderWidth:1, borderColor:"rgba(255,107,107,0.25)", paddingVertical:14 },
  logoutText:   { fontFamily:A, fontWeight:"600", fontSize:14, color:C.red },
  modalOverlay: { flex:1, backgroundColor:"rgba(0,0,0,0.7)", justifyContent:"flex-end" },
  modalCard:    { backgroundColor:"#1C1A50", borderTopLeftRadius:24, borderTopRightRadius:24, padding:28, borderWidth:1, borderColor:C.border },
  modalTitle:   { fontFamily:A, fontWeight:"700", fontSize:18, color:C.text, marginBottom:4 },
  modalSub:     { fontFamily:A, fontSize:13, color:C.muted, marginBottom:20 },
  modalLabel:   { fontFamily:A, fontSize:12, color:C.muted, marginBottom:6 },
  modalInput:   { backgroundColor:"rgba(255,255,255,0.08)", borderRadius:12, height:46, paddingHorizontal:14, fontFamily:A, fontSize:14, color:C.text, borderWidth:1, borderColor:C.border },
  modalBtn:     { backgroundColor:C.accent, borderRadius:14, paddingVertical:14, alignItems:"center", marginTop:8 },
  modalBtnText: { fontFamily:A, fontWeight:"700", fontSize:15, color:"#FFF" },
});