import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela para armazenar dados de fluxo de investidores da B3
 */
export const b3FluxoData = mysqlTable("b3_fluxo_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  data: timestamp("data").notNull(),
  tipoInvestidor: varchar("tipoInvestidor", { length: 100 }).notNull(),
  comprasAcumuladoMil: int("comprasAcumuladoMil").notNull(), // em milhares de reais
  vendasAcumuladoMil: int("vendasAcumuladoMil").notNull(), // em milhares de reais
  fluxoAcumuladoMil: int("fluxoAcumuladoMil").notNull(), // em milhares de reais
  comprasDiarioMil: int("comprasDiarioMil"), // calculado
  vendasDiarioMil: int("vendasDiarioMil"), // calculado
  fluxoDiarioMil: int("fluxoDiarioMil"), // calculado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type B3FluxoData = typeof b3FluxoData.$inferSelect;
export type InsertB3FluxoData = typeof b3FluxoData.$inferInsert;

/**
 * Tabela para armazenar cotações WINFUT
 */
export const winfutCotacoes = mysqlTable("winfut_cotacoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  data: timestamp("data").notNull(),
  abertura: int("abertura").notNull(), // pontos do índice
  maxima: int("maxima").notNull(),
  minima: int("minima").notNull(),
  fechamento: int("fechamento").notNull(),
  volumeTotal: varchar("volumeTotal", { length: 50 }).notNull(), // armazenar como string para valores grandes
  quantidadeTotal: int("quantidadeTotal").notNull(),
  variacaoPontos: int("variacaoPontos"), // calculado
  variacaoPct: varchar("variacaoPct", { length: 20 }), // armazenar como string para precisão
  amplitude: int("amplitude"), // calculado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WinfutCotacoes = typeof winfutCotacoes.$inferSelect;
export type InsertWinfutCotacoes = typeof winfutCotacoes.$inferInsert;

/**
 * Tabela para armazenar análises salvas (histórico)
 */
export const analises = mysqlTable("analises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataInicio: timestamp("dataInicio").notNull(),
  dataFim: timestamp("dataFim").notNull(),
  totalDias: int("totalDias").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Analise = typeof analises.$inferSelect;
export type InsertAnalise = typeof analises.$inferInsert;