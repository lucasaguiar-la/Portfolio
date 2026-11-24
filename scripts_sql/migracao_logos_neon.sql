-- MIGRAÇÃO: logo dos projetos principais (exibido ao centro da imagem do card)
-- Idempotente: pode ser executada mais de uma vez. NÃO apaga dados.
--
-- projects.logo_url  caminho do logo (mesmo formato de technologies.iconsrc)

BEGIN;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url text;

UPDATE projects SET logo_url = './assets/images/icones/logos/moodboard-symbol-white.png?v=2' WHERE title = 'Moodboard';
UPDATE projects SET logo_url = './assets/images/icones/logos/meridian-symbol-white-256px.png' WHERE title = 'Meridian';
UPDATE projects SET logo_url = './assets/images/icones/logos/weatherops-symbol-white.png'   WHERE title = 'WeatherOps';

COMMIT;

-- Conferência
SELECT title, tier, logo_url FROM projects ORDER BY tier, sort_order;
