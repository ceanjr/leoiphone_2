/**
 * Re-exporta funções de ordenação do módulo helpers
 * Mantém compatibilidade com imports antigos
 * 
 * @deprecated Importar diretamente de '@/lib/utils/produtos/helpers'
 */

export {
  extrairArmazenamento,
  extrairModeloECapacidade,
  ordenarProdutosPorModelo,
} from './helpers'
