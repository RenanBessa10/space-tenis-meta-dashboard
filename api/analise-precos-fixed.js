// api/analise-precos.js
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS para permitir chamadas de qualquer origem (Codex, local etc.)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Buscar últimos preços coletados + nomes de produto e concorrente
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
      .limit(100);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({ error: "Erro ao buscar dados no Supabase" });
    }

    // 2. Montar mensagem para o ChatGPT
    const userContent =
      "Você é um analista de preços para um e-commerce de tênis de corrida (Space Tênis)." +
      " Analise os dados de preços abaixo (produto, preço atual, diferença para os concorrentes e data) e responda em tópicos:" +
      "\n\n1) Quais produtos estão com preço pior que os concorrentes\n" +
      "2) Onde temos oportunidade de reduzir ou aumentar preço\n" +
      "3) Sugestões práticas de ações promocionais ou ajustes\n\n" +
      "Dados:\n" +
      JSON.stringify(data, null, 2);

    // 3. Chamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um consultor de pricing especialista em e-commerce esportivo. Seja direto, objetivo e fale em português do Brasil.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const texto = completion.choices[0].message.content;

    return res.status(200).json({ analise: texto });
  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ error: "Erro interno ao gerar análise" });
  }
}

