// ============================================================
// EDGE FUNCTION: convite-publico   (roda no SUPABASE)
// Chamada PELA PÁGINA WEB (web/index.html) quando o familiar clica no e-mail.
// Devolve JSON (o Supabase NÃO renderiza HTML em *.supabase.co).
// Deploy SEM verificação de JWT (o familiar não tem conta):
//   supabase functions deploy convite-publico --no-verify-jwt
// ============================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const H = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
const rest = async (path: string, init: RequestInit = {}) =>
  (await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } })).json();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const acao = url.searchParams.get("acao") ?? "ver";
    if (!/^[a-f0-9]{64}$/.test(token)) return json({ erro: "Link inválido" }, 400);

    const rows = await rest(
      `convites_familiares?token=eq.${token}&select=id,paciente_id,nome,status,permissoes,expira_em`,
    );
    const c = rows?.[0];
    if (!c) return json({ erro: "Convite não encontrado" }, 404);

    const perfil = (await rest(`perfis?id=eq.${c.paciente_id}&select=nome_completo`))?.[0];
    const paciente = perfil?.nome_completo ?? "Paciente";
    const expirado = c.expira_em && new Date(c.expira_em) < new Date();

    // ---------- aceitar / recusar ----------
    if (acao === "aceitar" || acao === "recusar") {
      if (c.status === "pendente") {
        if (expirado) return json({ erro: "Este convite expirou. Peça um novo." }, 410);
        const novo = acao === "aceitar" ? "aceito" : "recusado";
        await rest(`convites_familiares?id=eq.${c.id}`, { method: "PATCH", body: JSON.stringify({ status: novo }) });
        c.status = novo;
      }
      return json({ ok: true, status: c.status, paciente, nome: c.nome });
    }

    // ---------- ver dados ----------
    if (c.status !== "aceito") return json({ erro: "Convite ainda não aceito", status: c.status, paciente }, 403);

    const p = c.permissoes ?? {};
    const desde = new Date(Date.now() - 30 * 86400000).toISOString();
    const out: Record<string, unknown> = { paciente, permissoes: p, atualizadoEm: new Date().toISOString() };

    if (p.glicemia || p.historico || p.graficos || p.relatorios || p.alertas) {
      const l: any[] = await rest(
        `leituras_glicemia?user_id=eq.${c.paciente_id}&medido_em=gte.${desde}&select=valor,momento,medido_em&order=medido_em.asc`,
      );
      const vals = l.map((x) => Number(x.valor));
      if (p.glicemia) out.ultima = l.length ? l[l.length - 1] : null;
      if (p.historico) out.historico = l.slice(-30).reverse();
      if (p.graficos) out.grafico = l.map((x) => ({ valor: x.valor, medido_em: x.medido_em }));
      if (p.relatorios && vals.length) {
        out.resumo = {
          media: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          minima: Math.min(...vals),
          maxima: Math.max(...vals),
          noAlvo: Math.round((vals.filter((v) => v >= 70 && v <= 180).length / vals.length) * 100),
          total: vals.length,
        };
      }
      if (p.alertas) {
        const sete = Date.now() - 7 * 86400000;
        const rec = l.filter((x) => new Date(x.medido_em).getTime() >= sete);
        out.alertas = {
          altas: rec.filter((x) => x.valor > 180).length,
          baixas: rec.filter((x) => x.valor < 70).length,
        };
      }
    }

    const tipos: string[] = [];
    if (p.alimentacao) tipos.push("alimentacao");
    if (p.atividade) tipos.push("atividade");
    if (p.medicamentos) tipos.push("medicacao", "insulina");
    if (tipos.length) {
      out.registros = await rest(
        `registros_diarios?user_id=eq.${c.paciente_id}&tipo=in.(${tipos.join(",")})&registrado_em=gte.${desde}&select=tipo,dados,registrado_em&order=registrado_em.desc&limit=60`,
      );
    }
    return json(out);
  } catch (e) {
    console.error(e);
    return json({ erro: "Erro interno" }, 500);
  }
});