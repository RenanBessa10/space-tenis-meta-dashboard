const state = {
  produtos: [],
  concorrentes: [],
  dashboard: null,
  analytics: null,
  alertas: [],
  alertConfigs: [],
  associacoes: [],
  filtros: {
    produtoId: null,
    concorrenteId: 'all',
    periodo: 30
  },
  alertaProdutoId: null,
  associacaoProdutoId: null,
  editingConcorrenteId: null,
  editingAssociacaoId: null,
  naoLidos: 0
}

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error('Erro ao comunicar com o servidor')
  return res.json()
}

function formatCurrency(valor) {
  if (valor === null || valor === undefined) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercent(valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—'
  return `${valor > 0 ? '+' : ''}${valor.toFixed(1)}%`
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch (e) {
    return false
  }
}

function renderCards(totais) {
  const cards = [
    { label: 'Produtos monitorados', value: totais.produtos, hint: 'Lista importada do ecommerce' },
    { label: 'Concorrentes ativos', value: totais.concorrentes, hint: 'Fontes com scraping diário' },
    { label: 'Preços armazenados', value: totais.precos, hint: 'Histórico para análises de tendência' }
  ]

  const container = document.getElementById('metricCards')
  container.innerHTML = cards
    .map(
      (card) => `
      <div class="card">
        <h3>${card.label}</h3>
        <strong>${card.value}</strong>
        <div class="metric-trend">${card.hint}</div>
      </div>`
    )
    .join('')
}

function renderBadgeAlertas() {
  const badge = document.getElementById('badgeAlertas')
  const menuDot = document.getElementById('menuBadgeDot')
  const menuCount = document.getElementById('menuBadgeCount')
  badge.textContent = `${state.naoLidos} não lidos`
  menuCount.textContent = state.naoLidos
  if (state.naoLidos > 0) {
    badge.classList.remove('ghost')
    menuDot.classList.remove('off')
  } else {
    menuDot.classList.add('off')
  }
}

function renderTabela(precosRecentes) {
  const corpo = document.querySelector('#tabelaPrecos tbody')
  if (precosRecentes.length === 0) {
    corpo.innerHTML = '<tr><td colspan="4">Nenhum preço coletado ainda.</td></tr>'
    return
  }

  corpo.innerHTML = precosRecentes
    .map((p) => {
      const data = new Date(p.data_coleta)
      const badgeClass = p.preco < (p.produto?.preco_atual || 0) ? 'success' : 'warning'
      return `
        <tr>
          <td>${p.produto?.nome || '—'}</td>
          <td>${p.concorrente?.nome || '—'}</td>
          <td><span class="badge ${badgeClass}">R$ ${p.preco.toFixed(2)}</span></td>
          <td>${data.toLocaleString('pt-BR')}</td>
        </tr>
      `
    })
    .join('')
}

function renderHistorico(historico) {
  const container = document.getElementById('historico')
  if (historico.length === 0) {
    container.innerHTML = '<div class="card">Sem dados históricos ainda.</div>'
    return
  }

  container.innerHTML = historico
    .map((linha) => {
      const points = linha.series.slice(-6)
      return `
        <div class="card chart-card">
          <h3>${linha.produto.nome}</h3>
          <div class="metric-trend">Últimas coletas</div>
          <div>
            ${points
              .map((p) => `<div class="metric-trend"><span class="badge secondary">${new Date(p.data_coleta).toLocaleDateString('pt-BR')}</span>${formatCurrency(p.preco)}</div>`)
              .join('')}
          </div>
        </div>
      `
    })
    .join('')
}

function renderAnalyticsCards(analytics) {
  const cardsContainer = document.getElementById('analyticsCards')
  if (!analytics || !analytics.estatisticas) {
    cardsContainer.innerHTML = '<div class="card">Selecione um produto para ver o comparativo.</div>'
    return
  }

  const { estatisticas } = analytics
  const diffTone = estatisticas.diffPercent === null ? '' : estatisticas.diffPercent > 0 ? 'danger' : 'success'
  const diffCopy = estatisticas.diffPercent === null
    ? 'Aguardando coletas dos concorrentes'
    : estatisticas.diffPercent > 0
      ? 'Você está acima do menor concorrente'
      : 'Você está abaixo do menor concorrente'

  const cards = [
    {
      label: 'Diferença para menor preço',
      value: formatPercent(estatisticas.diffPercent),
      hint: diffCopy,
      tone: diffTone
    },
    {
      label: 'Meu preço',
      value: formatCurrency(estatisticas.meuPreco),
      hint: 'Base do ecommerce'
    },
    {
      label: 'Menor concorrente',
      value: formatCurrency(estatisticas.menorConcorrente),
      hint: 'Menor preço no período analisado'
    }
  ]

  cardsContainer.innerHTML = cards
    .map(
      (card) => `
      <div class="card ${card.tone ? `tone-${card.tone}` : ''}">
        <div class="card-title-row">
          <h3>${card.label}</h3>
          ${card.tone ? `<span class="pill ${card.tone === 'success' ? 'success' : 'warning'}">${card.tone === 'success' ? 'Competitivo' : 'Atenção'}</span>` : ''}
        </div>
        <strong>${card.value}</strong>
        <div class="metric-trend">${card.hint}</div>
      </div>`
    )
    .join('')
}

function renderComparativo(estatisticas) {
  const tbody = document.querySelector('#tabelaComparativa tbody')

  if (!estatisticas || estatisticas.diffPercent === null) {
    tbody.innerHTML = '<tr><td colspan="5">Sem histórico suficiente para calcular.</td></tr>'
    return
  }

  const linha = `
    <tr>
      <td>${formatCurrency(estatisticas.meuPreco)}</td>
      <td>${formatCurrency(estatisticas.menorConcorrente)}</td>
      <td>${formatCurrency(estatisticas.maiorConcorrente)}</td>
      <td>${formatCurrency(estatisticas.mediaConcorrente)}</td>
      <td>
        <span class="badge ${estatisticas.diffPercent > 0 ? 'warning' : 'success'}">${formatPercent(estatisticas.diffPercent)}</span>
      </td>
    </tr>
  `
  tbody.innerHTML = linha
}

function renderConcorrentes() {
  const corpo = document.querySelector('#tabelaConcorrentes tbody')
  const actionBtn = document.getElementById('salvarConcorrente')
  if (actionBtn && !state.editingConcorrenteId) actionBtn.textContent = 'Adicionar fonte'
  if (!state.concorrentes || state.concorrentes.length === 0) {
    corpo.innerHTML = '<tr><td colspan="3">Nenhum concorrente cadastrado.</td></tr>'
    return
  }

  corpo.innerHTML = state.concorrentes
    .map(
      (c) => `
      <tr>
        <td>${c.nome}</td>
        <td><a href="${c.url_base}" target="_blank" rel="noreferrer">${c.url_base}</a></td>
        <td class="actions">
          <button class="ghost" data-edit-concorrente="${c.id}">Editar</button>
          <button class="danger ghost" data-remove-concorrente="${c.id}">Excluir</button>
        </td>
      </tr>
    `
    )
    .join('')

  document.querySelectorAll('[data-edit-concorrente]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const id = event.currentTarget.getAttribute('data-edit-concorrente')
      const conc = state.concorrentes.find((c) => c.id === id)
      if (!conc) return
      document.getElementById('nomeConcorrente').value = conc.nome
      document.getElementById('urlConcorrente').value = conc.url_base
      state.editingConcorrenteId = id
      document.getElementById('salvarConcorrente').textContent = 'Salvar alterações'
    })
  })

  document.querySelectorAll('[data-remove-concorrente]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      const id = event.currentTarget.getAttribute('data-remove-concorrente')
      if (confirm('Confirma excluir esta fonte e desvincular URLs?')) {
        await removerConcorrente(id)
      }
    })
  })
}

