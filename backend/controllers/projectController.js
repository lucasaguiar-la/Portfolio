const pool = require('../db/db');

const VALID_TIERS = ['spotlight', 'featured', 'other'];

exports.getProjects = async (req, res) => {
    try {
        const projectsResult = await pool.query(
            `
            SELECT
                p.id,
                p.title,
                p.description,
                p.image_url,
                p.logo_url,
                p.github_url,
                p.live_url,
                p.tier,
                p.sort_order,
                p.metrics,
                t.name AS technology_name,
                t.iconsrc AS technology_icon_url,
                t.kind AS technology_kind
            FROM projects p
            LEFT JOIN projects_technologies pt
                ON pt.project_id = p.id
            LEFT JOIN technologies t
                ON t.id = pt.technology_id
            ORDER BY p.sort_order ASC, p.created_at DESC, CASE t.kind WHEN 'language' THEN 0 WHEN 'framework' THEN 1 WHEN 'database' THEN 2 ELSE 3 END, t.name ASC
            `
        );

        const projectsMap = new Map();

        projectsResult.rows.forEach((row) => {
            if (!projectsMap.has(row.id)) {
                projectsMap.set(row.id, {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    imageUrl: row.image_url,
                    logoUrl: row.logo_url,
                    githubUrl: row.github_url,
                    liveUrl: row.live_url,
                    tier: row.tier,
                    sortOrder: row.sort_order,
                    metrics: row.metrics,
                    technologies: []
                });
            }

            if (row.technology_name && row.technology_icon_url) {
                projectsMap.get(row.id).technologies.push({
                    name: row.technology_name,
                    iconUrl: row.technology_icon_url,
                    kind: row.technology_kind
                });
            }
        });

        const projectsWithTechnologies = Array.from(projectsMap.values());

        res.json(projectsWithTechnologies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching projects' });
    }
};

exports.createProject = async (req, res) => {
    try {
        const {
            title,
            description,
            imageUrl,
            logoUrl,
            githubUrl,
            liveUrl,
            technologies,
            tier = 'other',
            sortOrder = 0,
            metrics = null
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'title and description are required' });
        }

        if (!imageUrl) {
            return res.status(400).json({ error: 'imageUrl is required' });
        }

        if (!VALID_TIERS.includes(tier)) {
            return res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(', ')}` });
        }

        if (!Number.isInteger(sortOrder)) {
            return res.status(400).json({ error: 'sortOrder must be an integer' });
        }

        const { rows } = await pool.query(
            `
            INSERT INTO projects
            (title, description, image_url, logo_url, github_url, live_url, tier, sort_order, metrics)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            `,
            [title, description, imageUrl, logoUrl || null, githubUrl || null, liveUrl || null,
             tier, sortOrder, metrics ? JSON.stringify(metrics) : null]
        );

        const projectId = rows[0].id;

        if (technologies) {
            const techIds = Array.isArray(technologies)
                ? technologies
                : JSON.parse(technologies);

            for (const techId of techIds) {
                await pool.query(
                    `
                    INSERT INTO projects_technologies (project_id, technology_id)
                    VALUES ($1, $2)
                    `,
                    [projectId, techId]
                );
            }
        }

        res.status(201).json({
            id: rows[0].id,
            title: rows[0].title,
            description: rows[0].description,
            imageUrl: rows[0].image_url,
            githubUrl: rows[0].github_url,
            liveUrl: rows[0].live_url,
            tier: rows[0].tier,
            sortOrder: rows[0].sort_order,
            metrics: rows[0].metrics,
            technologies: []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating project' });
    }
};
