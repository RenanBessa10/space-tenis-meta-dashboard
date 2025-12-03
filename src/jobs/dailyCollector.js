import cron from 'node-cron'
import { listProdutos } from '../data/store.js'
import { coletarPrecosParaProduto } from '../services/competitorPriceService.js'

export function iniciarColetaDiaria() {
  // Cron diário às 06h (simulado em ambiente local)
  cron.schedule('0 6 * * *', async () => {
    const produtos = await listProdutos()
    for (const produto of produtos) {
      await coletarPrecosParaProduto(produto)
    }
    console.log('Coleta diária executada', new Date().toISOString())
  })
}
