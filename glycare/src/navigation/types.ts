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
  Registrar:     undefined;
  GlycareOne:    undefined;
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
  GlycareOne:     undefined;
};