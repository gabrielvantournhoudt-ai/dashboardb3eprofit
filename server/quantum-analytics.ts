/**
 * Módulo de Análise Quântica Avançada
 * Detecta pontos de inflexão, picos, vales, ciclos e momentum nos fluxos de investidores
 */

import { B3FluxoData, WinfutCotacoes } from '../drizzle/schema';

export interface PontoInflexao {
  data: Date;
  tipoInvestidor: string;
  tipo: 'INICIO_ALTA' | 'INICIO_BAIXA' | 'REVERSAO_ALTA' | 'REVERSAO_BAIXA';
  fluxoAnterior: number;
  fluxoAtual: number;
  variacao: number; // em %
  intensidade: number; // 0-100
  diasAcumulados: number; // quantos dias na tendência anterior
}

export interface PicoVale {
  data: Date;
  tipoInvestidor: string;
  tipo: 'PICO_COMPRA' | 'VALE_VENDA' | 'PICO_LOCAL' | 'VALE_LOCAL';
  valor: number;
  intensidade: number; // 0-100 (quão significativo é)
  contexto: string; // descrição do contexto
  diasAteProximo?: number; // dias até próximo pico/vale
}

export interface CicloFluxo {
  tipoInvestidor: string;
  dataInicio: Date;
  dataFim: Date;
  tipo: 'ACUMULACAO' | 'DISTRIBUICAO' | 'LATERAL';
  duracaoDias: number;
  fluxoMedio: number;
  fluxoTotal: number;
  consistencia: number; // 0-100
  forca: number; // 0-100
}

export interface MomentumAnalise {
  tipoInvestidor: string;
  momentumAtual: number; // -100 a 100
  velocidade: number; // taxa de mudança
  aceleracao: number; // mudança na velocidade
  direcao: 'ACELERANDO_COMPRA' | 'DESACELERANDO_COMPRA' | 'ACELERANDO_VENDA' | 'DESACELERANDO_VENDA' | 'ESTAVEL';
  forcaTendencia: number; // 0-100
  previsaoProximos3Dias: 'ALTA' | 'BAIXA' | 'LATERAL';
  confiancaPrevisao: number; // 0-100
}

export interface ComparativoInvestidores {
  data: Date;
  investidores: {
    tipo: string;
    fluxo: number;
    percentualTotal: number;
  }[];
  dominante: string; // qual investidor está dominando
  divergencia: boolean; // se há divergência entre investidores
  descricao: string;
}

export interface AnaliseQuantica {
  pontosInflexao: PontoInflexao[];
  picosVales: PicoVale[];
  ciclos: CicloFluxo[];
  momentum: MomentumAnalise[];
  comparativo: ComparativoInvestidores[];
}

/**
 * Detecta pontos de inflexão nos fluxos (quando a tendência muda)
 */