function renderAssociacoes() {
  if (!state.associacaoProdutoId && state.produtos.length > 0) {
    state.associacaoProdutoId = state.produtos[0].id
  }
  const actionBtn = document.getElementById('salvarAssociacao')
  if (actionBtn && !state.editingAssociacaoId) actionBtn.textContent = 'Vincular URL'
  const selectProduto = document.getElementById('produtoAssociacao')
  selectProduto.innerHTML = state.produtos
    .map((p) => `<option value="${p.id}" ${state.associacaoProdutoId === p.id ? 'selected' : ''}>${p.nome}</option>`)
    .join('')

  const selectConcorrente = document.getElementById('concorrenteAssociacao')
  if (state.concorrentes.length === 0) {
    selectConcorrente.innerHTML = '<option disabled>Cadastre concorrentes primeiro</option>'
  } else {
    selectConcorrente.innerHTML = state.concorrentes
      .map((c) => `<option value="${c.id}">${c.nome}</option>`)
      .join('')
  }

  const tbody = document.querySelector('#tabelaAssociacoes tbody')
  const associacoesProduto = state.associacoes.filter((a) => a.produto_id === state.associacaoProdutoId)

  if (associacoesProduto.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Nenhuma URL de concorrente associada ao produto selecionado.</td></tr>'
    return
  }

  tbody.innerHTML = associacoesProduto
    .map(
      (assoc) => `
      <tr>
        <td>${assoc.produto?.nome || 'Produto'}</td>
        <td>${assoc.concorrente?.nome || 'Concorrente'}</td>
        <td><a href="${assoc.url_produto}" target="_blank" rel="noreferrer">${assoc.url_produto}</a></td>
        <td class="actions">
          <button class="ghost" data-edit-associacao="${assoc.id}">Editar</button>
          <button class="danger ghost" data-remove-associacao="${assoc.id}">Excluir</button>
        </td>
      </tr>
    `
    )
    .join('')

  document.querySelectorAll('[data-edit-associacao]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      const id = event.currentTarget.getAttribute('data-edit-associacao')
      const assoc = state.associacoes.find((a) => a.id === id)
      if (!assoc) return
      state.editingAssociacaoId = id
      state.associacaoProdutoId = assoc.produto_id
      document.getElementById('produtoAssociacao').value = assoc.produto_id
      document.getElementById('concorrenteAssociacao').value = assoc.concorrente_id
      document.getElementById('urlAssociacao').value = assoc.url_produto
      document.getElementById('salvarAssociacao').textContent = 'Salvar alterações'
    })
  })

  document.querySelectorAll('[data-remove-associacao]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      const id = event.currentTarget.getAttribute('data-remove-associacao')
      if (confirm('Excluir esta URL do concorrente para o produto?')) {
        await removerAssociacao(id)
      }
    })
  })
}

