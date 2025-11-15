/**
 * Módulo de análises estatísticas avançadas - VERSÃO MELHORADA
 * Foco em análises objetivas e acionáveis para identificar tendências de investidores
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
  // Novas métricas
  intensidadeCompra: number; // Média do fluxo nos dias de compra
  intensidadeVenda: number; // Média do fluxo nos dias de venda
  consistencia: number; // 0-100: quão consistente é o comportamento
  forcaTendencia: number; // -100 a 100: força da tendência atual
}

export interface TendenciaPeriodo {
  periodo: string; // '7d', '14d', '30d'
  tendencia: 'COMPRADOR' | 'VENDEDOR' | 'NEUTRO';
  fluxoMedio: number;
  intensidade: number; // 0-100
  confianca: number; // 0-100
}

export interface PadraoComportamento {
  tipoInvestidor: string;
  padraoIdentificado: string;
  descricao: string;
  confianca: number; // 0-100
  diasConsecutivos: number;
  fluxoAcumulado: number;
}

export interface AlertaMovimento {
  data: Date;
  tipoInvestidor: string;
  tipo: 'ENTRADA_FORTE' | 'SAIDA_FORTE' | 'REVERSAO' | 'ACELERACAO';
  descricao: string;
  intensidade: number; // 0-100
  relevancia: number; // 0-100
}

/**
 * Calcula estatísticas avançadas por tipo de investidor com novas métricas
 */
