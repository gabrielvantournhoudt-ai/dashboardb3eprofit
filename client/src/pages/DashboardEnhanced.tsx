import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  AlertTriangle,
  Target,
  Zap,
  Calendar
} from 'lucide-react';
import { useLocation } from 'wouter';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardEnhanced() {
  const [, setLocation] = useLocation();
  const [selectedInvestor, setSelectedInvestor] = useState<string>('Investidor Estrangeiro');

  const { data: fluxoData, isLoading: loadingFluxo } = trpc.b3.getFluxoData.useQuery();
  const { data: winfutData, isLoading: loadingWinfut } = trpc.b3.getWinfutData.useQuery();
  const { data: estatisticasEnhanced } = trpc.b3.getEstatisticasEnhanced.useQuery();
  const { data: tendenciasPeriodo } = trpc.b3.getTendenciasPeriodo.useQuery();
  const { data: padroes } = trpc.b3.getPadroes.useQuery();
  const { data: alertasMovimento } = trpc.b3.getAlertasMovimento.useQuery();
  const { data: analiseQuantica } = trpc.b3.getAnaliseQuantica.useQuery();
  const { data: momentum } = trpc.b3.getMomentum.useQuery();
  const clearDataMutation = trpc.b3.clearData.useMutation();

  const tiposInvestidores = useMemo(() => {
    if (!fluxoData) return [];
    const tipos = new Set(fluxoData.map(d => d.tipoInvestidor));
    return Array.from(tipos);
  }, [fluxoData]);

  const fluxoFiltrado = useMemo(() => {
    if (!fluxoData) return [];
    return fluxoData
      .filter(d => d.tipoInvestidor === selectedInvestor)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [fluxoData, selectedInvestor]);

  const estatisticaAtual = useMemo(() => {
    if (!estatisticasEnhanced) return null;
    return estatisticasEnhanced.find(e => e.tipoInvestidor === selectedInvestor);
  }, [estatisticasEnhanced, selectedInvestor]);

  const tendenciaAtual = useMemo(() => {
    if (!tendenciasPeriodo || !selectedInvestor) return null;
    return tendenciasPeriodo[selectedInvestor];
  }, [tendenciasPeriodo, selectedInvestor]);

  // Dados para gráfico de fluxo diário
  const fluxoChartData = useMemo(() => ({
    labels: fluxoFiltrado.map(d => new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
    datasets: [{
      label: 'Fluxo Diário (R$ Bilhões)',
      data: fluxoFiltrado.map(d => (d.fluxoDiarioMil || 0) / 1000),
      backgroundColor: fluxoFiltrado.map(d => 
        (d.fluxoDiarioMil || 0) > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      ),
      borderColor: fluxoFiltrado.map(d => 
        (d.fluxoDiarioMil || 0) > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
      ),
      borderWidth: 2
    }]
  }), [fluxoFiltrado]);

  const fluxoChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `Fluxo: R$ ${value >= 0 ? '+' : ''}${value.toFixed(2)}bi`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Fluxo (R$ Bilhões)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data'
        },
        grid: {
          display: false
        }
      }
    }
  };

  // Dados para gráfico de tendências por período
  const tendenciaChartData = useMemo(() => {
    if (!tendenciaAtual) return null;

    return {
      labels: tendenciaAtual.map(t => t.periodo),
      datasets: [
        {
          label: 'Fluxo Médio (R$ Bilhões)',
          data: tendenciaAtual.map(t => t.fluxoMedio / 1000),
          backgroundColor: tendenciaAtual.map(t => 
            t.fluxoMedio > 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'
          ),
          borderColor: tendenciaAtual.map(t => 
            t.fluxoMedio > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
          ),
          borderWidth: 2
        }
      ]
    };
  }, [tendenciaAtual]);

  const tendenciaChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x ?? 0;
            const idx = context.dataIndex;
            const tendencia = tendenciaAtual?.[idx];
            return [
              `Fluxo Médio: R$ ${value >= 0 ? '+' : ''}${value.toFixed(2)}bi`,
              `Tendência: ${tendencia?.tendencia || 'N/A'}`,
              `Confiança: ${tendencia?.confianca.toFixed(0)}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Fluxo Médio (R$ Bilhões)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Período'
        }
      }
    }
  };

  const handleClearData = async () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      await clearDataMutation.mutateAsync();
      setLocation('/');
    }
  };

  if (loadingFluxo || loadingWinfut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!fluxoData || fluxoData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nenhum Dado Disponível</CardTitle>
            <CardDescription>
              Faça upload dos arquivos CSV da B3 para começar a análise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} className="w-full">
              Fazer Upload de Dados
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'COMPRADOR': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'VENDEDOR': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'COMPRADOR': return 'text-green-600';
      case 'VENDEDOR': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA_FORTE': return <TrendingUp className="h-5 w-5" />;
      case 'SAIDA_FORTE': return <TrendingDown className="h-5 w-5" />;
      case 'REVERSAO': return <Zap className="h-5 w-5" />;
      case 'ACELERACAO': return <Target className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertaColor = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA_FORTE': return 'bg-green-100 dark:bg-green-950 border-green-600 text-green-800 dark:text-green-200';
      case 'SAIDA_FORTE': return 'bg-red-100 dark:bg-red-950 border-red-600 text-red-800 dark:text-red-200';
      case 'REVERSAO': return 'bg-yellow-100 dark:bg-yellow-950 border-yellow-600 text-yellow-800 dark:text-yellow-200';
      case 'ACELERACAO': return 'bg-blue-100 dark:bg-blue-950 border-blue-600 text-blue-800 dark:text-blue-200';
      default: return 'bg-gray-100 dark:bg-gray-950 border-gray-600 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard B3 Análise Profissional
            </h1>
            <p className="text-sm text-muted-foreground">
              Análise Avançada de Fluxo de Investidores
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setLocation('/')}>
              Nova Análise
            </Button>
            <Button variant="destructive" onClick={handleClearData} disabled={clearDataMutation.isPending}>
              {clearDataMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Limpar Dados'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Seletor de Investidor */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Selecione o Tipo de Investidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposInvestidores.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* KPIs Principais */}
        {estatisticaAtual && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fluxo Total Período</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${estatisticaAtual.fluxoTotalPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {(estatisticaAtual.fluxoTotalPeriodo / 1000).toFixed(2)}bi
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média: R$ {(estatisticaAtual.fluxoDiarioMedio / 1000).toFixed(2)}bi/dia
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tendência Atual</CardTitle>
                {getTendenciaIcon(estatisticaAtual.tendenciaAtual)}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getTendenciaColor(estatisticaAtual.tendenciaAtual)}`}>
                  {estatisticaAtual.tendenciaAtual}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Força: {estatisticaAtual.forcaTendencia.toFixed(0)}%
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Intensidade Compra</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {(estatisticaAtual.intensidadeCompra / 1000).toFixed(2)}bi
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticaAtual.pctDiasComprador.toFixed(0)}% dos dias
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Intensidade Venda</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {(estatisticaAtual.intensidadeVenda / 1000).toFixed(2)}bi
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticaAtual.pctDiasVendedor.toFixed(0)}% dos dias
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertas de Movimento */}
        {alertasMovimento && alertasMovimento.length > 0 && (
          <Card className="border-2 border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alertas de Movimentos Significativos
              </CardTitle>
              <CardDescription>
                Movimentos recentes que merecem atenção (ordenados por relevância)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertasMovimento.slice(0, 5).map((alerta, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${getAlertaColor(alerta.tipo)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getAlertaIcon(alerta.tipo)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {new Date(alerta.data).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {alerta.tipoInvestidor}
                            </Badge>
                          </div>
                          <p className="text-sm">{alerta.descricao}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Relevância</div>
                        <div className="text-lg font-bold">{alerta.relevancia.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs de Visualizações */}
        <Tabs defaultValue="fluxo" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fluxo">Fluxo Diário</TabsTrigger>
            <TabsTrigger value="tendencias">Tendências</TabsTrigger>
            <TabsTrigger value="quantica">Análise Quântica</TabsTrigger>
            <TabsTrigger value="padroes">Padrões</TabsTrigger>
            <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          </TabsList>

          {/* Aba: Fluxo Diário */}
          <TabsContent value="fluxo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo Diário - {selectedInvestor}</CardTitle>
                <CardDescription>
                  Evolução diária do fluxo de capital (verde = compra, vermelho = venda)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[450px]">
                  {fluxoFiltrado.length > 0 && (
                    <Bar data={fluxoChartData} options={fluxoChartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Análise Quântica */}
          <TabsContent value="quantica" className="space-y-4">
            {/* Momentum e Previsão */}
            <Card className="border-2 border-purple-200 dark:border-purple-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Momentum e Previsão de Curto Prazo
                </CardTitle>
                <CardDescription>
                  Análise de velocidade, aceleração e previsão para os próximos 3 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {momentum && momentum.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {momentum.map((m, idx) => (
                      <div key={idx} className="p-4 rounded-lg border-2 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg">{m.tipoInvestidor}</h4>
                          <Badge variant={m.previsaoProximos3Dias === 'ALTA' ? 'default' : m.previsaoProximos3Dias === 'BAIXA' ? 'destructive' : 'secondary'}>
                            {m.previsaoProximos3Dias}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Momentum:</span>
                            <span className={`font-semibold ${m.momentumAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              R$ {(m.momentumAtual / 1000).toFixed(2)}bi
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Velocidade:</span>
                            <span className={`font-semibold ${m.velocidade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {m.velocidade >= 0 ? '+' : ''}{(m.velocidade / 1000).toFixed(2)}bi/dia
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Direção:</span>
                            <span className="font-semibold">{m.direcao.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Força Tendência:</span>
                            <span className="font-semibold">{m.forcaTendencia.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-muted-foreground">Confiança Previsão:</span>
                            <span className="font-semibold text-purple-600">{m.confiancaPrevisao.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Dados insuficientes para cálculo de momentum
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pontos de Inflexão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Pontos de Inflexão (Mudanças de Tendência)
                </CardTitle>
                <CardDescription>
                  Momentos em que o fluxo mudou de direção significativamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analiseQuantica?.pontosInflexao && analiseQuantica.pontosInflexao.length > 0 ? (
                  <div className="space-y-3">
                    {analiseQuantica.pontosInflexao.slice(0, 10).map((ponto, idx) => (
                      <div key={idx} className="p-4 rounded-lg border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                {new Date(ponto.data).toLocaleDateString('pt-BR')}
                              </span>
                              <Badge variant="outline">{ponto.tipoInvestidor}</Badge>
                            </div>
                            <p className="text-sm font-semibold mb-1">
                              {ponto.tipo.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              De R$ {(ponto.fluxoAnterior / 1000).toFixed(2)}bi para R$ {(ponto.fluxoAtual / 1000).toFixed(2)}bi
                              ({ponto.variacao >= 0 ? '+' : ''}{ponto.variacao.toFixed(1)}%)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Após {ponto.diasAcumulados} dias na tendência anterior
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Intensidade</div>
                            <div className="text-2xl font-bold text-orange-600">{ponto.intensidade.toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum ponto de inflexão detectado no período
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Picos e Vales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Picos e Vales de Fluxo
                </CardTitle>
                <CardDescription>
                  Máximos e mínimos significativos no fluxo de capital
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analiseQuantica?.picosVales && analiseQuantica.picosVales.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {analiseQuantica.picosVales.slice(0, 8).map((pv, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${
                          pv.tipo.includes('PICO') 
                            ? 'bg-green-50 dark:bg-green-950 border-green-500' 
                            : 'bg-red-50 dark:bg-red-950 border-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-semibold">
                              {new Date(pv.data).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {pv.tipoInvestidor}
                            </Badge>
                          </div>
                          {pv.tipo.includes('PICO') ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm mb-1">{pv.contexto}</p>
                        {pv.diasAteProximo && (
                          <p className="text-xs text-muted-foreground">
                            Próximo em ~{pv.diasAteProximo} dias
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum pico ou vale significativo detectado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ciclos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Ciclos de Acumulação e Distribuição
                </CardTitle>
                <CardDescription>
                  Períodos prolongados de comportamento consistente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analiseQuantica?.ciclos && analiseQuantica.ciclos.length > 0 ? (
                  <div className="space-y-3">
                    {analiseQuantica.ciclos.slice(0, 8).map((ciclo, idx) => (
                      <div key={idx} className="p-4 rounded-lg border-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="mb-2">{ciclo.tipoInvestidor}</Badge>
                            <h4 className="font-semibold">
                              {ciclo.tipo === 'ACUMULACAO' ? '📈 Acumulação' : ciclo.tipo === 'DISTRIBUICAO' ? '📉 Distribuição' : '➡️ Lateral'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(ciclo.dataInicio).toLocaleDateString('pt-BR')} a {new Date(ciclo.dataFim).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Duração</div>
                            <div className="text-2xl font-bold">{ciclo.duracaoDias} dias</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm mt-3 pt-3 border-t">
                          <div>
                            <span className="text-muted-foreground">Fluxo Total:</span>
                            <span className={`ml-2 font-semibold ${ciclo.fluxoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              R$ {(ciclo.fluxoTotal / 1000).toFixed(2)}bi
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Consistência:</span>
                            <span className="ml-2 font-semibold">{ciclo.consistencia.toFixed(0)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Força:</span>
                            <span className="ml-2 font-semibold">{ciclo.forca.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum ciclo prolongado identificado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Tendências por Período */}
          <TabsContent value="tendencias" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tendências por Período - {selectedInvestor}</CardTitle>
                  <CardDescription>
                    Análise de tendência em diferentes janelas temporais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {tendenciaChartData && (
                      <Bar data={tendenciaChartData} options={tendenciaChartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes das Tendências</CardTitle>
                  <CardDescription>
                    Confiança e intensidade por período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tendenciaAtual?.map((t, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{t.periodo}</span>
                          </div>
                          <Badge variant={t.tendencia === 'COMPRADOR' ? 'default' : t.tendencia === 'VENDEDOR' ? 'destructive' : 'secondary'}>
                            {t.tendencia}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Fluxo Médio:</span>
                            <span className={`ml-2 font-semibold ${t.fluxoMedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              R$ {(t.fluxoMedio / 1000).toFixed(2)}bi
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confiança:</span>
                            <span className="ml-2 font-semibold">{t.confianca.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba: Padrões Identificados */}
          <TabsContent value="padroes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Padrões de Comportamento Identificados</CardTitle>
                <CardDescription>
                  Padrões consistentes detectados no comportamento dos investidores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {padroes && padroes.length > 0 ? (
                  <div className="space-y-3">
                    {padroes.map((padrao, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {padrao.tipoInvestidor}
                            </Badge>
                            <h4 className="font-semibold text-lg">
                              {padrao.padraoIdentificado.replace(/_/g, ' ')}
                            </h4>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Confiança</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {padrao.confianca.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{padrao.descricao}</p>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Dias Consecutivos:</span>
                            <span className="ml-2 font-semibold">{padrao.diasConsecutivos}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fluxo Acumulado:</span>
                            <span className="ml-2 font-semibold">
                              R$ {(padrao.fluxoAcumulado / 1000).toFixed(2)}bi
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum padrão consistente identificado no período analisado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Comparativo entre Investidores */}
          <TabsContent value="comparativo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo entre Tipos de Investidores</CardTitle>
                <CardDescription>
                  Visão geral do comportamento de todos os investidores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estatisticasEnhanced && estatisticasEnhanced.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {estatisticasEnhanced.map(est => (
                      <Card key={est.tipoInvestidor} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{est.tipoInvestidor}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tendência:</span>
                            <span className={`font-semibold ${getTendenciaColor(est.tendenciaAtual)}`}>
                              {est.tendenciaAtual}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fluxo Total:</span>
                            <span className={`font-semibold ${est.fluxoTotalPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              R$ {(est.fluxoTotalPeriodo / 1000).toFixed(2)}bi
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Consistência:</span>
                            <span className="font-semibold">{est.consistencia.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">% Comprador:</span>
                            <span className="font-semibold text-green-600">{est.pctDiasComprador.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">% Vendedor:</span>
                            <span className="font-semibold text-red-600">{est.pctDiasVendedor.toFixed(0)}%</span>
                          </div>
                          {est.correlacaoComPreco !== undefined && (
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-muted-foreground">Correlação c/ Preço:</span>
                              <span className="font-semibold">{est.correlacaoComPreco.toFixed(3)}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