function renderConfiguracaoAlerta() {
  const select = document.getElementById('produtoAlertaSelect')
  select.innerHTML = state.produtos
    .map((p) => `<option value="${p.id}" ${state.alertaProdutoId === p.id ? 'selected' : ''}>${p.nome}</option>`)
    .join('')

  const atual = state.alertConfigs.find((c) => c.produto_id === state.alertaProdutoId)
  document.getElementById('thresholdInput').value = atual?.threshold_percent ?? ''
}

function renderListaAlertas() {
  const container = document.getElementById('listaAlertas')
  if (!state.alertas || state.alertas.length === 0) {
    container.innerHTML = '<div class="tooltip-copy">Nenhum alerta disparado ainda.</div>'
    return
  }

  container.innerHTML = state.alertas
    .map((alerta) => {
      const data = new Date(alerta.criado_em).toLocaleString('pt-BR')
      const diffBadge = formatPercent(alerta.diff_percent)
      return `
        <div class="alert-card ${alerta.lido ? '' : 'unread'}">
          <div class="alert-meta">
            <div class="metric-trend">${alerta.produto?.nome || 'Produto'} • <span class="badge secondary">${alerta.concorrente?.nome || 'Concorrente'}</span></div>
            <span>${data}</span>
          </div>
          <div class="metric-trend">
            <span class="badge ${alerta.diff_percent > 0 ? 'danger' : 'success'}">${diffBadge}</span>
            <span class="badge warning">Limite ${alerta.threshold_percent}%</span>
          </div>
          <div class="tooltip-copy">${alerta.mensagem || 'Preço caiu abaixo do limite configurado.'}</div>
          <div class="alert-actions">
            ${alerta.lido ? '<span class="badge secondary">Lido</span>' : `<button data-alerta="${alerta.id}">Marcar como lido</button>`}
          </div>
        </div>
      `
    })
    .join('')

  document.querySelectorAll('[data-alerta]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      const id = event.currentTarget.getAttribute('data-alerta')
      await marcarComoLido(id)
    })
  })
}

