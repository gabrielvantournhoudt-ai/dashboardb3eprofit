# Dashboard B3 + Proffit - Análise Profissional de Fluxo de Investidores

## 📊 Visão Geral

Dashboard avançado para análise de fluxo de investidores na B3 (Bolsa de Valores brasileira) correlacionado com cotações do WINFUT. A aplicação processa arquivos CSV da B3 e do Proffit, gerando análises estatísticas avançadas e visualizações interativas para identificar tendências e padrões de comportamento dos investidores.

## ✨ Melhorias Implementadas (Nova Versão)

### 🎯 Análises Mais Objetivas e Acionáveis

#### 1. **Alertas de Movimentos Significativos**
- Detecta **entradas fortes** (> 2 desvios padrão acima da média)
- Detecta **saídas fortes** (> 2 desvios padrão abaixo da média)
- Identifica **reversões** (mudança de comportamento)
- Detecta **acelerações** (aumento significativo em relação aos últimos dias)
- Ordenação por relevância (top 10 alertas mais importantes)
- **Elimina sinais falsos** através de filtros estatísticos rigorosos

#### 2. **Análise de Tendências por Período**
- Tendências em **7, 14 e 30 dias**
- Cálculo de **confiança** baseado na consistência dos sinais
- Medição de **intensidade** da tendência
- Visualização clara: COMPRADOR, VENDEDOR ou NEUTRO

#### 3. **Identificação de Padrões de Comportamento**
- **Acumulação Consistente**: 5+ dias consecutivos comprando
- **Distribuição Consistente**: 5+ dias consecutivos vendendo
- **Reversão Recente**: Mudança de comportamento nos últimos 3 dias
- Nível de confiança para cada padrão identificado

#### 4. **Métricas Avançadas**
- **Intensidade de Compra**: Média do fluxo nos dias de compra
- **Intensidade de Venda**: Média do fluxo nos dias de venda
- **Consistência**: Quão previsível é o comportamento (0-100%)
- **Força da Tendência**: Comparação dos últimos 7 dias vs média geral (-100 a +100)
- **Correlação com Preço**: Correlação de Pearson entre fluxo e variação do WINFUT

#### 5. **Visualizações Melhoradas**
- **Dashboard Limpo e Profissional**: Design moderno com gradientes
- **KPIs Destacados**: Cards coloridos com informações essenciais
- **Gráficos Interativos**: Chart.js com tooltips informativos
- **Comparativo entre Investidores**: Visão geral de todos os tipos
- **Sistema de Abas**: Organização clara das diferentes análises

### 🚫 Removido: Painel de Divergências

O painel de divergências foi **removido da versão principal** devido aos sinais falsos. A detecção de divergências técnicas (preço vs fluxo) mostrou-se pouco confiável para decisões de trading. Em seu lugar, implementamos **alertas de movimento baseados em análise estatística**, que são mais objetivos e acionáveis.

> **Nota**: O dashboard antigo ainda está disponível em `/dashboard-old` para comparação.

## 🚀 Instalação e Execução

### Pré-requisitos

- **Node.js** 18+ 
- **pnpm** 10+
- **MySQL** 8+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/gabrielvantournhoudt-ai/dashboardb3eprofit.git
cd dashboardb3eprofit

# Instale as dependências
pnpm install
```

### Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=mysql://user:password@localhost:3306/dbname

# Servidor
PORT=3000
NODE_ENV=development

# OAuth (Manus)
# Configurado automaticamente pelo Manus Runtime
```

### Executar Migrações do Banco

```bash
pnpm db:push
```

### Modo Desenvolvimento

```bash
pnpm dev
```

Acesse: `http://localhost:3000`

### Modo Produção

```bash
# Build
pnpm build

# Start
pnpm start
```

## 📁 Estrutura do Projeto

```
dashboardb3eprofit/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Página inicial
│   │   │   ├── Upload.tsx            # Upload de arquivos
│   │   │   ├── DashboardEnhanced.tsx # ✨ NOVO Dashboard melhorado
│   │   │   └── Dashboard.tsx         # Dashboard antigo (legado)
│   │   ├── components/        # Componentes reutilizáveis
│   │   └── lib/              # Utilitários e configurações
│   └── index.html
├── server/                    # Backend Express + tRPC
│   ├── _core/                # Infraestrutura do servidor
│   ├── routers.ts            # Rotas da API (✨ com novas rotas)
│   ├── csv-processor.ts      # Processamento de CSV
│   ├── analytics.ts          # Análises estatísticas (original)
│   ├── analytics-enhanced.ts # ✨ NOVO Análises melhoradas
│   ├── b3-helpers.ts         # Funções de acesso ao banco
│   └── db.ts                 # Configuração do banco
├── drizzle/                  # Schema e migrações do banco
│   ├── schema.ts             # Definição das tabelas
│   └── migrations/           # Migrações SQL
├── shared/                   # Tipos compartilhados
└── package.json
```

## 🎨 Novas Rotas da API (tRPC)

### `b3.getEstatisticasEnhanced`
Retorna estatísticas avançadas com novas métricas:
- Intensidade de compra/venda
- Consistência do comportamento
- Força da tendência

