// ============================================================
// EDGE FUNCTION: enviar-convite   (roda no SUPABASE)
// Chamada pelo app (supabase.functions.invoke) com o login do usuário.
// Deploy NORMAL (com verificação de JWT):
//   supabase functions deploy enviar-convite
// Secrets necessários: RESEND_API_KEY, APP_URL
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já fornece)
// ============================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const APP_URL = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Enquanto você não verifica um domínio no Resend, use o remetente de teste
// (ele só entrega para o e-mail dono da conta Resend).
const FROM = Deno.env.get("EMAIL_FROM") ?? "Glico <onboarding@resend.dev>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function rest(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return r.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // 1) Quem está chamando? (valida o login do usuário)
    const auth = req.headers.get("Authorization") ?? "";
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_KEY, Authorization: auth },
    });
    if (!u.ok) return json({ erro: "Não autenticado" }, 401);
    const user = await u.json();

    // 2) Só o convite id vem do app; todo o resto vem do banco
    const { conviteId } = await req.json();
    if (!conviteId) return json({ erro: "conviteId ausente" }, 400);

    const convites = await rest(
      `convites_familiares?id=eq.${encodeURIComponent(conviteId)}&select=id,paciente_id,nome,email,relacao,token,expira_em,status`,
    );
    const convite = convites?.[0];
    if (!convite) return json({ erro: "Convite não encontrado" }, 404);
    if (convite.paciente_id !== user.id) return json({ erro: "Sem permissão" }, 403);
    if (convite.status !== "pendente") return json({ erro: "Convite não está pendente" }, 409);

    const perfis = await rest(`perfis?id=eq.${user.id}&select=nome_completo`);
    const nomePaciente = perfis?.[0]?.nome_completo ?? "Um familiar";

    if (!APP_URL) return json({ erro: "APP_URL não configurada nos secrets" }, 500);

    const aceitarUrl = `${APP_URL}/?token=${convite.token}&acao=aceitar`;
    const recusarUrl = `${APP_URL}/?token=${convite.token}&acao=recusar`;
    const verUrl = `${APP_URL}/?token=${convite.token}&acao=ver`;
    const expira = convite.expira_em ? new Date(convite.expira_em).toLocaleDateString("pt-BR") : "—";

    const html = `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#0B0A24;border-radius:20px;max-width:520px;width:100%;">
<tr><td style="padding:28px 32px 8px;">
<h1 style="color:#F5F3FF;font-size:22px;margin:0 0 8px;">Você foi convidado(a) 👋</h1>
<p style="color:#A5A3C7;font-size:14px;line-height:22px;margin:0;">
<strong style="color:#F5F3FF;">${esc(nomePaciente)}</strong> convidou você, <strong style="color:#F5F3FF;">${esc(convite.nome)}</strong>,
para acompanhar a jornada de saúde dele(a) no Glico como <strong style="color:#F5F3FF;">${esc(convite.relacao)}</strong>.</p></td></tr>
<tr><td style="padding:16px 32px;"><table width="100%"><tr>
<td style="padding-right:6px;"><a href="${aceitarUrl}" style="display:block;background:#7C5CFF;color:#fff;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">✓ Aceitar convite</a></td>
<td style="padding-left:6px;"><a href="${recusarUrl}" style="display:block;color:#FF6B6B;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid #FF6B6B;">Recusar</a></td>
</tr></table></td></tr>
<tr><td style="padding:0 32px 24px;"><p style="color:#A5A3C7;font-size:12px;line-height:18px;margin:0;">
Depois de aceitar, você vê os dados autorizados direto no navegador (sem instalar o app) e pode voltar a qualquer momento por este link:<br>
<a href="${verUrl}" style="color:#7C5CFF;">Ver dados compartilhados</a><br><br>
O convite expira em ${esc(expira)}. Se não esperava este e-mail, ignore.</p></td></tr>
</table></td></tr></table></body></html>`;

    // 3) Envia pelo Resend
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [convite.email],
        subject: `${nomePaciente} convidou você para o Espaço Familiar do Glico`,
        html,
      }),
    });
    if (!r.ok) {
      const detalhe = await r.text();
      console.error("Resend:", detalhe);
      return json({ erro: "Resend recusou o envio", detalhe }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ erro: "Erro interno" }, 500);
  }
});