import { v4 as uuid } from 'uuid'
import { getSupabaseClient } from '../lib/supabase.js'

const supabase = getSupabaseClient()

// In-memory fallback store for local development
const memoryDb = {
  produtos: [],
  concorrentes: [],
  precos_coletados: [],
  alertas_configuracao: [],
  alertas: [],
  produto_concorrente_urls: []
}

function nowISO() {
  return new Date().toISOString()
}

async function persist(table, payload) {
  if (supabase) {
    await supabase.from(table).insert(payload)
  } else {
    memoryDb[table].push(payload)
  }
}

async function upsert(table, payload, matchKeys) {
  if (supabase) {
    await supabase.from(table).upsert(payload, { onConflict: matchKeys.join(',') })
  } else {
    const existingIndex = memoryDb[table].findIndex((row) => matchKeys.every((key) => row[key] === payload[key]))
    if (existingIndex !== -1) {
      memoryDb[table][existingIndex] = { ...memoryDb[table][existingIndex], ...payload }
    } else {
      memoryDb[table].push(payload)
    }
  }
}

export async function listProdutos() {
  if (supabase) {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    return data ?? []
  }
  return memoryDb.produtos
}

export async function importProdutos(produtos) {
  for (const produto of produtos) {
    await upsert('produtos', produto, ['sku'])
  }
  return listProdutos()
}

export async function salvarConfiguracaoAlerta(config) {
  const payload = { id: config.id || uuid(), ...config }
  await upsert('alertas_configuracao', payload, ['produto_id'])
  return payload
}

export async function listarConfiguracoesAlertas() {
  if (supabase) {
    const { data } = await supabase.from('alertas_configuracao').select('*')
    return data ?? []
  }
  return memoryDb.alertas_configuracao
}

export async function obterConfiguracaoPorProduto(produto_id) {
  const configs = await listarConfiguracoesAlertas()
  return configs.find((c) => c.produto_id === produto_id) || null
}

export async function addConcorrente(concorrente) {
  const payload = { id: concorrente.id || uuid(), ...concorrente }
  await upsert('concorrentes', payload, ['id'])
  return payload
}

export async function updateConcorrente(id, changes) {
  if (supabase) {
    await supabase.from('concorrentes').update(changes).eq('id', id)
  } else {
    const idx = memoryDb.concorrentes.findIndex((c) => c.id === id)
    if (idx !== -1) {
      memoryDb.concorrentes[idx] = { ...memoryDb.concorrentes[idx], ...changes }
    }
  }
  const list = await listConcorrentes()
  return list.find((c) => c.id === id) || null
}

export async function deleteConcorrente(id) {
  if (supabase) {
    await supabase.from('concorrentes').delete().eq('id', id)
    await supabase.from('produto_concorrente_urls').delete().eq('concorrente_id', id)
  } else {
    memoryDb.concorrentes = memoryDb.concorrentes.filter((c) => c.id !== id)
    memoryDb.produto_concorrente_urls = memoryDb.produto_concorrente_urls.filter((link) => link.concorrente_id !== id)
  }
}

export async function listConcorrentes() {
  if (supabase) {
    const { data } = await supabase.from('concorrentes').select('*').order('nome')
    return data ?? []
  }
  return memoryDb.concorrentes
}

export async function listarAssociacoes() {
  const [produtos, concorrentes, links] = await Promise.all([
    listProdutos(),
    listConcorrentes(),
    listProductLinks()
  ])

  return links.map((link) => ({
    ...link,
    produto: produtos.find((p) => p.id === link.produto_id),
    concorrente: concorrentes.find((c) => c.id === link.concorrente_id)
  }))
}

export async function listProductLinks(produtoId) {
  if (supabase) {
    const query = supabase.from('produto_concorrente_urls').select('*')
    if (produtoId) query.eq('produto_id', produtoId)
    const { data } = await query
    return data ?? []
  }
  return produtoId
    ? memoryDb.produto_concorrente_urls.filter((l) => l.produto_id === produtoId)
    : memoryDb.produto_concorrente_urls
}

export async function salvarAssociacao({ id, produto_id, concorrente_id, url_produto }) {
  const payload = { id: id || uuid(), produto_id, concorrente_id, url_produto }
  await upsert('produto_concorrente_urls', payload, ['id'])
  return payload
}

export async function removerAssociacao(id) {
  if (supabase) {
    await supabase.from('produto_concorrente_urls').delete().eq('id', id)
  } else {
    memoryDb.produto_concorrente_urls = memoryDb.produto_concorrente_urls.filter((link) => link.id !== id)
  }
}