### `b3.getTendenciasPeriodo`
Analisa tendências em 7, 14 e 30 dias com confiança e intensidade.

### `b3.getPadroes`
Identifica padrões consistentes de comportamento:
- Acumulação
- Distribuição
- Reversão

### `b3.getAlertasMovimento`
Detecta movimentos significativos com filtros estatísticos:
- Entrada forte
- Saída forte
- Reversão
- Aceleração

## 📊 Como Usar

### 1. Upload de Dados

1. Acesse a página inicial
2. Clique em "Fazer Upload de Dados"
3. Selecione **múltiplos arquivos CSV da B3** (Participação dos Investidores)
4. Opcionalmente, selecione **arquivo CSV do WINFUT** (cotações do Proffit)
5. Clique em "Processar Arquivos"

### 2. Análise no Dashboard

Após o processamento, você será redirecionado para o dashboard onde poderá:

- **Selecionar o tipo de investidor** para análise detalhada
- **Visualizar KPIs principais**: Fluxo total, tendência atual, intensidades
- **Consultar alertas de movimento**: Movimentos significativos recentes
- **Analisar tendências**: Comportamento em 7, 14 e 30 dias
- **Identificar padrões**: Padrões consistentes de acumulação/distribuição
- **Comparar investidores**: Visão geral de todos os tipos

### 3. Interpretação dos Alertas

#### 🟢 Entrada Forte
Fluxo de compra significativamente acima da média (> 2σ). Indica **interesse forte** do investidor.

#### 🔴 Saída Forte
Fluxo de venda significativamente acima da média (> 2σ). Indica **saída de posições**.

#### 🟡 Reversão
Mudança de comportamento (comprador → vendedor ou vice-versa). Indica **mudança de sentimento**.

#### 🔵 Aceleração
Aumento significativo em relação aos últimos 3 dias. Indica **intensificação** do movimento.

## 🔧 Stack Tecnológico

### Frontend
- **React** 19.2.0
- **Vite** 7.1.9
- **TanStack Query** (React Query)
- **tRPC** (type-safe API)
- **Chart.js** (gráficos)
- **Tailwind CSS** (estilização)
- **Radix UI** (componentes)

### Backend
- **Node.js** + **TypeScript**
- **Express** 4.21.2
- **tRPC** 11.6.0
- **Drizzle ORM** 0.44.6
- **MySQL** (via mysql2)
- **Zod** (validação)

## 📈 Algoritmos de Análise

### Detecção de Alertas

```typescript
// Entrada Forte: fluxo > média + 2σ
if (fluxoAtual > mediaGeral + 2 * desvio && fluxoAtual > 100) {
  // Alerta de entrada forte
}

// Saída Forte: fluxo < média - 2σ
if (fluxoAtual < mediaGeral - 2 * desvio && fluxoAtual < -100) {
  // Alerta de saída forte
}

// Reversão: mudança de sinal com volume significativo
if (Math.sign(fluxoAtual) !== Math.sign(fluxoAnterior) && Math.abs(fluxoAtual) > Math.abs(mediaGeral)) {
  // Alerta de reversão
}
```

### Análise de Tendências

```typescript
// Confiança baseada na consistência dos sinais
const pctDominante = Math.max(diasPositivos, diasNegativos) / periodo.length;
const confianca = Math.min(100, pctDominante * 100);

// Intensidade baseada no fluxo médio normalizado
const intensidade = maxFluxo > 0 ? Math.min(100, (Math.abs(fluxoMedio) / maxFluxo) * 100) : 0;
```

### Identificação de Padrões

```typescript
// Acumulação: 5+ dias consecutivos comprando
if (maxConsecutivosCompra >= 5) {
  const confianca = Math.min(100, (maxConsecutivosCompra / 10) * 100);
  // Padrão de acumulação identificado
}

// Reversão: mudança nos últimos 3 dias vs 7 dias anteriores
if (Math.sign(mediaUltimos3) !== Math.sign(mediaAnteriores7) && Math.abs(mediaUltimos3) > 50) {
  // Padrão de reversão identificado
}
```

## 🎯 Próximos Passos Sugeridos

### Funcionalidades
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Filtros de data personalizados
- [ ] Notificações push para alertas
- [ ] Histórico de análises salvas
- [ ] Comparação entre períodos

### Melhorias Técnicas
- [ ] Testes automatizados (Vitest)
- [ ] CI/CD (GitHub Actions)
- [ ] Paginação de dados
- [ ] Cache com Redis
- [ ] Rate limiting
- [ ] Logs estruturados

### Segurança
- [ ] Validação de arquivo no backend
- [ ] Rate limiting para uploads
- [ ] CSRF protection
- [ ] Headers de segurança (Helmet.js)

## 📝 Licença

MIT

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📧 Contato

Gabriel Van Tournhoudt - [@gabrielvantournhoudt-ai](https://github.com/gabrielvantournhoudt-ai)

---

**Desenvolvido com ❤️ para análise profissional de mercado financeiro**
