/* Apenas PostgreSQL temporário local, com stubs de auth.
 * PGPORT=55432 node supabase/tests/diagnostico-paridade.mjs
 * Para repetir no mesmo banco temporário já preparado: acrescente --existente.
 * Não usar no Supabase: este script cria schemas e papéis sintéticos.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const host = process.env.PGHOST || "127.0.0.1";
const port = process.env.PGPORT || "55432";
assert.equal(host, "127.0.0.1", "Teste restrito a loopback IPv4.");
assert.equal(port, "55432", "Use a porta dedicada do banco temporário: 55432.");
const args = ["-X", "-h", host, "-p", port, "-U", process.env.USER || "csmadm", "-d", "postgres", "-w", "-v", "ON_ERROR_STOP=1", "-Atq"];
function sql(text) {
  const run = spawnSync("psql", args, { input: text, encoding: "utf8" });
  if (run.status !== 0) throw new Error(run.stderr || "psql indisponível");
  return run.stdout.trim();
}
function literal(text) { return "'" + text.replaceAll("'", "''") + "'"; }

const fonte = fs.readFileSync(path.join(root, "src/comunidade/lib/diagnostico.ts"), "utf8");
const modulo = { exports: {} };
vm.runInNewContext(ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: modulo.exports });
const { PERGUNTAS, calcular } = modulo.exports;
const migration = fs.readFileSync(path.join(root, "supabase/migrations/0012_diagnostico.sql"), "utf8");
const mapa = JSON.parse(migration.match(/v_mapa constant jsonb := '([\s\S]*?)'::jsonb/)[1]);
assert.equal(Object.keys(mapa).length, PERGUNTAS.length);
for (const p of PERGUNTAS) {
  assert.equal(mapa[p.id].eixo, p.eixo);
  assert.deepEqual(mapa[p.id].opcoes, Object.fromEntries(p.opcoes.map((o) => [o.id, o.pontos])));
}
console.log("Mapa SQL corresponde a todas as perguntas e opções da fonte TypeScript.");

if (!process.argv.includes("--existente")) {
sql(`
begin;
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema rede;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create table rede.perfis (auth_id uuid unique references auth.users(id), nome text, whatsapp text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema rede, auth to anon, authenticated, service_role;
-- Simula os grants amplos da migration 0001, para provar a revogação da 0012.
alter default privileges in schema rede grant all on tables to anon, authenticated, service_role;
alter default privileges in schema rede grant all on functions to anon, authenticated, service_role;
insert into auth.users values
  ('00000000-0000-0000-0000-000000000001', 'fixture@teste.invalid', '{"origem":"diagnostico","nome":"Teste local","whatsapp":"00000000000"}'),
  ('00000000-0000-0000-0000-000000000002', 'fixture2@teste.invalid', '{"origem":"rede","nome":"Metadado sintético"}');
insert into rede.perfis values ('00000000-0000-0000-0000-000000000002', 'Perfil sintético', '00000000001');
commit;
`);
sql(migration);
}

const casos = [
  Object.fromEntries(PERGUNTAS.map((p) => [p.id, p.opcoes.reduce((a, b) => a.pontos >= b.pontos ? a : b).id])),
  Object.fromEntries(PERGUNTAS.map((p) => [p.id, p.opcoes.reduce((a, b) => a.pontos <= b.pontos ? a : b).id])),
  Object.fromEntries(PERGUNTAS.map((p, i) => [p.id, p.opcoes[(i + 1) % p.opcoes.length].id])),
];
function chamada(respostas, id = 1) {
  return `begin; set local role authenticated;
    select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000${id}', true);
    select rede.salvar_diagnostico(${literal(JSON.stringify(respostas))}::jsonb); commit;`;
}
for (const [i, respostas] of casos.entries()) {
  const esperado = calcular(respostas);
  const obtido = JSON.parse(sql(chamada(respostas)).split("\n").at(-1));
  assert.deepEqual(obtido, {
    pontos_total: esperado.total, pontos_tecnica: esperado.tecnica, pontos_comercial: esperado.comercial,
    faixa: esperado.faixa.id, mql: esperado.mql, convidado_live: esperado.faixa.convidaLive,
  });
  console.log(`Paridade ${i + 1}/3: total ${esperado.total}, eixos, faixa, MQL e convite corretos.`);
}
assert.equal(sql("select count(*) from rede.diagnosticos where auth_id = '00000000-0000-0000-0000-000000000001';"), "1", "Upsert não duplica o dono.");
sql(chamada(casos[0], 2));
assert.equal(sql("select nome = 'Perfil sintético' and whatsapp = '00000000001' from rede.diagnosticos where auth_id = '00000000-0000-0000-0000-000000000002';"), "t");
assert.equal(sql("select nome = 'Teste local' and whatsapp = '00000000000' from rede.diagnosticos where auth_id = '00000000-0000-0000-0000-000000000001';"), "t");
assert.equal(sql("select has_table_privilege('anon','rede.diagnosticos','select') or has_function_privilege('anon','rede.salvar_diagnostico(jsonb)','execute');"), "f");
assert.equal(sql("select has_table_privilege('authenticated','rede.diagnosticos','insert') or has_table_privilege('authenticated','rede.diagnosticos','update') or has_table_privilege('authenticated','rede.diagnosticos','delete');"), "f");
assert.equal(sql("begin; set local role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true); select count(*) from rede.diagnosticos; rollback;").split("\n").at(-1), "1");
assert.equal(sql("begin; set local role authenticated; select count(*) from rede.diagnosticos; rollback;"), "0");
function rejeitado(statement, mensagem) {
  assert.throws(() => sql(statement), mensagem);
}
rejeitado(chamada({ ...casos[0], idade: "invalid" }), "Opção inválida deve falhar.");
rejeitado(chamada({ ...casos[0], idade: 0 }), "Tipo inválido deve falhar.");
rejeitado(chamada({ ...casos[0], pontos_total: "100" }), "Campo adicional deve falhar.");
const incompleto = { ...casos[0] }; delete incompleto.idade;
rejeitado(chamada(incompleto), "Resposta faltante deve falhar.");
rejeitado("begin; set local role anon; select rede.salvar_diagnostico('{}');", "Anon não executa RPC.");
rejeitado("begin; set local role authenticated; select rede.salvar_diagnostico('{}');", "Sessão sem dono não executa RPC.");
rejeitado("begin; set local role authenticated; update rede.diagnosticos set pontos_total = 100;", "Pontos não podem ser escritos diretamente.");
rejeitado("begin; set local role authenticated; insert into rede.diagnosticos (auth_id) values ('00000000-0000-0000-0000-000000000001');", "Cliente não pode inserir diretamente.");
console.log("SQL aplicado no banco temporário; upsert, contatos, RLS, grants e entradas inválidas verificados.");