export async function registrarPreco({ produto_id, concorrente_id, preco, data_coleta }) {
  const payload = { id: uuid(), produto_id, concorrente_id, preco, data_coleta: data_coleta || nowISO() }
  await persist('precos_coletados', payload)
  return payload
}

export async function registrarAlerta({
  produto_id,
  concorrente_id,
  preco_concorrente,
  preco_meu,
  diff_percent,
  threshold_percent,
  mensagem
}) {
  const payload = {
    id: uuid(),
    produto_id,
    concorrente_id,
    preco_concorrente,
    preco_meu,
    diff_percent,
    threshold_percent,
    mensagem,
    lido: false,
    criado_em: nowISO()
  }
  await persist('alertas', payload)
  return payload
}

export async function listarAlertas() {
  if (supabase) {
    const { data } = await supabase
      .from('alertas')
      .select('*')
      .order('criado_em', { ascending: false })
    return data ?? []
  }
  return [...memoryDb.alertas].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
}

export async function marcarAlertaComoLido(id) {
  if (supabase) {
    await supabase.from('alertas').update({ lido: true }).eq('id', id)
  } else {
    const idx = memoryDb.alertas.findIndex((a) => a.id === id)
    if (idx !== -1) memoryDb.alertas[idx].lido = true
  }
}

export async function listarPrecos() {
  if (supabase) {
    const { data } = await supabase.from('precos_coletados').select('*').order('data_coleta', { ascending: false })
    return data ?? []
  }
  return memoryDb.precos_coletados
}

function filtrarPrecosPorPeriodo(precos, periodoDias) {
  if (!periodoDias) return precos
  const limite = new Date()
  limite.setDate(limite.getDate() - periodoDias)
  return precos.filter((p) => new Date(p.data_coleta) >= limite)
}

export async function buildAnalyticsSnapshot({ produtoId, concorrenteId, periodo }) {
  const [produtos, concorrentes, precos] = await Promise.all([
    listProdutos(),
    listConcorrentes(),
    listarPrecos()
  ])

  const produtoSelecionado = produtos.find((p) => p.id === produtoId) || produtos[0]

  if (!produtoSelecionado) {
    return { produto: null, estatisticas: null, historico: [], concorrentes }
  }

  const periodoDias = periodo ? Number(periodo) : null

  const precosDoProduto = precos
    .filter((p) => p.produto_id === produtoSelecionado.id)
    .filter((p) => (!concorrenteId || concorrenteId === 'all' ? true : p.concorrente_id === concorrenteId))

  const precosFiltrados = filtrarPrecosPorPeriodo(precosDoProduto, periodoDias)

  const estatisticas = (() => {
    if (precosFiltrados.length === 0) {
      return {
        meuPreco: produtoSelecionado.preco_atual,
        menorConcorrente: null,
        maiorConcorrente: null,
        mediaConcorrente: null,
        diffPercent: null
      }
    }

    const valores = precosFiltrados.map((p) => p.preco)
    const menorConcorrente = Math.min(...valores)
    const maiorConcorrente = Math.max(...valores)
    const mediaConcorrente = valores.reduce((acc, cur) => acc + cur, 0) / valores.length
    const diffPercent = ((produtoSelecionado.preco_atual - menorConcorrente) / menorConcorrente) * 100

    return {
      meuPreco: produtoSelecionado.preco_atual,
      menorConcorrente,
      maiorConcorrente,
      mediaConcorrente,
      diffPercent
    }
  })()

  const historico = (() => {
    if (precosFiltrados.length === 0) return []

    const agrupadoPorData = precosFiltrados.reduce((acc, preco) => {
      const key = new Date(preco.data_coleta).toISOString().slice(0, 10)
      if (!acc[key]) acc[key] = []
      acc[key].push(preco)
      return acc
    }, {})

    return Object.entries(agrupadoPorData)
      .map(([data, registros]) => {
        const valores = registros.map((r) => r.preco)
        return {
          data,
          concorrente_preco: Math.min(...valores),
          meu_preco: produtoSelecionado.preco_atual
        }
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data))
  })()

  return {
    produto: produtoSelecionado,
    estatisticas,
    historico,
    concorrentes
  }
}

