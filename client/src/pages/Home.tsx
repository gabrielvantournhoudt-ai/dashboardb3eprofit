import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TrendingUp, Upload, BarChart3, LineChart } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">{APP_TITLE}</span>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Olá, {user.name}</span>
              <Button onClick={() => setLocation('/upload')}>Começar Análise</Button>
            </div>
          ) : (
            <Button asChild>
              <a href={getLoginUrl()}>Entrar</a>
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              Análise Avançada de Fluxo de Investidores
            </h1>
            <p className="text-xl text-muted-foreground">
              Visualize e analise o comportamento dos investidores da B3 com correlações de preço do WINFUT
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {user ? (
              <Button size="lg" onClick={() => setLocation('/upload')}>
                <Upload className="mr-2 h-5 w-5" />
                Fazer Upload de Dados
              </Button>
            ) : (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>
                  <Upload className="mr-2 h-5 w-5" />
                  Começar Agora
                </a>
              </Button>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Fluxo Diário</h3>
              <p className="text-sm text-muted-foreground">
                Visualize o fluxo de compras e vendas por tipo de investidor com gráficos interativos
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border">
              <LineChart className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Correlações</h3>
              <p className="text-sm text-muted-foreground">
                Analise a correlação entre fluxo de investidores e variação de preço do WINFUT
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Divergências</h3>
              <p className="text-sm text-muted-foreground">
                Detecte divergências entre preço e fluxo para identificar oportunidades de trading
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
