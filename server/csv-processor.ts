/**
 * Módulo para processar arquivos CSV da B3 e WINFUT
 */

interface B3DataRow {
  data: Date;
  tipoInvestidor: string;
  comprasAcumuladoMil: number;
  vendasAcumuladoMil: number;
  fluxoAcumuladoMil: number;
  comprasDiarioMil?: number;
  vendasDiarioMil?: number;
  fluxoDiarioMil?: number;
}

interface WinfutDataRow {
  data: Date;
  abertura: number;
  maxima: number;
  minima: number;
  fechamento: number;
  volumeTotal: number;
  quantidadeTotal: number;
}

/**
 * Extrai data REAL do CONTEÚDO do CSV
 * Formato: "Dados acumulados do início do mês até o dia DD/MM/YYYY"
 */
function extrairDataDoConteudo(conteudo: string): Date | null {
  const linhas = conteudo.split('\n').slice(0, 5);
  
  // Padrão: "até o dia DD/MM/YYYY"
  const pattern = /até o dia (\d{2})\/(\d{2})\/(\d{4})/;
  
  for (const linha of linhas) {
    const match = linha.match(pattern);
    if (match) {
      const [, dia, mes, ano] = match;
      const anoNum = parseInt(ano);
      const mesNum = parseInt(mes);
      const diaNum = parseInt(dia);
      
      if (anoNum >= 2000 && anoNum <= 2030 && mesNum >= 1 && mesNum <= 12 && diaNum >= 1 && diaNum <= 31) {
        return new Date(anoNum, mesNum - 1, diaNum);
      }
    }
  }
  
  return null;
}

/**
 * Processa múltiplos CSVs da B3 e calcula fluxo diário
 * IMPORTANTE: Os dados da B3 são ACUMULADOS desde o início do mês
 * Para obter fluxo diário, calculamos a diferença entre dias consecutivos
 */
export function processarMultiplosCSVsB3(arquivos: Array<{ nome: string; conteudo: string }>): B3DataRow[] {
  const dadosAcumulados: B3DataRow[] = [];
  
  // 1. Processar cada arquivo e extrair dados acumulados
  for (const arquivo of arquivos) {
    const data = extrairDataDoConteudo(arquivo.conteudo);
    
    if (!data) {
      console.warn(`[processarMultiplosCSVsB3] Não foi possível extrair data do arquivo: ${arquivo.nome}`);
      continue;
    }
    
    const linhas = arquivo.conteudo.split('\n');
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      // Pular linhas de cabeçalho ou vazias
      if (!linha || linha.includes('Tipos de Investidores') || linha.includes('Investidores no Volume')) {
        continue;
      }
      
      const partes = linha.split(';');
      
      if (partes.length >= 5) {
        const tipoInvestidor = partes[0].trim();
        
        // Pular se não for um tipo de investidor válido
        if (!tipoInvestidor || tipoInvestidor.includes('Dados acumulados')) {
          continue;
        }
        
        const compras = parseFloat(partes[1].replace(/\./g, '').replace(',', '.'));
        const vendas = parseFloat(partes[3].replace(/\./g, '').replace(',', '.'));
        
        if (!isNaN(compras) && !isNaN(vendas)) {
          dadosAcumulados.push({
            data,
            tipoInvestidor,
            comprasAcumuladoMil: compras,
            vendasAcumuladoMil: vendas,
            fluxoAcumuladoMil: compras - vendas
          });
        }
      }
    }
  }
  
  // 2. Ordenar por data e tipo de investidor
  dadosAcumulados.sort((a, b) => {
    const dateDiff = a.data.getTime() - b.data.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.tipoInvestidor.localeCompare(b.tipoInvestidor);
  });
  
  // 3. Calcular fluxo diário (diferença entre dias consecutivos)
  const dadosDiarios: B3DataRow[] = [];
  const investidoresPorData = new Map<string, Map<string, B3DataRow>>();
  
  // Agrupar por data
  for (const dado of dadosAcumulados) {
    const dataKey = dado.data.toISOString().split('T')[0];
    if (!investidoresPorData.has(dataKey)) {
      investidoresPorData.set(dataKey, new Map());
    }
    investidoresPorData.get(dataKey)!.set(dado.tipoInvestidor, dado);
  }
  
  // Calcular diferenças
  const datasOrdenadas = Array.from(investidoresPorData.keys()).sort();
  const investidores = Array.from(new Set(dadosAcumulados.map(d => d.tipoInvestidor)));
  
  for (let i = 0; i < datasOrdenadas.length; i++) {
    const dataAtual = datasOrdenadas[i];
    const dadosAtual = investidoresPorData.get(dataAtual)!;
    
    for (const investidor of investidores) {
      const dadoAtual = dadosAtual.get(investidor);
      
      if (!dadoAtual) continue;
      
      let comprasDiario = 0;
      let vendasDiario = 0;
      let fluxoDiario = 0;
      
      if (i === 0) {
        // Primeiro dia do mês: usar valores acumulados como diários
        comprasDiario = dadoAtual.comprasAcumuladoMil;
        vendasDiario = dadoAtual.vendasAcumuladoMil;
        fluxoDiario = dadoAtual.fluxoAcumuladoMil;
      } else {
        // Dias subsequentes: calcular diferença
        const dataAnterior = datasOrdenadas[i - 1];
        const dadosAnterior = investidoresPorData.get(dataAnterior)!;
        const dadoAnterior = dadosAnterior.get(investidor);
        
        if (dadoAnterior) {
          // Verificar se houve reset mensal (novo mês começou)
          const mesAtual = new Date(dataAtual).getMonth();
          const mesAnterior = new Date(dataAnterior).getMonth();
          
          if (mesAtual !== mesAnterior) {
            // Reset mensal: usar valores acumulados como diários
            comprasDiario = dadoAtual.comprasAcumuladoMil;
            vendasDiario = dadoAtual.vendasAcumuladoMil;
            fluxoDiario = dadoAtual.fluxoAcumuladoMil;
          } else {
            // Mesmo mês: calcular diferença
            comprasDiario = dadoAtual.comprasAcumuladoMil - dadoAnterior.comprasAcumuladoMil;
            vendasDiario = dadoAtual.vendasAcumuladoMil - dadoAnterior.vendasAcumuladoMil;
            fluxoDiario = dadoAtual.fluxoAcumuladoMil - dadoAnterior.fluxoAcumuladoMil;
          }
        } else {
          // Investidor não tinha dados no dia anterior
          comprasDiario = dadoAtual.comprasAcumuladoMil;
          vendasDiario = dadoAtual.vendasAcumuladoMil;
          fluxoDiario = dadoAtual.fluxoAcumuladoMil;
        }
      }
      
      dadosDiarios.push({
        ...dadoAtual,
        comprasDiarioMil: comprasDiario,
        vendasDiarioMil: vendasDiario,
        fluxoDiarioMil: fluxoDiario
      });
    }
  }
  
  return dadosDiarios;
}

