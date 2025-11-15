/**
 * Módulo de análises estatísticas avançadas
 */

import { B3FluxoData, WinfutCotacoes } from '../drizzle/schema';

export interface EstatisticasInvestidor {
  tipoInvestidor: string;
  diasAnalisados: number;
  fluxoDiarioMedio: number;
  fluxoDiarioMediano: number;
  fluxoDiarioDesvio: number;
  diasComprador: number;
  diasVendedor: number;
  pctDiasComprador: number;
  pctDiasVendedor: number;
  tendenciaAtual: 'COMPRADOR' | 'VENDEDOR';
  fluxoTotalPeriodo: number;
  volatilidadeFluxo: number;
  correlacaoComPreco?: number;
}

export interface Divergencia {
  data: Date;
  tipo: 'ALTA' | 'BAIXA';
  descricao: string;
  sinal: 'COMPRA' | 'VENDA';
  preco: number;
  fluxo: number;
  intensidade: number; // 0-1
}

/**
 * Calcula estatísticas avançadas por tipo de investidor
 */
export function calcularEstatisticas(
  fluxoData: B3FluxoData[],
  winfutData?: WinfutCotacoes[]
): EstatisticasInvestidor[] {
  // Agrupa por tipo de investidor
  const porTipo = new Map<string, B3FluxoData[]>();
  
  for (const dado of fluxoData) {
    if (!porTipo.has(dado.tipoInvestidor)) {
      porTipo.set(dado.tipoInvestidor, []);
    }
    porTipo.get(dado.tipoInvestidor)!.push(dado);
  }
  
  const estatisticas: EstatisticasInvestidor[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    // Ordena por data
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    const diasComprador = fluxos.filter(f => f > 0).length;
    const diasVendedor = fluxos.filter(f => f < 0).length;
    const fluxoTotal = fluxos.reduce((acc, f) => acc + f, 0);
    const fluxoMedio = fluxoTotal / fluxos.length;
    
    // Calcula mediana
    const fluxosOrdenados = [...fluxos].sort((a, b) => a - b);
    const meio = Math.floor(fluxosOrdenados.length / 2);
    const fluxoMediano = fluxosOrdenados.length % 2 === 0
      ? (fluxosOrdenados[meio - 1] + fluxosOrdenados[meio]) / 2
      : fluxosOrdenados[meio];
    
    // Calcula desvio padrão
    const variancia = fluxos.reduce((acc, f) => acc + Math.pow(f - fluxoMedio, 2), 0) / fluxos.length;
    const fluxoDesvio = Math.sqrt(variancia);
    
    // Volatilidade (coeficiente de variação)
    const volatilidade = Math.abs(fluxoMedio) > 0 ? fluxoDesvio / Math.abs(fluxoMedio) : 0;
    
    const stats: EstatisticasInvestidor = {
      tipoInvestidor: tipo,
      diasAnalisados: dados.length,
      fluxoDiarioMedio: fluxoMedio,
      fluxoDiarioMediano: fluxoMediano,
      fluxoDiarioDesvio: fluxoDesvio,
      diasComprador,
      diasVendedor,
      pctDiasComprador: (diasComprador / dados.length) * 100,
      pctDiasVendedor: (diasVendedor / dados.length) * 100,
      tendenciaAtual: fluxos[fluxos.length - 1] > 0 ? 'COMPRADOR' : 'VENDEDOR',
      fluxoTotalPeriodo: fluxoTotal,
      volatilidadeFluxo: volatilidade
    };
    
    // Calcula correlação com preço se dados WINFUT disponíveis
    if (winfutData && winfutData.length > 0) {
      stats.correlacaoComPreco = calcularCorrelacao(dados, winfutData);
    }
    
    estatisticas.push(stats);
  }
  
  return estatisticas;
}

/**
 * Calcula correlação de Pearson entre fluxo e variação de preço
 */
