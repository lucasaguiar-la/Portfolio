import { criarOdometroEconomia, criarRelogioProducao, rolarEstatico } from './odometro.js?v=20261123-14';
import { FadeInManager } from './fadeIn.js?v=20261123-14';

const API_URL = '/api/projetos';
const IMAGEM_PADRAO = './assets/images/geral/neutro_projetos.png';
const ATRASO_CARD_MS = 120;

// Linguagens primeiro, depois frameworks, bancos e ferramentas (ordem estável dentro de cada grupo)
const ORDEM_KIND = { language: 0, framework: 1, database: 2 };
const posicaoKind = (tech) => ORDEM_KIND[tech.kind] ?? 3;

// Aceita só links http(s) ou relativos (evita javascript: vindo de dados)
function urlSegura(url, padrao = '#') {
    if (typeof url !== 'string' || !url) return padrao;
    if (url.startsWith('./') || url.startsWith('/') || url.startsWith('#')) return url;
    try {
        const { protocol } = new URL(url);
        return protocol === 'https:' || protocol === 'http:' ? url : padrao;
    } catch {
        return padrao;
    }
}

function criar(tag, { classe, texto, atributos } = {}, filhos = []) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    Object.entries(atributos || {}).forEach(([k, v]) => el.setAttribute(k, v));
    filhos.forEach((f) => el.appendChild(f));
    return el;
}

