import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { b3FluxoData, winfutCotacoes, analises, InsertB3FluxoData, InsertWinfutCotacoes, InsertAnalise } from "../drizzle/schema";

/**
 * Insere dados de fluxo B3 no banco
 */
export async function insertB3FluxoData(data: InsertB3FluxoData[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(b3FluxoData).values(data);
}

/**
 * Busca dados de fluxo B3 por usuário e período
 */
export async function getB3FluxoDataByUser(userId: number, dataInicio?: Date, dataFim?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(b3FluxoData).where(eq(b3FluxoData.userId, userId));
  
  // TODO: Adicionar filtros de data quando necessário
  
  return await query.orderBy(b3FluxoData.data);
}

/**
 * Insere cotações WINFUT no banco
 */
export async function insertWinfutCotacoes(data: InsertWinfutCotacoes[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(winfutCotacoes).values(data);
}

/**
 * Busca cotações WINFUT por usuário e período
 */
export async function getWinfutCotacoesByUser(userId: number, dataInicio?: Date, dataFim?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(winfutCotacoes).where(eq(winfutCotacoes.userId, userId));
  
  // TODO: Adicionar filtros de data quando necessário
  
  return await query.orderBy(winfutCotacoes.data);
}

/**
 * Cria uma nova análise
 */
export async function createAnalise(data: InsertAnalise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(analises).values(data);
  return result;
}

/**
 * Lista análises de um usuário
 */
export async function getAnalisesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(analises)
    .where(eq(analises.userId, userId))
    .orderBy(desc(analises.createdAt));
}

/**
 * Deleta dados de fluxo B3 de um usuário
 */
export async function deleteB3FluxoDataByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(b3FluxoData).where(eq(b3FluxoData.userId, userId));
}

/**
 * Deleta cotações WINFUT de um usuário
 */
export async function deleteWinfutCotacoesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(winfutCotacoes).where(eq(winfutCotacoes.userId, userId));
}
