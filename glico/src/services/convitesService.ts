import { supabase } from "../lib/supabase";

export type StatusConvite = "pendente" | "aceito" | "recusado";

export type PermissoesConvite = {
  glicemia: boolean; historico: boolean; graficos: boolean;
  alimentacao: boolean; atividade: boolean; medicamentos: boolean;
  alertas: boolean; relatorios: boolean;
};

export interface ConviteFamiliar {
  id: string; pacienteId: string; nome: string; email: string;
  relacao: string; status: StatusConvite; permissoes: PermissoesConvite;
  criadoEm: string; expiraEm?: string;
}

// ── helpers ────────────────────────────────────────────────────────────────
function toConvite(row: any): ConviteFamiliar {
  return {
    id:         row.id,
    pacienteId: row.paciente_id,
    nome:       row.nome,
    email:      row.email,
    relacao:    row.relacao,
    status:     row.status,
    permissoes: row.permissoes,
    criadoEm:  row.criado_em,
    expiraEm:  row.expira_em ?? undefined,
  };
}

// ── criar + enviar e-mail real via Supabase Edge Function ──────────────────
export class EmailNaoEnviadoError extends Error {
  convite: ConviteFamiliar;
  constructor(msg: string, convite: ConviteFamiliar) { super(msg); this.convite = convite; }
}

export async function criarConvite(
  convite: Pick<ConviteFamiliar, "nome" | "email" | "relacao" | "permissoes">
): Promise<ConviteFamiliar> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + 7); // expira em 7 dias

  const { data, error } = await supabase
    .from("convites_familiares")
    .insert({
      paciente_id: user.id,
      nome:        convite.nome,
      email:       convite.email,
      relacao:     convite.relacao,
      permissoes:  convite.permissoes,
      status:      "pendente",
      criado_em:   new Date().toISOString(),
      expira_em:   expiraEm.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  const criado = toConvite(data);

  // Envia o e-mail de verdade (Edge Function -> Resend). O servidor busca
  // nome do paciente, token e destinatário no banco: o app só manda o id.
  const { data: resp, error: fnError } = await supabase.functions.invoke("enviar-convite", {
    body: { conviteId: data.id },
  });
  if (fnError || (resp && resp.erro)) {
    throw new EmailNaoEnviadoError(resp?.detalhe || resp?.erro || fnError?.message || "Falha ao enviar e-mail", criado);
  }

  return criado;
}

export async function buscarConvites(_pacienteId?: string): Promise<ConviteFamiliar[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("convites_familiares")
    .select("*")
    .eq("paciente_id", user.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toConvite);
}

export async function buscarConvitePorId(conviteId: string): Promise<ConviteFamiliar | null> {
  const { data, error } = await supabase
    .from("convites_familiares")
    .select("*")
    .eq("id", conviteId)
    .single();

  if (error) return null;
  return toConvite(data);
}

export async function atualizarStatusConvite(conviteId: string, status: StatusConvite): Promise<ConviteFamiliar | null> {
  const { data, error } = await supabase
    .from("convites_familiares")
    .update({ status })
    .eq("id", conviteId)
    .select()
    .single();

  if (error) return null;
  return toConvite(data);
}

export async function aceitarConvite(conviteId: string): Promise<ConviteFamiliar | null> {
  return atualizarStatusConvite(conviteId, "aceito");
}

export async function recusarConvite(conviteId: string): Promise<ConviteFamiliar | null> {
  return atualizarStatusConvite(conviteId, "recusado");
}

export async function atualizarPermissoesConvite(conviteId: string, permissoes: PermissoesConvite): Promise<ConviteFamiliar | null> {
  const { data, error } = await supabase
    .from("convites_familiares")
    .update({ permissoes })
    .eq("id", conviteId)
    .select()
    .single();

  if (error) return null;
  return toConvite(data);
}

export async function excluirConvite(conviteId: string): Promise<boolean> {
  const { error } = await supabase
    .from("convites_familiares")
    .delete()
    .eq("id", conviteId);

  return !error;
}