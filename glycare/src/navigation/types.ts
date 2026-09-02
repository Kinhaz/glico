// =========================================
// GlyCare — rotas do app
// =========================================

// Telas fora do menu (autenticação + onboarding)
export type RootStackParamList = {
  Inicio:        undefined;
  Login:         undefined;
  Cadastrar:     undefined;
  Questionario:  { dadosCadastro: DadosCadastro };  // ← recebe dados do cadastro
  Resultado:     { respostas: Record<string, string>; dadosCadastro: DadosCadastro };
  Registrar:     undefined;
  Receitas:      undefined;
  Exercicios:    undefined;
  RecipeDetail:  undefined;
};

// Dados passados do Cadastro para o Questionário
export interface DadosCadastro {
  nome:        string;
  email:       string;
  senha:       string;
  dataNasc:    string;
}

// Telas dentro do menu lateral (Drawer)
export type DrawerParamList = {
  Home:         undefined;   // ← Home no menu = tela principal
  Perfil:         undefined;
  EspacoFamiliar: undefined;
  Monitorar:      undefined;
  Relatorios:     undefined;
  EvIMC:          undefined;
  Configuracoes:  undefined;
};