function renderFiltros() {
  const produtoSelect = document.getElementById('produtoFiltro')
  const concorrenteSelect = document.getElementById('concorrenteFiltro')

  produtoSelect.innerHTML = state.produtos
    .map((p) => `<option value="${p.id}" ${state.filtros.produtoId === p.id ? 'selected' : ''}>${p.nome}</option>`)
    .join('')

  concorrenteSelect.innerHTML = [
    '<option value="all">Todos os concorrentes</option>',
    ...state.concorrentes.map((c) => `<option value="${c.id}" ${state.filtros.concorrenteId === c.id ? 'selected' : ''}>${c.nome}</option>`)
  ].join('')
}

const { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, Legend, XAxis, YAxis } = Recharts
const chartRoot = ReactDOM.createRoot(document.getElementById('chartRoot'))

function PriceHistoryChart({ data }) {
  if (!data || data.length === 0) {
    return React.createElement('div', { className: 'empty-chart' }, 'Sem histórico no período selecionado.')
  }

  return React.createElement(
    ResponsiveContainer,
    { width: '100%', height: 320 },
    React.createElement(
      LineChart,
      { data, margin: { top: 10, right: 20, left: 0, bottom: 0 } },
      React.createElement(CartesianGrid, { strokeDasharray: '3 3', stroke: '#e5e7eb' }),
      React.createElement(XAxis, { dataKey: 'data', tick: { fontSize: 12 }, tickMargin: 8 }),
      React.createElement(YAxis, { tickFormatter: (value) => `R$ ${value.toFixed(0)}` }),
      React.createElement(Tooltip, {
        formatter: (value) => formatCurrency(Number(value)),
        labelFormatter: (label) => new Date(label).toLocaleDateString('pt-BR')
      }),
      React.createElement(Legend, null),
      React.createElement(Line, {
        type: 'monotone',
        dataKey: 'meu_preco',
        name: 'Meu preço',
        stroke: '#6366f1',
        strokeWidth: 3,
        dot: false
      }),
      React.createElement(Line, {
        type: 'monotone',
        dataKey: 'concorrente_preco',
        name: 'Menor concorrente',
        stroke: '#f97316',
        strokeWidth: 3,
        dot: false
      })
    )
  )
}

function renderHistoricoLinha(data) {
  chartRoot.render(React.createElement(PriceHistoryChart, { data }))
}

async function carregarAssociacoes() {
  const associacoes = await fetchJson('/api/associacoes')
  state.associacoes = associacoes
  renderAssociacoes()
}

async function carregarDashboard() {
  const data = await fetchJson('/api/dashboard')
  state.dashboard = data
  renderCards(data.totais)
  renderTabela(data.precosRecentes)
  renderHistorico(data.historicoPorProduto)
}

async function carregarAnalitico() {
  const params = new URLSearchParams({
    produtoId: state.filtros.produtoId,
    concorrenteId: state.filtros.concorrenteId,
    periodo: state.filtros.periodo
  })
  const analytics = await fetchJson(`/api/analytics?${params.toString()}`)
  state.analytics = analytics

  document.getElementById('produtoEmFoco').textContent = analytics.produto?.nome || '—'
  renderAnalyticsCards(analytics)
  renderComparativo(analytics.estatisticas)
  renderHistoricoLinha(analytics.historico)
}

