import { registrarPreco, listConcorrentes, listProductLinks } from '../data/store.js'
import { avaliarPrecoParaAlertas } from './alertService.js'

// Mock de scraping: gera um preço aleatório ao redor de uma âncora base
function mockScrapePrice(basePrice) {
  const variacao = (Math.random() * 120 - 40).toFixed(2)
  return Number(basePrice) + Number(variacao)
}

export async function coletarPrecosParaProduto(produto) {
  const [concorrentes, links] = await Promise.all([
    listConcorrentes(),
    listProductLinks(produto.id)
  ])
  const resultados = []

  const linksParaColetar = links.map((link) => ({
    concorrente: concorrentes.find((c) => c.id === link.concorrente_id),
    url_produto: link.url_produto
  }))

  for (const { concorrente } of linksParaColetar) {
    if (!concorrente) continue
    const preco = mockScrapePrice(produto.preco_atual)
    const registro = await registrarPreco({
      produto_id: produto.id,
      concorrente_id: concorrente.id,
      preco
    })
    await avaliarPrecoParaAlertas({ produto, concorrente, precoConcorrente: preco })
    resultados.push({ ...registro, concorrente })
  }

  return resultados
}