export function detectarPontosInflexao(fluxoData: B3FluxoData[]): PontoInflexao[] {
  const porTipo = agruparPorTipo(fluxoData);
  const pontosInflexao: PontoInflexao[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    
    let tendenciaAtual: 'ALTA' | 'BAIXA' | 'LATERAL' = 'LATERAL';
    let diasNaTendencia = 0;
    let somaFluxoTendencia = 0;
    
    for (let i = 3; i < fluxos.length; i++) {
      const janela = fluxos.slice(i - 3, i + 1);
      const mediaJanela = janela.reduce((a, b) => a + b, 0) / janela.length;
      const fluxoAtual = fluxos[i];
      const fluxoAnterior = fluxos[i - 1];
      
      // Calcula tendência da janela
      let novaTendencia: 'ALTA' | 'BAIXA' | 'LATERAL' = 'LATERAL';
      if (mediaJanela > 50) novaTendencia = 'ALTA';
      else if (mediaJanela < -50) novaTendencia = 'BAIXA';
      
      // Detecta mudança de tendência
      if (novaTendencia !== tendenciaAtual && novaTendencia !== 'LATERAL') {
        const mediaAnterior = somaFluxoTendencia / Math.max(diasNaTendencia, 1);
        const variacao = mediaAnterior !== 0 ? ((fluxoAtual - mediaAnterior) / Math.abs(mediaAnterior)) * 100 : 0;
        
        let tipo: PontoInflexao['tipo'];
        if (tendenciaAtual === 'LATERAL' && novaTendencia === 'ALTA') {
          tipo = 'INICIO_ALTA';
        } else if (tendenciaAtual === 'LATERAL' && novaTendencia === 'BAIXA') {
          tipo = 'INICIO_BAIXA';
        } else if (tendenciaAtual === 'BAIXA' && novaTendencia === 'ALTA') {
          tipo = 'REVERSAO_ALTA';
        } else {
          tipo = 'REVERSAO_BAIXA';
        }
        
        const intensidade = Math.min(100, Math.abs(variacao));
        
        if (diasNaTendencia >= 3 && intensidade > 20) {
          pontosInflexao.push({
            data: dados[i].data,
            tipoInvestidor: tipo,
            tipo,
            fluxoAnterior: mediaAnterior,
            fluxoAtual,
            variacao,
            intensidade,
            diasAcumulados: diasNaTendencia
          });
        }
        
        tendenciaAtual = novaTendencia;
        diasNaTendencia = 0;
        somaFluxoTendencia = 0;
      }
      
      diasNaTendencia++;
      somaFluxoTendencia += fluxoAtual;
    }
  }
  
  return pontosInflexao.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/**
 * Detecta picos e vales nos fluxos
 */
export function detectarPicosVales(fluxoData: B3FluxoData[]): PicoVale[] {
  const porTipo = agruparPorTipo(fluxoData);
  const picosVales: PicoVale[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    
    const mediaGeral = fluxos.reduce((a, b) => a + b, 0) / fluxos.length;
    const desvio = Math.sqrt(fluxos.reduce((acc, f) => acc + Math.pow(f - mediaGeral, 2), 0) / fluxos.length);
    
    const picosLocais: number[] = [];
    const valesLocais: number[] = [];
    
    // Detecta picos e vales locais (janela de 5 dias)
    for (let i = 2; i < fluxos.length - 2; i++) {
      const valor = fluxos[i];
      const vizinhos = [fluxos[i-2], fluxos[i-1], fluxos[i+1], fluxos[i+2]];
      
      // É pico se for maior que todos os vizinhos
      if (vizinhos.every(v => valor > v) && valor > mediaGeral + desvio) {
        const intensidade = Math.min(100, ((valor - mediaGeral) / desvio) * 25);
        
        picosVales.push({
          data: dados[i].data,
          tipoInvestidor: tipo,
          tipo: valor > mediaGeral + 2 * desvio ? 'PICO_COMPRA' : 'PICO_LOCAL',
          valor,
          intensidade,
          contexto: `Pico de R$ ${(valor / 1000).toFixed(2)}bi (${((valor - mediaGeral) / desvio).toFixed(1)}σ acima da média)`
        });
        
        picosLocais.push(i);
      }
      
      // É vale se for menor que todos os vizinhos
      if (vizinhos.every(v => valor < v) && valor < mediaGeral - desvio) {
        const intensidade = Math.min(100, ((mediaGeral - valor) / desvio) * 25);
        
        picosVales.push({
          data: dados[i].data,
          tipoInvestidor: tipo,
          tipo: valor < mediaGeral - 2 * desvio ? 'VALE_VENDA' : 'VALE_LOCAL',
          valor,
          intensidade,
          contexto: `Vale de R$ ${(Math.abs(valor) / 1000).toFixed(2)}bi (${((mediaGeral - valor) / desvio).toFixed(1)}σ abaixo da média)`
        });
        
        valesLocais.push(i);
      }
    }
    
    // Calcula distância entre picos/vales
    const todosPontos = [...picosLocais, ...valesLocais].sort((a, b) => a - b);
    for (let i = 0; i < picosVales.length - 1; i++) {
      const idx = todosPontos.indexOf(i);
      if (idx !== -1 && idx < todosPontos.length - 1) {
        picosVales[i].diasAteProximo = todosPontos[idx + 1] - todosPontos[idx];
      }
    }
  }
  
  return picosVales.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/**
 * Identifica ciclos de acumulação e distribuição
 */
export function identificarCiclos(fluxoData: B3FluxoData[]): CicloFluxo[] {
  const porTipo = agruparPorTipo(fluxoData);
  const ciclos: CicloFluxo[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    
    let cicloAtual: {
      tipo: CicloFluxo['tipo'];
      inicio: number;
      fluxos: number[];
    } | null = null;
    
    for (let i = 0; i < fluxos.length; i++) {
      const fluxo = fluxos[i];
      
      let tipoCiclo: CicloFluxo['tipo'];
      if (fluxo > 100) tipoCiclo = 'ACUMULACAO';
      else if (fluxo < -100) tipoCiclo = 'DISTRIBUICAO';
      else tipoCiclo = 'LATERAL';
      
      if (!cicloAtual) {
        cicloAtual = { tipo: tipoCiclo, inicio: i, fluxos: [fluxo] };
      } else if (cicloAtual.tipo === tipoCiclo) {
        cicloAtual.fluxos.push(fluxo);
      } else {
        // Ciclo terminou
        if (cicloAtual.fluxos.length >= 5) {
          const fluxoMedio = cicloAtual.fluxos.reduce((a, b) => a + b, 0) / cicloAtual.fluxos.length;
          const fluxoTotal = cicloAtual.fluxos.reduce((a, b) => a + b, 0);
          const desvio = Math.sqrt(
            cicloAtual.fluxos.reduce((acc, f) => acc + Math.pow(f - fluxoMedio, 2), 0) / cicloAtual.fluxos.length
          );
          const consistencia = Math.max(0, Math.min(100, 100 * (1 - desvio / Math.abs(fluxoMedio || 1))));
          const forca = Math.min(100, Math.abs(fluxoMedio) / 10);
          
          ciclos.push({
            tipoInvestidor: tipo,
            dataInicio: dados[cicloAtual.inicio].data,
            dataFim: dados[i - 1].data,
            tipo: cicloAtual.tipo,
            duracaoDias: cicloAtual.fluxos.length,
            fluxoMedio,
            fluxoTotal,
            consistencia,
            forca
          });
        }
        
        cicloAtual = { tipo: tipoCiclo, inicio: i, fluxos: [fluxo] };
      }
    }
    
    // Adiciona último ciclo se existir
    if (cicloAtual && cicloAtual.fluxos.length >= 5) {
      const fluxoMedio = cicloAtual.fluxos.reduce((a, b) => a + b, 0) / cicloAtual.fluxos.length;
      const fluxoTotal = cicloAtual.fluxos.reduce((a, b) => a + b, 0);
      const desvio = Math.sqrt(
        cicloAtual.fluxos.reduce((acc, f) => acc + Math.pow(f - fluxoMedio, 2), 0) / cicloAtual.fluxos.length
      );
      const consistencia = Math.max(0, Math.min(100, 100 * (1 - desvio / Math.abs(fluxoMedio || 1))));
      const forca = Math.min(100, Math.abs(fluxoMedio) / 10);
      
      ciclos.push({
        tipoInvestidor: tipo,
        dataInicio: dados[cicloAtual.inicio].data,
        dataFim: dados[dados.length - 1].data,
        tipo: cicloAtual.tipo,
        duracaoDias: cicloAtual.fluxos.length,
        fluxoMedio,
        fluxoTotal,
        consistencia,
        forca
      });
    }
  }
  
  return ciclos.sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
}

/**
 * Calcula momentum e previsão de curto prazo
 */
export function calcularMomentum(fluxoData: B3FluxoData[]): MomentumAnalise[] {
  const porTipo = agruparPorTipo(fluxoData);
  const analises: MomentumAnalise[] = [];
  
  for (const [tipo, dados] of Array.from(porTipo.entries())) {
    dados.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const fluxos = dados.map(d => d.fluxoDiarioMil || 0);
    
    if (fluxos.length < 10) continue;
    
    // Calcula velocidade (média dos últimos 3 dias vs média dos 3 anteriores)
    const ultimos3 = fluxos.slice(-3);
    const anteriores3 = fluxos.slice(-6, -3);
    const mediaUltimos3 = ultimos3.reduce((a, b) => a + b, 0) / 3;
    const mediaAnteriores3 = anteriores3.reduce((a, b) => a + b, 0) / 3;
    const velocidade = mediaUltimos3 - mediaAnteriores3;
    
    // Calcula aceleração (mudança na velocidade)
    const maisAntigos3 = fluxos.slice(-9, -6);
    const mediaMaisAntigos3 = maisAntigos3.reduce((a, b) => a + b, 0) / 3;
    const velocidadeAnterior = mediaAnteriores3 - mediaMaisAntigos3;
    const aceleracao = velocidade - velocidadeAnterior;
    
    // Momentum: média ponderada dos últimos 7 dias
    const ultimos7 = fluxos.slice(-7);
    const pesos = [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2];
    const momentumAtual = ultimos7.reduce((acc, f, i) => acc + f * pesos[i], 0) / pesos.reduce((a, b) => a + b, 0);
    
    // Determina direção
    let direcao: MomentumAnalise['direcao'];
    if (velocidade > 50 && aceleracao > 0) direcao = 'ACELERANDO_COMPRA';
    else if (velocidade > 50 && aceleracao < 0) direcao = 'DESACELERANDO_COMPRA';
    else if (velocidade < -50 && aceleracao < 0) direcao = 'ACELERANDO_VENDA';
    else if (velocidade < -50 && aceleracao > 0) direcao = 'DESACELERANDO_VENDA';
    else direcao = 'ESTAVEL';
    
    // Força da tendência
    const mediaGeral = fluxos.reduce((a, b) => a + b, 0) / fluxos.length;
    const forcaTendencia = Math.min(100, Math.abs(momentumAtual - mediaGeral) / 10);
    
    // Previsão simples baseada em momentum
    let previsaoProximos3Dias: MomentumAnalise['previsaoProximos3Dias'];
    if (momentumAtual > 100 && velocidade > 0) previsaoProximos3Dias = 'ALTA';
    else if (momentumAtual < -100 && velocidade < 0) previsaoProximos3Dias = 'BAIXA';
    else previsaoProximos3Dias = 'LATERAL';
    
    // Confiança baseada na consistência
    const desvio = Math.sqrt(ultimos7.reduce((acc, f) => acc + Math.pow(f - mediaUltimos3, 2), 0) / 7);
    const confiancaPrevisao = Math.max(0, Math.min(100, 100 * (1 - desvio / Math.abs(mediaUltimos3 || 1))));
    
    analises.push({
      tipoInvestidor: tipo,
      momentumAtual,
      velocidade,
      aceleracao,
      direcao,
      forcaTendencia,
      previsaoProximos3Dias,
      confiancaPrevisao
    });
  }
  
  return analises;
}

/**
 * Cria comparativo entre investidores por dia
 */
export function criarComparativoInvestidores(fluxoData: B3FluxoData[]): ComparativoInvestidores[] {
  // Agrupa por data
  const porData = new Map<string, B3FluxoData[]>();
  
  for (const dado of fluxoData) {
    const dataKey = new Date(dado.data).toISOString().split('T')[0];
    if (!porData.has(dataKey)) {
      porData.set(dataKey, []);
    }
    porData.get(dataKey)!.push(dado);
  }
  
  const comparativos: ComparativoInvestidores[] = [];
  
  // Analisa últimos 30 dias
  const datasOrdenadas = Array.from(porData.keys()).sort().slice(-30);
  
  for (const dataKey of datasOrdenadas) {
    const dadosDia = porData.get(dataKey)!;
    const fluxoTotal = dadosDia.reduce((acc, d) => acc + Math.abs(d.fluxoDiarioMil || 0), 0);
    
    const investidores = dadosDia.map(d => ({
      tipo: d.tipoInvestidor,
      fluxo: d.fluxoDiarioMil || 0,
      percentualTotal: fluxoTotal > 0 ? (Math.abs(d.fluxoDiarioMil || 0) / fluxoTotal) * 100 : 0
    })).sort((a, b) => Math.abs(b.fluxo) - Math.abs(a.fluxo));
    
    const dominante = investidores[0]?.tipo || 'N/A';
    
    // Detecta divergência (investidores indo em direções opostas com força)
    const compradores = investidores.filter(i => i.fluxo > 100);
    const vendedores = investidores.filter(i => i.fluxo < -100);
    const divergencia = compradores.length > 0 && vendedores.length > 0;
    
    let descricao = `${dominante} dominando`;
    if (divergencia) {
      descricao += ` - Divergência: ${compradores.map(c => c.tipo).join(', ')} comprando vs ${vendedores.map(v => v.tipo).join(', ')} vendendo`;
    }
    
    comparativos.push({
      data: new Date(dataKey),
      investidores,
      dominante,
      divergencia,
      descricao
    });
  }
  
  return comparativos.sort((a, b) => b.data.getTime() - a.data.getTime());
}

/**
 * Análise quântica completa
 */
export function analiseQuanticaCompleta(
  fluxoData: B3FluxoData[],
  winfutData?: WinfutCotacoes[]
): AnaliseQuantica {
  return {
    pontosInflexao: detectarPontosInflexao(fluxoData),
    picosVales: detectarPicosVales(fluxoData),
    ciclos: identificarCiclos(fluxoData),
    momentum: calcularMomentum(fluxoData),
    comparativo: criarComparativoInvestidores(fluxoData)
  };
}

/**
 * Função auxiliar para agrupar dados por tipo de investidor
 */
function agruparPorTipo(fluxoData: B3FluxoData[]): Map<string, B3FluxoData[]> {
  const porTipo = new Map<string, B3FluxoData[]>();
  
  for (const dado of fluxoData) {
    if (!porTipo.has(dado.tipoInvestidor)) {
      porTipo.set(dado.tipoInvestidor, []);
    }
    porTipo.get(dado.tipoInvestidor)!.push(dado);
  }
  
  return porTipo;
}