function formatarHoras(horas) {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

const moeda0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const moeda2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export class ProjectsManager {
    constructor() {
        this.secaoDestaque = document.getElementById('destaque');
        this.cardsContainer = document.getElementById('cards-principais');
        this.secaoOutros = document.getElementById('outros');
        this.listaOutros = document.getElementById('lista-outros');
        this.skeletons = [];
    }

    // Fade por scroll (observador compartilhado criado pelo FadeInManager)
    revelarNoScroll(elemento, indice = 0) {
        elemento.style.setProperty('--atraso', `${indice * ATRASO_CARD_MS}ms`);
        if (FadeInManager.instancia) FadeInManager.instancia.observar(elemento);
        else elemento.classList.add('start');
    }

    // ---------- skeleton ----------
    renderSkeletons(qtd = 3) {
        if (!this.cardsContainer) return;
        for (let i = 0; i < qtd; i += 1) {
            const card = criar('article', { classe: 'card card--skeleton', atributos: { 'aria-hidden': 'true' } }, [
                criar('div', { classe: 'skeleton skeleton--imagem skeleton--shimmer' }),
                criar('div', { classe: 'card__corpo' }, [
                    criar('div', { classe: 'skeleton skeleton--titulo skeleton--shimmer' }),
                    criar('div', { classe: 'skeleton skeleton--texto skeleton--shimmer' }),
                    criar('div', { classe: 'skeleton skeleton--botao skeleton--shimmer' })
                ])
            ]);
            this.skeletons.push(card);
            this.cardsContainer.appendChild(card);
        }
    }

    removeSkeletons() {
        this.skeletons.forEach((s) => s.remove());
        this.skeletons = [];
    }

    // ---------- dados ----------
    async buscarProjetos() {
        try {
            const resposta = await fetch(API_URL);
            if (!resposta.ok) throw new Error(`Falha na requisição (${resposta.status})`);
            const dados = await resposta.json();
            return Array.isArray(dados) ? dados : [];
        } catch (erro) {
            console.error('Erro ao buscar projetos:', erro);
            return [];
        }
    }

    agrupar(projetos) {
        // API ainda sem os campos de tier (migração não aplicada): mostra tudo como cards principais
        if (projetos.length && projetos.every((p) => p.tier === undefined)) {
            return { destaque: null, principais: projetos, outros: [] };
        }

        const porOrdem = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        return {
            destaque: projetos.find((p) => p.tier === 'spotlight') || null,
            principais: projetos.filter((p) => p.tier === 'featured').sort(porOrdem),
            outros: projetos.filter((p) => p.tier === 'other').sort(porOrdem)
        };
    }

    // ---------- tecnologias ----------
    criarTecnologias(tecnologias = []) {
        const ordenadas = [...tecnologias].sort((a, b) => posicaoKind(a) - posicaoKind(b)); // sort é estável
        const lista = criar('ul', { classe: 'tech', atributos: { 'aria-label': 'Tecnologias usadas' } });
        ordenadas.forEach(({ name, iconUrl }) => {
            const item = criar('li');
            item.appendChild(criar('img', {
                classe: 'tech__icone',
                atributos: { src: urlSegura(iconUrl, ''), alt: name, title: name, width: '30', height: '30', loading: 'lazy' }
            }));
            lista.appendChild(item);
        });
        return lista;
    }

    // ---------- destaque (DocsPro) ----------
    renderDestaque(projeto) {
        const m = projeto?.metrics;
        if (!this.secaoDestaque || !projeto || !m) return;

        const porId = (id) => document.getElementById(id);
        porId('case-titulo').textContent = projeto.title;
        porId('case-descricao').textContent = projeto.description;

        const tech = porId('case-tech');
        tech.replaceWith(Object.assign(this.criarTecnologias(projeto.technologies), { id: 'case-tech' }));

        const link = porId('case-link');
        link.href = urlSegura(projeto.githubUrl || projeto.liveUrl);

        // KPIs: o valor entra como odômetro (dígitos rolam da primeira casa para a última)
        const kpis = [
            [`${formatarHoras(m.hours_saved_per_run_min)}–${formatarHoras(m.hours_saved_per_run_max)}`, 'de trabalho manual eliminado por execução'],
            [moeda0.format(m.monthly_savings_brl), 'economizados por mês (estimativa)'],
            [formatarHoras(m.monthly_hours_returned), 'devolvidas à equipe por mês']
        ];
        const listaKpis = porId('case-kpis');
        listaKpis.textContent = '';
        kpis.forEach(([valor, rotulo]) => {
            const numero = criar('span', { classe: 'odometro odometro--kpi' });
            listaKpis.appendChild(criar('li', { classe: 'kpi' }, [
                criar('strong', { classe: 'kpi__valor' }, [numero]),
                criar('span', { classe: 'kpi__rotulo', texto: rotulo })
            ]));
            rolarEstatico(numero, valor.replace(/ /g, ' '));
        });

        const inicio = new Date(m.started_at);
        const desdeCurto = inicio.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        porId('case-nota').textContent =
            `Base: ${m.analysts} analistas × ${moeda0.format(m.analyst_monthly_salary_brl)}/mês ` +
            `(${m.monthly_hours_per_analyst} h) = ${moeda2.format(m.hourly_cost_team_brl)}/h; ` +
            `${m.runs_per_month} execuções por mês de ${formatarHoras(m.hours_saved_per_run_avg)} → ` +
            `${moeda2.format(m.cost_per_run_brl)} por execução. Em produção desde ${desdeCurto}.`;

        const mesAno = inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        porId('case-desde').textContent = `Economia acumulada desde ${mesAno}`;

        this.secaoDestaque.hidden = false;

        criarRelogioProducao(porId('case-relogio'), { inicio: m.started_at });
        criarOdometroEconomia(porId('case-odometro'), {
            inicio: m.started_at,
            economiaMensal: m.monthly_savings_brl
        });
    }

    // ---------- cards principais ----------
    criarCard(projeto) {
        const imagem = criar('img', {
            classe: 'card__imagem',
            atributos: {
                src: urlSegura(projeto.imageUrl, IMAGEM_PADRAO),
                alt: `Imagem do projeto ${projeto.title}`,
                width: '250', height: '150', loading: 'lazy', decoding: 'async'
            }
        });

        const acoes = criar('div', { classe: 'card__acoes' }, [
            criar('a', {
                classe: 'botao',
                texto: 'Ver repositório',
                atributos: {
                    href: urlSegura(projeto.githubUrl || projeto.liveUrl),
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    'aria-label': `Ver repositório de ${projeto.title}`
                }
            })
        ]);

        return criar('article', { classe: 'card fade-in' }, [
            imagem,
            criar('div', { classe: 'card__corpo' }, [
                criar('h3', { classe: 'card__titulo', texto: projeto.title }),
                this.criarTecnologias(projeto.technologies),
                criar('p', { classe: 'card__descricao', texto: projeto.description }),
                acoes
            ])
        ]);
    }

    renderPrincipais(projetos) {
        if (!this.cardsContainer) return;
        const fragmento = document.createDocumentFragment();
        const criados = projetos.map((projeto) => {
            const card = this.criarCard(projeto);
            fragmento.appendChild(card);
            return card;
        });
        this.cardsContainer.appendChild(fragmento);
        criados.forEach((card, i) => this.revelarNoScroll(card, i));
    }

    // ---------- outros ----------
    renderOutros(projetos) {
        if (!this.secaoOutros || !this.listaOutros || projetos.length === 0) return;
        const itens = projetos.map((projeto) => criar('li', { classe: 'outro fade-in' }, [
            criar('h3', { classe: 'outro__titulo', texto: projeto.title }),
            criar('p', { classe: 'outro__descricao', texto: projeto.description }),
            criar('a', {
                classe: 'botao botao--sm',
                texto: 'Ver repositório',
                atributos: {
                    href: urlSegura(projeto.githubUrl || projeto.liveUrl),
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    'aria-label': `Ver repositório de ${projeto.title}`
                }
            })
        ]));
        itens.forEach((item) => this.listaOutros.appendChild(item));
        this.secaoOutros.hidden = false;
        itens.forEach((item, i) => this.revelarNoScroll(item, i));
    }

    async init() {
        this.renderSkeletons();
        try {
            const { destaque, principais, outros } = this.agrupar(await this.buscarProjetos());
            this.renderDestaque(destaque);
            this.renderPrincipais(principais);
            this.renderOutros(outros);
        } finally {
            this.removeSkeletons();
        }
    }
}