/**
 * Processa CSV do WINFUT exportado do Proffit
 * Formato: Ativo;Data;Hora;Abertura;Máximo;Mínimo;Fechamento;Volume;Quantidade
 */
export function processarCSVWINFUT(conteudo: string): WinfutDataRow[] {
  const linhas = conteudo.split('\n');
  const dados: WinfutDataRow[] = [];
  
  // Agrupar por data para agregar dados intraday
  const dadosPorData = new Map<string, {
    abertura: number;
    maxima: number;
    minima: number;
    fechamento: number;
    volumeTotal: number;
    quantidadeTotal: number;
  }>();
  
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    
    const partes = linha.split(';');
    
    if (partes.length >= 9) {
      try {
        // Extrair data (formato DD/MM/YYYY)
        const dataStr = partes[1].trim();
        const [dia, mes, ano] = dataStr.split('/');
        const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        const dataKey = data.toISOString().split('T')[0];
        
        // Parsear valores numéricos (remover separadores de milhar e trocar vírgula por ponto)
        const abertura = parseFloat(partes[3].replace(/\./g, '').replace(',', '.'));
        const maxima = parseFloat(partes[4].replace(/\./g, '').replace(',', '.'));
        const minima = parseFloat(partes[5].replace(/\./g, '').replace(',', '.'));
        const fechamento = parseFloat(partes[6].replace(/\./g, '').replace(',', '.'));
        const volume = parseFloat(partes[7].replace(/\./g, '').replace(',', '.'));
        const quantidade = parseFloat(partes[8].replace(/\./g, '').replace(',', '.'));
        
        // Validar valores
        if (isNaN(abertura) || isNaN(maxima) || isNaN(minima) || isNaN(fechamento)) {
          continue;
        }
        
        // Agregar por data
        if (!dadosPorData.has(dataKey)) {
          dadosPorData.set(dataKey, {
            abertura,
            maxima,
            minima,
            fechamento,
            volumeTotal: volume || 0,
            quantidadeTotal: quantidade || 0
          });
        } else {
          const existente = dadosPorData.get(dataKey)!;
          existente.maxima = Math.max(existente.maxima, maxima);
          existente.minima = Math.min(existente.minima, minima);
          existente.fechamento = fechamento; // Último fechamento
          existente.volumeTotal += volume || 0;
          existente.quantidadeTotal += quantidade || 0;
        }
      } catch (error) {
        console.warn(`[processarCSVWINFUT] Erro ao processar linha ${i}: ${error}`);
        continue;
      }
    }
  }
  
  // Converter para array
  const entries = Array.from(dadosPorData.entries());
  for (const [dataKey, valores] of entries) {
    dados.push({
      data: new Date(dataKey),
      ...valores
    });
  }
  
  // Ordenar por data
  dados.sort((a, b) => a.data.getTime() - b.data.getTime());
  
  return dados;
}

/**
 * Calcula variações de preço do WINFUT
 */
export function calcularVariacoesWINFUT(dados: WinfutDataRow[]): Array<WinfutDataRow & {
  variacaoPontos: number;
  variacaoPct: number;
  amplitude: number;
}> {
  return dados.map((atual, index) => {
    const anterior = index > 0 ? dados[index - 1] : null;
    
    const variacaoPontos = anterior ? atual.fechamento - anterior.fechamento : 0;
    const variacaoPct = anterior && anterior.fechamento !== 0 
      ? (variacaoPontos / anterior.fechamento) * 100 
      : 0;
    const amplitude = atual.maxima - atual.minima;
    
    return {
      ...atual,
      variacaoPontos,
      variacaoPct,
      amplitude
    };
  });
}
