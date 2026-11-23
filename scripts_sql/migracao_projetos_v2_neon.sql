-- MIGRAÇÃO v2: projetos principais (Moodboard, Meridian, WeatherOps), outros (LinuxAndroid,
-- SunshineMoonlight), tecnologias com "kind" (linguagens primeiro) e nova data de início do DocsPro.
-- Idempotente: pode ser executada mais de uma vez. Rode DEPOIS de migracao_tier_neon.sql.
--
-- ATENÇÃO: remove o projeto "Portfolio" (e seus vínculos de tecnologia, por ON DELETE CASCADE).

BEGIN;

-- 1) technologies.kind: language | framework | database | tool
ALTER TABLE technologies ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'tool';

-- 2) tecnologias novas (sem UNIQUE em name, então WHERE NOT EXISTS)
INSERT INTO technologies (name, iconsrc, kind)
SELECT v.name, v.iconsrc, 'tool'
FROM (VALUES
    ('TypeScript',   './assets/images/icones/projetos/typescript-icon.svg'),
    ('React',        './assets/images/icones/projetos/react.png'),
    ('Tailwind CSS', './assets/images/icones/projetos/tailwind.png')
) AS v(name, iconsrc)
WHERE NOT EXISTS (SELECT 1 FROM technologies t WHERE t.name = v.name);

UPDATE technologies SET kind = 'language'
WHERE name IN ('Java', 'JavaScript', 'TypeScript', 'Python', 'Shell Script', 'HTML5', 'CSS3');
UPDATE technologies SET kind = 'framework'
WHERE name IN ('SpringBoot', 'Vue.js', 'React', 'Tailwind CSS', 'NodeJS');
UPDATE technologies SET kind = 'database' WHERE name IN ('PostgreSQL', 'MongoDB');

-- 3) Portfolio sai (vínculos caem em cascata)
DELETE FROM projects WHERE title = 'Portfolio';

-- 4) MeuDiario -> Moodboard
UPDATE projects SET
    title = 'Moodboard',
    description = 'Diário de emoções para registrar o humor do dia, acompanhar hábitos e compartilhar listas em grupos.',
    github_url = 'https://github.com/lucasaguiar-la/Moodboard',
    live_url   = 'https://github.com/lucasaguiar-la/Moodboard'
WHERE title IN ('MeuDiario', 'Moodboard');

-- 5) Meridian (novo)
INSERT INTO projects (title, description, image_url, github_url, live_url)
SELECT 'Meridian',
       'Plataforma que monitora repositórios do GitHub, com rankings, tendências e métricas por linguagem.',
       './assets/images/geral/neutro_projetos.png',
       'https://github.com/lucasaguiar-la/Meridian',
       'https://github.com/lucasaguiar-la/Meridian'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Meridian');

-- 6) WeatherOps
UPDATE projects SET
    description = 'Clima em tempo real com métricas, histórico persistente e monitoramento de disponibilidade da API.',
    github_url = 'https://github.com/lucasaguiar-la/WeatherOps',
    live_url   = 'https://github.com/lucasaguiar-la/WeatherOps'
WHERE title = 'WeatherOps';

-- 7) Outros projetos: LinuxAndroid (existente) e SunshineMoonlight (novo), descrições curtas
UPDATE projects SET
    description = 'Script que instala um desktop Linux completo no Android via Termux.',
    github_url = 'https://github.com/lucasaguiar-la/LinuxAndroid',
    live_url   = 'https://github.com/lucasaguiar-la/LinuxAndroid'
WHERE title = 'LinuxAndroid';

INSERT INTO projects (title, description, image_url, github_url, live_url)
SELECT 'SunshineMoonlight',
       'Guia para transmitir jogos do PC para outros dispositivos com Sunshine + Moonlight.',
       './assets/images/geral/neutro_projetos.png',
       'https://github.com/lucasaguiar-la/SunshineMoonlight',
       'https://github.com/lucasaguiar-la/SunshineMoonlight'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'SunshineMoonlight');

-- 8) Tiers e ordem
UPDATE projects SET tier = 'spotlight', sort_order = 0 WHERE title = 'DocsPro';
UPDATE projects SET tier = 'featured',  sort_order = 1 WHERE title = 'Moodboard';
UPDATE projects SET tier = 'featured',  sort_order = 2 WHERE title = 'Meridian';
UPDATE projects SET tier = 'featured',  sort_order = 3 WHERE title = 'WeatherOps';
UPDATE projects SET tier = 'other',     sort_order = 1 WHERE title = 'LinuxAndroid';
UPDATE projects SET tier = 'other',     sort_order = 2 WHERE title = 'SunshineMoonlight';

-- 9) DocsPro: início do uso em 01/11/2024 00:00 (horário de Brasília)
UPDATE projects
SET metrics = jsonb_set(metrics, '{started_at}', '"2024-11-01T00:00:00-03:00"')
WHERE title = 'DocsPro' AND metrics IS NOT NULL;

-- 10) Vínculos projeto <-> tecnologia (idempotentes)
INSERT INTO projects_technologies (project_id, technology_id)
SELECT p.id, t.id
FROM (VALUES
    ('DocsPro',           'Python'),
    ('DocsPro',           'GhostScript'),
    ('DocsPro',           'MongoDB'),
    ('Moodboard',         'Java'),
    ('Moodboard',         'JavaScript'),
    ('Moodboard',         'SpringBoot'),
    ('Moodboard',         'Vue.js'),
    ('Moodboard',         'PostgreSQL'),
    ('Moodboard',         'Docker'),
    ('Meridian',          'Python'),
    ('Meridian',          'JavaScript'),
    ('Meridian',          'React'),
    ('Meridian',          'Tailwind CSS'),
    ('Meridian',          'PostgreSQL'),
    ('Meridian',          'Docker'),
    ('WeatherOps',        'TypeScript'),
    ('WeatherOps',        'Python'),
    ('WeatherOps',        'React'),
    ('WeatherOps',        'PostgreSQL'),
    ('WeatherOps',        'Docker'),
    ('LinuxAndroid',      'Shell Script')
) AS m(project, technology)
JOIN projects p ON p.title = m.project
JOIN technologies t ON t.name = m.technology
ON CONFLICT (project_id, technology_id) DO NOTHING;

COMMIT;

-- Conferência
SELECT p.title, p.tier, p.sort_order,
       string_agg(t.name, ', ' ORDER BY (t.kind = 'language') DESC, t.name) AS tecnologias
FROM projects p
LEFT JOIN projects_technologies pt ON pt.project_id = p.id
LEFT JOIN technologies t ON t.id = pt.technology_id
GROUP BY p.id, p.title, p.tier, p.sort_order
ORDER BY CASE p.tier WHEN 'spotlight' THEN 0 WHEN 'featured' THEN 1 ELSE 2 END, p.sort_order;
