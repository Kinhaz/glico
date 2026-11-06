import { supabase } from "./supabase";

/**
 * Chamado na abertura do app (HomeScreen useEffect).
 * - Se hoje != ultima_data: verifica registros de ontem e incrementa/reseta streak
 */
export async function verificarEAtualizarStreak(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const hoje = new Date().toISOString().split("T")[0];

    const { data: seq } = await supabase
      .from("sequencia_autocuidado")
      .select("dias_streak, ultima_data")
      .eq("user_id", user.id)
      .single();

    if (!seq) {
      await supabase.from("sequencia_autocuidado").insert({
        user_id: user.id, dias_streak: 0, ultima_data: hoje,
        updated_at: new Date().toISOString(),
      });
      return 0;
    }

    if (seq.ultima_data === hoje) return seq.dias_streak;

    // Novo dia — verifica se ontem teve registros
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split("T")[0];

    const { data: registrosOntem } = await supabase
      .from("registros_diarios")
      .select("id")
      .eq("user_id", user.id)
      .gte("registrado_em", `${ontemStr}T00:00:00.000Z`)
      .lte("registrado_em", `${ontemStr}T23:59:59.999Z`)
      .in("tipo", ["alimentacao", "atividade", "agua"]);

    const tevRegistros = (registrosOntem?.length ?? 0) > 0;
    const novoStreak   = tevRegistros ? seq.dias_streak + 1 : 0;

    await supabase.from("sequencia_autocuidado").update({
      dias_streak: novoStreak, ultima_data: hoje,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    return novoStreak;
  } catch (err) {
    console.error("Erro daily reset:", err);
    return 0;
  }
}