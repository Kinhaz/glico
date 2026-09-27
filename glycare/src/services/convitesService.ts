export type StatusConvite = "pendente" | "aceito" | "recusado";

export type PermissoesConvite = {
  glicemia: boolean;
  historico: boolean;
  graficos: boolean;
  alimentacao: boolean;
  atividade: boolean;
  medicamentos: boolean;
  alertas: boolean;
  relatorios: boolean;
};

export interface ConviteFamiliar {
  id: string;
  pacienteId: string;
  nome: string;
  email: string;
  relacao: string;
  status: StatusConvite;
  permissoes: PermissoesConvite;
  criadoEm: string;
  expiraEm?: string;
}

/**
 * MOCK TEMPORÁRIO
 *
 * Futuramente esta camada será substituída por Supabase
 * e pelo serviço real de envio de e-mails.
 */
let convites: ConviteFamiliar[] = [];

const gerarId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export async function criarConvite(
  convite: Omit<ConviteFamiliar, "id" | "status" | "criadoEm">
): Promise<ConviteFamiliar> {
  const novoConvite: ConviteFamiliar = {
    ...convite,
    id: gerarId(),
    status: "pendente",
    criadoEm: new Date().toISOString(),
  };

  convites.push(novoConvite);
  console.log("📧 Convite simulado enviado para:", novoConvite.email);

  return novoConvite;
}

export async function buscarConvites(
  pacienteId: string
): Promise<ConviteFamiliar[]> {
  return convites.filter((convite) => convite.pacienteId === pacienteId);
}

export async function buscarConvitePorId(
  conviteId: string
): Promise<ConviteFamiliar | null> {
  return convites.find((convite) => convite.id === conviteId) ?? null;
}

export async function atualizarStatusConvite(
  conviteId: string,
  status: StatusConvite
): Promise<ConviteFamiliar | null> {
  const indice = convites.findIndex((convite) => convite.id === conviteId);

  if (indice === -1) return null;

  convites[indice] = {
    ...convites[indice],
    status,
  };

  return convites[indice];
}

export async function aceitarConvite(
  conviteId: string
): Promise<ConviteFamiliar | null> {
  return atualizarStatusConvite(conviteId, "aceito");
}

export async function recusarConvite(
  conviteId: string
): Promise<ConviteFamiliar | null> {
  return atualizarStatusConvite(conviteId, "recusado");
}

export async function atualizarPermissoesConvite(
  conviteId: string,
  permissoes: PermissoesConvite
): Promise<ConviteFamiliar | null> {
  const indice = convites.findIndex((convite) => convite.id === conviteId);

  if (indice === -1) return null;

  convites[indice] = {
    ...convites[indice],
    permissoes,
  };

  return convites[indice];
}

export async function excluirConvite(
  conviteId: string
): Promise<boolean> {
  const tamanhoAnterior = convites.length;

  convites = convites.filter((convite) => convite.id !== conviteId);

  return convites.length < tamanhoAnterior;
}
