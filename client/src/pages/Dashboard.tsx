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
import { Bar, Scatter } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Loader2, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedInvestor, setSelectedInvestor] = useState<string>('Investidor Estrangeiro');

  const { data: fluxoData, isLoading: loadingFluxo } = trpc.b3.getFluxoData.useQuery();
  const { data: winfutData, isLoading: loadingWinfut } = trpc.b3.getWinfutData.useQuery();
  const { data: estatisticas } = trpc.b3.getEstatisticas.useQuery();
  const { data: divergencias } = trpc.b3.getDivergencias.useQuery(
    { tipoInvestidor: selectedInvestor, janela: 5 },
    { enabled: !!selectedInvestor && !!winfutData && winfutData.length > 0 }
  );
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

  const estatisticasLocais = useMemo(() => {
    if (fluxoFiltrado.length === 0) return null;

    const fluxos = fluxoFiltrado.map(d => d.fluxoDiarioMil || 0);
    const diasComprador = fluxos.filter(f => f > 0).length;
    const diasVendedor = fluxos.filter(f => f < 0).length;
    const fluxoTotal = fluxos.reduce((acc, f) => acc + f, 0);
    const fluxoMedio = fluxoTotal / fluxos.length;

    return {
      diasComprador,
      diasVendedor,
      pctComprador: (diasComprador / fluxos.length) * 100,
      pctVendedor: (diasVendedor / fluxos.length) * 100,
      fluxoTotal,
      fluxoMedio,
      tendenciaAtual: fluxos[fluxos.length - 1] > 0 ? 'COMPRADOR' : 'VENDEDOR'
    };
  }, [fluxoFiltrado]);

  const correlacao = useMemo(() => {
    if (!fluxoFiltrado || !winfutData || fluxoFiltrado.length === 0 || winfutData.length === 0) {
      return null;
    }

    const merged = fluxoFiltrado.map(f => {
      const winfut = winfutData.find(w => 
        new Date(w.data).toDateString() === new Date(f.data).toDateString()
      );
      return {
        data: f.data,
        fluxo: f.fluxoDiarioMil || 0,
        variacao: winfut ? (parseFloat(winfut.variacaoPct || '0')) / 100 : null
      };
    }).filter(d => d.variacao !== null);

    if (merged.length < 2) return null;

    const n = merged.length;
    const sumX = merged.reduce((acc, d) => acc + d.fluxo, 0);
    const sumY = merged.reduce((acc, d) => acc + (d.variacao || 0), 0);
    const sumXY = merged.reduce((acc, d) => acc + d.fluxo * (d.variacao || 0), 0);
    const sumX2 = merged.reduce((acc, d) => acc + d.fluxo * d.fluxo, 0);
    const sumY2 = merged.reduce((acc, d) => acc + (d.variacao || 0) * (d.variacao || 0), 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }, [fluxoFiltrado, winfutData]);

  // Dados para gráfico de fluxo diário
  const fluxoChartData = useMemo(() => ({
    labels: fluxoFiltrado.map(d => new Date(d.data).toLocaleDateString('pt-BR')),
    datasets: [{
      label: 'Fluxo Diário (R$ Bilhões)',
      data: fluxoFiltrado.map(d => (d.fluxoDiarioMil || 0) / 1000),
      backgroundColor: fluxoFiltrado.map(d => 
        (d.fluxoDiarioMil || 0) > 0 ? 'rgba(22, 163, 74, 0.8)' : 'rgba(220, 38, 38, 0.8)'
      ),
      borderColor: fluxoFiltrado.map(d => 
        (d.fluxoDiarioMil || 0) > 0 ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)'
      ),
      borderWidth: 1
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
          label: (context) => `Fluxo: R$ ${context.parsed.y?.toFixed(2) || '0.00'}bi`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Fluxo (R$ Bilhões)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data'
        }
      }
    }
  };

  // Dados para gráfico de correlação
  const correlacaoChartData = useMemo(() => {
    if (!winfutData || winfutData.length === 0) return null;

    const data = fluxoFiltrado.map(f => {
      const winfut = winfutData.find(w => 
        new Date(w.data).toDateString() === new Date(f.data).toDateString()
      );
      return {
        x: (f.fluxoDiarioMil || 0) / 1000,
        y: winfut ? (parseFloat(winfut.variacaoPct || '0')) / 100 : null
      };
    }).filter(d => d.y !== null);

    return {
      datasets: [{
        label: 'Fluxo vs Variação',
        data: data as { x: number; y: number }[],
        backgroundColor: data.map(d => d.y! > 0 ? 'rgba(22, 163, 74, 0.6)' : 'rgba(220, 38, 38, 0.6)'),
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    };
  }, [fluxoFiltrado, winfutData]);

  const correlacaoChartOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `Fluxo: R$ ${context.parsed.x?.toFixed(2) || '0.00'}bi | Variação: ${context.parsed.y?.toFixed(2) || '0.00'}%`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Fluxo Diário (R$ Bilhões)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Variação WINFUT (%)'
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard B3 + Proffit</h1>
            <p className="text-sm text-muted-foreground">
              Análise de Fluxo de Investidores
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

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Seletor de Investidor */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione o Tipo de Investidor</CardTitle>
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

        {/* KPIs */}
        {estatisticasLocais && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fluxo Total</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(estatisticasLocais.fluxoTotal / 1000).toFixed(2)}bi
                </div>
                <p className="text-xs text-muted-foreground">
                  Média: R$ {(estatisticasLocais.fluxoMedio / 1000).toFixed(2)}bi/dia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tendência Atual</CardTitle>
                {estatisticasLocais.tendenciaAtual === 'COMPRADOR' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  estatisticasLocais.tendenciaAtual === 'COMPRADOR' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {estatisticasLocais.tendenciaAtual}
                </div>
                <p className="text-xs text-muted-foreground">
                  Último dia analisado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias Comprador</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {estatisticasLocais.pctComprador.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {estatisticasLocais.diasComprador} dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias Vendedor</CardTitle>
                <BarChart3 className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {estatisticasLocais.pctVendedor.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {estatisticasLocais.diasVendedor} dias
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos */}
        <Tabs defaultValue="fluxo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="fluxo">Fluxo Diário</TabsTrigger>
            <TabsTrigger value="correlacao" disabled={!winfutData || winfutData.length === 0}>
              Correlação
            </TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            <TabsTrigger value="divergencias" disabled={!winfutData || winfutData.length === 0}>
              Divergências
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fluxo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo Diário - {selectedInvestor}</CardTitle>
                <CardDescription>
                  Compras e vendas diárias em bilhões de reais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {fluxoFiltrado.length > 0 && (
                    <Bar data={fluxoChartData} options={fluxoChartOptions} />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlacao" className="space-y-4">
            {winfutData && winfutData.length > 0 && correlacaoChartData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Correlação Fluxo x Preço</CardTitle>
                    <CardDescription>
                      Correlação entre fluxo de {selectedInvestor} e variação do WINFUT
                      {correlacao !== null && (
                        <span className="ml-2 font-semibold">
                          (r = {correlacao.toFixed(3)})
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <Scatter data={correlacaoChartData} options={correlacaoChartOptions} />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="estatisticas" className="space-y-4">
            {estatisticas && estatisticas.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {estatisticas.map(est => (
                  <Card key={est.tipoInvestidor}>
                    <CardHeader>
                      <CardTitle className="text-lg">{est.tipoInvestidor}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">


                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">% Dias Comprador:</span>
                        <span className="font-semibold text-green-600">{est.pctDiasComprador?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">% Dias Vendedor:</span>
                        <span className="font-semibold text-red-600">{est.pctDiasVendedor?.toFixed(1)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="divergencias" className="space-y-4">
            {divergencias && divergencias.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Divergências Detectadas</CardTitle>
                  <CardDescription>
                    Sinais de possíveis oportunidades de trading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {divergencias.map((div, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          div.tipo === 'ALTA' 
                            ? 'bg-green-50 dark:bg-green-950 border-green-600' 
                            : 'bg-red-50 dark:bg-red-950 border-red-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">
                            {new Date(div.data).toLocaleDateString('pt-BR')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            div.tipo === 'ALTA'
                              ? 'bg-green-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}>
                            {div.tipo === 'ALTA' ? 'SINAL DE COMPRA' : 'SINAL DE VENDA'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{div.descricao}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma divergência detectada no período analisado
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
