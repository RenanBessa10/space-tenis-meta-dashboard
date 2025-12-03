import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  seedInMemory,
  buildDashboardSnapshot,
  importProdutos,
  addConcorrente,
  listConcorrentes,
  updateConcorrente,
  deleteConcorrente,
  buildAnalyticsSnapshot,
  listarConfiguracoesAlertas,
  marcarAlertaComoLido,
  listarAssociacoes,
  salvarAssociacao,
  removerAssociacao,
  listProdutos
} from './data/store.js'
import { importarProdutosDoMeuEcommerce } from './services/ecommerceImporter.js'
import { coletarPrecosParaProduto } from './services/competitorPriceService.js'
import { iniciarColetaDiaria } from './jobs/dailyCollector.js'
import { configurarAlerta, obterPainelDeAlertas } from './services/alertService.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

seedInMemory()
iniciarColetaDiaria()

app.get('/api/dashboard', async (_req, res) => {
  const snapshot = await buildDashboardSnapshot()
  res.json(snapshot)
})

app.get('/api/produtos', async (_req, res) => {
  const produtos = await listProdutos()
  res.json(produtos)
})

app.get('/api/concorrentes', async (_req, res) => {
  const concorrentes = await listConcorrentes()
  res.json(concorrentes)
})

app.post('/api/importar', async (_req, res) => {
  const produtos = await importarProdutosDoMeuEcommerce()
  const lista = await importProdutos(produtos)
  res.json({ mensagem: 'Importação concluída', produtos: lista })
})

app.post('/api/concorrentes', async (req, res) => {
  const { nome, url_base } = req.body
  if (!nome || !url_base) {
    return res.status(400).json({ erro: 'Nome e url_base são obrigatórios' })
  }
  if (!isValidUrl(url_base)) {
    return res.status(400).json({ erro: 'URL base inválida' })
  }
  const conc = await addConcorrente({ nome, url_base })
  res.json(conc)
})

app.patch('/api/concorrentes/:id', async (req, res) => {
  const { id } = req.params
  const { nome, url_base } = req.body
  if (!nome || !url_base) {
    return res.status(400).json({ erro: 'Nome e url_base são obrigatórios' })
  }
  if (!isValidUrl(url_base)) {
    return res.status(400).json({ erro: 'URL base inválida' })
  }
  const atualizado = await updateConcorrente(id, { nome, url_base })
  res.json(atualizado)
})

app.delete('/api/concorrentes/:id', async (req, res) => {
  const { id } = req.params
  await deleteConcorrente(id)
  res.json({ mensagem: 'Concorrente removido' })
})

app.post('/api/coletar-agora', async (_req, res) => {
  const produtos = await listProdutos()
  for (const produto of produtos) {
    await coletarPrecosParaProduto(produto)
  }
  res.json({ mensagem: 'Coleta manual concluída' })
})

app.get('/api/analytics', async (req, res) => {
  const { produtoId, concorrenteId, periodo } = req.query
  const analytics = await buildAnalyticsSnapshot({ produtoId, concorrenteId, periodo })
  res.json(analytics)
})

app.get('/api/associacoes', async (_req, res) => {
  const associacoes = await listarAssociacoes()
  res.json(associacoes)
})

function isValidUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

app.post('/api/associacoes', async (req, res) => {
  const { produto_id, concorrente_id, url_produto } = req.body
  if (!produto_id || !concorrente_id || !url_produto) {
    return res.status(400).json({ erro: 'produto_id, concorrente_id e url_produto são obrigatórios' })
  }
  if (!isValidUrl(url_produto)) {
    return res.status(400).json({ erro: 'URL inválida' })
  }
  const registro = await salvarAssociacao({ produto_id, concorrente_id, url_produto })
  const associacoes = await listarAssociacoes()
  res.json({ registro, associacoes })
})

app.patch('/api/associacoes/:id', async (req, res) => {
  const { id } = req.params
  const { produto_id, concorrente_id, url_produto } = req.body
  if (!produto_id || !concorrente_id || !url_produto) {
    return res.status(400).json({ erro: 'produto_id, concorrente_id e url_produto são obrigatórios' })
  }
  if (!isValidUrl(url_produto)) {
    return res.status(400).json({ erro: 'URL inválida' })
  }
  await salvarAssociacao({ id, produto_id, concorrente_id, url_produto })
  const associacoes = await listarAssociacoes()
  res.json({ mensagem: 'Associação atualizada', associacoes })
})

app.delete('/api/associacoes/:id', async (req, res) => {
  const { id } = req.params
  await removerAssociacao(id)
  const associacoes = await listarAssociacoes()
  res.json({ mensagem: 'Associação removida', associacoes })
})

app.get('/api/alertas', async (_req, res) => {
  const painel = await obterPainelDeAlertas()
  res.json(painel)
})

app.get('/api/alertas/configuracao', async (_req, res) => {
  const configs = await listarConfiguracoesAlertas()
  res.json(configs)
})

app.post('/api/alertas/configuracao', async (req, res) => {
  const { produto_id, threshold_percent } = req.body
  if (!produto_id || threshold_percent === undefined) {
    return res.status(400).json({ erro: 'produto_id e threshold_percent são obrigatórios' })
  }
  const payload = await configurarAlerta({ produto_id, threshold_percent: Number(threshold_percent) })
  res.json(payload)
})

app.patch('/api/alertas/:id/lido', async (req, res) => {
  const { id } = req.params
  await marcarAlertaComoLido(id)
  const painel = await obterPainelDeAlertas()
  res.json(painel)
})

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

export default app
