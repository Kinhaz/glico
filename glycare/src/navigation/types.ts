// =========================================
// GlyCare — rotas do app
// =========================================

export type RootStackParamList = {
  Inicio:        undefined;
  Login:         undefined;
  Cadastrar:     undefined;
  Questionario:  { dadosCadastro: DadosCadastro };
  Resultado:     { respostas: Record<string, string>; dadosCadastro: DadosCadastro };
  Home:          undefined;   // ← entrada no DrawerNavigator (era MainApp)
  Registrar:     undefined;
  Receitas:      undefined;
  Exercicios:    undefined;
  RecipeDetail:  undefined;
};

export interface DadosCadastro {
  nome:     string;
  email:    string;
  senha:    string;
  dataNasc: string;
}

export type DrawerParamList = {
  Home:           undefined;
  Perfil:         undefined;
  EspacoFamiliar: undefined;
  Monitorar:      undefined;
  Relatorios:     undefined;
  EvIMC:          undefined;
  Configuracoes:  undefined;   // ← tela de configurações adicionada
};