export async function buildDashboardSnapshot() {
  const [produtos, concorrentes, precos] = await Promise.all([
    listProdutos(),
    listConcorrentes(),
    listarPrecos()
  ])

  const precosRecentes = precos
    .sort((a, b) => new Date(b.data_coleta) - new Date(a.data_coleta))
    .slice(0, 6)
    .map((p) => ({
      ...p,
      produto: produtos.find((prod) => prod.id === p.produto_id),
      concorrente: concorrentes.find((c) => c.id === p.concorrente_id)
    }))

  const historicoPorProduto = produtos.map((produto) => ({
    produto,
    series: precos
      .filter((p) => p.produto_id === produto.id)
      .sort((a, b) => new Date(a.data_coleta) - new Date(b.data_coleta))
  }))

  return {
    totais: {
      produtos: produtos.length,
      concorrentes: concorrentes.length,
      precos: precos.length
    },
    precosRecentes,
    historicoPorProduto
  }
}

export async function buildAlertasSnapshot() {
  const [produtos, concorrentes, alertas] = await Promise.all([
    listProdutos(),
    listConcorrentes(),
    listarAlertas()
  ])

  const enriquecidos = alertas.map((alerta) => ({
    ...alerta,
    produto: produtos.find((p) => p.id === alerta.produto_id),
    concorrente: concorrentes.find((c) => c.id === alerta.concorrente_id)
  }))

  return {
    alertas: enriquecidos,
    naoLidos: enriquecidos.filter((a) => !a.lido).length
  }
}

export function seedInMemory() {
  if (supabase) return
  if (memoryDb.produtos.length > 0) return

  const produtos = [
    {
      id: 'p-1',
      nome: 'Tênis Racer Carbon',
      sku: 'RCB-001',
      url: 'https://meuecommerce.com/produtos/tenis-racer-carbon',
      preco_atual: 749.9
    },
    {
      id: 'p-2',
      nome: 'Tênis Pulse Pro',
      sku: 'PUL-204',
      url: 'https://meuecommerce.com/produtos/tenis-pulse-pro',
      preco_atual: 659.9
    },
    {
      id: 'p-3',
      nome: 'Tênis Storm Runner',
      sku: 'STR-777',
      url: 'https://meuecommerce.com/produtos/tenis-storm-runner',
      preco_atual: 599.9
    }
  ]

  const concorrentes = [
    { id: 'c-1', nome: 'Sprint Sports', url_base: 'https://sprint-sports.com' },
    { id: 'c-2', nome: 'Arena Fit', url_base: 'https://arena-fit.com' }
  ]

  memoryDb.produtos.push(...produtos)
  memoryDb.concorrentes.push(...concorrentes)
  memoryDb.produto_concorrente_urls.push(
    {
      id: uuid(),
      produto_id: 'p-1',
      concorrente_id: 'c-1',
      url_produto: 'https://sprint-sports.com/produtos/tenis-racer-carbon'
    },
    {
      id: uuid(),
      produto_id: 'p-1',
      concorrente_id: 'c-2',
      url_produto: 'https://arena-fit.com/produtos/tenis-racer-carbon'
    },
    {
      id: uuid(),
      produto_id: 'p-2',
      concorrente_id: 'c-1',
      url_produto: 'https://sprint-sports.com/produtos/tenis-pulse-pro'
    }
  )
  memoryDb.alertas_configuracao.push(
    { id: uuid(), produto_id: 'p-1', threshold_percent: 10 },
    { id: uuid(), produto_id: 'p-2', threshold_percent: 12 }
  )

  const hoje = new Date()
  memoryDb.produto_concorrente_urls.forEach((link, idx) => {
    const produto = produtos.find((p) => p.id === link.produto_id)
    const conc = concorrentes.find((c) => c.id === link.concorrente_id)
    if (!produto || !conc) return
    const variacao = (Math.random() * 80 - 20).toFixed(2)
    memoryDb.precos_coletados.push({
      id: uuid(),
      produto_id: produto.id,
      concorrente_id: conc.id,
      preco: produto.preco_atual + Number(variacao),
      data_coleta: new Date(hoje.getTime() - idx * 86400000).toISOString()
    })
  })

  memoryDb.alertas.push({
    id: uuid(),
    produto_id: 'p-1',
    concorrente_id: 'c-1',
    preco_concorrente: 599.9,
    preco_meu: 749.9,
    diff_percent: ((749.9 - 599.9) / 599.9) * 100,
    threshold_percent: 10,
    mensagem: 'Sprint Sports reduziu o preço abaixo do limite configurado para Tênis Racer Carbon.',
    lido: false,
    criado_em: new Date(hoje.getTime() - 12 * 3600000).toISOString()
  })
}