export function calcularEstatisticasEnhanced(
  fluxoData: B3FluxoData[],
  winfutData?: WinfutCotacoes[]
): EstatisticasInvestidor[] {
  const porTipo = new Map<string, B3FluxoData[]>();
  
  for (const dado of fluxoData) {
    if (!porTipo.has(dado.tipoInvestidor)) {
      porTipo.set(dado.tipoInvestidor, []);
    }
    porTipo.get(dado.tipoInvestidor)!.push(dado);
  }
  
  const estatisticas: EstatisticasInvestidor[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    const fluxosCompra = fluxos.filter(f => f > 0);
    const fluxosVenda = fluxos.filter(f => f < 0);
    
    const diasComprador = fluxosCompra.length;
    const diasVendedor = fluxosVenda.length;
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
    
    // NOVAS MÉTRICAS
    
    // Intensidade de compra e venda
    const intensidadeCompra = fluxosCompra.length > 0 
      ? fluxosCompra.reduce((acc, f) => acc + f, 0) / fluxosCompra.length 
      : 0;
    const intensidadeVenda = fluxosVenda.length > 0 
      ? Math.abs(fluxosVenda.reduce((acc, f) => acc + f, 0) / fluxosVenda.length)
      : 0;
    
    // Consistência: mede o quão consistente é o comportamento (baixa volatilidade = alta consistência)
    const consistencia = Math.max(0, Math.min(100, 100 * (1 - Math.min(volatilidade, 1))));
    
    // Força da tendência: considera últimos 7 dias vs média geral
    const ultimos7Dias = fluxos.slice(-Math.min(7, fluxos.length));
    const mediaUltimos7 = ultimos7Dias.reduce((acc, f) => acc + f, 0) / ultimos7Dias.length;
    const forcaTendencia = fluxoMedio !== 0 
      ? Math.max(-100, Math.min(100, ((mediaUltimos7 - fluxoMedio) / Math.abs(fluxoMedio)) * 100))
      : 0;
    
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
      volatilidadeFluxo: volatilidade,
      intensidadeCompra,
      intensidadeVenda,
      consistencia,
      forcaTendencia
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
 * Analisa tendências em diferentes períodos (7, 14, 30 dias)
 */
export function analisarTendenciasPeriodo(fluxoData: B3FluxoData[]): Map<string, TendenciaPeriodo[]> {
  const porTipo = new Map<string, B3FluxoData[]>();
  
  for (const dado of fluxoData) {
    if (!porTipo.has(dado.tipoInvestidor)) {
      porTipo.set(dado.tipoInvestidor, []);
    }
    porTipo.get(dado.tipoInvestidor)!.push(dado);
  }
  
  const resultado = new Map<string, TendenciaPeriodo[]>();
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    
    const periodos: TendenciaPeriodo[] = [];
    
    // Analisa 7, 14 e 30 dias
    for (const dias of [7, 14, 30]) {
      if (fluxos.length >= dias) {
        const periodo = fluxos.slice(-dias);
        const fluxoMedio = periodo.reduce((acc, f) => acc + f, 0) / periodo.length;
        const diasPositivos = periodo.filter(f => f > 0).length;
        const diasNegativos = periodo.filter(f => f < 0).length;
        
        let tendencia: 'COMPRADOR' | 'VENDEDOR' | 'NEUTRO' = 'NEUTRO';
        let intensidade = 0;
        let confianca = 0;
        
        if (Math.abs(fluxoMedio) > 10) { // Threshold mínimo de 10 milhões
          tendencia = fluxoMedio > 0 ? 'COMPRADOR' : 'VENDEDOR';
          
          // Intensidade baseada no fluxo médio normalizado
          const maxFluxo = Math.max(...periodo.map(f => Math.abs(f)));
          intensidade = maxFluxo > 0 ? Math.min(100, (Math.abs(fluxoMedio) / maxFluxo) * 100) : 0;
          
          // Confiança baseada na consistência dos sinais
          const pctDominante = Math.max(diasPositivos, diasNegativos) / periodo.length;
          confianca = Math.min(100, pctDominante * 100);
        }
        
        periodos.push({
          periodo: `${dias}d`,
          tendencia,
          fluxoMedio,
          intensidade,
          confianca
        });
      }
    }
    
    resultado.set(tipo, periodos);
  }
  
  return resultado;
}

/**
 * Identifica padrões de comportamento dos investidores
 */
export function identificarPadroes(fluxoData: B3FluxoData[]): PadraoComportamento[] {
  const porTipo = new Map<string, B3FluxoData[]>();
  
  for (const dado of fluxoData) {
    if (!porTipo.has(dado.tipoInvestidor)) {
      porTipo.set(dado.tipoInvestidor, []);
    }
    porTipo.get(dado.tipoInvestidor)!.push(dado);
  }
  
  const padroes: PadraoComportamento[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    
    // Padrão 1: Acumulação consistente (5+ dias consecutivos comprando)
    let diasConsecutivosCompra = 0;
    let fluxoAcumuladoCompra = 0;
    let maxConsecutivosCompra = 0;
    let fluxoMaxAcumuladoCompra = 0;
    
    for (const fluxo of fluxos) {
      if (fluxo > 0) {
        diasConsecutivosCompra++;
        fluxoAcumuladoCompra += fluxo;
        if (diasConsecutivosCompra > maxConsecutivosCompra) {
          maxConsecutivosCompra = diasConsecutivosCompra;
          fluxoMaxAcumuladoCompra = fluxoAcumuladoCompra;
        }
      } else {
        diasConsecutivosCompra = 0;
        fluxoAcumuladoCompra = 0;
      }
    }
    
    if (maxConsecutivosCompra >= 5) {
      const confianca = Math.min(100, (maxConsecutivosCompra / 10) * 100);
      padroes.push({
        tipoInvestidor: tipo,
        padraoIdentificado: 'ACUMULACAO_CONSISTENTE',
        descricao: `Acumulação por ${maxConsecutivosCompra} dias consecutivos`,
        confianca,
        diasConsecutivos: maxConsecutivosCompra,
        fluxoAcumulado: fluxoMaxAcumuladoCompra
      });
    }
    
    // Padrão 2: Distribuição consistente (5+ dias consecutivos vendendo)
    let diasConsecutivosVenda = 0;
    let fluxoAcumuladoVenda = 0;
    let maxConsecutivosVenda = 0;
    let fluxoMaxAcumuladoVenda = 0;
    
    for (const fluxo of fluxos) {
      if (fluxo < 0) {
        diasConsecutivosVenda++;
        fluxoAcumuladoVenda += Math.abs(fluxo);
        if (diasConsecutivosVenda > maxConsecutivosVenda) {
          maxConsecutivosVenda = diasConsecutivosVenda;
          fluxoMaxAcumuladoVenda = fluxoAcumuladoVenda;
        }
      } else {
        diasConsecutivosVenda = 0;
        fluxoAcumuladoVenda = 0;
      }
    }
    
    if (maxConsecutivosVenda >= 5) {
      const confianca = Math.min(100, (maxConsecutivosVenda / 10) * 100);
      padroes.push({
        tipoInvestidor: tipo,
        padraoIdentificado: 'DISTRIBUICAO_CONSISTENTE',
        descricao: `Distribuição por ${maxConsecutivosVenda} dias consecutivos`,
        confianca,
        diasConsecutivos: maxConsecutivosVenda,
        fluxoAcumulado: fluxoMaxAcumuladoVenda
      });
    }
    
    // Padrão 3: Reversão recente (mudança de comportamento nos últimos 3 dias)
    if (fluxos.length >= 10) {
      const ultimos3 = fluxos.slice(-3);
      const anteriores7 = fluxos.slice(-10, -3);
      
      const mediaUltimos3 = ultimos3.reduce((acc, f) => acc + f, 0) / ultimos3.length;
      const mediaAnteriores7 = anteriores7.reduce((acc, f) => acc + f, 0) / anteriores7.length;
      
      // Detecta reversão significativa
      if (Math.sign(mediaUltimos3) !== Math.sign(mediaAnteriores7) && Math.abs(mediaUltimos3) > 50) {
        const confianca = Math.min(100, (Math.abs(mediaUltimos3 - mediaAnteriores7) / Math.abs(mediaAnteriores7 || 1)) * 50);
        padroes.push({
          tipoInvestidor: tipo,
          padraoIdentificado: 'REVERSAO_RECENTE',
          descricao: `Mudança de ${mediaAnteriores7 > 0 ? 'comprador' : 'vendedor'} para ${mediaUltimos3 > 0 ? 'comprador' : 'vendedor'}`,
          confianca,
          diasConsecutivos: 3,
          fluxoAcumulado: ultimos3.reduce((acc, f) => acc + f, 0)
        });
      }
    }
  }
  
  return padroes;
}

/**
 * Detecta alertas de movimentos significativos
 */
export function detectarAlertasMovimento(
  fluxoData: B3FluxoData[],
  winfutData?: WinfutCotacoes[]
): AlertaMovimento[] {
  const porTipo = new Map<string, B3FluxoData[]>();
  
  for (const dado of fluxoData) {
    if (!porTipo.has(dado.tipoInvestidor)) {
      porTipo.set(dado.tipoInvestidor, []);
    }
    porTipo.get(dado.tipoInvestidor)!.push(dado);
  }
  
  const alertas: AlertaMovimento[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    if (dados.length < 10) continue;
    
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    const mediaGeral = fluxos.reduce((acc, f) => acc + f, 0) / fluxos.length;
    const desvio = Math.sqrt(fluxos.reduce((acc, f) => acc + Math.pow(f - mediaGeral, 2), 0) / fluxos.length);
    
    // Analisa últimos 5 dias
    for (let i = Math.max(5, fluxos.length - 5); i < fluxos.length; i++) {
      const fluxoAtual = fluxos[i];
      const dataAtual = dados[i].data;
      
      // Alerta 1: Entrada forte (> 2 desvios padrão acima da média)
      if (fluxoAtual > mediaGeral + 2 * desvio && fluxoAtual > 100) {
        const intensidade = Math.min(100, ((fluxoAtual - mediaGeral) / (desvio || 1)) * 25);
        const relevancia = Math.min(100, (Math.abs(fluxoAtual) / 1000) * 50);
        
        alertas.push({
          data: dataAtual,
          tipoInvestidor: tipo,
          tipo: 'ENTRADA_FORTE',
          descricao: `Entrada forte de R$ ${(fluxoAtual / 1000).toFixed(2)}bi (${((fluxoAtual - mediaGeral) / desvio).toFixed(1)}σ acima da média)`,
          intensidade,
          relevancia
        });
      }
      
      // Alerta 2: Saída forte (> 2 desvios padrão abaixo da média)
      if (fluxoAtual < mediaGeral - 2 * desvio && fluxoAtual < -100) {
        const intensidade = Math.min(100, ((mediaGeral - fluxoAtual) / (desvio || 1)) * 25);
        const relevancia = Math.min(100, (Math.abs(fluxoAtual) / 1000) * 50);
        
        alertas.push({
          data: dataAtual,
          tipoInvestidor: tipo,
          tipo: 'SAIDA_FORTE',
          descricao: `Saída forte de R$ ${(Math.abs(fluxoAtual) / 1000).toFixed(2)}bi (${((mediaGeral - fluxoAtual) / desvio).toFixed(1)}σ abaixo da média)`,
          intensidade,
          relevancia
        });
      }
      
      // Alerta 3: Reversão (mudança de sinal com volume significativo)
      if (i > 0) {
        const fluxoAnterior = fluxos[i - 1];
        if (Math.sign(fluxoAtual) !== Math.sign(fluxoAnterior) && Math.abs(fluxoAtual) > Math.abs(mediaGeral)) {
          const intensidade = Math.min(100, (Math.abs(fluxoAtual - fluxoAnterior) / (desvio || 1)) * 20);
          const relevancia = Math.min(100, (Math.abs(fluxoAtual) / 500) * 50);
          
          alertas.push({
            data: dataAtual,
            tipoInvestidor: tipo,
            tipo: 'REVERSAO',
            descricao: `Reversão de ${fluxoAnterior > 0 ? 'compra' : 'venda'} para ${fluxoAtual > 0 ? 'compra' : 'venda'}`,
            intensidade,
            relevancia
          });
        }
      }
      
      // Alerta 4: Aceleração (aumento significativo em relação aos últimos 3 dias)
      if (i >= 3) {
        const media3DiasAnteriores = fluxos.slice(i - 3, i).reduce((acc, f) => acc + f, 0) / 3;
        const aceleracao = fluxoAtual - media3DiasAnteriores;
        
        if (Math.abs(aceleracao) > desvio && Math.abs(fluxoAtual) > 100) {
          const intensidade = Math.min(100, (Math.abs(aceleracao) / (desvio || 1)) * 30);
          const relevancia = Math.min(100, (Math.abs(aceleracao) / 500) * 50);
          
          alertas.push({
            data: dataAtual,
            tipoInvestidor: tipo,
            tipo: 'ACELERACAO',
            descricao: `Aceleração de ${aceleracao > 0 ? 'compras' : 'vendas'}: R$ ${(Math.abs(aceleracao) / 1000).toFixed(2)}bi acima da média recente`,
            intensidade,
            relevancia
          });
        }
      }
    }
  }
  
  // Ordena por relevância e data (mais recentes primeiro)
  alertas.sort((a, b) => {
    const relevDiff = b.relevancia - a.relevancia;
    if (Math.abs(relevDiff) > 10) return relevDiff;
    return new Date(b.data).getTime() - new Date(a.data).getTime();
  });
  
  // Retorna apenas os alertas mais relevantes (top 10)
  return alertas.slice(0, 10);
}

/**
 * Calcula correlação de Pearson entre fluxo e variação de preço
 */
function calcularCorrelacao(fluxoData: B3FluxoData[], winfutData: WinfutCotacoes[]): number {
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
