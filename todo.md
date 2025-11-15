# Project TODO

## Database & Backend
- [x] Definir schema do banco de dados para armazenar histórico de análises B3
- [x] Criar tabela para dados de fluxo diário de investidores
- [x] Criar tabela para cotações WINFUT
- [x] Implementar rota tRPC para upload de arquivos CSV da B3
- [x] Implementar rota tRPC para upload de arquivos CSV do WINFUT
- [x] Implementar processamento de CSV da B3 (extração de data, parsing de dados)
- [x] Implementar cálculo de fluxo diário puro (com detecção de reset mensal)
- [x] Implementar agregação de cotações diárias WINFUT
- [x] Implementar cálculo de estatísticas avançadas por tipo de investidor
- [x] Implementar detecção de divergências entre fluxo e preço
- [ ] Implementar rota para listar análises salvas

## Frontend - Upload e Validação
- [x] Criar página de upload de arquivos CSV
- [x] Implementar componente de drag-and-drop para upload
- [x] Adicionar validação de formato de arquivo (apenas CSV)
- [x] Mostrar preview dos arquivos selecionados
- [x] Implementar feedback visual durante upload e processamento
- [x] Adicionar tratamento de erros de upload

## Frontend - Visualizações Interativas
- [x] Integrar biblioteca Plotly.js para gráficos interativos
- [x] Criar gráfico de fluxo diário por tipo de investidor (barras)
- [ ] Criar gráfico de variação de preço WINFUT (barras)
- [x] Criar gráfico de correlação fluxo vs preço (scatter plot)
- [x] Implementar filtros por tipo de investidor
- [ ] Implementar seletor de período (datas)
- [x] Adicionar controles de zoom e pan nos gráficos
- [x] Implementar tooltip com informações detalhadas ao passar mouse

## Frontend - Dashboard de Correlações
- [x] Criar painel de estatísticas avançadas
- [x] Mostrar correlação fluxo x preço por investidor (gráfico de barras horizontal)
- [x] Mostrar comportamento dos investidores (% dias comprador vs vendedor)
- [x] Mostrar volatilidade do fluxo por tipo de investidor
- [x] Criar resumo executivo com métricas principais
- [x] Implementar cards com KPIs (fluxo total, tendência atual, etc)

## Frontend - Detecção de Divergências
- [x] Criar painel de divergências detectadas
- [x] Mostrar alertas visuais para divergências de alta (sinal de compra)
- [x] Mostrar alertas visuais para divergências de baixa (sinal de venda)
- [x] Implementar tabela de divergências com data, tipo e descrição
- [ ] Adicionar marcadores nos gráficos onde divergências ocorreram
- [ ] Criar notificações para novas divergências detectadas

## UI/UX
- [x] Criar layout responsivo para desktop e mobile
- [x] Implementar tema dark/light apropriado para análise financeira
- [x] Adicionar navegação entre diferentes seções do dashboard
- [x] Implementar loading states para todas operações assíncronas
- [x] Adicionar empty states quando não há dados
- [ ] Criar página de histórico de análises anteriores
- [ ] Implementar exportação de dados (CSV/JSON)
- [ ] Adicionar tutorial/onboarding para novos usuários


## Correções Solicitadas
- [x] Corrigir componente FileUpload para permitir seleção de múltiplos arquivos B3 simultaneamente
- [x] Exportar pasta completa do projeto organizada


## Bugs Reportados
- [x] Erro ao processar CSV WINFUT - falha no parsing de dados e inserção no banco
- [x] Erro de renderização React (insertBefore) - Resolvido substituindo Plotly.js por Chart.js
- [x] Processamento WINFUT não está funcionando
- [x] Datas duplicadas nos gráficos (15/10 aparece 3x, 16/10 aparece 3x, etc)
- [x] Data deve ser extraída do NOME DO ARQUIVO, não do conteúdo (delay D+2/D+3)
- [x] Fluxo diário deve ser calculado como DIFERENÇA entre dias consecutivos (dados são acumulados mensais)
- [x] Detectar reset mensal (quando novo mês começa, valores resetam)
- [x] Data REAL deve ser extraída do CONTEÚDO do CSV ("até o dia XX/XX/XXXX"), não do nome do arquivo
- [x] Nome do arquivo = data de publicação (D+2/D+3), conteúdo = data real dos dados
- [x] Erro ao inserir dados WINFUT no banco - query SQL falhando - Resolvido alterando schema para varchar
