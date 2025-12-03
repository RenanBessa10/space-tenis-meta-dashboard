import { v4 as uuid } from 'uuid'

export async function importarProdutosDoMeuEcommerce() {
  // Mock simples simulando retorno de um ecommerce próprio
  return [
    {
      id: uuid(),
      nome: 'Tênis Velocity Prime',
      sku: 'VEL-101',
      url: 'https://meuecommerce.com/produtos/tenis-velocity-prime',
      preco_atual: 699.9
    },
    {
      id: uuid(),
      nome: 'Tênis Supra Fly',
      sku: 'SUP-303',
      url: 'https://meuecommerce.com/produtos/tenis-supra-fly',
      preco_atual: 829.9
    }
  ]
}
