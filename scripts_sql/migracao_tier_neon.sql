-- MIGRAÇÃO: tiers de projetos (destaque / principais / outros) + métricas
-- Idempotente: pode ser executada mais de uma vez. NÃO apaga dados.
--
-- projects.tier        'spotlight' (case em destaque), 'featured' (cards principais), 'other' (lista simples)
-- projects.sort_order  ordem dentro do tier (menor primeiro)
-- projects.metrics     jsonb opcional (usado pelo DocsPro: resultados reais e base do contador)

BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS tier       text    NOT NULL DEFAULT 'other';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metrics    jsonb;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_tier_check') THEN
        ALTER TABLE projects
            ADD CONSTRAINT projects_tier_check CHECK (tier IN ('spotlight', 'featured', 'other'));
    END IF;
END $$;

-- DocsPro: case em destaque, com os resultados informados
--   custo/hora do analista = 3000 / 220 = R$ 13,64; equipe de 3 = R$ 40,91/h
--   execução de 2h45 = R$ 112,50; 22 execuções/mês = R$ 2.475,00 e 60h30
UPDATE projects SET
    tier = 'spotlight',
    sort_order = 0,
    description = 'Automação que trata e carrega arquivos em lote, com Python, interface e base de dados. Eliminou um serviço manual de 2h30 a 3h por execução.',
    metrics = '{
        "started_at": "2024-08-01",
        "analysts": 3,
        "analyst_monthly_salary_brl": 3000,
        "monthly_hours_per_analyst": 220,
        "hourly_cost_team_brl": 40.91,
        "hours_saved_per_run_min": 2.5,
        "hours_saved_per_run_max": 3,
        "hours_saved_per_run_avg": 2.75,
        "cost_per_run_brl": 112.5,
        "runs_per_month": 22,
        "monthly_hours_returned": 60.5,
        "monthly_savings_brl": 2475
    }'::jsonb
WHERE title = 'DocsPro';

-- Cards principais
UPDATE projects SET tier = 'featured', sort_order = 1 WHERE title = 'MeuDiario';
UPDATE projects SET tier = 'featured', sort_order = 2 WHERE title = 'WeatherOps';
UPDATE projects SET tier = 'featured', sort_order = 3 WHERE title = 'Portfolio';

-- Outros projetos (lista simples)
UPDATE projects SET tier = 'other', sort_order = 1 WHERE title = 'LinuxAndroid';

COMMIT;

-- Conferência
SELECT title, tier, sort_order, metrics IS NOT NULL AS tem_metricas
FROM projects
ORDER BY CASE tier WHEN 'spotlight' THEN 0 WHEN 'featured' THEN 1 ELSE 2 END, sort_order;

-- Modelo para adicionar um projeto menor em "Outros projetos":
-- INSERT INTO projects (title, description, image_url, github_url, live_url, tier, sort_order)
-- VALUES ('NomeDoRepo', '-', './assets/images/geral/neutro_projetos.png',
--         'https://github.com/lucasaguiar-la/NomeDoRepo', 'https://github.com/lucasaguiar-la/NomeDoRepo', 'other', 2);
