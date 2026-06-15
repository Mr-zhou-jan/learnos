// Supabase 建表迁移脚本
const { Client } = require("pg");
const path = require("path");
const fs = require("fs");

async function main() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const match = fs.readFileSync(envPath, "utf-8").match(/DATABASE_URL=(.+)/);
  if (!match) { console.error("DATABASE_URL not found"); process.exit(1); }

  const client = new Client({ connectionString: match[1].trim(), connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    console.log("connected");

    await client.query("CREATE TABLE IF NOT EXISTS learnos_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())");
    console.log("+ learnos_users");

    await client.query("CREATE TABLE IF NOT EXISTS learnos_passwords (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL)");
    console.log("+ learnos_passwords");

    await client.query("ALTER TABLE learnos_users ENABLE ROW LEVEL SECURITY");
    await client.query("ALTER TABLE learnos_passwords ENABLE ROW LEVEL SECURITY");

    await client.query("DROP POLICY IF EXISTS anon_all ON learnos_users");
    await client.query("CREATE POLICY anon_all ON learnos_users FOR ALL USING (true)");
    await client.query("DROP POLICY IF EXISTS anon_all ON learnos_passwords");
    await client.query("CREATE POLICY anon_all ON learnos_passwords FOR ALL USING (true)");
    console.log("+ RLS policies");

    await client.end();
    console.log("DONE");
    process.exit(0);
  } catch (e) { console.error(e.message); process.exit(1); }
}
main();
