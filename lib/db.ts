import postgres from "postgres";

const globalForSql = globalThis as unknown as {
  __lichenSql: ReturnType<typeof postgres> | undefined;
};

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export const sql =
  globalForSql.__lichenSql ??
  postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForSql.__lichenSql = sql;
}
