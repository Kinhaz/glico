// =========================================
// GlyCare — rotas do app
// =========================================

// Telas fora do menu (autenticação)
export type RootStackParamList = {
  Inicio:    undefined;
  Login:     undefined;
  Cadastrar: undefined;
  MainApp:   undefined;
};

// Telas dentro do menu lateral
export type DrawerParamList = {
  Perfil:         undefined;
  EspacoFamiliar: undefined;
  Monitorar:      undefined;
  Relatorios:     undefined;
  Configuracoes:  undefined;
};
