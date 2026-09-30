-- ============================================================================
-- Rede Nacional de Especialistas — Migration 0007
-- Limpeza apontada pelo Security Advisor do Supabase depois da 0006.
--
-- Funções de gatilho não são RPC: ninguém precisa chamá-las pela API. O
-- Postgres já recusa chamá-las fora de um gatilho, mas o default privileges da
-- 0001 as deixou com EXECUTE para anon/authenticated e o advisor acusa. O
-- gatilho continua disparando: EXECUTE só é checado ao criar o gatilho.
-- ============================================================================

revoke all on function rede.guard_post_update()    from public, anon, authenticated;
revoke all on function rede.moderar_post()         from public, anon, authenticated;
revoke all on function rede.log_posts()            from public, anon, authenticated;
revoke all on function rede.checar_comentario()    from public, anon, authenticated;
revoke all on function rede.subir_atividade_post() from public, anon, authenticated;
revoke all on function rede.log_comentarios()      from public, anon, authenticated;
revoke all on function rede.log_perfis()           from public, anon, authenticated;
revoke all on function rede.log_artigos()          from public, anon, authenticated;
revoke all on function rede.log_arquivos()         from public, anon, authenticated;
revoke all on function rede.log_config()           from public, anon, authenticated;
revoke all on function rede.log_palavras()         from public, anon, authenticated;

-- search_path fixo (advisor: function_search_path_mutable). Só usa funções do
-- pg_catalog.
alter function rede.fone_canonico(text) set search_path = pg_catalog, public;
