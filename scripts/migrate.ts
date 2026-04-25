import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", override: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  await sql`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;

  const dir = join(process.cwd(), "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    (await sql<{ name: string }[]>`select name from _migrations`).map((r) => r.name),
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    const contents = readFileSync(join(dir, file), "utf8");
    console.log(`apply ${file}`);
    await sql.unsafe(contents);
    await sql`insert into _migrations (name) values (${file})`;
  }
  console.log("done");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sql.end());
