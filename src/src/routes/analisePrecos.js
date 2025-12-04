import { Router } from "express";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/analise-precos
router.get("/", async (req, res) => {
  try {
    // 1. Buscar dados do Supabase
    const { data, error } = await supabase
      .from("precos_coletados")
      .select(`
        preco,
        diferenca_valor,
        data_coleta,
        produtos (nome),
        concorrentes (nome)
      `)
      .order("data_coleta", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar dados:", error);
      return res.status(500).json({ error: "Erro ao consultar Supabase." });
    }

    // 2. Montar conteúdo para IA
    const userContent =
      "Analise os preços abaixo do e-commerce Space Tênis e liste:\n" +
      "1) Produtos com preço pior que concorrentes\n" +
      "2) Oportunidades de ajuste de preço\n" +
      "3) Sugestões de ação imediata\n\n" +
      JSON.stringify(data, null, 2);

    // 3. Chamada para OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Você é especialista em pricing de e-commerce." },
        { role: "user", content: userContent },
      ],
    });

    return res.json({ analise: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao gerar análise." });
  }
});

export default router;