async function carregarBase() {
  const [produtos, concorrentes, associacoes] = await Promise.all([
    fetchJson('/api/produtos'),
    fetchJson('/api/concorrentes'),
    fetchJson('/api/associacoes')
  ])

  state.produtos = produtos
  state.concorrentes = concorrentes
  state.associacoes = associacoes

  if (!state.filtros.produtoId && produtos.length > 0) {
    state.filtros.produtoId = produtos[0].id
  }

  if (!state.alertaProdutoId && produtos.length > 0) {
    state.alertaProdutoId = produtos[0].id
  }

  if (state.filtros.concorrenteId && state.filtros.concorrenteId !== 'all') {
    const existe = concorrentes.find((c) => c.id === state.filtros.concorrenteId)
    if (!existe) state.filtros.concorrenteId = 'all'
  }

  if (state.editingConcorrenteId && !concorrentes.find((c) => c.id === state.editingConcorrenteId)) {
    state.editingConcorrenteId = null
  }
  if (state.editingAssociacaoId && !associacoes.find((a) => a.id === state.editingAssociacaoId)) {
    state.editingAssociacaoId = null
  }

  if (!state.associacaoProdutoId && produtos.length > 0) {
    state.associacaoProdutoId = produtos[0].id
  }
  if (state.associacaoProdutoId && !produtos.find((p) => p.id === state.associacaoProdutoId) && produtos.length > 0) {
    state.associacaoProdutoId = produtos[0].id
  }

  renderFiltros()
  renderConfiguracaoAlerta()
  renderConcorrentes()
  renderAssociacoes()
}

async function importarProdutos() {
  await fetchJson('/api/importar', { method: 'POST' })
  await carregarBase()
  await Promise.all([carregarDashboard(), carregarAnalitico(), carregarAlertas(), carregarConfiguracoesAlertas()])
  alert('Importação concluída!')
}

async function coletarAgora() {
  await fetchJson('/api/coletar-agora', { method: 'POST' })
  await Promise.all([carregarDashboard(), carregarAnalitico(), carregarAlertas()])
  alert('Coleta simulada executada!')
}

async function salvarConcorrente() {
  const nome = document.getElementById('nomeConcorrente').value
  const url_base = document.getElementById('urlConcorrente').value
  if (!nome || !url_base) {
    alert('Preencha nome e URL base')
    return
  }
  if (!isValidUrl(url_base)) {
    alert('Informe uma URL base válida (http/https)')
    return
  }

  const payload = {
    method: state.editingConcorrenteId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, url_base })
  }
  const endpoint = state.editingConcorrenteId
    ? `/api/concorrentes/${state.editingConcorrenteId}`
    : '/api/concorrentes'

  await fetchJson(endpoint, payload)
  document.getElementById('nomeConcorrente').value = ''
  document.getElementById('urlConcorrente').value = ''
  state.editingConcorrenteId = null
  document.getElementById('salvarConcorrente').textContent = 'Adicionar fonte'
  await carregarBase()
  await carregarAnalitico()
  alert('Fonte de concorrente salva!')
}

async function removerConcorrente(id) {
  await fetchJson(`/api/concorrentes/${id}`, { method: 'DELETE' })
  if (state.editingConcorrenteId === id) {
    state.editingConcorrenteId = null
    document.getElementById('salvarConcorrente').textContent = 'Adicionar fonte'
    document.getElementById('nomeConcorrente').value = ''
    document.getElementById('urlConcorrente').value = ''
  }
  await carregarBase()
  await carregarAnalitico()
  alert('Concorrente removido e URLs desvinculadas.')
}

