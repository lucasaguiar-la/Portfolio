export class FadeInManager {
    static instancia = null;

    constructor(selector = '.fade-in', threshold = 0.15) {
        this.fadeIns = document.querySelectorAll(selector);
        this.threshold = threshold;
        this.observador = null;
    }

    init() {
        FadeInManager.instancia = this;

        // Sem IntersectionObserver: mostra tudo de uma vez em vez de deixar conteúdo invisível
        if (!('IntersectionObserver' in window)) {
            this.fadeIns.forEach((el) => el.classList.add('start'));
            return;
        }

        this.observador = new IntersectionObserver((entradas, obs) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('start');
                    obs.unobserve(entrada.target);
                }
            });
        }, {
            threshold: this.threshold,
            rootMargin: '0px 0px -4% 0px'
        });

        this.fadeIns.forEach((el) => this.observador.observe(el));
    }

    // Para elementos criados depois (cards vindos da API)
    observar(elemento) {
        if (!this.observador) {
            elemento.classList.add('start');
            return;
        }
        this.observador.observe(elemento);
    }
}