function calcularCorrelacao(fluxoData: B3FluxoData[], winfutData: WinfutCotacoes[]): number {
  // Mescla dados por data
  const merged = fluxoData.map(f => {
    const winfut = winfutData.find(w => 
      new Date(w.data).toDateString() === new Date(f.data).toDateString()
    );
    return {
      fluxo: f.fluxoDiarioMil || 0,
      variacao: winfut ? (parseFloat(winfut.variacaoPct || '0')) / 100 : null
    };
  }).filter(d => d.variacao !== null);
  
  if (merged.length < 2) return 0;
  
  const n = merged.length;
  const sumX = merged.reduce((acc, d) => acc + d.fluxo, 0);
  const sumY = merged.reduce((acc, d) => acc + (d.variacao || 0), 0);
  const sumXY = merged.reduce((acc, d) => acc + d.fluxo * (d.variacao || 0), 0);
  const sumX2 = merged.reduce((acc, d) => acc + d.fluxo * d.fluxo, 0);
  const sumY2 = merged.reduce((acc, d) => acc + (d.variacao || 0) * (d.variacao || 0), 0);
  
  const numerador = n * sumXY - sumX * sumY;
  const denominador = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominador === 0 ? 0 : numerador / denominador;
}

/**
 * Detecta divergências entre fluxo e preço
 */
export function detectarDivergencias(
  fluxoData: B3FluxoData[],
  winfutData: WinfutCotacoes[],
  janela: number = 5
): Divergencia[] {
  if (fluxoData.length < janela + 2 || winfutData.length < janela + 2) {
    return [];
  }
  
  // Ordena por data
  const fluxoOrdenado = [...fluxoData].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const winfutOrdenado = [...winfutData].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  
  // Mescla dados por data
  const merged = fluxoOrdenado.map(f => {
    const winfut = winfutOrdenado.find(w => 
      new Date(w.data).toDateString() === new Date(f.data).toDateString()
    );
    return winfut ? {
      data: f.data,
      fluxo: f.fluxoDiarioMil || 0,
      fechamento: winfut.fechamento
    } : null;
  }).filter(d => d !== null) as { data: Date; fluxo: number; fechamento: number }[];
  
  if (merged.length < janela + 2) {
    return [];
  }
  
  const divergencias: Divergencia[] = [];
  
  for (let i = janela; i < merged.length; i++) {
    const janelaAtual = merged.slice(i - janela, i + 1);
    
    // Encontra índices de máximas e mínimas
    let idxMaxPreco = 0;
    let idxMinPreco = 0;
    let idxMaxFluxo = 0;
    let idxMinFluxo = 0;
    
    for (let j = 0; j < janelaAtual.length; j++) {
      if (janelaAtual[j].fechamento > janelaAtual[idxMaxPreco].fechamento) {
        idxMaxPreco = j;
      }
      if (janelaAtual[j].fechamento < janelaAtual[idxMinPreco].fechamento) {
        idxMinPreco = j;
      }
      if (janelaAtual[j].fluxo > janelaAtual[idxMaxFluxo].fluxo) {
        idxMaxFluxo = j;
      }
      if (janelaAtual[j].fluxo < janelaAtual[idxMinFluxo].fluxo) {
        idxMinFluxo = j;
      }
    }
    
    const ultimoIdx = janelaAtual.length - 1;
    
    // Divergência de Alta (preço faz nova mínima, mas fluxo não)
    if (idxMinPreco === ultimoIdx && idxMinFluxo !== ultimoIdx) {
      const intensidade = Math.abs(idxMinFluxo - ultimoIdx) / janela;
      divergencias.push({
        data: janelaAtual[ultimoIdx].data,
        tipo: 'ALTA',
        descricao: 'Preço fez nova mínima, mas fluxo não acompanhou',
        sinal: 'COMPRA',
        preco: janelaAtual[ultimoIdx].fechamento,
        fluxo: janelaAtual[ultimoIdx].fluxo,
        intensidade
      });
    }
    
    // Divergência de Baixa (preço faz nova máxima, mas fluxo não)
    if (idxMaxPreco === ultimoIdx && idxMaxFluxo !== ultimoIdx) {
      const intensidade = Math.abs(idxMaxFluxo - ultimoIdx) / janela;
      divergencias.push({
        data: janelaAtual[ultimoIdx].data,
        tipo: 'BAIXA',
        descricao: 'Preço fez nova máxima, mas fluxo não acompanhou',
        sinal: 'VENDA',
        preco: janelaAtual[ultimoIdx].fechamento,
        fluxo: janelaAtual[ultimoIdx].fluxo,
        intensidade
      });
    }
  }
  
  return divergencias;
}
