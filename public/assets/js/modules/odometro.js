// Contadores em formato "odômetro": cada dígito é uma coluna (fita 0-9) que rola de cima para baixo.
//  - Ao entrar na tela, TODOS os dígitos partem do 0 e rolam da primeira casa para a última.
//  - Contadores vivos (R$ e relógio de produção) continuam rodando depois da animação inicial.
//  - Valores vêm de Date.now() (sem drift): recarregar a página sempre mostra o valor correto.
const POSICAO_ZERO_FINAL = 10;   // fita: [0, 9, 8, ..., 1, 0]; o 0 do topo só existe para as viradas 9 -> 0
const DURACAO_INTRO_MS = 1600;
const ATRASO_COLUNA_MS = 90;
const SEGUNDOS_MES_MEDIO = 30.4375 * 86400;

const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const posicaoDoDigito = (d) => (d === 0 ? POSICAO_ZERO_FINAL : 10 - d);
const comMilhar = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dois = (n) => String(n).padStart(2, '0');

export function formatarCentavos(cents) {
    return `R$ ${comMilhar(Math.floor(cents / 100))},${dois(cents % 100)}`;
}

export function formatarRelogio(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const horas = Math.floor(total / 3600);
    return `${comMilhar(horas)}:${dois(Math.floor((total % 3600) / 60))}:${dois(total % 60)}`;
}

export class Rolador {
    // texto: string fixa ou função que devolve o texto atual; intervaloMs: null = valor estático
    constructor(container, { texto, intervaloMs = null, rotulo = (t) => t }) {
        this.container = container;
        this.texto = texto;
        this.intervaloMs = intervaloMs;
        this.rotulo = rotulo;
        this.colunas = [];
        this.ultimoTexto = '';
        this.ultimoAria = 0;
        this.revelado = false;
    }

    textoAtual() {
        return typeof this.texto === 'function' ? this.texto() : this.texto;
    }

    criarColuna() {
        const raiz = document.createElement('span');
        raiz.className = 'odometro__digito';
        raiz.setAttribute('aria-hidden', 'true');
        const fita = document.createElement('span');
        fita.className = 'odometro__fita';
        [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].forEach((n) => {
            const celula = document.createElement('span');
            celula.textContent = String(n);
            fita.appendChild(celula);
        });
        raiz.appendChild(fita);
        return { raiz, fita, valor: null };
    }

    definirPosicao(coluna, posicao, animar = true) {
        if (!animar) {
            coluna.fita.classList.add('odometro__fita--sem-transicao');
            coluna.fita.style.setProperty('--i', posicao);
            void coluna.fita.offsetWidth; // aplica sem animar
            coluna.fita.classList.remove('odometro__fita--sem-transicao');
            return;
        }
        coluna.fita.style.setProperty('--i', posicao);
    }

    // Monta as colunas para o texto e as deixa no 0 (estado anterior à animação de entrada)
    montar(texto) {
        this.container.textContent = '';
        this.colunas = [];
        for (const caractere of texto) {
            if (/\d/.test(caractere)) {
                const coluna = this.criarColuna();
                this.definirPosicao(coluna, POSICAO_ZERO_FINAL, false);
                coluna.valor = 0;
                this.colunas.push(coluna);
                this.container.appendChild(coluna.raiz);
            } else {
                const fixo = document.createElement('span');
                fixo.className = caractere === ' ' ? 'odometro__fixo odometro__fixo--espaco' : 'odometro__fixo';
                fixo.setAttribute('aria-hidden', 'true');
                fixo.textContent = caractere === ' ' ? ' ' : caractere;
                this.container.appendChild(fixo);
            }
        }
        this.ultimoTexto = texto;
    }

    atualizarAria(texto, forcar = false) {
        if (forcar || Date.now() - this.ultimoAria > 60000) {
            this.container.setAttribute('aria-label', this.rotulo(texto));
            this.ultimoAria = Date.now();
        }
    }

    init() {
        const texto = this.textoAtual();
        this.container.setAttribute('role', 'img');
        this.montar(texto);
        this.atualizarAria(texto, true);

        if (reduzirMovimento() || !('IntersectionObserver' in window)) {
            this.revelar(false);
            return;
        }
        const observador = new IntersectionObserver((entradas, obs) => {
            if (entradas.some((e) => e.isIntersecting)) {
                obs.disconnect();
                this.revelar(true);
            }
        }, { threshold: 0.4 });
        observador.observe(this.container);
    }

