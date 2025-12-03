import {
  obterConfiguracaoPorProduto,
  registrarAlerta,
  salvarConfiguracaoAlerta,
  listarConfiguracoesAlertas,
  buildAlertasSnapshot,
  marcarAlertaComoLido
} from '../data/store.js'

function calcularDiffPercent(precoMeu, precoConcorrente) {
  return ((precoMeu - precoConcorrente) / precoConcorrente) * 100
}

export async function avaliarPrecoParaAlertas({ produto, concorrente, precoConcorrente }) {
  const config = await obterConfiguracaoPorProduto(produto.id)
  if (!config || config.threshold_percent === undefined || config.threshold_percent === null) return null

  const threshold = Number(config.threshold_percent)
  if (Number.isNaN(threshold) || threshold <= 0) return null

  const limite = produto.preco_atual * (1 - threshold / 100)
  if (precoConcorrente >= limite) return null

  const diff_percent = calcularDiffPercent(produto.preco_atual, precoConcorrente)

  return registrarAlerta({
    produto_id: produto.id,
    concorrente_id: concorrente.id,
    preco_concorrente: precoConcorrente,
    preco_meu: produto.preco_atual,
    diff_percent,
    threshold_percent: threshold,
    mensagem: `${concorrente.nome} reduziu para ${precoConcorrente.toFixed(2)}, abaixo do limite configurado (${threshold}%).`
  })
}

export async function configurarAlerta(payload) {
  return salvarConfiguracaoAlerta(payload)
}

export async function listarConfiguracoes() {
  return listarConfiguracoesAlertas()
}

export async function obterPainelDeAlertas() {
  return buildAlertasSnapshot()
}

export async function marcarComoLido(id) {
  return marcarAlertaComoLido(id)
}
