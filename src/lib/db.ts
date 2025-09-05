import postgres from "postgres";

const url = process.env.DATABASE_URL!;
if (!url) throw new Error("Missing DATABASE_URL");

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

// Connessione singleton (riutilizzata tra invocazioni in dev/prod)
export const sql =
  global.__sql ??
  postgres(url, {
    ssl: "require",
    prepare: false, // compat con serverless
    max: 1,         // connessione singola per funzione
  });

if (process.env.NODE_ENV !== "production") global.__sql = sql;
