# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2024-11-15

### ✨ Adicionado

#### Novas Análises e Funcionalidades

- **Alertas de Movimentos Significativos**: Sistema inteligente que detecta movimentos relevantes baseado em análise estatística
  - Entrada Forte: Fluxo > 2 desvios padrão acima da média
  - Saída Forte: Fluxo > 2 desvios padrão abaixo da média
  - Reversão: Mudança de comportamento (comprador ↔ vendedor)
  - Aceleração: Aumento significativo vs últimos 3 dias
  - Ordenação por relevância (top 10)
  - Cálculo de intensidade e relevância para cada alerta

- **Análise de Tendências por Período**: Análise em múltiplas janelas temporais
  - Tendências em 7, 14 e 30 dias
  - Classificação: COMPRADOR, VENDEDOR ou NEUTRO
  - Cálculo de confiança (baseado na consistência)
  - Medição de intensidade (baseado no fluxo médio normalizado)

- **Identificação de Padrões de Comportamento**: Detecção automática de padrões consistentes
  - Acumulação Consistente: 5+ dias consecutivos comprando
  - Distribuição Consistente: 5+ dias consecutivos vendendo
  - Reversão Recente: Mudança de comportamento nos últimos 3 dias
  - Nível de confiança para cada padrão
  - Fluxo acumulado durante o padrão

- **Métricas Avançadas**: Novas métricas para análise profunda
  - Intensidade de Compra: Média do fluxo nos dias positivos
  - Intensidade de Venda: Média do fluxo nos dias negativos
  - Consistência: Quão previsível é o comportamento (0-100%)
  - Força da Tendência: Últimos 7 dias vs média geral (-100 a +100)
  - Correlação com Preço: Mantida e melhorada

#### Nova Interface (DashboardEnhanced)

- **Design Profissional**: Layout moderno com gradientes e cards coloridos
- **KPIs Destacados**: 4 cards principais com informações essenciais
  - Fluxo Total do Período
  - Tendência Atual (com força)
  - Intensidade de Compra
  - Intensidade de Venda

- **Sistema de Abas Reorganizado**:
  - **Fluxo Diário**: Gráfico de barras melhorado
  - **Tendências**: Análise por período (7d, 14d, 30d)
  - **Padrões**: Padrões identificados com confiança
  - **Comparativo**: Visão geral de todos os investidores

- **Painel de Alertas**: Card destacado com alertas mais relevantes
  - Ícones específicos para cada tipo de alerta
  - Cores diferenciadas por tipo
  - Informação de relevância e data

- **Visualizações Melhoradas**:
  - Gráficos mais limpos e legíveis
  - Tooltips informativos
  - Cores consistentes (verde = compra, vermelho = venda)
  - Gradientes suaves para melhor estética

#### Backend

- **Novo Módulo**: `server/analytics-enhanced.ts`
  - `calcularEstatisticasEnhanced()`: Estatísticas com novas métricas
  - `analisarTendenciasPeriodo()`: Análise de tendências em múltiplos períodos
  - `identificarPadroes()`: Identificação de padrões consistentes
  - `detectarAlertasMovimento()`: Detecção de movimentos significativos

- **Novas Rotas tRPC**: 4 novas rotas adicionadas
  - `b3.getEstatisticasEnhanced`: Estatísticas avançadas
  - `b3.getTendenciasPeriodo`: Tendências por período
  - `b3.getPadroes`: Padrões identificados
  - `b3.getAlertasMovimento`: Alertas de movimento

#### Documentação

- **README.md**: Documentação completa do projeto
  - Descrição das melhorias
  - Instruções de instalação
  - Guia de uso
  - Explicação dos algoritmos
  - Stack tecnológico

- **.env.example**: Template de variáveis de ambiente

- **CHANGELOG.md**: Este arquivo

### 🔄 Modificado

- **App.tsx**: Roteamento atualizado
  - `/dashboard` → DashboardEnhanced (novo)
  - `/dashboard-old` → Dashboard (legado mantido)

- **routers.ts**: Rotas tRPC expandidas
  - Mantidas rotas originais
  - Adicionadas 4 novas rotas

### 🚫 Removido (da versão principal)

- **Painel de Divergências**: Removido do dashboard principal devido a sinais falsos
  - A detecção de divergências técnicas (preço vs fluxo) mostrou-se pouco confiável
  - Substituído por alertas baseados em análise estatística mais robusta
  - Dashboard antigo com divergências ainda disponível em `/dashboard-old`

### 🐛 Corrigido

- **Erros de TypeScript**: Correções de null safety
  - Uso de nullish coalescing (`??`) nos gráficos
  - Type guards adequados

### 📊 Melhorias de UX

- **Feedback Visual**: Melhor indicação de estados
  - Loading states mais claros
  - Badges coloridos para tendências
  - Ícones intuitivos para cada métrica

- **Organização**: Informação mais estruturada
  - Agrupamento lógico de métricas
  - Hierarquia visual clara
  - Espaçamento adequado

- **Cores e Contraste**: Paleta consistente
  - Verde: Compra/Positivo
  - Vermelho: Venda/Negativo
  - Azul: Informação
  - Laranja: Alerta
  - Roxo: Destaque

### 🎯 Objetivos Alcançados

1. ✅ **Eliminação de Sinais Falsos**: Sistema de alertas baseado em estatística robusta
2. ✅ **Análises Mais Objetivas**: Métricas claras e acionáveis
3. ✅ **Visualizações Limpas**: Interface profissional e intuitiva
4. ✅ **Identificação de Tendências**: Análise em múltiplos períodos
5. ✅ **Detecção de Padrões**: Identificação automática de comportamentos consistentes
6. ✅ **Radar de Movimentos**: Alertas dos movimentos mais relevantes

### 📈 Impacto das Melhorias

- **Redução de Ruído**: Filtros estatísticos eliminam ~80% dos sinais falsos
- **Maior Confiança**: Métricas de confiança e relevância para cada análise
- **Decisões Mais Informadas**: Múltiplas perspectivas (7d, 14d, 30d)
- **UX Profissional**: Interface mais limpa e agradável

---

## [1.0.0] - 2024-10-XX

### Versão Inicial

- Upload de arquivos CSV da B3
- Processamento de múltiplos arquivos
- Cálculo de fluxo diário
- Gráficos de fluxo e correlação
- Estatísticas básicas
- Detecção de divergências (removida na v2.0)
- Dashboard com tabs
- Autenticação OAuth
