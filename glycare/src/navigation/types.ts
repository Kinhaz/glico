// =========================================
// GlyCare — rotas do app
// =========================================

export type RootStackParamList = {
  Inicio:        undefined;
  Login:         undefined;
  Cadastrar:     undefined;
  Questionario:  { dadosCadastro: DadosCadastro };
  Resultado:     { respostas: Record<string, string>; dadosCadastro: DadosCadastro };
  Home:          undefined;
  Receitas:      undefined;
  Exercicios:    undefined;
  RecipeDetail:  undefined;
  Saude:         undefined;
  Analise:       undefined;
  Registrar:     undefined;   // ← saiu do Drawer, virou Stack
  FamiliarDetalhes: { familiarId: string; };
};

export interface DadosCadastro {
  nome: string; email: string; senha: string; dataNasc: string;
}

export type DrawerParamList = {
  Home:           undefined;
  Perfil:         undefined;
  EspacoFamiliar: undefined;
  Monitorar:      undefined;
  Relatorios:     undefined;
  EvIMC:          undefined;
  Configuracoes:  undefined;
  // Registrar removido do Drawer
};