async function salvarAssociacao() {
  const produto_id = document.getElementById('produtoAssociacao').value
  const concorrente_id = document.getElementById('concorrenteAssociacao').value
  const url_produto = document.getElementById('urlAssociacao').value

  if (!produto_id || !concorrente_id || !url_produto) {
    alert('Informe produto, concorrente e URL do produto')
    return
  }
  if (!isValidUrl(url_produto)) {
    alert('URL do produto do concorrente inválida')
    return
  }

  const payload = {
    method: state.editingAssociacaoId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id, concorrente_id, url_produto })
  }

  const endpoint = state.editingAssociacaoId
    ? `/api/associacoes/${state.editingAssociacaoId}`
    : '/api/associacoes'

  await fetchJson(endpoint, payload)
  state.editingAssociacaoId = null
  state.associacaoProdutoId = produto_id
  document.getElementById('urlAssociacao').value = ''
  document.getElementById('salvarAssociacao').textContent = 'Vincular URL'
  await carregarAssociacoes()
  await carregarAnalitico()
  alert('Vínculo salvo com sucesso!')
}

async function removerAssociacao(id) {
  await fetchJson(`/api/associacoes/${id}`, { method: 'DELETE' })
  await carregarAssociacoes()
  await carregarAnalitico()
  alert('Vínculo removido.')
}

function bindEvents() {
  document.getElementById('importarBtn').addEventListener('click', importarProdutos)
  document.getElementById('coletarBtn').addEventListener('click', coletarAgora)
  document.getElementById('salvarConcorrente').addEventListener('click', salvarConcorrente)

  document.getElementById('produtoFiltro').addEventListener('change', async (event) => {
    state.filtros.produtoId = event.target.value
    await carregarAnalitico()
  })

  document.getElementById('concorrenteFiltro').addEventListener('change', async (event) => {
    state.filtros.concorrenteId = event.target.value
    await carregarAnalitico()
  })

  document.getElementById('periodoFiltro').addEventListener('change', async (event) => {
    state.filtros.periodo = event.target.value
    await carregarAnalitico()
  })

  document.getElementById('produtoAlertaSelect').addEventListener('change', (event) => {
    state.alertaProdutoId = event.target.value
    renderConfiguracaoAlerta()
  })

  document.getElementById('salvarAlertaConfig').addEventListener('click', salvarConfiguracaoAlerta)
  document.getElementById('menuBadgeAlertas').addEventListener('click', () => {
    document.getElementById('alertas').scrollIntoView({ behavior: 'smooth' })
  })

  document.getElementById('produtoAssociacao').addEventListener('change', (event) => {
    state.associacaoProdutoId = event.target.value
    renderAssociacoes()
  })
  document.getElementById('salvarAssociacao').addEventListener('click', salvarAssociacao)
}

async function carregarAlertas() {
  const painel = await fetchJson('/api/alertas')
  state.alertas = painel.alertas
  state.naoLidos = painel.naoLidos
  renderBadgeAlertas()
  renderListaAlertas()
}

async function carregarConfiguracoesAlertas() {
  const configs = await fetchJson('/api/alertas/configuracao')
  state.alertConfigs = configs
  if (!state.alertaProdutoId && state.produtos.length > 0) {
    state.alertaProdutoId = state.produtos[0].id
  }
  renderConfiguracaoAlerta()
}

async function salvarConfiguracaoAlerta() {
  const threshold = Number(document.getElementById('thresholdInput').value)
  if (!threshold) {
    alert('Informe o percentual que dispara alerta')
    return
  }
  await fetchJson('/api/alertas/configuracao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ produto_id: state.alertaProdutoId, threshold_percent: threshold })
  })
  await carregarConfiguracoesAlertas()
  alert('Configuração de alerta salva!')
}

async function marcarComoLido(id) {
  const painel = await fetchJson(`/api/alertas/${id}/lido`, { method: 'PATCH' })
  state.alertas = painel.alertas
  state.naoLidos = painel.naoLidos
  renderBadgeAlertas()
  renderListaAlertas()
}

async function init() {
  await carregarBase()
  await Promise.all([carregarDashboard(), carregarAnalitico(), carregarConfiguracoesAlertas(), carregarAlertas()])
  bindEvents()
}

init()
