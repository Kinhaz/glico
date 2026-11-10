import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", text:"#F5F3FF", muted:"#A5A3C7" };
const LOGO = require("../../assets/logo.png");

type Props = { navigation: NativeStackNavigationProp<RootStackParamList,"Inicio"> };

export default function InicioScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.logoWrap}>
          <Image source={LOGO} style={s.logo} resizeMode="contain" />
        </View>
        <Text style={s.title}>Controle seu{"\n"}diabetes com{"\n"}inteligência</Text>
        <Text style={s.sub}>Acompanhe sua glicemia, medicações e hábitos num só lugar.</Text>
        <View style={s.buttons}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate("Cadastrar")}>
            <Text style={s.primaryBtnText}>Criar conta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={s.secondaryBtnText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:C.bg },
  container:      { flex:1, paddingHorizontal:28, justifyContent:"center" },
  logoWrap:       { alignItems:"center", marginBottom:48 },
  logo:           { width:112, height:112 },
  title:          { fontFamily:A, fontWeight:"800", fontSize:34, color:C.text, lineHeight:42, marginBottom:16 },
  sub:            { fontFamily:A, fontSize:15, color:C.muted, lineHeight:22, marginBottom:48 },
  buttons:        { gap:14 },
  primaryBtn:     { backgroundColor:C.accent, borderRadius:16, paddingVertical:16, alignItems:"center" },
  primaryBtnText: { fontFamily:A, fontWeight:"700", fontSize:16, color:"#FFF" },
  secondaryBtn:   { backgroundColor:C.surface, borderRadius:16, paddingVertical:16, alignItems:"center", borderWidth:1, borderColor:C.border },
  secondaryBtnText:{ fontFamily:A, fontWeight:"600", fontSize:16, color:C.text },
});