    // Animação de entrada: do 0 até o valor atual, primeira casa -> última
    revelar(animar) {
        if (this.revelado) return;
        this.revelado = true;

        const texto = this.textoAtual();
        if (texto.length !== this.ultimoTexto.length) this.montar(texto);
        const digitos = texto.replace(/\D/g, '');

        this.colunas.forEach((coluna, i) => {
            const alvo = Number(digitos[i]);
            if (animar) {
                coluna.fita.style.setProperty('--atraso', `${i * ATRASO_COLUNA_MS}ms`);
                coluna.fita.style.setProperty('--duracao', `${DURACAO_INTRO_MS}ms`);
                // alvo 0: dá uma volta completa (0 -> 9 ... -> 0 do topo) e encaixa no 0 final depois
                this.definirPosicao(coluna, alvo === 0 ? 0 : posicaoDoDigito(alvo), true);
            } else {
                this.definirPosicao(coluna, posicaoDoDigito(alvo), false);
            }
            coluna.valor = alvo;
        });
        this.ultimoTexto = texto;
        this.atualizarAria(texto, true);

        const fim = animar ? DURACAO_INTRO_MS + this.colunas.length * ATRASO_COLUNA_MS + 150 : 0;
        setTimeout(() => {
            this.colunas.forEach((coluna) => {
                coluna.fita.style.removeProperty('--atraso');
                coluna.fita.style.removeProperty('--duracao');
                if (coluna.valor === 0) this.definirPosicao(coluna, POSICAO_ZERO_FINAL, false);
            });
            if (this.intervaloMs) this.iniciarVivo();
        }, fim);
    }

    definirDigito(coluna, digito, animar) {
        if (coluna.valor === digito) return;
        if (animar && coluna.valor === 9 && digito === 0) {
            // virada 9 -> 0: continua descendo até o 0 do topo e depois "encaixa" no 0 final
            this.definirPosicao(coluna, 0, true);
            setTimeout(() => {
                if (coluna.valor === 0) this.definirPosicao(coluna, POSICAO_ZERO_FINAL, false);
            }, 1300);
        } else {
            this.definirPosicao(coluna, posicaoDoDigito(digito), animar);
        }
        coluna.valor = digito;
    }

    atualizar(animar = true) {
        const texto = this.textoAtual();
        if (texto === this.ultimoTexto) return;

        if (texto.length !== this.ultimoTexto.length) {
            this.montar(texto);
            animar = false;
        }
        const digitos = texto.replace(/\D/g, '');
        this.colunas.forEach((coluna, i) => this.definirDigito(coluna, Number(digitos[i]), animar));
        this.ultimoTexto = texto;
        this.atualizarAria(texto);
    }

    iniciarVivo() {
        this.atualizar(true); // pode ter avançado alguns ticks durante a animação de entrada
        // consulta 4x por segundo (barato: só mexe no DOM quando o texto muda), então o relógio nunca atrasa quase 1 s
        setInterval(() => this.atualizar(true), Math.min(this.intervaloMs, 250));
        // ao voltar para a aba, sincroniza de uma vez (sem rolar centenas de dígitos)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.atualizar(false);
        });
    }
}

// Valor estático (KPIs): só a animação de entrada
export function rolarEstatico(container, texto, rotulo) {
    const rolador = new Rolador(container, { texto, rotulo: rotulo || ((t) => t) });
    rolador.init();
    return rolador;
}

// R$ acumulado: taxa contínua de calendário = economia mensal / segundos de um mês médio
export function criarOdometroEconomia(container, { inicio, economiaMensal }) {
    const t0 = new Date(inicio).getTime();
    const taxaPorMs = economiaMensal / (SEGUNDOS_MES_MEDIO * 1000);
    const rolador = new Rolador(container, {
        texto: () => formatarCentavos(Math.floor(taxaPorMs * Math.max(0, Date.now() - t0) * 100)),
        intervaloMs: 1000,
        rotulo: (t) => `Economia acumulada estimada: ${t}`
    });
    rolador.init();
    return rolador;
}

// Tempo em produção: horas totais : minutos : segundos, 1 s por segundo
export function criarRelogioProducao(container, { inicio }) {
    const t0 = new Date(inicio).getTime();
    const rolador = new Rolador(container, {
        texto: () => formatarRelogio(Date.now() - t0),
        intervaloMs: 1000,
        rotulo: (t) => `Tempo em produção: ${t} (horas, minutos e segundos)`
    });
    rolador.init();
    return rolador;
}
