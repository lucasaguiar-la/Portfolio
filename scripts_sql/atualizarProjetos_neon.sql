-- MODELO NOVO (NEON / UUID) - atualização dos cards de projetos
-- projects(id, title, description, image_url, github_url, live_url, created_at)
-- technologies(id, name, iconsrc)
-- projects_technologies(project_id, technology_id)
--
-- Limpa os dados e repopula. As tabelas (estrutura) são mantidas.
-- A API ordena os cards por created_at DESC, então o primeiro da lista recebe
-- o created_at mais recente.

-- ATENÇÃO: este script limpa e repopula os dados. Depois dele, rode migracao_tier_neon.sql
-- (idempotente) para reaplicar tier / sort_order / metrics (DocsPro em destaque, 3 principais, outros).

BEGIN;

-- Limpeza (as três tabelas juntas por causa das chaves estrangeiras)
TRUNCATE projects_technologies, projects, technologies;

-- Populando a tabela projects
INSERT INTO projects (title, description, image_url, github_url, live_url, created_at) VALUES
('MeuDiario', 'Diário de emoções para registrar o humor diário, organizar pensamentos e acompanhar seu bem-estar ao longo do tempo.', './assets/images/geral/neutro_projetos.png', 'https://github.com/lucasaguiar-la/MeuDiario', 'https://github.com/lucasaguiar-la/MeuDiario', now() - interval '1 minute' * 0),
('LinuxAndroid', 'Sistema automatizado para transformar dispositivos Android em um ambiente Linux completo via Termux.', './assets/images/geral/neutro_projetos.png', 'https://github.com/lucasaguiar-la/LinuxAndroid', 'https://github.com/lucasaguiar-la/LinuxAndroid', now() - interval '1 minute' * 1),
('DocsPro', 'Projeto de automação para tratamento e carregamento de arquivos, com python, interface e base de dados.', './assets/images/geral/neutro_projetos.png', 'https://github.com/lucasaguiar-la/app_DocsPro', 'https://github.com/lucasaguiar-la/app_DocsPro', now() - interval '1 minute' * 2),
('WeatherOps', 'API REST em Python para coleta de dados climáticos, com armazenamento em PostgreSQL.', './assets/images/geral/neutro_projetos.png', 'https://github.com/lucasaguiar-la/api_Weather', 'https://github.com/lucasaguiar-la/api_Weather', now() - interval '1 minute' * 3),
('Portfolio', 'Meu portfólio de programação, feito para organizar e demonstrar um pouco sobre meus projetos e exercícios.', './assets/images/geral/neutro_projetos.png', 'https://github.com/lucasaguiar-la/portfolio', 'https://github.com/lucasaguiar-la/portfolio', now() - interval '1 minute' * 4);

-- Populando a tabela technologies
-- Vue.js: o arquivo vue-icon.png ainda não existe em assets/images/icones/projetos/
INSERT INTO technologies (name, iconsrc) VALUES
('Java', './assets/images/icones/colorido/java-icon.png'),
('JavaScript', './assets/images/icones/projetos/javascript-icon.png'),
('SpringBoot', './assets/images/icones/colorido/spring-icon.png'),
('Vue.js', './assets/images/icones/projetos/vue-icon.png'),
('PostgreSQL', './assets/images/icones/projetos/postgresql-icon.png'),
('Docker', './assets/images/icones/projetos/docker-icon.png'),
('Shell Script', './assets/images/icones/colorido/bash-icon.png'),
('Python', './assets/images/icones/projetos/python-icon.png'),
('GhostScript', './assets/images/icones/projetos/ghostscript.png'),
('MongoDB', './assets/images/icones/projetos/mongodb-icon.png'),
('HTML5', './assets/images/icones/projetos/html-icon.png'),
('CSS3', './assets/images/icones/projetos/css-icon.png'),
('NodeJS', './assets/images/icones/projetos/node-icon.png');

-- Populando a tabela projects_technologies (relacionamento por UUID)
INSERT INTO projects_technologies (project_id, technology_id)
SELECT p.id, t.id
FROM (VALUES
    ('MeuDiario',    'Java'),
    ('MeuDiario',    'JavaScript'),
    ('MeuDiario',    'SpringBoot'),
    ('MeuDiario',    'Vue.js'),
    ('MeuDiario',    'PostgreSQL'),
    ('MeuDiario',    'Docker'),
    ('LinuxAndroid', 'Shell Script'),
    ('DocsPro',      'Python'),
    ('DocsPro',      'GhostScript'),
    ('DocsPro',      'MongoDB'),
    ('WeatherOps',   'Python'),
    ('WeatherOps',   'PostgreSQL'),
    ('WeatherOps',   'Docker'),
    ('Portfolio',    'HTML5'),
    ('Portfolio',    'CSS3'),
    ('Portfolio',    'JavaScript'),
    ('Portfolio',    'NodeJS'),
    ('Portfolio',    'PostgreSQL')
) AS m(project, technology)
JOIN projects p ON p.title = m.project
JOIN technologies t ON t.name = m.technology;

COMMIT;

-- Conferência: deve listar 5 projetos, na ordem, com 6 / 1 / 3 / 3 / 5 tecnologias
SELECT p.title, count(pt.technology_id) AS tecnologias
FROM projects p
LEFT JOIN projects_technologies pt ON pt.project_id = p.id
GROUP BY p.id, p.title, p.created_at
ORDER BY p.created_at DESC;
