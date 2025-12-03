# Monitoramento de Preços – Knowledge Base

## Visão Geral
- **Objetivo:** Monitorar diariamente os preços de tênis esportivos no ecommerce próprio e compará-los automaticamente com concorrentes.
- **Usuários:** Donos de ecommerce, analistas de preço e gestores de produto.
- **Problema Resolvido:** Dificuldade em acompanhar mudanças rápidas de preço nos concorrentes e tomar decisões baseadas em dados.

## Arquitetura
- **Stack:** React + Tailwind + Supabase.
- **Tabelas:**
  - `produtos` { id, nome, sku, url, preco_atual }
  - `concorrentes` { id, nome, url_base }
  - `precos_coletados` { id, produto_id, concorrente_id, preco, data_coleta }
  - `alertas` { id, produto_id, concorrente_id, diff_percent, mensagem, data }

## Funcionalidades
1. Coleta diária de preços simulada via função mock.
2. Histórico de preços por produto e concorrente.
3. Dashboard com gráficos e comparativos percentuais.
4. Alertas internos quando concorrentes reduzem preço.
5. CRUD de concorrentes e associação produto → URLs concorrentes.

## Diretrizes
- Manter UI limpa e profissional com gráficos avançados.
- Calcular diferença percentual sempre com base no menor preço do concorrente.
- Não executar scraping real nesta fase; usar apenas mock até integração final.
- Nunca permitir concorrente sem URL válida.

## Design System
- **Cores:** Azul profissional + neutros.
- **Fonte:** Inter ou Roboto.
- **Componentes:** Cards, tabelas, badges e gráficos (Recharts).
- **Layout:** Dashboard modular, espaçamentos amplos e responsivo.
