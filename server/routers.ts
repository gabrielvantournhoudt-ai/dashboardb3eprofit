import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  b3: router({
    uploadB3CSV: protectedProcedure
      .input(z.object({
        arquivos: z.array(z.object({
          conteudo: z.string(),
          nomeArquivo: z.string()
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        const { processarMultiplosCSVsB3 } = await import('./csv-processor');
        const { insertB3FluxoData, deleteB3FluxoDataByUser } = await import('./b3-helpers');
        
        try {
          // Processa múltiplos CSVs e calcula fluxo diário
          const arquivos = input.arquivos.map(arq => ({
            nome: arq.nomeArquivo,
            conteudo: arq.conteudo
          }));
          
          const dadosDiarios = processarMultiplosCSVsB3(arquivos);
          
          // Prepara dados para inserção
          const dadosParaInserir = dadosDiarios.map((d: any) => ({
            userId: ctx.user.id,
            data: d.data,
            tipoInvestidor: d.tipoInvestidor,
            comprasAcumuladoMil: d.comprasAcumuladoMil,
            vendasAcumuladoMil: d.vendasAcumuladoMil,
            fluxoAcumuladoMil: d.fluxoAcumuladoMil,
            comprasDiarioMil: d.comprasDiarioMil || 0,
            vendasDiarioMil: d.vendasDiarioMil || 0,
            fluxoDiarioMil: d.fluxoDiarioMil || 0
          }));
          
          // Insere no banco
          await insertB3FluxoData(dadosParaInserir);
          
          return {
            success: true,
            totalRegistros: dadosParaInserir.length,
            dataInicio: dadosDiarios[0]?.data,
            dataFim: dadosDiarios[dadosDiarios.length - 1]?.data
          };
        } catch (error) {
          throw new Error(`Erro ao processar CSV B3: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }),
    
    uploadWINFUTCSV: protectedProcedure
      .input(z.object({
        conteudo: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        const { processarCSVWINFUT, calcularVariacoesWINFUT } = await import('./csv-processor');
        const { insertWinfutCotacoes } = await import('./b3-helpers');
        
        try {
          // Processa CSV
          const cotacoes = processarCSVWINFUT(input.conteudo);
          
          if (cotacoes.length === 0) {
            throw new Error('Nenhum dado válido encontrado no arquivo CSV. Verifique o formato do arquivo.');
          }
          
          // Calcula variações
          const cotacoesComVariacoes = calcularVariacoesWINFUT(cotacoes);
          
          // Prepara dados para inserção
          const dadosParaInserir = cotacoesComVariacoes.map(c => ({
            userId: ctx.user.id,
            data: c.data,
            abertura: c.abertura,
            maxima: c.maxima,
            minima: c.minima,
            fechamento: c.fechamento,
            volumeTotal: c.volumeTotal.toString(),
            quantidadeTotal: c.quantidadeTotal,
            variacaoPontos: c.variacaoPontos,
            variacaoPct: c.variacaoPct.toString(),
            amplitude: c.amplitude
          }));
          
          // Insere no banco
          await insertWinfutCotacoes(dadosParaInserir);
          
          return {
            success: true,
            totalRegistros: dadosParaInserir.length,
            dataInicio: cotacoesComVariacoes[0]?.data,
            dataFim: cotacoesComVariacoes[cotacoesComVariacoes.length - 1]?.data
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error('[uploadWINFUTCSV] Erro:', errorMessage);
          throw new Error(`Erro ao processar CSV WINFUT: ${errorMessage}`);
        }
      }),
    
    getFluxoData: protectedProcedure.query(async ({ ctx }) => {
      const { getB3FluxoDataByUser } = await import('./b3-helpers');
      return await getB3FluxoDataByUser(ctx.user.id);
    }),
    
    getWinfutData: protectedProcedure.query(async ({ ctx }) => {
      const { getWinfutCotacoesByUser } = await import('./b3-helpers');
      return await getWinfutCotacoesByUser(ctx.user.id);
    }),
    
    clearData: protectedProcedure.mutation(async ({ ctx }) => {
      const { deleteB3FluxoDataByUser, deleteWinfutCotacoesByUser } = await import('./b3-helpers');
      await deleteB3FluxoDataByUser(ctx.user.id);
      await deleteWinfutCotacoesByUser(ctx.user.id);
      return { success: true };
    }),
    
    getEstatisticas: protectedProcedure.query(async ({ ctx }) => {
      const { getB3FluxoDataByUser, getWinfutCotacoesByUser } = await import('./b3-helpers');
      const { calcularEstatisticas } = await import('./analytics');
      
      const fluxoData = await getB3FluxoDataByUser(ctx.user.id);
      const winfutData = await getWinfutCotacoesByUser(ctx.user.id);
      
      return calcularEstatisticas(fluxoData, winfutData);
    }),
    
    getDivergencias: protectedProcedure
      .input(z.object({
        tipoInvestidor: z.string(),
        janela: z.number().optional().default(5)
      }))
      .query(async ({ ctx, input }) => {
        const { getB3FluxoDataByUser, getWinfutCotacoesByUser } = await import('./b3-helpers');
        const { detectarDivergencias } = await import('./analytics');
        
        const fluxoData = await getB3FluxoDataByUser(ctx.user.id);
        const winfutData = await getWinfutCotacoesByUser(ctx.user.id);
        
        // Filtra por tipo de investidor
        const fluxoFiltrado = fluxoData.filter(d => d.tipoInvestidor === input.tipoInvestidor);
        
        return detectarDivergencias(fluxoFiltrado, winfutData, input.janela);
      }),
    
    // NOVAS ROTAS - ANÁLISES MELHORADAS
    getEstatisticasEnhanced: protectedProcedure.query(async ({ ctx }) => {
      const { getB3FluxoDataByUser, getWinfutCotacoesByUser } = await import('./b3-helpers');
      const { calcularEstatisticasEnhanced } = await import('./analytics-enhanced');
      
      const fluxoData = await getB3FluxoDataByUser(ctx.user.id);
      const winfutData = await getWinfutCotacoesByUser(ctx.user.id);
      
      return calcularEstatisticasEnhanced(fluxoData, winfutData);
    }),
    
    getTendenciasPeriodo: protectedProcedure.query(async ({ ctx }) => {
      const { getB3FluxoDataByUser } = await import('./b3-helpers');
      const { analisarTendenciasPeriodo } = await import('./analytics-enhanced');
      
      const fluxoData = await getB3FluxoDataByUser(ctx.user.id);
      const tendencias = analisarTendenciasPeriodo(fluxoData);
      
      // Converte Map para objeto para serialização
      return Object.fromEntries(tendencias);
    }),
    
    getPadroes: protectedProcedure.query(async ({ ctx }) => {
      const { getB3FluxoDataByUser } = await import('./b3-helpers');
      const { identificarPadroes } = await import('./analytics-enhanced');
      
      const fluxoData = await getB3FluxoDataByUser(ctx.user.id);
      return identificarPadroes(fluxoData);
    }),
    
    getAlertasMovimento: protectedProcedure.query(async ({ ctx }) => {
      const { getB3FluxoDataByUser, getWinfutCotacoesByUser } = await import('./b3-helpers');
      const { detectarAlertasMovimento } = await import('./analytics-enhanced');
      
      const fluxoData = await getB3FluxoDataByUser(ctx.user.id);
      const winfutData = await getWinfutCotacoesByUser(ctx.user.id);
      
      return detectarAlertasMovimento(fluxoData, winfutData);
    })
  }),
});

export type AppRouter = typeof appRouter;
